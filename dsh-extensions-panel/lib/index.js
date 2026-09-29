// dsh-extensions-panel —— Host 半端。
//
// 为左栏「功能」Tab 里的「虚拟显示器」卡片提供接口：
//   GET /extensions/api/vdd            → 设备与显示模式状态
//   GET /extensions/api/vdd?mode=on    → 扩展显示（虚拟屏参与桌面）
//   GET /extensions/api/vdd?mode=off   → 仅电脑屏幕（虚拟屏不参与桌面）
//
// ⚠️ 为什么开关是「切显示模式」而不是「禁用/启用显示设备」：
// 2026-09-25 实测，在联想小新 Pro 14 AHP9（AMD 780M）上禁用/启用虚拟显示设备会触发
// 0x113 VIDEO_DXGKRNL_FATAL_ERROR 蓝屏。显示模式切换只是 Win+P 的语义，不碰设备状态，
// 不影响物理屏与主机；设备本身始终留在系统里可用。

import { execFile } from "node:child_process";

export const inject = ["webServer"];

const DISPLAY_SWITCH = "C:\\Windows\\System32\\DisplaySwitch.exe";
const PS = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";

// 查虚拟显示器设备：返回 "installed"（设备在且 OK）/ "disabled" / "absent"
const PROBE_PS = [
  "$d = Get-PnpDevice -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -eq 'Virtual Display Driver' } | Select-Object -First 1;",
  "if ($d -eq $null) { 'absent' } elseif ($d.Status -eq 'OK') { 'installed' } else { 'disabled' }",
].join(" ");

// 屏幕数量：>1 说明虚拟屏正参与桌面
const SCREEN_PS = "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::AllScreens.Count";

let webServer = null;

function run(file, args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(file, args, { timeout: timeoutMs || 10000, windowsHide: true }, (err, stdout) => {
      if (err) resolve({ ok: false, error: String((err && err.message) || err).slice(0, 200) });
      else resolve({ ok: true, out: String(stdout || "").trim() });
    });
  });
}

async function statusPayload() {
  const dev = await run(PS, ["-NoProfile", "-NonInteractive", "-Command", PROBE_PS], 15000);
  const screens = await run(PS, ["-NoProfile", "-NonInteractive", "-Command", SCREEN_PS], 15000);
  const count = screens.ok ? Number(screens.out) || 0 : 0;
  return {
    ok: true,
    device: dev.ok ? dev.out : "unknown",
    screens: count,
    extended: count > 1,
    switchAvailable: true,
  };
}

function registerRoute(method, path, handler) {
  if (!webServer) return;
  webServer.register({
    kind: "exact",
    path,
    handler: async (req, res) => {
      let result;
      try {
        if (req.method !== method) result = { ok: false, error: "method-not-allowed" };
        else result = await handler(req);
      } catch (e) {
        result = { ok: false, error: String((e && e.message) || e).slice(0, 300) };
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify(result));
    },
  });
}

export function apply(ctx) {
  try { webServer = ctx.get("webServer"); } catch { webServer = null; }
  if (!webServer) return;

  registerRoute("GET", "/extensions/api/vdd", async (req) => {
    const url = new URL(req.url || "/", "http://localhost");
    const mode = url.searchParams.get("mode");
    if (mode !== "on" && mode !== "off") return statusPayload();

    const arg = mode === "on" ? "/extend" : "/internal";
    const r = await run(DISPLAY_SWITCH, [arg], 10000);
    if (!r.ok) return { ok: false, error: r.error, mode };
    // DisplaySwitch 是异步生效的，稍等再读状态
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const payload = await statusPayload();
    return Object.assign({}, payload, { switched: mode });
  });
}
