// dsh-lan-services —— Host 半端
// 局域网服务管理器（复习网站等本地 HTTP 服务，默认 3090~3099 端口段）：
//   1) 自动探测：对端口段逐端口 GET http://127.0.0.1:<p>/api/net（复习网站 server.cjs 自带该接口），
//      应答即视为「在跑的受管服务」；同时借 Windows 进程命令行解析出 server 脚本绝对路径；
//   2) 托管启停：start = spawn node <script> <port>（detached，DSH 退出不杀）；
//                 stop  = 按监听端口查 PID 后 Stop-Process；
//   3) 状态持久化 ~/.dsh/dsh-lan-services.json：脚本路径 + 用户改名 override，
//      服务停止后仍会保留在面板，可一键再启动（不必先手动跑一次）。
// 路由：/lan-services/api/status|start|stop|rename（浏览器同源调用）。
// 说明：3081（DSH 移动端反代）归 dsh-wifi-access 管，不在此插件范围。
// 注：纯面板插件，不注册模型工具（用户要求简版：标题 + 网址 + 启停）。

import { createRequire } from "node:module";
import { networkInterfaces } from "node:os";

export const name = "dsh-lan-services";
export const inject = ["webServer"];

const PORT_FROM = 3090; // 探测端口段（可改）
const PORT_TO = 3099;
const PROBE_TIMEOUT = 600; // ms，单端口探测超时

const require = createRequire(import.meta.url);
const http = require("node:http");
const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");

const DATA_DIR = path.join(os.homedir(), ".dsh");
const DATA_FILE = path.join(DATA_DIR, "dsh-lan-services.json");

// 兜底：任何未捕获错误都不让宿主进程崩溃
process.on("uncaughtException", (e) => console.log("[lan-services] uncaughtException:", (e && e.code) || (e && e.message)));
process.on("unhandledRejection", (e) => console.log("[lan-services] unhandledRejection:", (e && e.code) || (e && e.message)));

/** 本机局域网 IPv4 列表：真实私有段优先（192.168/16、10/8、172.16-31/12），排除回环/APIPA/虚拟段。 */
function lanAddresses() {
  const addrs = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const iface of list || []) {
      if (iface.family !== "IPv4" || iface.internal) continue;
      const ip = iface.address;
      if (!ip) continue;
      const parts = ip.split(".").map(Number);
      if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) continue;
      if (parts[0] === 169 && parts[1] === 254) continue; // APIPA
      if (parts[0] === 127) continue; // 回环
      let rank = 3;
      if (parts[0] === 192 && parts[1] === 168) rank = 0;
      else if (parts[0] === 10) rank = 1;
      else if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) rank = 2;
      addrs.push({ ip, rank });
    }
  }
  return [...new Set(addrs)].sort((a, b) => a.rank - b.rank || (a.ip < b.ip ? -1 : 1)).map((a) => a.ip);
}

function inRange(p) { return p >= PORT_FROM && p <= PORT_TO; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** 探测单端口：GET /api/net，200 + JSON 即视为受管服务在跑。 */
function probePort(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: "127.0.0.1", port, path: "/api/net", timeout: PROBE_TIMEOUT, headers: { "Cache-Control": "no-store" } },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try { const j = JSON.parse(body); resolve(Boolean(j && (j.urls || j.port))); }
          catch { resolve(false); }
        });
        res.on("error", () => resolve(false));
      }
    );
    req.on("timeout", () => { try { req.destroy(); } catch {} resolve(false); });
    req.on("error", () => resolve(false));
  });
}

/** 跑一条 PowerShell（无窗口），把 stdout 当 UTF-8 base64 解回文本。返回 '' 表示失败。 */
function psExec(script, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", () => { /* ignore */ });
    child.on("close", () => resolve(out.trim()));
    child.on("error", () => resolve(""));
    setTimeout(() => { try { child.kill(); } catch {} }, timeoutMs || 6000);
  });
}

