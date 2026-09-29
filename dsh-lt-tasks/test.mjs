// test.mjs — dsh-lt-tasks 核心逻辑单测（文档集 / state 拆分 / store / lock / 工具闭环 / 快照）
// 运行：node test.mjs
import { mkdtemp, writeFile, mkdir, readFile, rm } from "node:fs/promises";
import fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import * as store from "./lib/store.js";
import * as lock from "./lib/lock.js";
import { tools } from "./lib/tools.js";

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { passed++; console.log("  \u2713 " + name); }
  else { failed++; console.log("  \u2717 " + name); }
}

const tmp = await mkdtemp(join(tmpdir(), "lt-test-"));
process.env.DSH_LT_TASKS_ROOT = tmp;
process.env.DSH_LT_WS_ROOT = join(tmp, "ws-root");
const root = store.resolveTasksRoot();
const wsRoot = store.resolveWorkspaceRoot();
const exec = {};
const t = Object.fromEntries(tools.map((x) => [x.name, x]));

console.log("\n== 文档集与工具面 ==");
assert(store.docNames().length === 7, "7 个业务文档（meta 另计）");
assert(["goal", "state", "frozen", "log", "notes", "handoff", "index"].every((d) => store.docNames().includes(d)), "新文档集齐全");
assert(!store.docNames().some((d) => ["next", "tasklist", "progress", "errors", "blockers", "review", "refs"].includes(d)), "旧文档名已退役");
assert(tools.length === 6, "注册 6 个工具（list/get/advance/save/freeze/complete）");

console.log("\n== state 组合与拆分 ==");
const st = store.composeState("做第二步", "- [x] 一步\n- [ ] 二步");
assert(store.splitState(st).next === "做第二步", "splitState 取回下一步");
assert(store.splitState(st).tasklist.includes("- [ ] 二步"), "splitState 取回清单");
assert(store.countChecklist(st).total === 2 && store.countChecklist(st).done === 1, "countChecklist 1/2");
assert(store.countChecklist("[ ] 裸格式").total === 1, "countChecklist 兼容裸 [ ]");
const sec = "## 甲\n\nA\n\n## 乙\n\nB\n";
assert(store.replaceSection(sec, "## 甲", "A2").includes("A2") && store.replaceSection(sec, "## 甲", "A2").includes("B"), "replaceSection 只改目标小节");
assert(store.sectionOf(sec, "## 乙") === "B", "sectionOf 取小节正文");

console.log("\n== store ==");
await mkdir(join(tmp, "refsrc"), { recursive: true });
await writeFile(join(tmp, "refsrc", "文献.md"), "# 参考文献\n内容\n", "utf8");
const { id, workspacePath } = await store.createTask(root, "测试任务", "验证", tmp + "/refsrc");
assert(id === "测试任务", "createTask 建任务（中文 id）");
assert(workspacePath.startsWith(wsRoot) && workspacePath.includes("lt-task-001"), "产出工作区落在 ws-root/lt-task-001-*");
assert(workspacePath !== join(root, id), "产出区与任务库分离");
const list = await store.listTasks(root);
assert(list.length === 1 && list[0].status === "planning", "listTasks 返回筹划中");
await store.setStatus(root, id, "blocked");
assert((await store.readMeta(root, id)).status === "blocked", "setStatus 支持 blocked");
await store.setStatus(root, id, "review");
assert((await store.readMeta(root, id)).status === "review", "setStatus 支持 review");
await store.setStatus(root, id, "active");
assert((await store.bumpVersion(root, id)) === 2, "bumpVersion 递增");

console.log("\n== lock ==");
await lock.acquire(root, id, "s1");
assert((await lock.isLocked(root, id)).locked === true, "acquire 加锁");
const renew = await lock.acquire(root, id, "s1");
assert(renew.renewed === true, "同一会话重复 acquire 只续期，不抛错");
let threw = false;
try { await lock.acquire(root, id, "s2"); } catch { threw = true; }
assert(threw, "其他会话 acquire 仍被拒");
await lock.release(root, id);
assert((await lock.isLocked(root, id)).locked === false, "release 解锁");

