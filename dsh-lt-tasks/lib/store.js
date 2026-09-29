import { homedir } from "node:os";
import { join, basename, dirname, extname, parse as parsePath } from "node:path";
import { mkdir, readdir, readFile, writeFile, cp, rm, rename, copyFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { markReadonly, unmarkReadonly } from "./readonly.js";

const execFileAsync = promisify(execFile);

/** 7 个业务文档 + meta（机器元数据）。 */
const DOCS = ["handoff", "goal", "frozen", "state", "log", "notes", "index"];
const STATUS = new Set(["planning", "active", "paused", "blocked", "review", "completed"]);

/** state.md 的两个小节：下一步在前、清单在后，超预算时可从尾部截断。 */
export const STATE_NEXT_HEAD = "## 下一步";
export const STATE_LIST_HEAD = "## 任务清单";
/** notes.md 的四个小节（阻塞 / 审查 / 错误 / 参考资料）。 */
export const NOTES_HEADS = { blockers: "## 阻塞项", review: "## 审查记录", errors: "## 错误汇总", refs: "## 参考资料" };

const DOC_TEMPLATES = {
  handoff: "# 对接文档\n\n",
  goal: "# 目标\n\n",
  frozen: "# 已确认不可修改列表\n\n",
  state: "# 当前状态\n\n" + STATE_NEXT_HEAD + "\n\n（待写）\n\n" + STATE_LIST_HEAD + "\n\n- [ ] （待列）\n",
  log: "# 推进流水\n\n",
  notes:
    "# 备忘\n\n" +
    NOTES_HEADS.blockers + "\n\n- [ （暂无阻塞） ]\n\n" +
    NOTES_HEADS.review + "\n\n（待记录）\n\n" +
    NOTES_HEADS.errors + "\n\n（待记录）\n\n" +
    NOTES_HEADS.refs + "\n",
  index: "# 完整工作流目录\n\n"
};

/** 组装 state.md。 */
export function composeState(next, tasklist) {
  return [
    "# 当前状态", "",
    STATE_NEXT_HEAD, "",
    String(next || "").trim() || "（待写）", "",
    STATE_LIST_HEAD, "",
    String(tasklist || "").trim() || "（待列）", ""
  ].join("\n");
}

/** 拆 state.md 为 { next, tasklist }（缺小节时整篇归 next）。 */
export function splitState(text) {
  const src = String(text || "");
  const ni = src.indexOf(STATE_NEXT_HEAD);
  const li = src.indexOf(STATE_LIST_HEAD);
  if (li < 0) return { next: src.replace(/^#\s*当前状态[^\n]*\n?/m, "").trim(), tasklist: "" };
  const from = ni >= 0 ? ni + STATE_NEXT_HEAD.length : 0;
  return { next: src.slice(from, li).trim(), tasklist: src.slice(li + STATE_LIST_HEAD.length).trim() };
}

/** 用新正文替换 markdown 中某个 `## 小节` 的内容，其余小节保持原样。 */
export function replaceSection(text, head, body) {
  const src = String(text || "");
  const block = head + "\n\n" + String(body || "").trim() + "\n";
  const i = src.indexOf(head);
  if (i < 0) return src.replace(/\s*$/, "") + "\n\n" + block;
  const rest = src.slice(i + head.length);
  const m = rest.match(/\n##\s/);
  const end = m ? i + head.length + m.index + 1 : src.length;
  return src.slice(0, i) + block + src.slice(end);
}

/** 取 notes.md 的某个小节正文（不含标题）。 */
export function sectionOf(text, head) {
  const src = String(text || "");
  const i = src.indexOf(head);
  if (i < 0) return "";
  const rest = src.slice(i + head.length);
  const m = rest.match(/\n##\s/);
  return (m ? rest.slice(0, m.index) : rest).trim();
}

/** 任务清单完成度：兼容 `- [ ] x` / 裸 `[ ] x`；状态位可为空格(未开工) x(关闭) ~(进行中) !(阻塞)。 */
export function countChecklist(text) {
  const src = String(text || "");
  return {
    total: (src.match(/^\s*(?:[-*]\s*)?\[[ xX~!]\]/gm) || []).length,
    done: (src.match(/^\s*(?:[-*]\s*)?\[[xX]\]/gm) || []).length
  };
}

/** 取 log.md 中最近一次存档的时间戳（appendDoc 写入的 `## <ISO>` 头）；无则返回空串。 */
export function lastPushAt(logText) {
  const all = [...String(logText || "").matchAll(/^##\s+(\S+)\s*$/gm)];
  for (let i = all.length - 1; i >= 0; i--) {
    if (!Number.isNaN(Date.parse(all[i][1]))) return all[i][1];
  }
  return "";
}

// ── 条目编号 / 状态 / 里程碑 / 交接自检（借 GitHub issue 的可寻址与可追踪）──
/** 清单行：`- [ ] #12 内容`；状态 x 已关闭 / ~ 进行中 / ! 阻塞 / 空格 未开工。 */
const ITEM_RE = /^\s*(?:[-*]\s*)?\[([ x~!])\]\s*(?:#(\d+)\s+)?(.*)$/;
const STATE_CODE = { " ": "o", "~": "t", "!": "b", "x": "x" };

/** 解析清单为条目数组（id 0 = 尚未编号）。 */
export function parseItems(listText) {
  const out = [];
  for (const line of String(listText || "").split("\n")) {
    const m = line.match(ITEM_RE);
    if (!m) continue;
    const text = m[3].trim();
    if (!text) continue;
    out.push({ box: m[1], id: m[2] ? Number(m[2]) : 0, text });
  }
  return out;
}

const itemKey = (t) => String(t).replace(/\s+/g, " ").trim().slice(0, 60);

/** 分配稳定编号：内容与旧条目一致则沿用旧号，新条目从 nextItemId 递增；编号永不复用。
 *  非条目行（分组标题 / 说明 / 空行）原样保留，只改条目行。 */
export function assignItemIds(oldList, newList, nextId) {
  const olds = parseItems(oldList);
  const byText = new Map(olds.filter((i) => i.id).map((i) => [itemKey(i.text), i.id]));
  const used = new Set(olds.map((i) => i.id).filter(Boolean));
  let id = Math.max(1, Number(nextId) || 1);
  let count = 0;
  const out = String(newList || "")
    .split("\n")
    .map((line) => {
      const m = line.match(ITEM_RE);
      if (!m) return line;
      const box = m[1];
      const text = m[3].trim();
      if (!text) return line;
      let n = (m[2] ? Number(m[2]) : 0) || byText.get(itemKey(text)) || 0;
      if (!n) {
        while (used.has(id)) id++;
        n = id;
        id++;
      } else {
        id = Math.max(id, n + 1);
      }
      used.add(n);
      count++;
      return "- [" + box + "] #" + n + " " + text;
    });
  return {
    list: out.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    nextId: Math.max(id, ...[...used, 0].map((x) => x + 1)),
    count
  };
}

/** 条目状态签名（`id:状态` 逗号串），用于判断本轮哪些条目变了。 */
export function itemsSig(listText) {
  return parseItems(listText)
    .filter((it) => it.id)
    .map((it) => it.id + ":" + (STATE_CODE[it.box] || "o"))
    .join(",");
}

/** 对比前后签名：新增 / 关闭 / 重开 / 消失 / 仍开放。 */
export function diffItems(oldSig, newSig) {
  const o = new Map(String(oldSig || "").split(",").filter(Boolean).map((s) => s.split(":")));
  const n = new Map(String(newSig || "").split(",").filter(Boolean).map((s) => s.split(":")));
  return {
    added: [...n.keys()].filter((k) => !o.has(k)).map(Number),
    closed: [...n].filter(([k, v]) => v === "x" && o.get(k) !== "x").map(([k]) => Number(k)),
    reopened: [...n].filter(([k, v]) => v !== "x" && o.get(k) === "x").map(([k]) => Number(k)),
    gone: [...o.keys()].filter((k) => !n.has(k)).map(Number),
    open: [...n.values()].filter((v) => v !== "x").length,
    total: n.size
  };
}

/** 里程碑：goal.md 的 `## 里程碑` 节，行格式 `- M1 标题：#3 #4 #5`。 */
export function parseMilestones(goalText) {
  const out = [];
  for (const line of sectionOf(goalText, "## 里程碑").split("\n")) {
    const m = line.match(/^\s*[-*]\s*(.+?)[：:]\s*(.+)$/);
    if (!m) continue;
    const ids = [...m[2].matchAll(/#(\d+)/g)].map((x) => Number(x[1]));
    if (ids.length) out.push({ name: m[1].trim(), ids });
  }
  return out;
}

/** 用条目状态给里程碑算进度。 */
export function milestoneProgress(goalText, listText) {
  const st = new Map(parseItems(listText).filter((i) => i.id).map((i) => [i.id, i.box]));
  return parseMilestones(goalText).map((ms) => {
    const closed = ms.ids.filter((id) => st.get(id) === "x").length;
    const blocked = ms.ids.filter((id) => st.get(id) === "!").length;
    return { name: ms.name, total: ms.ids.length, closed, blocked, open: ms.ids.length - closed, missing: ms.ids.filter((id) => !st.has(id)) };
  });
}

/** 交接自检：悬空 `#N` 引用、已关闭却无原因、清单条目缺编号。 */
export function handoffSelfCheck(docs, listText, allIds) {
  const ids = new Set((allIds && allIds.length ? allIds : parseItems(listText).filter((i) => i.id).map((i) => i.id)).map(Number));
  const unknown = new Set();
  for (const [name, text] of Object.entries(docs || {})) {
    if (name === "state") continue;
    for (const m of String(text || "").matchAll(/#(\d{1,4})(?![\w-])/g)) {
      if (!ids.has(Number(m[1]))) unknown.add("#" + m[1]);
    }
  }
  const items = parseItems(listText);
  return {
    unknownRefs: [...unknown],
    closedWithoutReason: items.filter((i) => i.box === "x" && !/——/.test(i.text)).map((i) => "#" + i.id),
    itemsWithoutId: items.filter((i) => !i.id).map((i) => i.text.slice(0, 30))
  };
}

/** 任务库根目录（存档侧）：DSH_LT_TASKS_ROOT 优先，否则 ~/.dsh/lt-tasks。 */
export function resolveTasksRoot() {
  return process.env.DSH_LT_TASKS_ROOT || join(homedir(), ".dsh", "lt-tasks");
}

/** 产出工作区根目录（桌面侧）：DSH_LT_WS_ROOT 优先，否则 <用户桌面>\DSHlongtasks。 */
export function resolveWorkspaceRoot() {
  return process.env.DSH_LT_WS_ROOT || join(homedir(), "Desktop", "DSHlongtasks");
}

/** 产出文件夹名 lt-task-NNN-<topic>：NNN 为工作区根下已有序号 + 1（与会话文件夹同规则，独立编号）。 */
export async function nextWsFolder(wsRoot, topic) {
  await mkdir(wsRoot, { recursive: true });
  let max = 0;
  let entries;
  try { entries = await readdir(wsRoot, { withFileTypes: true }); } catch { entries = []; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const m = /^lt-task-(\d+)-/.exec(e.name);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const n = String(max + 1).padStart(3, "0");
  return `lt-task-${n}-${topic}`;
}

/** 任务名 → 目录 id：保留 Unicode 字母数字（含中文），其余转 -，小写。 */
function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "task";
}

/** 解析 meta.md 的 YAML frontmatter（仅 key: value 单行）。 */
function parseMeta(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

/** 渲染 meta.md 的 frontmatter。 */
function renderMeta(meta) {
  const keys = ["id", "name", "status", "version", "createdAt", "updatedAt", "lastPushAt", "workspacePath", "lastSessionId", "taskDone", "taskTotal", "nextItemId", "itemsSig"];
  const lines = keys
    .filter((k) => meta[k] !== undefined && meta[k] !== "")
    .map((k) => `${k}: ${meta[k]}`);
  return `---\n${lines.join("\n")}\n---\n\n`;
}

const DOC_NAMES = new Set([...DOCS, "meta"]);

/** 列出所有任务（扫子目录，读各自 meta.md）。 */
export async function listTasks(root) {
  const out = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try {
      const meta = parseMeta(await readFile(join(root, e.name, "meta.md"), "utf8"));
      out.push({
        id: meta.id || e.name,
        name: meta.name || e.name,
        status: meta.status || "planning",
        version: Number(meta.version) || 0,
        updatedAt: meta.updatedAt || "",
        taskDone: Number(meta.taskDone) || 0,
        taskTotal: Number(meta.taskTotal) || 0
      });
    } catch {
      // 跳过无 meta.md 的目录
    }
  }
  return out;
}

export async function readMeta(root, id) {
  return parseMeta(await readFile(join(root, id, "meta.md"), "utf8"));
}

/** 原子写：先写临时文件再 rename 覆盖，避免写入中途崩溃损坏文档。 */
async function atomicWrite(path, content) {
  const tmp = path + ".tmp";
  await writeFile(tmp, content, "utf8");
  await rename(tmp, path);
}

export async function writeMeta(root, id, patch) {
  const meta = { ...(await readMeta(root, id)), ...patch, updatedAt: new Date().toISOString() };
  await atomicWrite(join(root, id, "meta.md"), renderMeta(meta));
}

export async function readDoc(root, id, docName) {
  if (!DOC_NAMES.has(docName)) throw new Error(`unknown doc: ${docName}`);
  return readFile(join(root, id, docName + ".md"), "utf8");
}

export async function writeDoc(root, id, docName, content) {
  if (!DOC_NAMES.has(docName)) throw new Error(`unknown doc: ${docName}`);
  await atomicWrite(join(root, id, docName + ".md"), content);
}

/** 向 progress/errors 追加一段，带时间戳。 */
export async function appendDoc(root, id, docName, block) {
  const stamp = new Date().toISOString();
  const cur = await readDoc(root, id, docName).catch(() => "");
  await writeDoc(root, id, docName, cur + `\n## ${stamp}\n${block}\n`);
}

export async function setStatus(root, id, status) {
  if (!STATUS.has(status)) throw new Error(`invalid status: ${status}`);
  await writeMeta(root, id, { status });
}

export async function bumpVersion(root, id) {
  const meta = await readMeta(root, id);
  const v = (Number(meta.version) || 0) + 1;
  await writeMeta(root, id, { version: v });
  return v;
}

// 2026-09-18 收束整定：index.md 曾达 2.8 MB / 27548 行（97% 来自 backups 自动快照与编译产物），
// 接手会话若读到它就等于烧掉几十万 token。以下忽略集把 index 压到「只看产出」的规模。
const INDEX_SKIP_DIRS = new Set([
  "backups", "node_modules", ".git", ".svn", "__pycache__", ".vscode", ".idea",
  "build", "build_o0", "build_o1", "build_o2", "build_o3", "Debug", "Release", "CPU1_RAM", "CPU1_FLASH"
]);
const INDEX_SKIP_EXT = new Set([
  ".obj", ".o", ".d", ".map", ".out", ".abs", ".pp", ".exe", ".dll", ".so", ".lib", ".a",
  ".pdb", ".ilk", ".bin", ".hex", ".zip", ".7z", ".rar", ".log", ".tmp", ".lock"
]);

/** 只统计文件数（用于折叠摘要，不列举）。 */
async function countFiles(dir) {
  let n = 0;
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    if (e.isDirectory()) n += await countFiles(join(dir, e.name));
    else if (e.name !== ".lock") n += 1;
  }
  return n;
}

/** 递归列出目录下所有文件（绝对路径）：跳过 .lock、忽略目录（折叠成摘要）与编译产物后缀。 */
async function listFilesRecursive(dir) {
  const out = [];
  const skippedDirs = [];
  async function walk(d) {
    let entries;
    try { entries = await readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (INDEX_SKIP_DIRS.has(e.name)) {
          skippedDirs.push({ path: full, count: await countFiles(full) });
          continue;
        }
        await walk(full);
      } else if (e.name !== ".lock" && !INDEX_SKIP_EXT.has(extname(e.name).toLowerCase())) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  out.sort();
  skippedDirs.sort((a, b) => a.path.localeCompare(b.path));
  return { files: out, skippedDirs };
}

/** 大 .md（>200 KB）不展开标题，避免索引被单个长文档撑爆。 */
async function isSmallFile(filePath) {
  try { return (await stat(filePath)).size <= 200 * 1024; } catch { return false; }
}

/** 解析 Markdown 文件的标题（# ## ### ...），返回 [{level, title}]。 */
async function parseMdHeadings(filePath) {
  try {
    const text = await readFile(filePath, "utf8");
    const out = [];
    for (const line of text.split("\n")) {
      const m = line.match(/^(#{1,6})\s+(.+)$/);
      if (m) {
        const title = m[2].replace(/#+\s*$/, "").trim();
        if (title) out.push({ level: m[1].length, title });
      }
    }
    return out;
  } catch { return []; }
}

/** 把一个文件的路径 + 内部目录（md 标题）追加到 lines。 */
async function appendFileWithHeadings(lines, filePath, indent) {
  lines.push(indent + "- " + filePath);
  if (filePath.toLowerCase().endsWith(".md") && (await isSmallFile(filePath))) {
    const headings = await parseMdHeadings(filePath);
    for (const h of headings) {
      lines.push(indent + "    " + "#".repeat(h.level) + " " + h.title);
    }
  }
}

export const REFS_COPY_MAX_FILES = 200;
export const REFS_COPY_MAX_BYTES = 100 * 1024 * 1024;
/** 参考资料小节内的自动区标记：工具只重写这段；区外（手写区）永不覆盖。 */
export const REFS_AUTO_BEGIN = "<!-- refs:auto:begin -->";
export const REFS_AUTO_END = "<!-- refs:auto:end -->";
export const REFS_MANUAL_HEAD = "<!-- 手写区：工具不覆盖 -->";

/** 取参考资料小节的自动区正文；无标记时返回空串。 */
export function refsAutoOf(text) {
  const seg = sectionOf(text, NOTES_HEADS.refs);
  const m = seg.match(/<!--\s*refs:auto:begin\s*-->([\s\S]*?)<!--\s*refs:auto:end\s*-->/);
  return m ? m[1].trim() : "";
}

/** 取参考资料小节的手写区正文：有标记取其后内容；旧格式（无标记）整节视作手写内容保护。 */
export function refsManualOf(text) {
  const seg = sectionOf(text, NOTES_HEADS.refs);
  const m = seg.match(/<!--\s*手写区[^>]*-->\s*([\s\S]*)$/);
  if (m) return m[1].replace(/^\s*\n/, "").trim();
  const body = seg.trim();
  if (!body || /^位置：/.test(body)) return ""; // 工具生成的旧格式，没有手写内容
  return body;
}

/** 取自动区里保留的「仅登记（未复制）」清单（旧格式回退到解析整节）。 */
export function refsRegisteredOf(text) {
  const auto = refsAutoOf(text) || sectionOf(text, NOTES_HEADS.refs);
  const m = auto.match(/###\s*仅登记[\s\S]*?(?=\n#{2,3}\s|$)/);
  if (!m) return [];
  return m[0]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

/** 组装参考资料小节：自动区（可重写）+ 手写区（永不动）。 */
function refsBody(autoLines, manual) {
  const m = String(manual || "").trim();
  return [REFS_AUTO_BEGIN, ...autoLines, REFS_AUTO_END, "", REFS_MANUAL_HEAD, m || "（无）"].join("\n");
}

/** 只写自动区、保留手写区（addRefs 中途登记用）。 */
async function writeRegistered(root, id, list) {
  const cur = await readDoc(root, id, "notes").catch(() => DOC_TEMPLATES.notes);
  const manual = refsManualOf(cur);
  const auto = ["位置：（重建中）"];
  if (list.length) {
    auto.push("", "### 仅登记（未复制，按绝对路径使用）");
    for (const r of list) auto.push("- " + r);
  }
  await writeDoc(root, id, "notes", replaceSection(cur, NOTES_HEADS.refs, refsBody(auto, manual)));
}

/** 重建 notes.md 的参考资料小节：只重写自动区，手写区原样保留（其余小节不动）。 */
export async function rebuildRefs(root, id) {
  const meta = await readMeta(root, id).catch(() => ({}));
  const wsDir = meta.workspacePath || "";
  const refs = wsDir ? join(wsDir, "refs") : "";
  const cur = await readDoc(root, id, "notes").catch(() => DOC_TEMPLATES.notes);
  const manual = refsManualOf(cur);
  const registered = refsRegisteredOf(cur);
  const { files } = refs ? await listFilesRecursive(refs) : { files: [] };
  const auto = ["位置：" + (refs || "（未建）"), "", "### 已复制（只读）"];
  if (files.length === 0) auto.push("（无）");
  else
    for (const f of files) {
      const rel = refs ? f.slice(refs.length + 1) : f;
      let size = 0;
      try {
        size = (await stat(f)).size;
      } catch {
        // 读不到就只记路径
      }
      auto.push("- " + rel + "  （" + size + " B）");
    }
  if (registered.length) {
    auto.push("", "### 仅登记（未复制，按绝对路径使用）");
    for (const r of registered) auto.push("- " + r);
  }
  await writeDoc(root, id, "notes", replaceSection(cur, NOTES_HEADS.refs, refsBody(auto, manual)));
}

/**
 * 加参考资料：小文件/小目录复制进 refs/ 并置只读；超阈值（200 文件或 100 MB）只登记绝对路径。
 * 复制前先解除 refs/ 只读，复制后重新标记，解决「标记只读后无法再补资料」。
 */
export async function addRefs(root, id, paths, note = "") {
  const meta = await readMeta(root, id).catch(() => ({}));
  const wsDir = meta.workspacePath || join(root, id);
  await mkdir(wsDir, { recursive: true });
  const refs = join(wsDir, "refs");
  await mkdir(refs, { recursive: true });
  const copied = [],
    registered = [],
    failed = [],
    missing = [];
  for (const p of paths || []) {
    const src = String(p || "").trim();
    if (!src) continue;
    let s;
    try {
      s = await stat(src);
    } catch {
      missing.push(src);
      continue;
    }
    let tooBig = false,
      count = 0,
      bytes = 0;
    if (s.isDirectory()) {
      const { files } = await listFilesRecursive(src);
      count = files.length;
      for (const f of files) {
        try {
          bytes += (await stat(f)).size;
        } catch {
          // 跳过读不到的文件
        }
      }
      tooBig = count > REFS_COPY_MAX_FILES || bytes > REFS_COPY_MAX_BYTES;
    } else {
      tooBig = s.size > REFS_COPY_MAX_BYTES;
    }
    if (tooBig) {
      const sizeTxt = s.isDirectory() ? count + " 个文件 / " + Math.round(bytes / 1024) + " KB" : Math.round(s.size / 1024) + " KB";
      registered.push(src + "（" + sizeTxt + "）" + (note ? " —— " + note : ""));
      continue;
    }
    const dest = join(refs, basename(src));
    try {
      await unmarkReadonly(dest);
      await rm(dest, { recursive: true, force: true });
      await cp(src, dest, { recursive: true });
      copied.push(src);
    } catch (err) {
      failed.push(src + "：" + String((err && err.message) || err));
    }
  }
  if (registered.length) {
    const list = refsRegisteredOf(await readDoc(root, id, "notes").catch(() => ""));
    for (const r of registered) if (!list.includes(r)) list.push(r);
    await writeRegistered(root, id, list);
  }
  await markReadonly(refs);
  await rebuildRefs(root, id);
  return { refsPath: refs, copied, registered, failed, missing, limits: { maxFiles: REFS_COPY_MAX_FILES, maxBytes: REFS_COPY_MAX_BYTES } };
}

/** 列出 refs/ 实际文件与仅登记清单（只看清单，不吐正文）。 */
export async function listRefs(root, id) {
  const meta = await readMeta(root, id).catch(() => ({}));
  const wsDir = meta.workspacePath || join(root, id);
  const refs = join(wsDir, "refs");
  const files = [];
  async function walk(d, rel) {
    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(d, e.name);
      const r = rel ? rel + "/" + e.name : e.name;
      if (e.isDirectory()) await walk(full, r);
      else {
        let size = 0;
        try {
          size = (await stat(full)).size;
        } catch {
          // 只记路径
        }
        files.push({ path: r, size });
      }
    }
  }
  await walk(refs, "");
  const cur = await readDoc(root, id, "notes").catch(() => "");
  return { refsPath: refs, fileCount: files.length, files: files.slice(0, 200), registered: refsRegisteredOf(cur) };
}

/** 重建完整工作流目录 index.md：产出文件（忽略 backups/编译产物）+ 折叠摘要 + 文档内部目录。 */
export async function rebuildIndex(root, id) {
  const meta = await readMeta(root, id).catch(() => ({}));
  const wsDir = meta.workspacePath || join(root, id);
  const lines = ["# 完整工作流目录", "", "产出工作区：" + wsDir, ""];
  const { files, skippedDirs } = await listFilesRecursive(wsDir);
  if (files.length === 0) lines.push("（工作区暂无文件）");
  else for (const f of files) await appendFileWithHeadings(lines, f, "");
  if (skippedDirs.length > 0) {
    lines.push("", "## 已折叠（不逐个索引，仅记录位置与规模）", "");
    const total = skippedDirs.reduce((s, d) => s + d.count, 0);
    for (const d of skippedDirs) lines.push("- " + d.path + "  （" + d.count + " 个文件）");
    lines.push("", "> 折叠合计 " + total + " 个文件；需要时直接在左侧文件树查看，不要通读本索引。");
  }
  await writeDoc(root, id, "index", lines.join("\n"));
}

/** 建产出工作区：桌面侧 wsDir 已由 createTask 创建，此处补参考资料并重建索引。 */
export async function setupWorkspace(root, id, refPath) {
  const meta = await readMeta(root, id).catch(() => ({}));
  const wsDir = meta.workspacePath || join(root, id);
  await mkdir(wsDir, { recursive: true });
  const paths = refPath ? (Array.isArray(refPath) ? refPath : [refPath]) : [];
  if (paths.length) await addRefs(root, id, paths, "");
  else await rebuildRefs(root, id);
  await rebuildIndex(root, id);
  return wsDir;
}

/** 建任务：存档侧 <tasksRoot>/<id>/（11 文档 + meta）；产出侧桌面工作区 lt-task-NNN-<topic>，产出与 refs 均落此处。 */
export async function createTask(root, name, goal, refPath) {
  await mkdir(root, { recursive: true });
  let id = slugify(name);
  let created = false;
  for (let n = 1; n <= 100; n++) {
    const candidate = n === 1 ? id : slugify(name) + "-" + n;
    try {
      await mkdir(join(root, candidate));
      id = candidate;
      created = true;
      break;
    } catch (err) {
      if (err && err.code === "EEXIST") continue;
      throw err;
    }
  }
  if (!created) throw new Error("无法创建任务目录：名称冲突过多");
  const now = new Date().toISOString();
  const meta = { id, name, status: "planning", version: 1, createdAt: now, updatedAt: now, workspacePath: "" };
  await writeFile(join(root, id, "meta.md"), renderMeta(meta), "utf8");
  for (const d of DOCS) {
    await writeFile(join(root, id, d + ".md"), DOC_TEMPLATES[d], "utf8");
  }
  await writeDoc(root, id, "goal", "# 目标\n\n" + goal + "\n");
  // 产出侧：桌面工作区 lt-task-NNN-<topic>（独立编号，与会话文件夹同规则）
  // 唯一性创建：非 recursive mkdir 探测，EEXIST 说明并发撞号 → 重扫重试（多窗口并发 create 安全）
  const wsRoot = resolveWorkspaceRoot();
  const topic = (slugify(name) || "task").slice(0, 24);
  let wsDir = "", wsFolder = "";
  for (let n = 1; n <= 100; n++) {
    wsFolder = await nextWsFolder(wsRoot, topic);
    const candidate = join(wsRoot, wsFolder);
    try {
      await mkdir(candidate);
      wsDir = candidate;
      break;
    } catch (err) {
      if (err && err.code === "EEXIST") continue;
      throw err;
    }
  }
  if (!wsDir) {
    await rm(join(root, id), { recursive: true, force: true });
    throw new Error("无法创建产出工作区：目录冲突过多");
  }
  await writeMeta(root, id, { workspacePath: wsDir });
  const createdWs = await setupWorkspace(root, id, refPath);
  await snapshotVersion(root, id, 1); // v1 基线快照
  return { id, workspacePath: createdWs, wsFolder };
}

/** 删除任务：先去只读属性，再删存档文件夹 + 桌面产出工作区（双端联动）。 */
export async function deleteTask(root, id) {
  const dir = join(root, id);
  const wsRoot = resolveWorkspaceRoot();
  const meta = await readMeta(root, id).catch(() => ({}));
  const wsDir = (meta.workspacePath || "").startsWith(wsRoot) ? meta.workspacePath : "";
  for (const target of [dir, wsDir]) {
    if (!target) continue;
    try {
      await execFileAsync("attrib", ["-R", target, "/S", "/D"], { windowsHide: true });
    } catch {
      // 目录不存在或无法改属性，忽略
    }
    await rm(target, { recursive: true, force: true });
  }
}

/** 快照单文件上限 / 单版累计上限（字节）：超限只登记路径不复制。 */
const SNAP_MAX_FILE = 20 * 1024 * 1024;
const SNAP_MAX_TOTAL = 200 * 1024 * 1024;

/** 找最近一版「内容快照」manifest 作为增量基线（version 小于 before 的最大者）。 */
async function lastContentManifest(wsDir, before) {
  const bk = join(wsDir, "backups");
  let entries;
  try { entries = await readdir(bk, { withFileTypes: true }); } catch { return null; }
  const vers = entries
    .filter((e) => e.isDirectory() && /^v\d+$/.test(e.name))
    .map((e) => Number(e.name.slice(1)))
    .filter((v) => v < before)
    .sort((a, b) => b - a);
  for (const v of vers) {
    try {
      const m = JSON.parse(await readFile(join(bk, "v" + v, "manifest.json"), "utf8"));
      if (m && m.mode === "content" && Array.isArray(m.files)) return m;
    } catch { /* 该版无可用清单，继续向前找 */ }
  }
  return null;
}

/** 工作区外的绝对路径映射为备份内相对路径：external/<盘符>/<原路径>。 */
function externalRel(abs) {
  const r = parsePath(abs);
  const drive = (r.root || "").replace(/[:\\/]+/g, "") || "x";
  const rest = abs.slice((r.root || "").length).split(/[\\/]+/).filter(Boolean).join("/");
  return join("external", drive, rest);
}

/**
 * 版本快照：备份**实际产物文件的内容**，落在产出工作区 backups/v<N>/。
 * - 工作区内：changed/<相对路径>，只复制本轮新增或修改（与上一版 content 清单比对）
 * - 工作区外（真正被改的作业文件）：external/<盘符>/<原路径>
 * - 不再复制任务库的 11 个文档；任务库目录内不产生任何备份
 * - 单文件 >20MB 或单版累计 >200MB 只登记不复制；DSH_LT_SNAPSHOT=full 忽略基线强制全量
 * 回退到 vN = 依次叠加 v1..vN 的 changed 与 external（后版覆盖前版）。快照失败不阻断存档。
 */
export async function snapshotVersion(root, id, version, opts = {}) {
  try {
    const meta = await readMeta(root, id).catch(() => ({}));
    const wsDir = meta.workspacePath || "";
    if (!wsDir) return { ok: false, reason: "no workspacePath" };
    const force = String(process.env.DSH_LT_SNAPSHOT || "").toLowerCase() === "full";
    const verDir = join(wsDir, "backups", "v" + version);
    await mkdir(join(verDir, "changed"), { recursive: true });

    const copied = [];
    const external = [];
    const skipped = [];
    let bytes = 0;
    const put = async (abs, rel) => {
      let s;
      try { s = await stat(abs); } catch { skipped.push({ p: rel, size: 0, why: "unreadable" }); return false; }
      if (s.size > SNAP_MAX_FILE) { skipped.push({ p: rel, size: s.size, why: "over-20MB" }); return false; }
      if (bytes + s.size > SNAP_MAX_TOTAL) { skipped.push({ p: rel, size: s.size, why: "over-200MB" }); return false; }
      try {
        const dest = join(verDir, rel);
        await mkdir(dirname(dest), { recursive: true });
        await copyFile(abs, dest);
      } catch { skipped.push({ p: rel, size: s.size, why: "copy-failed" }); return false; }
      bytes += s.size;
      copied.push(rel);
      return true;
    };

    // 工作区内：与上一版 content 清单比对，只落改动
    const { files, skippedDirs } = await listFilesRecursive(wsDir);
    const base = force ? null : await lastContentManifest(wsDir, version);
    const baseSig = new Map((base?.files || []).map((f) => [f.p, f.size + ":" + f.mtime]));
    const entries = [];
    for (const f of files) {
      let s;
      try { s = await stat(f); } catch { continue; }
      const rel = f.slice(wsDir.length + 1);
      const mtime = Math.round(s.mtimeMs);
      entries.push({ p: rel, size: s.size, mtime });
      if (!base || baseSig.get(rel) !== s.size + ":" + mtime) {
        if (await put(f, join("changed", rel))) { /* 已记入 copied */ }
      }
    }

    // 工作区外：调用方点名的作业文件（filesChanged 里位于产出工作区之外的绝对路径）
    for (const rawPath of opts.external || []) {
      const p = String(rawPath || "").trim();
      if (!p) continue;
      let s;
      try { s = await stat(p); } catch { skipped.push({ p, size: 0, why: "external-missing" }); continue; }
      if (s.isDirectory()) {
        const sub = await listFilesRecursive(p);
        for (const f of sub.files) {
          const rel = externalRel(f);
          if (await put(f, rel)) external.push(rel);
        }
      } else {
        const rel = externalRel(p);
        if (await put(p, rel)) external.push(rel);
      }
    }

    const manifest = {
      mode: "content",
      version,
      base: base ? base.version : null,
      at: new Date().toISOString(),
      workspacePath: wsDir,
      fileCount: entries.length,
      workspaceBytes: entries.reduce((s, x) => s + x.size, 0),
      changed: copied.filter((r) => r.startsWith("changed")),
      external,
      skipped,
      ignoredDirs: skippedDirs.map((d) => ({ path: d.path, count: d.count })),
      files: entries
    };
    await writeFile(join(verDir, "manifest.json"), JSON.stringify(manifest), "utf8");
    return {
      ok: true, backupPath: verDir, version, mode: "content", base: manifest.base,
      fileCount: entries.length, changedCount: manifest.changed.length,
      externalCount: external.length, skippedCount: skipped.length, bytes
    };
  } catch (err) {
    return { ok: false, reason: String((err && err.message) || err) };
  }
}

/** 11 文档名（工具侧校验用）。 */
export function docNames() {
  return [...DOCS];
}

// ── 冻结清单（frozen.md）─────────────────────────────────────────
const FROZEN_BEGIN = "<!-- frozen:begin -->";
const FROZEN_END = "<!-- frozen:end -->";
const FROZEN_HEAD = "## 工具冻结项（只记基础事实：对象 + 值 + 来源；禁写原因、后果与推测）";

/** 事实闸门：frozen 只收基础事实——命中推理 / 后果 / 推测词就拒收（那两类会随代码腐烂，也是幻觉源）。 */
const FACT_GATE_RE = /因为|由于|所以|因此|从而|导致|会引起|会造成|否则|后果|目的在于|为了避免|以防|免得|说明|意味着|推测|估计|大概|可能是|应该是|理论上|原因/;
export function factGate(text) {
  const hits = String(text || "").match(new RegExp(FACT_GATE_RE.source, "g")) || [];
  return { ok: hits.length === 0, hits: [...new Set(hits)] };
}

/**
 * 摘要 frozen.md：按章节内联条目，**丢弃必须显式标注**（未内联条数 + 行号区间）。
 * cap 按字节计（中文 3 字节/字），是**硬上限**：填充时逐条试探，超限即回退。
 * 章 = `#`/`##`；`###` 及更深并入本章标题。表格行只计数不内联（易误读），正文行按条目处理。
 * 章行格式：`-- <章标题> | 共 N 条内联 M，余 K 未内联@a-b 行 | 表项 T 项未内联@c-d 行`
 */
export function summarizeFrozen(text, cap = 3000) {
  const bytes = (s) => Buffer.byteLength(s, "utf8");
  const SHORT = 22;
  const ITEM = 110;
  const short = (s) => (s.length > SHORT ? s.slice(0, SHORT) + "…" : s);
  const trunc = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);

  const chapters = [];
  let cur = null;
  const open = (title, line) => {
    cur = { title, line, endLine: line, items: [], cells: 0, cellFrom: 0, cellTo: 0, cellTexts: [] };
    chapters.push(cur);
  };
  const raw = String(text || "").split("\n");
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i].replace(/\s+$/, "");
    const no = i + 1;
    if (!line.trim() || /^<!--/.test(line.trim())) continue;
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const title = h[2].replace(/#+\s*$/, "").trim();
      if (h[1].length <= 2) open(title, no);
      else if (cur) cur.title += " / " + title;
      if (cur) cur.endLine = no;
      continue;
    }
    if (!cur) open("（前言）", no);
    cur.endLine = no;
    if (/^\s*[-*]\s+/.test(line)) {
      const t = line.trim();
      if (/^[-*]\s*\[\s*\]\s*$/.test(t)) continue;
      // 带 [禁改]/[已定] 前缀的条目是硬约束，摘要里必须全量出现
      cur.items.push({ t: trunc(t, ITEM), f: /^[-*]\s*\[(禁改|已定)\]/.test(t) });
      continue;
    }
    if (/^\s*\|/.test(line)) {
      if (/^\|[\s:|-]+\|$/.test(line.trim())) continue;
      cur.cells++;
      if (!cur.cellFrom) cur.cellFrom = no;
      cur.cellTo = no;
      const first = line.trim().replace(/^\|/, "").split("|")[0].trim();
      if (first && !/^[-:\s]*$/.test(first) && cur.cellTexts.length < 24) cur.cellTexts.push(trunc(first, 18));
      cur.items.push({ t: trunc(line.trim(), 160), f: false }); // 表格行同样可内联
      continue;
    }
    cur.items.push({ t: trunc(line.trim(), ITEM), f: false });
  }

  const totalItems = chapters.reduce((s, c) => s + c.items.length, 0);
  const totalCells = chapters.reduce((s, c) => s + c.cells, 0);

  const fold = () => {
    const head = "冻结/已定清单共 " + chapters.length + " 章 / " + totalItems + " 条 / " + totalCells + " 项表项，全部未内联：逐章按行号读 frozen.md。";
    return {
      text: head, bytes: bytes(head), bulletCount: totalItems, tableCount: totalCells,
      dropped: totalItems, droppedBullets: totalItems, droppedCells: totalCells,
      inlineBullets: 0, chapters: chapters.length, truncated: true
    };
  };

  const rows = chapters.map((c) => ({ c, count: 0 }));
  const render = () =>
    rows
      .map((r) => {
        const n = r.c.items.length;
        const shown = r.c.items.filter((x, i) => i < r.count || x.f);
        const tail = [];
        if (n) {
          tail.push("共 " + n + " 条内联 " + shown.length + (n - shown.length > 0 ? "，余 " + (n - shown.length) + " 未内联" : "") + "@" + r.c.line + "-" + r.c.endLine + " 行");
        }
        if (r.c.cells && shown.length < n) {
          // 未内联完时列出表项首列：「禁提方案」「写死数值表」这类章的首列本身就是关键信息
          const shown = r.c.cellTexts.slice(0, 6);
          tail.push(
            "表项 " + r.c.cells + " 项@" + (r.c.cellFrom || r.c.line) + "-" + (r.c.cellTo || r.c.endLine) + " 行" +
              (shown.length ? "｜首列：" + shown.join("、") + (r.c.cells > shown.length ? "…" : "") : "")
          );
        }
        const head = "-- " + (r.c.title ? short(r.c.title) : "（前言）") + " | " + (tail.length ? tail.join(" | ") : "（无正文）");
        return head + (shown.length ? "\n" + shown.map((x) => x.t).join("\n") : "");
      })
      .join("\n");

  // 章行与强制条目（[禁改]/[已定]）是必出内容：只有按 cap 的 8 倍预算都放不下才整体折叠
  let text2 = render();
  if (bytes(text2) > cap * 8) return fold();

  // 关键章（禁改 / 禁提 / 写死值 / 红线…）**全量强制内联**：这类事实读漏的代价最高；
  // 其余章先各保底 1 条，再用 cap 作为「追加额度」继续补。
  const KEY = /写死|禁改|禁提|禁做|红线|已定|口径|冻结|硬值|数值表/;
  const order = [...rows].sort((a, b) => (KEY.test(b.c.title) ? 1 : 0) - (KEY.test(a.c.title) ? 1 : 0));
  const forced = order.filter((r) => KEY.test(r.c.title));
  const rest = order.filter((r) => !KEY.test(r.c.title));
  const plain = (r) => r.c.items.filter((x) => !x.f).length;
  for (const r of forced) r.count = r.c.items.length;
  for (const r of rest) if (plain(r)) r.count = 1;
  const base = bytes(render());
  const overExtra = () => bytes(render()) - base > cap;

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const r of rest) {
      if (r.count >= plain(r)) continue;
      r.count++;
      if (overExtra()) { r.count--; continue; }
      progressed = true;
    }
  }
  text2 = render();
  const inlineOf = (r) => r.c.items.filter((x, i) => i < r.count || x.f).length;
  const inline = rows.reduce((s, r) => s + inlineOf(r), 0);
  return {
    text: text2, bytes: bytes(text2), bulletCount: totalItems, tableCount: totalCells,
    dropped: totalItems - inline, droppedBullets: totalItems - inline, droppedCells: totalCells,
    inlineBullets: inline, forcedChapters: forced.length,
    forcedInline: rows.reduce((s, r) => s + r.c.items.filter((x) => x.f).length, 0),
    overBudget: bytes(text2) - base > cap, chapters: chapters.length, truncated: totalItems - inline > 0 || totalCells > 0
  };
}

/** 从冻结摘要抽可校验触发词（反引号标识 / 数值+单位）。 */
export function frozenTokens(summaryText) {
  const src = String(summaryText || "");
  const tokens = new Set();
  for (const m of src.matchAll(/`([^`]{2,40})`/g)) tokens.add(m[1].trim());
  for (const m of src.matchAll(/\b\d+(?:\.\d+)?\s?(?:kHz|MHz|Hz|us|µs|ms|V|A|W|U|%)\b/g)) tokens.add(m[0].replace(/\s+/g, ""));
  return [...tokens].filter((t) => t.length >= 2);
}

/** 追加冻结/已定条目（同条目不重复追加）。追加式写入，绝不重写已有手写内容。 */
export async function appendFrozen(root, id, items, section = "") {
  const cur = await readDoc(root, id, "frozen").catch(() => DOC_TEMPLATES.frozen);
  const stamp = new Date().toISOString().slice(0, 10);
  const added = [];
  const dup = [];
  const rejected = [];
  const lines = [];
  for (const it of items || []) {
    const text = String(it.text || "").trim();
    if (!text) continue;
    const gate = factGate(text);
    if (!gate.ok) {
      rejected.push({ text, hits: gate.hits });
      continue;
    }
    if (cur.includes(text)) {
      dup.push(text);
      continue;
    }
    const kind = it.kind === "spec" ? "已定" : "禁改";
    lines.push("- [" + kind + "] " + text + (it.reason ? " —— " + it.reason : "") + "（" + stamp + "）");
    added.push(text);
  }
  if (!lines.length) return { added, dup, rejected, section: "" };
  // 指定章节：插到该章末尾（AI 追加禁改项时能续写在对应章节里，不另起孤块）
  const key = String(section || "").trim();
  if (key) {
    const ls = cur.split("\n");
    const at = ls.findIndex((l) => /^##\s/.test(l) && l.includes(key));
    if (at >= 0) {
      let end = ls.length;
      for (let i = at + 1; i < ls.length; i++) if (/^##\s/.test(ls[i])) { end = i; break; }
      while (end > at + 1 && !ls[end - 1].trim()) end--;
      await writeDoc(root, id, "frozen", [...ls.slice(0, end), ...lines, ...ls.slice(end)].join("\n"));
      return { added, dup, rejected, section: ls[at].trim() };
    }
  }
  if (cur.includes(FROZEN_BEGIN) && cur.includes(FROZEN_END)) {
    const idx = cur.lastIndexOf(FROZEN_END);
    await writeDoc(root, id, "frozen", cur.slice(0, idx).replace(/\s*$/, "") + "\n" + lines.join("\n") + "\n" + cur.slice(idx));
  } else {
    await writeDoc(root, id, "frozen", [cur.replace(/\s*$/, ""), "", FROZEN_BEGIN, FROZEN_HEAD, ...lines, FROZEN_END, ""].join("\n"));
  }
  return { added, dup, rejected, section: "" };
}

/** 解除冻结：删除含 match 的列表行，返回删除条数。 */
export async function removeFrozen(root, id, match) {
  const needle = String(match || "").trim();
  if (!needle) return 0;
  const cur = await readDoc(root, id, "frozen").catch(() => "");
  const out = [];
  let removed = 0;
  for (const line of cur.split("\n")) {
    if (line.trim().startsWith("- ") && line.includes(needle)) {
      removed++;
      continue;
    }
    out.push(line);
  }
  if (removed) await writeDoc(root, id, "frozen", out.join("\n"));
  return removed;
}

// ── 对接文档（handoff.md：自动区 + 手写区）──────────────────────
export const HANDOFF_BEGIN = "<!-- auto:begin -->";
export const HANDOFF_END = "<!-- auto:end -->";
export const HANDOFF_MANUAL_HEAD = "## 人工补充（工具不覆盖）";
const LEGACY_GENERATED = [
  /^#\s*对接文档/,
  /^##\s*产出工作区/,
  /^##\s*接手先读/,
  /^##\s*其余档案/,
  /^-\s*下一步做什么/,
  /^-\s*任务清单/,
  /^-\s*冻结事项/,
  /^-\s*（读完这 3 个/,
  /^-\s*⛔/,
  /^\s{2}需要时先/,
  /^-\s*(目标|历史总结|错误汇总|阻塞项|审查记录|参考资料|工作流目录)/,
  /^[A-Za-z]:[\\/]/,
  /^<!--/
];
/** 取 handoff 手写区：新格式取 auto:end 之后（并剥掉人工补充标题，避免反复生成时标题重复）；旧格式剔除模板行。 */
export function handoffManualOf(text) {
  const t = String(text || "");
  const m = t.match(/<!-- auto:end -->([\s\S]*)$/);
  if (m) {
    return m[1]
      .replace(/^\s*\n/, "")
      .replace(/^(?:##\s*人工补充（工具不覆盖）\s*\n?)+/, "")
      .trim();
  }
  return t
    .split("\n")
    .filter((l) => l.trim() !== "" && !LEGACY_GENERATED.some((re) => re.test(l)))
    .join("\n")
    .trim();
}
/** 取 handoff 自动区累积的决策行（跨次存档保留）。 */
export function handoffDecisionsOf(text) {
  const m = String(text || "").match(/<!-- auto:begin -->([\s\S]*?)<!-- auto:end -->/);
  if (!m) return [];
  const seg = m[1].match(/###\s*关键决策[\s\S]*?(?=\n#{2,3}\s|$)/);
  if (!seg) return [];
  return seg[0]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "));
}

// ── 文档读取（get_task 摘要 / 分段）─────────────────────────────
/** 11 文档 + meta 的规模与标题（供 get_task 摘要，不吐正文）。 */
export async function docStats(root, id) {
  const out = [];
  for (const d of [...DOCS, "meta"]) {
    try {
      const text = await readFile(join(root, id, d + ".md"), "utf8");
      const title = (text.split("\n").find((l) => /^#\s+/.test(l)) || "").replace(/^#\s+/, "").trim();
      out.push({ doc: d, bytes: Buffer.byteLength(text, "utf8"), lines: text.split("\n").length, title });
    } catch {
      out.push({ doc: d, bytes: 0, lines: 0, title: "" });
    }
  }
  return out;
}

/** 按行号区间读文档（1 基，含端点）。 */
export async function readDocSlice(root, id, docName, from, to) {
  const text = await readDoc(root, id, docName);
  const lines = text.split("\n");
  const a = Math.max(1, Number(from) || 1);
  const b = Math.min(lines.length, Number(to) || a);
  if (b < a) throw new Error(`行号区间无效：${from}-${to}（该文档共 ${lines.length} 行）`);
  return { doc: docName, from: a, to: b, totalLines: lines.length, text: lines.slice(a - 1, b).join("\n") };
}

/** 在文档内按正则检索，返回命中行（带行号）。 */
export async function grepDoc(root, id, docName, pattern, cap = 40) {
  const text = await readDoc(root, id, docName);
  let re;
  try {
    re = new RegExp(pattern, "i");
  } catch {
    throw new Error("无效正则：" + pattern);
  }
  const lines = text.split("\n");
  const hits = [];
  for (let i = 0; i < lines.length && hits.length < cap; i++) {
    if (re.test(lines[i])) hits.push({ line: i + 1, text: lines[i].slice(0, 300) });
  }
  return { doc: docName, pattern, hits, totalLines: lines.length, truncated: hits.length >= cap };
}