/** 查询监听指定端口的进程（port -> {pid, cmd}）。中文命令行经 UTF-8 base64 传出避免乱码。 */
async function psQuery(ports) {
  if (!ports.length) return {};
  const ps = `
$ports=@(${ports.join(",")});
$o=New-Object System.Collections.ArrayList;
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | ForEach-Object {
  $p=Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)" -ErrorAction SilentlyContinue;
  if($p){ [void]$o.Add([pscustomobject]@{ port=$_.LocalPort; pid=$_.OwningProcess; cmd=$p.CommandLine }) }
};
[Console]::OutputEncoding=[Text.Encoding]::UTF8;
[Console]::Write([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($o | ConvertTo-Json -Compress))))`;
  const b64 = await psExec(ps, 6000);
  if (!b64) return {};
  try {
    const j = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const arr = Array.isArray(j) ? j : j ? [j] : [];
    const map = {};
    for (const it of arr) map[Number(it.port)] = { pid: Number(it.pid), cmd: String(it.cmd || "") };
    return map;
  } catch { return {}; }
}

/** 从进程命令行提取 server 脚本绝对路径（node xxx\server.cjs [port] 形态）。 */
function scriptFromCmd(cmd) {
  if (!cmd) return "";
  const m = cmd.match(/"([^"]+\.(?:cjs|mjs|js))"|(?:^|\s)([A-Za-z]:[^"\s]+\.(?:cjs|mjs|js))/);
  if (!m) return "";
  const p = (m[1] || m[2] || "").trim();
  return p && p.toLowerCase().endsWith(".exe") ? "" : p;
}

function basename(p) { return path.basename(p || ""); }

/** 默认标题：脚本所在目录的上层目录名优先（复习网站模板里上层才是课程名），兜底目录名/端口。 */
function defaultTitle(script, port) {
  if (script) {
    const folder = path.dirname(script);
    const f1 = basename(folder);
    const f2 = basename(path.dirname(folder));
    if (f2 && f2 !== f1) return f2;
    if (f1) return f1;
  }
  return "服务 :" + port;
}