console.log("\n== 工具闭环 ==");
const extFile = join(tmp, "外部改动.txt");
await writeFile(extFile, "外部作业文件内容", "utf8");
const adv = await t.advance_task.execute({ name: "测试任务" }, exec);
assert(adv.status === "active", "advance 置进行中");
assert(typeof adv.state === "string" && adv.state.includes(store.STATE_NEXT_HEAD), "advance 内联 state 全文");
assert(typeof adv.frozenDigest === "string" && typeof adv.goal === "string", "advance 内联冻结摘要与目标");
assert(!!adv.lastPush && typeof adv.lastPush.at === "string", "advance 带上次推进时间");
assert(adv.log === undefined && adv.index === undefined, "advance 不返回流水与索引全文");
assert(typeof adv.notes.blockers === "string", "advance 带备忘摘要");

const saved = await t.save_progress.execute({
  name: "测试任务",
  summary: "完成第一步",
  nextContent: "做第二步",
  filesChanged: "草稿.md\n数据.xlsx\n" + extFile,
  decisions: "选方案 A",
  blockers: "- [ ] - 缺数据\n- 等硬件\n[ ] 等硬件2\n纯文本",
  tasklist: "- [x] 第一步\n- [ ] 第二步\n- [ ] 第三步\n"
}, exec);
assert(saved.version === 3, "save_progress 版本递增");
assert(saved.snapshot.ok === true && saved.snapshot.external === 1, "快照成功且带 1 个工作区外文件");