export function apply(ctx) {
  const webServer = ctx.get("webServer");

  // —— 持久化状态：known{port:{script,title,lastSeen}} + overrides{port:title} ——
  let known = {};
  let overrides = {};
  let saveChain = Promise.resolve();
  function loadState() {
    try {
      if (!fs.existsSync(DATA_FILE)) return;
      const j = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      known = (j && j.known) || {};
      overrides = (j && j.overrides) || {};
    } catch { /* 静默 */ }
  }
  function persist() {
    const obj = { known, overrides, savedAt: Date.now() };
    saveChain = saveChain.then(() => new Promise((res) => {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
      } catch { /* 静默 */ }
      res();
    }));
  }
  function mergeKnown(port, patch) {
    const prev = known[port] || {};
    const cur = { ...prev, ...patch, lastSeen: Date.now() };
    const changed = JSON.stringify(prev) !== JSON.stringify(cur);
    known[port] = cur;
    if (changed) persist();
    return cur;
  }
  loadState();

  /** 组装完整状态（探测 + ps 解析 + known 合并）。 */
  async function statusPayload() {
    const lanIps = lanAddresses();
    const ports = [];
    for (let p = PORT_FROM; p <= PORT_TO; p++) ports.push(p);
    const results = await Promise.all(ports.map(async (p) => ({ p, running: await probePort(p) })));
    const runningPorts = results.filter((r) => r.running).map((r) => r.p);
    const psMap = runningPorts.length ? await psQuery(runningPorts) : {};

    const services = [];
    for (const { p, running } of results) {
      if (running) {
        const ps = psMap[p] || {};
        const script = scriptFromCmd(ps.cmd || "");
        const dflt = defaultTitle(script, p);
        const title = (() => {
          // mergeKnown 必须无条件执行：若写成 `overrides[p] || mergeKnown(...)`，
          // 一旦该端口改过名（override 为真），短路会跳过收录 → script 永远为空、
          // 面板「启动」按钮长期禁用（2026-09-13 实测：3092 改名后无法再一键启动）。
          const merged = mergeKnown(p, { script, title: dflt });
          return overrides[p] || merged.title || dflt;
        })();
        services.push({ port: p, title, running: true, script, mainUrl: lanIps.length ? "http://" + lanIps[0] + ":" + p : "" });
      } else if (known[p]) {
        services.push({ port: p, title: overrides[p] || known[p].title || defaultTitle(known[p].script, p), running: false, script: known[p].script || "", canStart: Boolean(known[p].script), mainUrl: lanIps.length ? "http://" + lanIps[0] + ":" + p : "" });
      }
    }
    return { ok: true, range: [PORT_FROM, PORT_TO], lanIps, runningCount: runningPorts.length, services };
  }

  function bodyOf(req) {
    return new Promise((resolve) => {
      let b = "";
      req.on("data", (c) => (b += c));
      req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
      req.on("error", () => resolve({}));
    });
  }

  function registerRoute(method, pathName, handler) {
    if (!webServer) return;
    webServer.register({
      kind: "exact",
      path: pathName,
      handler: async (req, res) => {
        let result;
        try {
          if (req.method !== method) result = { ok: false, error: "method-not-allowed" };
          else result = await handler(req);
        } catch (e) {
          result = { ok: false, error: String((e && e.message) || e).slice(0, 300) };
        }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result));
      },
    });
  }

  registerRoute("GET", "/lan-services/api/status", async () => statusPayload());

  registerRoute("POST", "/lan-services/api/start", async (req) => {
    const { port } = await bodyOf(req);
    const p = Number(port);
    if (!inRange(p)) return { ok: false, error: "端口不在受管范围 " + PORT_FROM + "~" + PORT_TO };
    if (await probePort(p)) return { ok: false, error: "端口 " + p + " 已有服务在运行" };
    const script = known[p] && known[p].script;
    if (!script) return { ok: false, error: "未记录启动路径：请先手动运行一次该服务，让插件收录后即可一键启动" };
    const done = await new Promise((resolve) => {
      const child = spawn(process.execPath, [script, String(p)], { detached: true, stdio: "ignore", windowsHide: true });
      child.on("error", () => resolve(false));
      child.on("spawn", () => { try { child.unref(); } catch {} resolve(true); });
    });
    if (!done) return { ok: false, error: "启动进程失败（无法 spawn node）" };
    // 多轮探测：Windows 下 node 冷启动可能超过 800ms，避免把已成功的启动误报为失败
    let up = false;
    for (let i = 0; i < 12 && !up; i++) { await sleep(400); up = await probePort(p); }
    if (!up) return { ok: false, error: "启动后 4.8s 内未探测到服务（端口被占或脚本自行退出）。请在本目录手动运行 node server.cjs " + p + " 查看具体报错；若实际已在运行请点面板「刷新」" };
    return { ok: true, status: await statusPayload() };
  });

  registerRoute("POST", "/lan-services/api/stop", async (req) => {
    const { port } = await bodyOf(req);
    const p = Number(port);
    if (!inRange(p)) return { ok: false, error: "端口不在受管范围" };
    const ps = `$ports=@(${p});
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue };'ok'`;
    await psExec(ps, 5000);
    await sleep(400);
    if (await probePort(p)) return { ok: false, error: "端口 " + p + " 仍在运行，停止失败（可能权限不足）" };
    return { ok: true, status: await statusPayload() };
  });

  registerRoute("POST", "/lan-services/api/rename", async (req) => {
    const { port, title } = await bodyOf(req);
    const p = Number(port);
    if (!inRange(p)) return { ok: false, error: "端口不在受管范围" };
    const t = String(title || "").trim().slice(0, 60);
    if (!t) return { ok: false, error: "标题不能为空" };
    overrides[p] = t;
    persist();
    return { ok: true, status: await statusPayload() };
  });
}