const stateDoc = await store.readDoc(root, id, "state");
assert(stateDoc.includes("做第二步") && /- \[ \] #\d+ 第三步/.test(stateDoc), "state.md 同时写下一步与编号清单");
const logDoc = await store.readDoc(root, id, "log");
assert(logDoc.includes("总结：完成第一步") && logDoc.includes("决策：选方案 A"), "log 记审计轨迹");
const notesDoc = await store.readDoc(root, id, "notes");
assert(notesDoc.includes("- [ 缺数据 ]") && notesDoc.includes("- [ 等硬件2 ]") && notesDoc.includes("- [ 纯文本 ]"), "notes 阻塞项规整");
assert(!notesDoc.includes("- [ ]"), "notes 不留空 checkbox");
assert(notesDoc.includes(store.NOTES_HEADS.refs), "notes 带参考资料小节");
const meta2 = await store.readMeta(root, id);
assert(meta2.status === "blocked", "save_progress 传 blockers 自动置 blocked");
assert(Number(meta2.taskDone) === 1 && Number(meta2.taskTotal) === 3, "完成度 1/3");

const handoff = await store.readDoc(root, id, "handoff");
assert(handoff.includes("<!-- auto:begin -->") && handoff.includes("## 人工补充（工具不覆盖）"), "handoff 自动区 + 手写区");
assert(handoff.includes("state.md") && !handoff.includes("next.md"), "handoff 指向 state（不再指向已退役的 next）");
assert(handoff.includes("notes.md") && !handoff.includes("errors.md"), "handoff 指向 notes（不再指向已退役的 errors）");
assert(!handoff.includes("完成第一步"), "handoff 不塞审计轨迹");

const g1 = await t.get_task.execute({ name: "测试任务" }, exec);
assert(g1.docIndex.length === 8, "get_task 默认回 7 文档 + meta 清单");
assert(!!g1.docIndex && !g1.docs, "get_task 默认不吐正文");
const g2 = await t.get_task.execute({ name: "测试任务", docs: "notes,state" }, exec);
assert(typeof g2.docs.notes === "string" && typeof g2.docs.state === "string", "notes/state 可读");
let badDoc = false;
try { await t.get_task.execute({ name: "测试任务", docs: "progress" }, exec); } catch { badDoc = true; }
assert(badDoc, "退役文档名被拒");
await writeFile(join(root, id, "log.md"), ("填充内容".repeat(10) + "\n").repeat(200), "utf8");
let bigThrew = false;
try { await t.get_task.execute({ name: "测试任务", docs: "log" }, exec); } catch { bigThrew = true; }
assert(bigThrew, "大文档整读被拒");
const g3 = await t.get_task.execute({ name: "测试任务", docs: "log", lines: "1-2" }, exec);
assert(g3.docs.log.text.split("\n").length === 2, "lines 分段可用");
const g4 = await t.get_task.execute({ name: "测试任务", docs: "log", grep: "填充内容" }, exec);
assert(g4.docs.log.hits.length > 0, "grep 分段可用");

console.log("\n== 快照语义（内容模式 / 无 task-docs / 任务库无备份）==");
const man = JSON.parse(await readFile(join(workspacePath, "backups", "v3", "manifest.json"), "utf8"));
assert(man.mode === "content", "快照为内容模式");
assert(!fs.existsSync(join(workspacePath, "backups", "v3", "task-docs")), "备份不含 task-docs");
assert(!fs.existsSync(join(root, id, "backups")), "任务库侧无 backups");
assert(man.files.some((f) => f.p.includes("refs")), "清单记录工作区产物（refs/）");
assert(Array.isArray(man.external) && man.external.length === 1, "external 记录 1 个工作区外文件");
assert((await readFile(join(workspacePath, "backups", "v3", man.external[0]), "utf8")) === "外部作业文件内容", "外部文件内容已备份到 lt 工作区");
assert(!String(man.external[0]).includes(".."), "external 路径不含越界段");

console.log("\n== 参考资料（notes 的 refs 小节）与冻结 ==");
await mkdir(join(tmp, "bigsrc"), { recursive: true });
for (let i = 0; i < 205; i++) await writeFile(join(tmp, "bigsrc", "f" + i + ".txt"), "x");
const { id: nid, workspacePath: nws } = await store.createTask(root, "新功能任务", "验证", [join(tmp, "refsrc"), join(tmp, "bigsrc")]);
assert(fs.existsSync(join(nws, "refs", "refsrc", "文献.md")), "小目录复制进 refs/");
assert(!fs.existsSync(join(nws, "refs", "bigsrc")), "大目录（205 文件）只登记不复制");
assert(store.refsRegisteredOf(await store.readDoc(root, nid, "notes")).length === 1, "仅登记清单 1 条（存于 notes 的参考资料小节）");
await store.rebuildRefs(root, nid);
const notesAfterRebuild = await store.readDoc(root, nid, "notes");
assert(store.refsRegisteredOf(notesAfterRebuild).length === 1, "rebuildRefs 不丢仅登记清单");
assert(notesAfterRebuild.includes(store.NOTES_HEADS.blockers), "rebuildRefs 不动其他小节");
const addRes = await store.addRefs(root, nid, [join(tmp, "refsrc")], "更新");
assert(addRes.copied.length === 1 && addRes.failed.length === 0, "重复补资料：先解除只读再覆盖成功");

const fr = await t.save_progress.execute({ name: "新功能任务", summary: "记两条冻结", nextContent: "继续", frozen: "提高波特率\n已定：TBPRD = 999U" }, exec);
assert(fr.frozenAdded.length === 2, "save_progress 一次追加 2 条冻结");
const fr2 = await t.save_progress.execute({ name: "新功能任务", summary: "重复冻结", nextContent: "继续", frozen: "提高波特率" }, exec);
assert(fr2.frozenAdded.length === 0, "冻结条目幂等不重复");
const adv2 = await t.advance_task.execute({ name: "新功能任务" }, exec);
assert(adv2.frozenDigest.includes("提高波特率") && adv2.frozenDigest.includes("TBPRD = 999U"), "advance 内联冻结摘要");
const sp = await t.save_progress.execute({ name: "新功能任务", summary: "把 TBPRD = 999U 改小试试", nextContent: "继续" }, exec);
assert(sp.warnings.length > 0, "命中冻结项返回告警（非阻断）");
assert(!("next" in sp), "save_progress 不回显 next");
assert((await store.removeFrozen(root, nid, "提高波特率")) === 1, "removeFrozen 解除 1 条");

console.log("\n== 事实闸门：frozen 只收基础事实 ==");
assert(store.factGate("提高上位机波特率").ok === true, "纯事实过闸门");
assert(store.factGate("提高波特率因为上位机会异常").ok === false, "含「因为」被拒");
assert(store.factGate("不许编译，否则回退失败").hits.includes("否则"), "含「否则」被拒");
assert(store.factGate("已定：TBPRD = 999U（app.h:12）").ok === true, "带来源的已定值过闸门");
assert(typeof t.freeze_task?.execute === "function", "freeze_task 已注册（模型可写 frozen）");
const fr3 = await t.freeze_task.execute({ name: "新功能任务", items: "部署目录 = D:\\Plexus", reason: "用户 2026-09-09 定" }, exec);
assert(fr3.added.length === 1 && fr3.rejected.length === 0, "freeze_task 写入 1 条事实");
const fr4 = await t.freeze_task.execute({ name: "新功能任务", items: "提高波特率因为上位机显示会异常" }, exec);
assert(fr4.added.length === 0 && fr4.rejected.length === 1 && fr4.rejected[0].hits.includes("因为"), "含原因的条目被拒收");
const fzDoc = await store.readDoc(root, nid, "frozen");
assert(fzDoc.includes("部署目录 = D:\\Plexus") && !fzDoc.includes("上位机显示会异常"), "被拒内容未落盘");
await store.writeDoc(root, nid, "frozen", "# 不可修改列表\n\n## 1 改动边界\n\n- [禁改] 甲\n\n## 2 禁提方案\n\n- [禁改] 乙\n");
const fr5 = await t.freeze_task.execute({ name: "新功能任务", items: "丙", section: "禁提" }, exec);
const fzDoc2 = await store.readDoc(root, nid, "frozen");
assert(fr5.intoSection.includes("禁提"), "section 命中「禁提」章节");
assert(fzDoc2.slice(fzDoc2.indexOf("## 2 禁提方案")).includes("丙"), "新条目落在指定章节内");
const fr6 = await t.freeze_task.execute({ name: "新功能任务", items: "- [已定] 无名值 = 42", section: "禁提" }, exec);
assert(fr6.added.length === 1 && fr6.added[0] === "无名值 = 42", "带工具前缀的输入被剥前缀（不双写）");
assert(!(await store.readDoc(root, nid, "frozen")).includes("[禁改] [禁改]"), "文件里不存在双前缀条目");

console.log("\n== 冻结摘要：硬约束条目强制内联 ==");
const bigFz =
  "# 不可修改列表\n\n## 1 改动边界\n\n" +
  Array.from({ length: 20 }, (_, i) => "- [禁改] 边界项" + i).join("\n") +
  "\n\n## 9 其它说明\n\n" +
  Array.from({ length: 100 }, (_, i) => "- 说明" + i).join("\n");
const dgBig = store.summarizeFrozen(bigFz, 100);
assert(dgBig.text.includes("边界项0") && dgBig.text.includes("边界项19"), "硬约束条目全量内联（20/20）");
assert(dgBig.text.includes("说明0"), "非硬约束章保底 1 条");
assert(!dgBig.text.includes("说明99"), "非硬约束章超出 cap 的不内联");
assert(dgBig.forcedInline === 20, "forcedInline 计数正确（实测 " + dgBig.forcedInline + "）");

console.log("\n== 条目编号 / 状态 / 里程碑 / 交接自检 ==");
const ol = "- [x] #1 甲\n- [ ] #2 乙\n- [ ] #3 丙";
const nl = "- [x] 甲\n- [~] 乙\n- [ ] 丁";
const asg = store.assignItemIds(ol, nl, 4);
assert(asg.list.startsWith("- [x] #1 甲"), "已有条目沿用旧号");
assert(asg.list.includes("#4 丁"), "新条目取下一个号");
assert(!asg.list.includes("#3"), "删掉的号不回收");
assert(asg.nextId === 5, "nextItemId 递增到 5");
const asg2 = store.assignItemIds("", "## 分组一\n\n- [ ] 甲\n\n## 分组二\n\n- [ ] 乙", 1);
assert(asg2.list.includes("## 分组一") && asg2.list.includes("## 分组二"), "分组标题原样保留");
assert(asg2.count === 2, "只给条目编号");
const d1 = store.diffItems(store.itemsSig(ol), store.itemsSig(asg.list));
assert(d1.added.includes(4) && d1.gone.includes(3) && d1.total === 3, "变化识别新增与消失");
const goalMs = "# 目标\n\n## 里程碑\n- M1 甲：#1 #2\n- M2 乙：#9\n";
const ms = store.milestoneProgress(goalMs, asg.list);
assert(ms.length === 2 && ms[0].closed === 1 && ms[0].total === 2, "里程碑进度按条目状态算");
assert(ms[1].missing.includes(9), "里程碑指向不存在的条目会被标出");
const sc = store.handoffSelfCheck({ goal: "见 #9", notes: "warning #179-D 与 #2" }, asg.list);
assert(sc.unknownRefs.includes("#9"), "自检认出悬空引用");
assert(!sc.unknownRefs.includes("#179"), "自检不把编译警告号当条目引用");

console.log("\n== 参考资料：手写区不被覆盖 ==");
const notesText = await store.readDoc(root, nid, "notes");
const withManual = store.replaceSection(
  notesText,
  store.NOTES_HEADS.refs,
  store.sectionOf(notesText, store.NOTES_HEADS.refs) + "\n\n手写：算法真源在 D:\\x\\ACHFC.c"
);
await store.writeDoc(root, nid, "notes", withManual);
await store.rebuildRefs(root, nid);
const notesBack = await store.readDoc(root, nid, "notes");
assert(store.sectionOf(notesBack, store.NOTES_HEADS.refs).includes("手写：算法真源在"), "rebuildRefs 保留手写内容");
assert(store.refsAutoOf(notesBack).includes("位置："), "自动区被重建");
assert(store.sectionOf(notesBack, store.NOTES_HEADS.blockers).length > 0, "其他小节不受影响");

console.log("\n== 超预算降级链（先削清单，冻结摘要最后动）==");
const bigTask = await store.createTask(root, "超预算任务", "验证降级链", null);
await store.writeDoc(root, bigTask.id, "state", store.composeState("步骤".repeat(300), ("- [ ] " + "任务".repeat(60) + "\n").repeat(200)));
const bigAdv = await t.advance_task.execute({ name: "超预算任务" }, exec);
assert(bigAdv.payloadBytes <= 28000, "回包不超 28000 字节预算（实测 " + bigAdv.payloadBytes + "）");
assert(typeof bigAdv.trimmed === "string" && bigAdv.trimmed.includes("state-list"), "降级先削清单（" + bigAdv.trimmed + "）");
assert(typeof bigAdv.frozenDigest === "string" && bigAdv.frozenDigest.length > 0, "冻结摘要仍内联，未被清空");
await store.deleteTask(root, bigTask.id);

console.log("\n== 并发撞号与删除 ==");
await mkdir(join(wsRoot, "lt-task-002-占位"), { recursive: true });
const c1 = await store.createTask(root, "并发A", "验证撞号", null);
assert(/^lt-task-\d+-并发a$/.test(c1.wsFolder) && !c1.wsFolder.includes("002"), "占位目录存在时顺延编号");
const [p1, p2] = await Promise.all([
  store.createTask(root, "并发B", "验证并发", null),
  store.createTask(root, "并发C", "验证并发", null)
]);
assert(p1.wsFolder !== p2.wsFolder && p1.workspacePath !== p2.workspacePath, "并发 create 产出目录不冲突");
assert((await store.readMeta(root, c1.id)).workspacePath === c1.workspacePath, "meta.workspacePath 指向实际产出目录");
await store.deleteTask(root, c1.id);
const gone = (p) => !fs.existsSync(p);
assert(gone(join(root, c1.id)) && gone(c1.workspacePath), "删除后任务库存档与产出目录均已删");
await store.deleteTask(root, p1.id);
await store.deleteTask(root, p2.id);

console.log("\n结果：" + passed + " 通过, " + failed + " 失败");
await rm(tmp, { recursive: true, force: true });
process.exit(failed > 0 ? 1 : 0);
