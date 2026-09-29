window.__ModuleLoader__.load({
	id: 'dsh-files-tree',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/* Workspace directories, discovered not hardcoded: the distinct cwd values in the session list,
   which is what the official sidebar groups by. The merged bundle carries two module bodies (the
   tree and the composer that re-includes it); both HOME_DIRS point at this one table so the
   landing page and the @ source always agree. */
const VK_HOME_DIRS = [];
let vkLtWsPath = null;
let vkLtWsAt = 0;
/** 长任务产出工作区根：问 dsh-lt-tasks 的 host（/lt-tasks/roots），再用 list 确认它真实存在。 */
function vkLtWsSync() {
	const now = Date.now();
	if (now - vkLtWsAt < 15000) return;
	vkLtWsAt = now;
	fetch("/lt-tasks/roots")
		.then((r) => (r.ok === true ? r.json() : null))
		.then((d) => {
			const p = d !== null && d !== undefined && d.ok === true && typeof d.workspaceRoot === "string" ? d.workspaceRoot : "";
			if (p.length === 0) return null;
			return fetch("/vscode-files/list?path=" + encodeURIComponent(p))
				.then((r) => (r.ok === true ? r.json() : null))
				.then((l) => {
					if (l === null || l === undefined || l.ok !== true || typeof l.path !== "string") return;
					if (vkLtWsPath === l.path) return;
					vkLtWsPath = l.path;
					try { window.dispatchEvent(new Event("vk-home-dirs")); } catch { /* ignore */ }
				});
		})
		.catch(() => {});
}
/** 工作区目录（探测，不写死路径）：官方 workspaces 列表 ∪ 会话 cwd ∪ 长任务产出工作区。 */
function vkHomeDirsSync() {
	vkLtWsSync();
	const next = [];
	const seen = new Set();
	const add = (p, title) => {
		const s = typeof p === "string" ? p.replace(/[\\/]+$/, "") : "";
		if (s.length === 0) return;
		const k = s.toLowerCase();
		if (seen.has(k)) return;
		seen.add(k);
		next.push({ name: typeof title === "string" && title.length > 0 ? title : pathBase(s), path: s });
	};
	try {
		const ws = ctxRef.current.get("workspaces");
		const snap = ws !== null && ws !== undefined && ws.list !== null && ws.list !== undefined && typeof ws.list.getSnapshot === "function" ? ws.list.getSnapshot() : null;
		const items = snap !== null && snap !== undefined && Array.isArray(snap.items) ? snap.items : [];
		for (const it of items) { if (it !== null && it !== undefined) add(it.path, it.title); }
	} catch { /* 官方工作区服务未就绪时回退到会话 cwd */ }
	try {
		const snapshot = ctxRef.current.get("sessions").list.getSnapshot();
		const byId = snapshot !== undefined && snapshot !== null && snapshot.byId !== undefined && snapshot.byId !== null ? snapshot.byId : {};
		for (const key of Object.keys(byId)) {
			const row = byId[key];
			if (row === null || row === undefined || row.blank === true) continue;
			add(row.cwd, "");
		}
	} catch { /* 会话服务未就绪时保持空表 */ }
	add(vkLtWsPath, "");
	next.sort((a, b) => a.path.localeCompare(b.path));
	VK_HOME_DIRS.length = 0;
	for (const d of next) VK_HOME_DIRS.push(d);
}

// dsh-files-tree —— 左栏「文件」Tab（文件树）+ 输入区 @（原 dsh-files-tree）。

		const react = require('react');
		const contract = require('dsh-vk-contract');
		const h = react.createElement;
		const VK = contract.VK;
		const VK_SERVICE = contract.VK_SERVICE;
		const vkCard = contract.vkCard;
		const ctxRef = { current: null };

		const _VK_ICONS = {
			menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
			tasks: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/>',
			folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
			folderOpen: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
			chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
			eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
			eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
			search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
			edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
			trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
			check: '<path d="M20 6 9 17l-5-5"/>',
			close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
			save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
			columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>',
			fullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
			file: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>',
			fileText: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
			image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
			video: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
			music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
			archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
			lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
			tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
			atom: '<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>',
			terminal: '<path d="m4 17 6-5-6-5"/><path d="M12 19h8"/>',
			open: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
			zoomIn: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>',
			zoomOut: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>',
			gear: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
			gitBranch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
			box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
			chevronLeft: '<path d="m15 18-6-6 6-6"/>',
			// 侧栏/面板类图标（左侧栏 Tab 条最右端的「打开拓展栏」按钮用）
			panelRight: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="15" y1="4" x2="15" y2="20"/>',
			// 拓展栏顶栏第 4 颗按钮：上下分界（上=官方拓展栏，下=命令行）
			panelBottom: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="13" x2="21" y2="13"/><path d="m6.6 15.6 2.4 1.7-2.4 1.7" stroke-width="1.6"/><line x1="11" y1="19" x2="15" y2="19" stroke-width="1.6"/>',
			chevronRight: '<path d="m9 18 6-6-6-6"/>',
			chevronDown: '<path d="m6 9 6 6 6-6"/>',
			chevronUp: '<path d="m18 15-6-6-6 6"/>',
			arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
			hardDrive: '<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>',
			refresh: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
			monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
			home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'
		};
		function VIcon({ name, size = 14 }) {
			const d = _VK_ICONS[name];
			if (!d) return null;
			return h("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { flex: "none", display: "block" }, dangerouslySetInnerHTML: { __html: d } });
		}
		const CSS = [
			// ── 滚动条：细、半透明、贴主题；标签条隐藏但可滚 ─────────────
			".vk_tree,.vk_viewer,.vk_editorInput{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l1) transparent}",
			".vk_tree::-webkit-scrollbar,.vk_viewer::-webkit-scrollbar,.vk_editorInput::-webkit-scrollbar{width:10px;height:10px}",
			".vk_tree::-webkit-scrollbar-thumb,.vk_viewer::-webkit-scrollbar-thumb,.vk_editorInput::-webkit-scrollbar-thumb{background:var(--dsw-alias-scrollbar-bg-l1);border:3px solid transparent;border-radius:6px;background-clip:padding-box;min-height:40px}",
			".vk_tree::-webkit-scrollbar-thumb:hover,.vk_viewer::-webkit-scrollbar-thumb:hover,.vk_editorInput::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-scrollbar-hover-l1);border:3px solid transparent;background-clip:padding-box}",
			".vk_tree::-webkit-scrollbar-track,.vk_viewer::-webkit-scrollbar-track,.vk_editorInput::-webkit-scrollbar-track,.vk_tree::-webkit-scrollbar-corner,.vk_viewer::-webkit-scrollbar-corner,.vk_editorInput::-webkit-scrollbar-corner{background:transparent}",
			// ── 面板 Tab 栏（左：文件/会话；右：对话/详情） ──────────────
			".vk_tabBar{display:flex;align-items:stretch;flex:none;min-width:0;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-sidebar-fill);container-type:inline-size}@container (width<=560px){.vk_reconnectHint{max-width:8em;overflow:hidden;text-overflow:ellipsis}.vk_modeBtn{padding:4px 9px;margin:0 6px 0 2px;font-size:11px}}@container (width<=460px){.vk_reconnectHint{display:none}}@container (width<=400px){.vk_tabBtn{padding:7px 8px}.vk_reloadBtn{padding:4px 8px;margin-left:4px}}",
			// ── 文件树头部与工具按钮 ───────────────────────────────────
			".vk_treeWrap{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
			".vk_treeHead{display:flex;align-items:center;gap:2px;flex:none;padding:7px 6px 7px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
			".vk_treeTitle{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}",
			".vk_treeBtn{appearance:none;border:none;background:none;cursor:pointer;width:24px;height:24px;padding:0;border-radius:6px;font-size:13px;line-height:1;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:center;flex:none;transition:background-color .12s,color .12s}",
			".vk_treeBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_treeBtnActive{background:var(--vk-accent-soft);color:var(--vk-accent)}",
			".vk_treeBtn:disabled{opacity:.35;cursor:not-allowed}",
			".vk_treeBtn:disabled:hover{background:none;color:var(--dsw-alias-label-secondary)}",
			// ── 表单（打开文件夹/新建/重命名/搜索） ─────────────────────
			".vk_pickForm{padding:8px;display:flex;flex-direction:column;gap:6px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
			".vk_pickInput{box-sizing:border-box;width:100%;background:var(--dsw-specific-input-major);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;color:var(--dsw-alias-label-primary);font-size:12px;padding:6px 9px;outline:none;font-family:inherit;transition:border-color .12s,box-shadow .12s}",
			".vk_pickInput:hover{border-color:var(--dsw-alias-border-l3)}",
			".vk_pickInput:focus{border-color:var(--vk-accent);box-shadow:0 0 0 2px var(--vk-accent-ring)}",
			".vk_pickInput::placeholder{color:var(--dsw-alias-label-tertiary)}",
			".vk_row .vk_pickInput{padding:3px 8px}",
			".vk_pickErr{font-size:11px;line-height:15px;color:var(--dsw-alias-state-error-primary);padding:0 2px}",
			".vk_pickRow{display:flex;gap:6px;justify-content:flex-end;min-width:0;container-type:inline-size}@container (width<=360px){.vk_pickBtn{padding:4px 8px;font-size:11px}}",
			".vk_pickBtn{appearance:none;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;font-size:12px;padding:4px 12px;font-family:inherit;transition:background-color .12s,border-color .12s,color .12s}",
			".vk_pickBtn:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}",
			// 模式切换胶囊（accent 实心；右栏「全屏对话/分栏视图」与「新建文件/文件夹」切换复用。
			// 位置须在 .vk_pickBtn/.vk_tabBtn 之后：同级特异性下靠后者覆盖底色与圆角）
			".vk_modeBtn{align-self:center;background:var(--vk-accent);color:#fff;border-radius:999px;padding:4px 13px;margin:0 8px 0 4px;border-bottom:none;font-weight:600;line-height:16px;letter-spacing:.2px;box-shadow:0 1px 3px rgba(0,0,0,.18);transition:filter .12s,box-shadow .12s,color .12s,background-color .12s}",
			".vk_modeBtn:hover{color:#fff;background:var(--vk-accent);filter:brightness(1.1);box-shadow:0 2px 8px var(--vk-accent-ring)}",
			// ── 文件树行：缩进参考线 / 图标 / 悬停与选中层次 ─────────────
			".vk_tree{flex:1;min-height:0;overflow:auto;padding:4px 0}",
			".vk_row{position:relative;display:flex;align-items:center;gap:5px;padding:2px 8px 2px 4px;cursor:pointer;font-size:13px;line-height:22px;white-space:nowrap;user-select:none;transition:background-color .1s}",
			".vk_row:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".vk_rowActive{background:var(--vk-accent-soft)}",
			// 选中态（第三轮 B 项）：单击 = 选中，底纹 + 一圈 accent 描边；正在拓展栏打开的那一行
			// （vk_rowActive）保留 accent 实底，两者同时存在时以「已打开」为准。
			".vk_rowSelected{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1px var(--vk-accent-ring)}",
			".vk_rowSelected.vk_rowActive{background:var(--vk-accent-soft)}",
			".vk_openErr{padding:6px 10px;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-error,#d9534f);background:var(--vk-accent-soft);border-bottom:0.5px solid var(--dsw-alias-border-l3);flex:none;word-break:break-all}",
			".vk_rowActive:hover{background:var(--vk-accent-ring)}",
			".vk_rowHidden{opacity:.55}",
			".vk_guide{position:absolute;top:0;bottom:0;width:0;border-left:1px solid var(--dsw-alias-border-l2)}",
			".vk_row:hover .vk_guide{border-left-color:var(--dsw-alias-border-l3)}",
			".vk_caret{width:14px;flex:none;color:var(--dsw-alias-label-tertiary);text-align:center;font-size:10px}",
			// 左侧三角现在是**唯一的展开/收起入口**（单击行改成了「选中 / 再点一次进入」，见 B 项）
			".vk_caretBtn{cursor:pointer;border-radius:4px}",
			".vk_caretBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_name{overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary)}",
			".vk_dirName{font-weight:500}",
			".vk_relPath{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".vk_nameFixed{flex:none}",
			".vk_rowActions{display:none;flex:none;margin-left:4px;align-items:center;gap:2px}",
			// 行右端那一组按钮（「进入子目录」常显按钮 + hover 才出的重命名/删除）整块靠右：
			// 用一层 tail 兜住，避免给两个兄弟节点同时 margin-left:auto 把空白平均分掉。
			".vk_rowTail{display:flex;align-items:center;gap:2px;flex:none}",
			".vk_row:not(:has(.vk_gitBadge)) .vk_rowTail{margin-left:auto}",
			".vk_rowTail .vk_rowActions{margin-left:0}",
			".vk_row:hover .vk_rowActions{display:flex}",
			".vk_rowBtn{appearance:none;border:none;background:none;cursor:pointer;font-size:11px;width:20px;height:20px;padding:0;border-radius:5px;line-height:1;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:center;transition:background-color .1s,color .1s}",
			".vk_rowBtn:hover{background:var(--dsw-alias-interactive-bg-hover-accent);color:var(--dsw-alias-label-primary)}",
			// 真删除（送回收站）那颗：悬停染成告警色，和上面那颗「仅移出列表」的垃圾桶区分开
			".vk_rowBtnDanger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5534b) 16%,transparent);color:var(--dsw-alias-state-error-primary,#e5534b)}",
			".vk_hiddenHint{padding:3px 12px;font-size:11px;color:var(--dsw-alias-label-tertiary);cursor:default;white-space:nowrap;font-style:italic}",
			// ── 应用内「打开文件夹」目录浏览器弹窗 ──────────────────────
			// z-index：官方 @ 菜单自身是 z-index:100（dsh-client-ui-input-trigger 的 ._3e4SsG_menu），
			// 官方 UI 里最高的浮层是 1100。原来这里是 90 → **@ 菜单浮在弹窗之上**，正好压在卡片上半截，
			// 就是用户 2026-09-13 报的「@ 列表搜索框还是存在遮挡关系」。取 1200 让它置顶到所有官方浮层之上。
			".vk_browseOverlay{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.52);display:flex;align-items:center;justify-content:center;padding:24px;animation:vkFadeIn .12s ease-out}",
			// 固定尺寸（2026-09-12 用户要求：点开文件夹后不能变大，弹窗自始至终一个大小）：
			// 卡片给死高度、内容区只滚不撑 —— 条数少（磁盘列表）与条数多（文件夹里几十项）都是同一块框。
			// 高度取 300px = 「刚打开那一屏」的自然高度（头部 + 路径行 + 磁盘/桌面约 5 行条目 ≈ 285px），
			// 也就是用户口径里的「原来那个刚进搜索栏的大小」；480px 那种大框会顶到窗口边缘被遮挡。
			// --vk-browse-dx：水平对齐偏移（2026-09-13 用户要求「相对对话框水平居中」）。
			// 浮层模式由 VKBrowseModal 按锚点算出像素值写成内联变量；嵌入式不设 → 默认 0px，行为不变。
			// transform 既写在常规态（动画结束后由它生效）也写进 vkBrowseIn（动画期间不丢偏移）。
			".vk_browseCard{width:min(520px,94vw);height:min(300px,72vh);max-height:min(300px,72vh);background:var(--dsw-alias-bg-layer-2,var(--dsw-specific-menu));border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:var(--dsw-shadow-lv3),0 24px 60px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;transform:translateX(var(--vk-browse-dx,0px));animation:vkBrowseIn .14s cubic-bezier(.2,.7,.3,1)}",
			".vk_browseHead{display:flex;align-items:center;gap:8px;padding:11px 12px 10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}",
			".vk_browseTitle{flex:1;min-width:0;font-size:13px;font-weight:600;letter-spacing:.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".vk_iconBtn{appearance:none;border:none;background:none;cursor:pointer;color:var(--dsw-alias-label-tertiary);padding:0;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex:none;transition:background-color .1s,color .1s,transform .08s}",
			".vk_iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_iconBtn:active{transform:scale(.94)}",
			".vk_iconBtnOn{color:var(--vk-accent)}",
			".vk_iconBtnOn:hover{color:var(--vk-accent)}",
			".vk_browsePathRow{display:flex;gap:6px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
			".vk_browsePathRow .vk_pickInput{flex:1;min-width:0}",
			".vk_browsePathIcon{display:flex;color:var(--dsw-alias-label-tertiary);flex:none}",
			".vk_crumbs{display:flex;align-items:center;gap:1px;overflow-x:auto;scrollbar-width:none;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;user-select:none}",
			".vk_crumbs::-webkit-scrollbar{display:none}",
			".vk_crumb{display:inline-flex;align-items:center;gap:1px;padding:2px 5px;border-radius:5px;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}",
			".vk_crumb:not(.vk_crumbCur){cursor:pointer}",
			".vk_crumb:not(.vk_crumbCur):hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_crumbCur{color:var(--dsw-alias-label-primary);font-weight:600}",
			".vk_crumbsSpacer{flex:1;min-width:8px}",
			".vk_crumbsBack{margin-left:auto}",
			// 内容区：只负责滚动，不再用 max-height 让卡片跟着内容长高（尺寸由 .vk_browseCard 定死）
			".vk_browseBody{flex:1;min-height:0;overflow:auto;padding:6px;display:flex;flex-direction:column;gap:1px}",
			".vk_browseErr{margin:2px 4px 4px;padding:7px 10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);color:var(--dsw-alias-state-error-primary);border-radius:7px;font-size:12px;line-height:16px;flex:none}",
			".vk_browseHint{display:flex;align-items:center;justify-content:center;gap:6px;padding:20px 10px;font-size:12px;color:var(--dsw-alias-label-tertiary);text-align:center}",
			".vk_browseRow{display:flex;align-items:center;gap:9px;padding:4px 10px;line-height:24px;font-size:13px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:7px;white-space:nowrap;user-select:none;flex:none}",
			".vk_browseRow:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".vk_browseRowIcon{display:flex;color:var(--dsw-alias-label-tertiary);flex:none;transition:color .1s}",
			".vk_browseRow:hover .vk_browseRowIcon{color:var(--dsw-alias-label-primary)}",
			".vk_browseRow .vk_name{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis}",
			".vk_browseRowUp{color:var(--dsw-alias-label-secondary)}",
			// 选中态（第三轮 B 项）：单击选中（底纹 + accent 描边），再点一次才动作
			".vk_browseRowSelected{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1px var(--vk-accent-ring)}",
			".vk_browseRowEnter{flex:none;width:20px;height:20px}",
			".vk_browseRowSelected .vk_browseOpenHint{opacity:1}",
			".vk_browseRowHidden{opacity:.55}",
			".vk_browseShowHidden{color:var(--dsw-alias-label-tertiary);font-size:12px}",
			// 文件行（"打开本机文件"弹窗的文件模式）：与目录行同款，光标给 pointer，末端的回车提示常显
			".vk_browseFileRow{color:var(--dsw-alias-label-primary)}",
			".vk_browseFileRow .vk_name{flex:0 1 auto}",
			".vk_browseOpenHint{flex:none;margin-left:auto;font-size:10.5px;line-height:16px;padding:0 6px;border-radius:999px;background:var(--vk-accent-soft);color:var(--vk-accent);opacity:0;transition:opacity .12s}",
			".vk_browseFileRow:hover .vk_browseOpenHint{opacity:1}",
			// 标签正文内嵌（拓展栏「打开本机文件」）：不浮层、不遮罩，改成**居中卡片**（高度约栏高 1/3，
			// 内容超出时卡片内部滚动）。原先铺满整列（height:100%）会把「只有几行目录」的内容拉成一大片空白，
			// 上下顶到栏的两端，观感很差；改成自适应高度（flex:0 1 auto）+ 上限 22vh 后：内容少则卡片矮、
			// 内容多则卡片内部滚动，卡片始终竖向居中。
			".vk_browseEmbed{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:12px;overflow:hidden}",
			// 内嵌（拓展栏标签正文）形态：这条**不受上面那个固定高度管**，卡片按内容自适应（height:auto 覆盖），
			// 否则几行目录会被 480px 的框拉出一大片空白。
			".vk_browseCardEmbed{width:100%;max-width:520px;height:auto;max-height:100%;border-radius:12px;box-shadow:var(--dsw-shadow-lv3)}",
			".vk_browseCardEmbed .vk_browseBody{flex:0 1 auto;min-height:0;max-height:min(22vh,230px)}",
			".vk_browseFoot{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid var(--dsw-alias-border-l1)}",
			".vk_browseFootPath{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".vk_primaryBtn{background:var(--vk-accent);color:#fff;border-color:var(--vk-accent);font-weight:600}",
			".vk_primaryBtn:hover{background:var(--vk-accent);color:#fff;filter:brightness(1.1);border-color:var(--vk-accent)}",
			".vk_primaryBtn:disabled{opacity:.45;cursor:not-allowed;filter:none}",
			"@keyframes vkBrowseIn{from{opacity:0;transform:translateX(var(--vk-browse-dx,0px)) scale(.97) translateY(4px)}to{opacity:1;transform:translateX(var(--vk-browse-dx,0px))}}",
			".vk_imgToolbar{display:flex;align-items:center;gap:2px;padding:4px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;flex:none}",
			".vk_imgToolbarSpacer{flex:1;min-width:8px}",
			".vk_imgZoomBtn{display:inline-flex;align-items:center;gap:4px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;padding:4px 7px;border-radius:6px;cursor:pointer;font-family:inherit}",
			".vk_imgZoomBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_imgZoomBtnOn{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
			".vk_imgZoomPct{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));min-width:52px;text-align:center;font-variant-numeric:tabular-nums}",
			".vk_imgWrap{flex:1;min-height:0;display:flex;overflow:auto;background:repeating-conic-gradient(var(--dsw-alias-interactive-bg-hover) 0% 25%,transparent 0% 50%) 0 0/22px 22px;position:relative;cursor:grab}",
			".vk_imgWrap.vk_imgPan{cursor:grabbing}",
			".vk_imgWrap img{display:block;margin:auto;user-select:none;-webkit-user-drag:none;box-shadow:0 2px 16px rgba(0,0,0,.35);background:#fff;border-radius:4px}",
			// ── 文件图标徽章（浅色基准；深色在文末覆盖） ─────────────────
			".vk_icon{flex:none;width:17px;height:17px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1}",
			".vk_iconSvg{color:var(--dsw-alias-label-secondary)}",
			".vk_iconChip{width:16px;height:16px;border-radius:4px;font-size:8.5px;font-weight:700;font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;letter-spacing:.1px}",
			".vk_iJs{color:#9c8205;background:rgba(241,224,90,.28)}",
			".vk_iTs{color:#3178c6;background:rgba(49,120,198,.16)}",
			".vk_iReact{color:#0e9fc9;background:rgba(97,218,251,.2)}",
			".vk_iPy{color:#3572a5;background:rgba(53,114,165,.14)}",
			".vk_iJson{color:#a87b00;background:rgba(203,182,65,.18)}",
			".vk_iHtml{color:#e34c26;background:rgba(227,76,38,.12)}",
			".vk_iXml{color:#7d4b8f;background:rgba(125,75,143,.12)}",
			".vk_iSvg{color:#b8563e;background:rgba(184,86,62,.12)}",
			".vk_iCss{color:#2965f1;background:rgba(41,101,241,.12)}",
			".vk_iScss{color:#c6538c;background:rgba(198,83,140,.12)}",
			".vk_iLess{color:#2a4d8f;background:rgba(42,77,143,.12)}",
			".vk_iVue{color:#41b883;background:rgba(65,184,131,.16)}",
			".vk_iSvelte{color:#ff3e00;background:rgba(255,62,0,.1)}",
			".vk_iMd{color:#519aba;background:rgba(81,154,186,.14)}",
			".vk_iYaml{color:#c93c3c;background:rgba(203,60,60,.1)}",
			".vk_iShell{color:#4e9a06;background:rgba(137,224,81,.18)}",
			".vk_iConf{color:#6d8086;background:rgba(109,128,134,.14)}",
			".vk_iTxt{color:#7f8c8d;background:rgba(127,140,141,.14)}",
			".vk_iSql{color:#e38c00;background:rgba(227,140,0,.12)}",
			".vk_iVisio{color:#3955a3;background:rgba(57,85,163,.14)}",
			".vk_iGql{color:#e535ab;background:rgba(229,53,171,.12)}",
			".vk_iRs{color:#b4713d;background:rgba(222,165,132,.22)}",
			".vk_iGo{color:#00add8;background:rgba(0,173,216,.12)}",
			".vk_iC{color:#5c6bc0;background:rgba(92,107,192,.14)}",
			".vk_iCpp{color:#d1477b;background:rgba(243,75,125,.12)}",
			".vk_iCs{color:#2c8c1e;background:rgba(35,145,32,.12)}",
			".vk_iRb{color:#cc342d;background:rgba(204,52,45,.1)}",
			".vk_iPhp{color:#777bb4;background:rgba(119,123,180,.14)}",
			".vk_iKt{color:#7f52ff;background:rgba(127,82,255,.12)}",
			".vk_iSwift{color:#f05138;background:rgba(240,81,56,.12)}",
			".vk_iLua{color:#4a4ab8;background:rgba(74,74,184,.12)}",
			".vk_iR{color:#276dc3;background:rgba(39,109,195,.12)}",
			".vk_iWasm{color:#654ff0;background:rgba(101,79,240,.12)}",
			".vk_iFont{color:#a074c4;background:rgba(160,116,196,.14)}",
			".vk_iBin{color:#6e7681;background:rgba(110,118,129,.16)}",
			".vk_iGit{color:#e94e32;background:rgba(240,80,51,.12)}",
			".vk_iNpm{color:#cb3837;background:rgba(203,56,55,.12)}",
			".vk_iJava{color:#b07219;background:rgba(176,114,25,.14)}",
			// ── Git 角标：VS Code 式纯色字母（无底色胶囊） ────────────────
			".vk_gitBadge{flex:none;margin-left:auto;padding:0 2px;font-size:11px;font-weight:700;line-height:16px;letter-spacing:.2px}",
			".vk_gitM{color:#c09a52}",
			".vk_gitU,.vk_gitA{color:#4f9e68}",
			".vk_gitD{color:#d64545}",
			".vk_gitR{color:#a866c4}",
			".vk_saveMsg{font-size:12px;color:var(--dsw-alias-label-secondary);flex:none}",
			// ── 空态 / 错误 / 通知排版 ─────────────────────────────────
			".vk_err{margin:8px;padding:8px 10px;font-size:12px;line-height:1.6;color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger);border-radius:6px}",
			".vk_empty{padding:32px 20px;font-size:12.5px;line-height:2;color:var(--dsw-alias-label-tertiary);text-align:center;white-space:pre-wrap}",
			// ── 键盘聚焦可见态（统一 accent 光圈） ──────────────────────
			".vk_tabBtn:focus-visible,.vk_railBtn:focus-visible,.vk_treeBtn:focus-visible,.vk_rowBtn:focus-visible,.vk_pickBtn:focus-visible,.vk_editBtn:focus-visible,.vk_tabClose:focus-visible{outline:2px solid var(--vk-accent-ring);outline-offset:-2px}",
			// ── 深色主题覆盖：徽章/角标颜色提亮 ─────────────────────────
			"body[data-ds-dark-theme] .vk_iJs{color:#f1e05a;background:rgba(241,224,90,.14)}",
			"body[data-ds-dark-theme] .vk_iTs{color:#5496d8}",
			"body[data-ds-dark-theme] .vk_iReact{color:#61dafb;background:rgba(97,218,251,.12)}",
			"body[data-ds-dark-theme] .vk_iPy{color:#6aa5e0}",
			"body[data-ds-dark-theme] .vk_iJson{color:#cbcb41}",
			"body[data-ds-dark-theme] .vk_iHtml{color:#ff7a59}",
			"body[data-ds-dark-theme] .vk_iXml{color:#b47fd4}",
			"body[data-ds-dark-theme] .vk_iSvg{color:#e08a70}",
			"body[data-ds-dark-theme] .vk_iCss{color:#6ea8ff}",
			"body[data-ds-dark-theme] .vk_iLess{color:#7a9ee0}",
			"body[data-ds-dark-theme] .vk_iYaml{color:#ff7b72}",
			"body[data-ds-dark-theme] .vk_iShell{color:#89e051}",
			"body[data-ds-dark-theme] .vk_iConf{color:#9aa7b0}",
			"body[data-ds-dark-theme] .vk_iTxt{color:#9aa7b0}",
			"body[data-ds-dark-theme] .vk_iSql{color:#f0a63c}",
			"body[data-ds-dark-theme] .vk_iVisio{color:#8aa4e8}",
			"body[data-ds-dark-theme] .vk_iRs{color:#dea584}",
			"body[data-ds-dark-theme] .vk_iC{color:#8fa3e8}",
			"body[data-ds-dark-theme] .vk_iCs{color:#6fbf4a}",
			"body[data-ds-dark-theme] .vk_iRb{color:#ff7b72}",
			"body[data-ds-dark-theme] .vk_iLua{color:#8b8bff}",
			"body[data-ds-dark-theme] .vk_iR{color:#6aa5e0}",
			"body[data-ds-dark-theme] .vk_iBin{color:#9aa7b0}",
			"body[data-ds-dark-theme] .vk_iGit{color:#f05033}",
			"body[data-ds-dark-theme] .vk_iJava{color:#e6b84f}",
			"body[data-ds-dark-theme] .vk_gitM{color:#e2c08d}",
			"body[data-ds-dark-theme] .vk_gitU,body[data-ds-dark-theme] .vk_gitA{color:#73c991}",
			"body[data-ds-dark-theme] .vk_gitD{color:#f14c4c}",
			"body[data-ds-dark-theme] .vk_gitR{color:#c678dd}",
			".vk_imgToolbar{display:flex;align-items:center;gap:2px;padding:4px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}",
			".vk_imgZoomBtn{display:inline-flex;align-items:center;gap:4px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;padding:4px 7px;border-radius:6px;cursor:pointer}",
			".vk_imgZoomBtn:disabled{opacity:.4;cursor:default}",
			".vk_homeLabel{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--dsw-alias-label-tertiary);letter-spacing:.02em;margin:6px 10px 2px}",
			".vk_homeLabelToggle{cursor:pointer;user-select:none;border-radius:4px;padding:1px 4px;margin-left:6px;margin-right:6px}",
			".vk_homeLabelToggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}",
		].join("");

		(function injectFilesCss() {
			if (typeof document === 'undefined') return;
			const plugin = 'dsh-files-tree';
			for (const old of document.querySelectorAll('style[data-plugin="' + plugin + '"]')) { try { old.remove(); } catch { /* ignore */ } }
			const tag = document.createElement('style');
			tag.dataset.plugin = plugin;
			tag.textContent = CSS + '.vk_filesPane{display:flex;flex-direction:column;min-height:0;height:100%;overflow:hidden}';
			document.head.appendChild(tag);
		})();

		/** 路径尾段（`D:\a\b.txt` → `b.txt`；没有分隔符时原样返回）。 */
		function pathBase(p) {
			const s = String(p);
			const cut = Math.max(s.lastIndexOf("\\"), s.lastIndexOf("/"));
			return cut < 0 ? s : s.slice(cut + 1);
		}
		// 文件树落地页（未打开具体文件夹时）：折叠展示的常用根目录，展开即可浏览；要固定展示自己的目录，在这里补条目
		const HOME_DIRS = VK_HOME_DIRS;
		/** 路径归一化：去掉首尾空白与尾部分隔符，盘根补回一条反斜杠，统一小写（Windows 不区分大小写）。 */
		function normPath(p) {
			if (typeof p !== "string") return "";
			const trimmed = p.trim();
			const withRoot = /^[A-Za-z]:$/.test(trimmed) ? trimmed + "\\" : trimmed;
			const bare = withRoot.replace(/[\\/]+$/, "");
			return (/^[A-Za-z]:$/.test(bare) ? bare + "\\" : bare).toLowerCase();
		}
		/** 是否落在工作区 / 长期任务的固定目录里（这类目录不进「最近打开」，也不写记录）。 */
		function isHomeDirPath(p) {
			const n = normPath(p);
			return HOME_DIRS.some((d) => normPath(d.path) === n);
		}
		// ── 文件栏的展开状态：**模块级共享（仅文件栏这一族视图内部）**────────────────────
		// 2026-09-12 晚修订：与「会话 @ 列表」**解绑**（用户口径：两边只是内容一致，展开状态各自独立）。
		// 写入方只剩文件栏自己：那颗三角 toggle；复位方是「离开文件栏」（切 Tab / 收起面板 / 卸载，
		// 用户口径「切走再切回来仍纯折叠」）与换工作区根。@ 菜单不再清它、也不拿它当自己的展开态：
		// @ 菜单目录行走官方 drill（vkAtBrowse）自己那一套。
		// 保留模块级存放只是为了文件栏内的多个入口（落地页 / 文件列表 / 最近打开）读到同一份。
		// showHidden 同理（文件栏那颗眼睛）：要显示同一批条目。
		// 注意用**归一化路径**比较（大小写/尾斜杠不敏感），但集合里存**原样路径**——
		// 原样路径要拿去请求 /vscode-files/list 并作为 entries 的键，写成小写会让 rows() 取不到子项。
		const vkFileTreeState = { expanded: new Set(), showHidden: false, subs: new Set() };
		// ── 诊断探针（2026-09-12 晚，临时；查完「还是会自己收」就删）──────────────────────
		// 自报数（DevTools 控制台）：JSON.stringify(__VK_DIAG__)
		//   · mounts.k 一直涨 → FileTree 被反复重挂载（本地 state 复位 → 看起来「自己收」）
		//   · unmounts  涨  → 同上，且能看出是哪次渲染卸的
		//   · clears.<来源> 涨 → 展开集真的被某条代码路径清了，来源直接点名
		const vkDiag = { mountedAt: new Date().toISOString(), mounts: 0, unmounts: 0, clears: {}, lastMounts: [], lastUnmounts: [], events: [], uiSeq: [] };
		try { globalThis.__VK_DIAG__ = vkDiag; } catch { /* 非浏览器环境 */ }
		/** 统一录入一条诊断事件（带调用栈）。 */
		function vkDiagEvent(kind, detail) {
			try {
				vkDiag.events.push({ at: new Date().toISOString().slice(11, 23), kind: kind, detail: detail, stack: String(new Error().stack || "").split("\n").slice(2, 6).join(" <- ") });
				if (vkDiag.events.length > 80) vkDiag.events.shift();
			} catch { /* 探针失败不影响行为 */ }
		}
		/** 统一的时间线录入：把「点击 / 栏目开合 / 卸载」放进同一条序列里，用来对齐先后。 */
		function vkDiagUI(kind, detail) {
			try {
				vkDiag.uiSeq.push({ at: new Date().toISOString().slice(11, 23), kind: kind, detail: detail });
				if (vkDiag.uiSeq.length > 120) vkDiag.uiSeq.shift();
			} catch { /* 探针失败不影响行为 */ }
		}
		/** 清空展开集：正常路径与诊断共用，reason 就是「谁清的」。 */
		function vkFileTreeClearExpanded(reason) {
			if (vkFileTreeState.expanded.size === 0) return;
			vkDiag.clears[reason] = (vkDiag.clears[reason] || 0) + 1;
			vkFileTreeSetExpanded(new Set());
			vkDiagEvent("clear:" + reason, "");
		}
		function vkFileTreeSubscribe(fn) {
			vkFileTreeState.subs.add(fn);
			return () => { vkFileTreeState.subs.delete(fn); };
		}
		function vkFileTreeSetExpanded(next) {
			vkFileTreeState.expanded = next instanceof Set ? new Set(next) : new Set(next);
			const list = [...vkFileTreeState.expanded];
			for (const fn of [...vkFileTreeState.subs]) { try { fn(list); } catch { /* 订阅方可能已卸载 */ } }
		}
		// ── 展开集什么时候被清空（2026-09-13 定稿：与 @ 列表彻底解绑）──────────────────────
		// 只有**确定性的两个来源**：
		//   ① 用户离开文件栏：切到会话/任务 Tab、或收起左栏 —— 由 VKSidebarBody 的 tab/wide effect
		//      直接清（见那边注释）；切回来时 DOM 还没渲染就已经是空的，天然「纯折叠」。
		//   ② 在文件栏里换根 / 关根（setRoot 到不同值）—— 由 FileTree 的 [root] effect 清。
		// 写入方只有文件栏自己（那颗三角 / 单击目录行）。
		// **@ 列表与文件栏完全分离**（用户第一轮口径：两边只是内容一致）：@ 菜单的关闭复位、@ 的旧目录行
		// 分支都不再读写这份状态；IntersectionObserver 那条「看可见性」的兜底也已删除。
		// 展开状态在文件栏内也不跨视图记忆：切走再切回来仍是纯折叠。
		/** 某目录是否处于展开态（按归一化路径比较，忽略大小写与尾斜杠）。 */
		function vkFileTreeHas(path) {
			const k = normPath(path);
			for (const p of vkFileTreeState.expanded) if (normPath(p) === k) return true;
			return false;
		}
		/** 展开 / 收起一个目录（收起时级联收起全部后代）；返回切换后的状态（true = 已展开）。 */
		function vkFileTreeToggle(path) {
			const k = normPath(path);
			const next = new Set();
			let wasOpen = false;
			for (const p of vkFileTreeState.expanded) {
				const pk = normPath(p);
				if (pk === k) { wasOpen = true; continue; }
				if (pk.startsWith(k + "\\") || pk.startsWith(k + "/")) continue;
				next.add(p);
			}
			if (!wasOpen) next.add(String(path));
			vkFileTreeSetExpanded(next);
			return !wasOpen;
		}
		// ── 栏目（section）折叠：两份独立状态（2026-09-11，用户要求）────────────────────
		// 形态：**默认全部折叠 + 一次只开一栏**（手风琴）。展开某栏时其他栏自动收起；
		// 点当前已展开的那一栏 = 全部收起。切走再切回来不会"记着"展开（用户明确口径）。
		// ① vkSectionState —— @ 菜单落地页的栏目。
		// ② vkHomeState    —— 左侧文件栏（项目栏）落地页的同样四个栏目，同一套形态。
		// 两份状态都不落盘：刷新页面即回到默认（全折叠）。
		const vkSectionState = { open: null, subs: new Set() }; // open = 当前展开的栏目名；null = 全折叠
		function vkSectionSubscribe(fn) {
			vkSectionState.subs.add(fn);
			return () => { vkSectionState.subs.delete(fn); };
		}
		/** 栏目是否展开（@ 落地页；默认为 null → 全折叠）。 */
		function vkSectionIsOpen(name) {
			return vkSectionState.open !== null && vkSectionState.open === String(name);
		}
		/** 切换栏目展开态（@ 落地页）：开一栏即收其他栏，返回切换后的状态。 */
		function vkSectionToggle(name) {
			const k = String(name);
			vkSectionState.open = vkSectionState.open === k ? null : k;
			for (const fn of [...vkSectionState.subs]) { try { fn(k); } catch { /* 订阅方可能已卸载 */ } }
			return vkSectionState.open === k;
		}
		const vkHomeState = { open: null, subs: new Set() }; // open = 当前展开的栏目名；null = 全折叠
		function vkHomeSubscribe(fn) {
			vkHomeState.subs.add(fn);
			return () => { vkHomeState.subs.delete(fn); };
		}
		/** 栏目是否展开（文件栏落地页；默认为 null → 全折叠）。 */
		function vkHomeIsOpen(name) {
			return vkHomeState.open !== null && vkHomeState.open === String(name);
		}
		/** 切换栏目展开态（文件栏落地页）：开一栏即收其他栏，返回切换后的状态。 */
		function vkHomeToggle(name) {
			const k = String(name);
			vkHomeState.open = vkHomeState.open === k ? null : k;
			vkDiagUI("home-toggle", k + " -> open=" + String(vkHomeState.open));
			for (const fn of [...vkHomeState.subs]) { try { fn(k); } catch { /* 订阅方可能已卸载 */ } }
			return vkHomeState.open === k;
		}
		/** 复位落地页栏目（reason 只用于诊断）：当前是「切走文件栏 / 卸载」两条路径。 */
		function vkHomeReset(reason) {
			const wasOpen = vkHomeState.open;
			vkHomeState.open = null;
			vkDiagUI("home-reset", reason + " wasOpen=" + String(wasOpen));
			for (const fn of [...vkHomeState.subs]) { try { fn(null); } catch { /* 订阅方可能已卸载 */ } }
		}
		// 桌面快捷入口：目录浏览器根视图里与磁盘同级列出的快捷入口，探测存在才显示
				/**
		 * 当前会话 id（**文件栏按会话隔离的唯一基准**，2026-09-12 用户口径「每个对话不共享文件栏」）。
		 * root 作用域插槽拿不到 props.sessionId（见 §5.2.1），一律现取 sessions 服务的快照。
		 * 取不到（插件刚加载 / 无会话面）时返回空串，调用方回落到一个与「无会话」等价的桶。
		 */
		function vkCurrentSessionId() {
			// ★主口径（对照官方客户端复核，2026-09-29）：中间栏正在显示哪个会话，就是 list 快照里
			// `retainedBy.mainView > 0` 的那一行 —— 官方 layout / session / workspace / cordis /
			// settings-general / open-in-app 六处取当前会话用的都是这一句。快照字段只有
			// { ids, byId, phase, projectionsBySession }，`current` / `currentId` 早就不存在了，
			// 只靠下面三层兜底会永远拿到空串（用户 2026-09-29 报的「先在中间栏打开一个会话」）。
			try {
				const byId = ctxRef.current.get("sessions").list.getSnapshot().byId;
				const rows = byId === undefined || byId === null ? [] : Object.keys(byId);
				for (const id of rows) {
					const row = byId[id];
					if (row !== undefined && row !== null && ((row.retainedBy && row.retainedBy.mainView) || 0) > 0) return id;
				}
			} catch { /* 落到下面的兜底 */ }
			// 兜底：旧字段名（1.6 时期是 current）
			// DSH 1.7 的 sessions 快照**只剩 byId**，老的 `current` / `currentId` 都没了。
			// 以前这里只认 `current` → 永远空串 → 双击文件在右栏打开时被判成「没有会话」，
			// 弹「先在中间栏打开一个会话」（用户 2026-09-29 报的）。三层取值口径与 dsh-vk-layout 一致。
			try {
				const snapshot = ctxRef.current.get("sessions").list.getSnapshot();
				if (snapshot !== undefined && snapshot !== null) {
					for (const key of ["current", "currentId", "activeId", "selectedId"]) {
						const value = snapshot[key];
						if (typeof value === "string" && value.length > 0) return value;
					}
				}
			} catch { /* 落到 ② */ }
			try {
				const svc = ctxRef.current.get("sessions");
				for (const key of ["current", "currentId", "activeId"]) {
					if (typeof svc[key] === "function") {
						const value = svc[key]();
						if (typeof value === "string" && value.length > 0) return value;
					}
				}
			} catch { /* 落到 ③ */ }
			try {
				const row = document.querySelector("[data-row-key^=\"session:\"][aria-selected=\"true\"]")
					|| document.querySelector("[data-row-key^=\"session:\"][class*=\"_selected\"]");
				const raw = row === null ? "" : String(row.getAttribute("data-row-key") || "");
				if (raw.indexOf("session:") === 0) return raw.slice("session:".length);
			} catch { /* ignore */ }
			return "";
		}
		/** 文件栏两份列表（最近打开 / 文件列表）的落盘键：**按会话隔离**，键里带会话 id。 */
		function vkSessionKey(sid, kind) {
			return "dsh-vscode-layout:" + kind + ":v1:" + (typeof sid === "string" && sid.length > 0 ? sid : "none");
		}
		const RECENTS_MAX = 8;
		// 拖入文件的自动收件目录（~/.dsh/drop-inbox/<sessionId>）：这类路径本身是 UUID 乱码，
		// 在「最近打开」里用其内含的首个文件名做可辨识标签
		const DROP_INBOX_RE = /[\\/]\.dsh[\\/]drop-inbox[\\/][^\\/]+$/i;
		function isDropInboxDir(p) {
			return typeof p === "string" && DROP_INBOX_RE.test(p);
		}
		function dropDirLabel(p, e) {
			if (e && e.ok && Array.isArray(e.files) && e.files.length > 0) {
				const n = String(e.files[0].name || "").trim();
				if (n.length > 0) {
					const i = n.lastIndexOf(".");
					return "贴入 · " + (i > 0 ? n.slice(0, i) : n);
				}
			}
			return "贴入文件";
		}
		function landingLabel(p, e) {
			return isDropInboxDir(p) ? dropDirLabel(p, e) : pathBase(p);
		}
		/** 两份列表（最近打开 / 文件列表）共用的落盘读写：读失败当空、写失败静默。 */
		function vkListRead(kind, sid) {
			const s = typeof sid === "string" && sid.length > 0 ? sid : vkCurrentSessionId();
			try {
				const raw = localStorage.getItem(vkSessionKey(s, kind));
				const arr = raw === null ? [] : JSON.parse(raw);
				return Array.isArray(arr) ? arr : [];
			} catch { return []; }
		}
		function vkListWrite(kind, sid, list) {
			const s = typeof sid === "string" && sid.length > 0 ? sid : vkCurrentSessionId();
			try {
				localStorage.setItem(vkSessionKey(s, kind), JSON.stringify(Array.isArray(list) ? list : []));
			} catch { /* 落盘不可用（隐私模式等）：这次不记，不影响使用 */ }
		}
		/** 按归一化路径去重、保留首现顺序——重复路径会共享展开状态，导致折叠错乱。 */
		function vkUniqueByPath(list, pick) {
			const seen = new Set();
			const out = [];
			for (const it of list) {
				const p = pick(it);
				if (typeof p !== "string" || p.length === 0) continue;
				const k = normPath(p);
				if (seen.has(k)) continue;
				seen.add(k);
				out.push(it);
			}
			return out;
		}
		/**
		 * 「最近打开」：按会话隔离（键 …:recents:v1:<sessionId>），读取时顺手剔掉固定目录与重复项。
		 * 旧版全局键的残留数据不读取、也不清理——留给用户自己处置，免得误删他手写的记录。
		 */
		function readRecents(sid) {
			return vkUniqueByPath(vkListRead("recents", sid), (p) => p)
				.filter((p) => typeof p === "string" && p.length > 0 && !isHomeDirPath(p))
				.slice(0, RECENTS_MAX);
		}
		function writeRecents(list, sid) {
			vkListWrite("recents", sid, vkUniqueByPath(Array.isArray(list) ? list : [], (p) => p).slice(0, RECENTS_MAX));
		}
		/** 「文件列表」：那台自适应浏览器里点中过的文件，落地页单独成一组，回头能直接再开。 */
		const FILE_LIST_KEY = "dsh-vscode-layout:filelist:v1";
		const FILE_LIST_MAX = 12;
		/** 列表项统一成 { path, name }：没有名字就用路径尾段补一个。 */
		function vkFileItem(it) {
			return { path: it.path, name: typeof it.name === "string" && it.name.length > 0 ? it.name : pathBase(it.path) };
		}
		function readFileList(sid) {
			return vkUniqueByPath(vkListRead("filelist", sid), (it) => (it !== null && typeof it === "object" ? it.path : null))
				.map(vkFileItem)
				.slice(0, FILE_LIST_MAX);
		}
		function writeFileList(list, sid) {
			const clean = vkUniqueByPath(Array.isArray(list) ? list : [], (it) => (it !== null && typeof it === "object" ? it.path : null))
				.map(vkFileItem)
				.slice(0, FILE_LIST_MAX);
			vkListWrite("filelist", sid, clean);
		}
		// ──────────────────────────────────────────────────────────────
		// 文件图标（VS Code 式）：代码/数据类 = 按语言着色的字母徽章，媒体/二进制类 = 单色线性图标。
		// 一张扁平表：值写 `svg:<图标名>` 走线性图标，写 `chip:<后缀>|<徽章文字>` 走彩色 chip
		// （后缀对应样式表里的 .vk_i<后缀>，浅/深色两套颜色都定义在那儿）。
		// ──────────────────────────────────────────────────────────────
		const VK_FILE_ICON = {
			js: "chip:Js|JS", mjs: "chip:Js|JS", cjs: "chip:Js|JS",
			ts: "chip:Ts|TS", mts: "chip:Ts|TS", cts: "chip:Ts|TS",
			jsx: "svg:atom", tsx: "svg:atom",
			vue: "chip:Vue|V", svelte: "chip:Svelte|S", py: "chip:Py|Py",
			json: "chip:Json|{}", jsonc: "chip:Json|{}",
			html: "chip:Html|<>", htm: "chip:Html|<>", xml: "chip:Xml|<>", svg: "chip:Svg|<>",
			css: "chip:Css|#", scss: "chip:Scss|#", sass: "chip:Scss|#", less: "chip:Less|#",
			md: "chip:Md|Md", markdown: "chip:Md|Md",
			yml: "chip:Yaml|Y", yaml: "chip:Yaml|Y",
			sh: "svg:terminal", bash: "svg:terminal", zsh: "svg:terminal", ps1: "svg:terminal", bat: "svg:terminal", cmd: "svg:terminal",
			toml: "svg:gear", ini: "svg:gear", cfg: "svg:gear", conf: "svg:gear", env: "svg:gear", properties: "svg:gear",
			txt: "chip:Txt|Txt", log: "chip:Txt|Txt",
			sql: "chip:Sql|DB", graphql: "chip:Gql|Gql", gql: "chip:Gql|Gql",
			rs: "chip:Rs|Rs", go: "chip:Go|Go", java: "chip:Java|Jv",
			c: "chip:C|C", h: "chip:C|C",
			cpp: "chip:Cpp|C+", cc: "chip:Cpp|C+", cxx: "chip:Cpp|C+", hpp: "chip:Cpp|C+",
			cs: "chip:Cs|C#", rb: "chip:Rb|Rb", php: "chip:Php|Php",
			kt: "chip:Kt|K", kts: "chip:Kt|K", swift: "chip:Swift|Sw",
			lua: "chip:Lua|Lu", r: "chip:R|R", wasm: "chip:Wasm|W",
			woff: "chip:Font|A", woff2: "chip:Font|A", ttf: "chip:Font|A", otf: "chip:Font|A", eot: "chip:Font|A",
			exe: "svg:box", dll: "svg:box", bin: "svg:box", dat: "svg:box", msi: "svg:box",
			png: "svg:image", jpg: "svg:image", jpeg: "svg:image", gif: "svg:image", webp: "svg:image",
			bmp: "svg:image", ico: "svg:image", icns: "svg:image", avif: "svg:image",
			mp4: "svg:video", mov: "svg:video", avi: "svg:video", mkv: "svg:video", webm: "svg:video",
			mp3: "svg:music", wav: "svg:music", ogg: "svg:music", flac: "svg:music",
			zip: "svg:archive", tar: "svg:archive", gz: "svg:archive", rar: "svg:archive", "7z": "svg:archive", bz2: "svg:archive", xz: "svg:archive",
			pdf: "svg:fileText", lock: "svg:lock",
			vsd: "chip:Visio|Vi", vsdx: "chip:Visio|Vi", vsdm: "chip:Visio|Vi"
		};
		/** 按整名认的特殊文件（键必须全小写；查不到再退回扩展名）。 */
		const VK_FILE_ICON_NAME = {
			"package.json": "svg:box", ".npmrc": "svg:box", ".nvmrc": "svg:box",
			"package-lock.json": "svg:lock", "yarn.lock": "svg:lock", "pnpm-lock.yaml": "svg:lock",
			"tsconfig.json": "chip:Ts|TS",
			"dockerfile": "svg:box", "docker-compose.yml": "svg:box", "docker-compose.yaml": "svg:box", ".dockerignore": "svg:box",
			"makefile": "svg:tool", "cmakelists.txt": "svg:tool",
			"license": "svg:fileText", "license.md": "svg:fileText", "license.txt": "svg:fileText",
			".gitignore": "svg:gitBranch", ".gitattributes": "svg:gitBranch", ".gitmodules": "svg:gitBranch"
		};
		/** 名字（或目录）→ 图标描述：目录按开合给文件夹图标；文件先整名、再扩展名，认不出给通用文件图标。 */
		function iconOf(name, isDir, expanded) {
			if (isDir === true) return expanded === true ? "svg:folderOpen" : "svg:folder";
			const lower = String(name).toLowerCase();
			const dot = lower.lastIndexOf(".");
			const hit = VK_FILE_ICON_NAME[lower] !== undefined ? VK_FILE_ICON_NAME[lower] : VK_FILE_ICON[dot >= 0 ? lower.slice(dot + 1) : ""];
			return hit !== undefined ? hit : "svg:file";
		}
		/** 渲染图标描述：svg 前缀走单色线性图标，chip 前缀走 `后缀|文字` 彩色徽章。 */
		function renderFileIcon(spec0) {
			const spec = String(spec0 === null || spec0 === undefined ? "" : spec0);
			if (spec.startsWith("svg:")) return h("span", { className: "vk_icon vk_iconSvg" }, h(VIcon, { name: spec.slice(4), size: 14 }));
			const parts = spec.slice(5).split("|");
			return h("span", { className: "vk_icon vk_iconChip vk_i" + parts[0] }, parts[1]);
		}
		/** 是否盘根本身（`D:\` / `C:/`）。 */
		function isRootDriveOf(p) {
			return typeof p === "string" && /^[A-Za-z]:[\\/]$/.test(p);
		}
		/** 上一级目录（盘根返回自身；没有分隔符时原样返回）。 */
		function parentOfPath(p) {
			const s = String(p === null || p === undefined ? "" : p).replace(/[\\/]+$/, "");
			const cut = Math.max(s.lastIndexOf("\\"), s.lastIndexOf("/"));
			if (cut < 0) return s;
			const head = s.slice(0, cut);
			return /^[A-Za-z]:$/.test(head) ? head + "\\" : head;
		}
		/** 绝对路径 → 逐级面包屑 [{label, path}]（盘符单独成一级；相对路径从第一段起累积）。 */
		function crumbPartsOf(p) {
			if (typeof p !== "string" || p.length === 0) return [];
			const out = [];
			let acc = "";
			for (const seg of p.split(/[\\/]+/).filter((s) => s.length > 0)) {
				if (out.length === 0 && /^[A-Za-z]:$/.test(seg)) {
					acc = seg + "\\";
					out.push({ label: acc, path: acc });
					continue;
				}
				acc += seg + "\\";
				out.push({ label: seg, path: acc });
			}
			return out;
		}
		// ──────────────────────────────────────────────────────────────
		// 组件：应用内文件浏览弹窗（三处调用点共用）
		//
		// 数据与交互都长在调用方（目录、查询词、显隐开关），这里只负责画与转发：
		//   ① 左栏文件栏那颗文件夹图标——自适应（fileMode + pickFolder）：进目录/点文件都算选中，
		//      点文件就在拓展栏打开，点「打开」则把当前目录加入列表；
		//   ② 拓展栏「新标签页 → 打开本机文件」——文件模式，最终必须选中一个文件；
		//   ③ 对话输入区 @ 菜单右上角那颗放大镜——插入模式（insertMode），底部动作叫「引用」。
		// 三处的根视图、面包屑、模糊搜索、隐藏项开关、上下级导航完全一致。
		//
		// props: { fileMode, mode, pickFolder, embedded, anchorX, openTarget,
		//          path, dir, err, drives, probing, desktopPath, query, search, showHidden,
		//          onQuery, onGoto, onRoots, onToggleHidden, onReload, onClose, onPickFile, onOpen }
		// ──────────────────────────────────────────────────────────────
		function VKBrowseModal(props) {
			const fileMode = props.fileMode === true;
			const insertMode = props.mode === "insert";
			const pickFolder = props.pickFolder === true;
			const embedded = props.embedded === true;
			const actWord = insertMode ? "引用" : "打开";
			const anchorX = typeof props.anchorX === "number" && isFinite(props.anchorX) ? props.anchorX : null;
			const path = typeof props.path === "string" ? props.path : "";
			const query = typeof props.query === "string" ? props.query : "";
			const showHidden = props.showHidden === true;
			const openTarget = typeof props.openTarget === "string" ? props.openTarget : "";
			const dir = props.dir;
			const search = props.search;
			const err = props.err === null || props.err === undefined ? null : props.err;
			const probing = props.probing === true;
			const drives = Array.isArray(props.drives) ? props.drives : [];
			const desktopPath = props.desktopPath === null || props.desktopPath === undefined ? null : props.desktopPath;
			const loaded = dir !== null && dir !== undefined && dir.ok === true;
			const dirs = loaded ? (dir.dirs || []).filter((d) => showHidden || !d.hidden) : [];
			const files = loaded && fileMode ? (dir.files || []).filter((f) => showHidden || !f.hidden) : [];
			const hiddenCount = loaded ? (dir.dirs || []).filter((d) => d.hidden).length + (fileMode ? (dir.files || []).filter((f) => f.hidden).length : 0) : 0;
			const crumb = crumbPartsOf(path);
			const searching = query.trim().length > 0;
			const busy = search !== null && search !== undefined && search.busy === true;
			const hits = search !== null && search !== undefined && Array.isArray(search.items) ? search.items : [];
			// 选中态只属于当前这一屏：第一次点选中（底纹），再点一次才动作；换目录或换查询即清空。
			const [sel, setSel] = react.useState(null);
			react.useEffect(() => { setSel(null); }, [path, query]);
			const chosen = (p) => sel !== null && sel.path === p;
			const tapDir = (p, name) => { if (chosen(p)) props.onGoto(p); else setSel({ path: p, name: name, isDir: true }); };
			const tapFile = (p, name) => { if (chosen(p)) props.onPickFile({ path: p, name: name }); else setSel({ path: p, name: name, isDir: false }); };
			// 浮层贴着对话框水平居中：整张卡片 translateX，量到宽度后限幅，保证不出视口。
			// 首帧还没量到宽度时按 CSS 的 min(520px,94vw) 兜底，rAF 里再校正一次。
			const cardRef = react.useRef(null);
			const [shiftX, setShiftX] = react.useState(0);
			react.useEffect(() => {
				if (embedded) return void 0;
				const place = () => {
					try {
						if (anchorX === null) { setShiftX(0); return; }
						const vw = window.innerWidth;
						const box = cardRef.current === null ? null : cardRef.current.getBoundingClientRect();
						const cw = box !== null && box.width > 0 ? box.width : Math.min(520, vw * 0.94);
						const limit = Math.max(0, vw / 2 - cw / 2 - 12);
						const want = anchorX - vw / 2;
						setShiftX(Math.round(want > limit ? limit : want < -limit ? -limit : want));
					} catch { setShiftX(0); }
				};
				place();
				let raf = 0;
				try {
					if (typeof requestAnimationFrame === "function") raf = requestAnimationFrame(place);
					window.addEventListener("resize", place);
				} catch { /* 非浏览器环境（离线冒烟）：算一次就够 */ }
				return () => {
					try {
						if (raf !== 0 && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
						window.removeEventListener("resize", place);
					} catch { /* 同上 */ }
				};
			}, [anchorX, embedded]);
			const fileIcon = (name, isDir, expanded) => renderFileIcon(iconOf(name, isDir, expanded));
			const enterBtn = (target, title) => h("button", {
				className: "vk_rowBtn vk_browseRowEnter",
				title: title,
				onClick: (e) => { e.stopPropagation(); props.onGoto(target); }
			}, h(VIcon, { name: "folderOpen", size: 12 }));
			const goDeeper = h(VIcon, { name: "chevronRight", size: 12 });
			const rowIcon = (ic) => h("span", { className: "vk_browseRowIcon" }, ic);
			/** 一行条目：key 既是 React key 也是选中态判定的路径。 */
			const entry = (key, extraClass, title, onClick, icon, name, tail) => h("div", {
				className: "vk_browseRow" + extraClass + (chosen(key) ? " vk_browseRowSelected" : ""),
				key: key,
				title: title,
				onClick: onClick
			}, icon, h("span", { className: "vk_name" }, name), tail);
			const body = searching
				? [
					busy ? h("div", { key: "__busy", className: "vk_browseHint" }, h(VIcon, { name: "refresh", size: 12 }), "搜索中…") : null,
					...hits.map((r) => entry(r.path, "", r.path,
						() => (fileMode ? tapFile(r.path, r.name) : tapDir(r.path, r.name)),
						rowIcon(h(VIcon, { name: "folder", size: 15 })), r.name,
						h(react.Fragment, null, h("span", { className: "vk_relPath" }, r.rel), goDeeper))),
					hits.length === 0 && !busy
						? h("div", { key: "__none", className: "vk_browseHint" },
							(search !== null && search !== undefined && search.note !== null && search.note !== void 0 ? search.note : "")
							|| (fileMode ? "没有匹配的文件，试试更短的关键词" : "没有匹配的文件夹"))
						: null
				]
				: path.length === 0
					? [
						err !== null ? h("div", { key: "__err", className: "vk_browseErr" }, err) : null,
						probing === true
							? h("div", { key: "__probe", className: "vk_browseHint" }, h(VIcon, { name: "refresh", size: 12 }), "正在检测磁盘与桌面…")
							: (drives.length === 0 && desktopPath === null
								? h("div", { key: "__nodrv", className: "vk_browseHint" }, "未检测到磁盘与桌面，可点右上角刷新或在上方输入路径")
								: h("div", { key: "__roots" },
									desktopPath === null ? null : entry(desktopPath, "", desktopPath + "（本机桌面；单击选中 · 再点一次进入）",
										() => tapDir(desktopPath, "桌面"),
										rowIcon(h(VIcon, { name: "monitor", size: 15 })), "桌面",
										h(react.Fragment, null, enterBtn(desktopPath, "进入此文件夹"), goDeeper)),
									...drives.map((p) => entry(p, "", p + "（单击选中 · 再点一次进入）",
										() => tapDir(p, p),
										rowIcon(h(VIcon, { name: "hardDrive", size: 15 })), p,
										h(react.Fragment, null, enterBtn(p, "进入此盘"), goDeeper)))))
					]
					: [
						!isRootDriveOf(path)
							? h("div", { key: "__up", className: "vk_browseRow vk_browseRowUp", title: parentOfPath(path), onClick: () => props.onGoto(parentOfPath(path)) },
								rowIcon(h(VIcon, { name: "arrowUp", size: 14 })), h("span", { className: "vk_name" }, "上一级"))
							: null,
						!loaded && err === null ? h("div", { key: "__loading", className: "vk_browseHint" }, "加载中…") : null,
						...dirs.map((d) => entry(d.path, d.hidden ? " vk_browseRowHidden" : "",
							d.path + (insertMode ? "（单击选中 · 再点一次进入；选中后点「引用」插入 @引用）" : "（单击选中 · 再点一次进入）"),
							() => tapDir(d.path, d.name),
							rowIcon(fileIcon(d.name, true, false)), d.name,
							h(react.Fragment, null, enterBtn(d.path, "进入此文件夹"), goDeeper))),
						...files.map((f) => entry(f.path, " vk_browseFileRow" + (f.hidden ? " vk_browseRowHidden" : ""),
							f.path + (insertMode ? "（单击选中 · 再点一次或点「引用」插入到会话）" : "（单击选中，再点一次或点「打开」在拓展栏打开）"),
							() => tapFile(f.path, f.name),
							rowIcon(fileIcon(f.name, false, false)), f.name,
							h("span", { className: "vk_browseOpenHint" }, actWord))),
						loaded && dirs.length === 0 && files.length === 0 && hiddenCount === 0
							? h("div", { key: "__empty", className: "vk_browseHint" }, fileMode ? "该目录下没有子文件夹与文件" : "该目录下没有子文件夹")
							: null,
						loaded && hiddenCount > 0 && !showHidden
							? h("div", { key: "__hidden", className: "vk_browseRow vk_browseShowHidden", title: "显示隐藏条目", onClick: () => props.onToggleHidden() },
								h("span", { className: "vk_name" }, "⋯ " + hiddenCount + " 个隐藏项"), h(VIcon, { name: "eye", size: 12 }))
							: null
					];
			const selPath = sel !== null ? sel.path : path;
			const footText = sel !== null
				? (insertMode
					? (sel.isDir === true ? "已选中文件夹（点「引用」插入 @引用）：" : "已选中文件（点「引用」插入 @引用）：") + sel.path
					: (sel.isDir === true ? "已选中文件夹（点「打开」进入）：" : "已选中文件（点「打开」在拓展栏打开）：") + sel.path)
				: (insertMode
					? (path.length > 0 ? "单击选中文件或文件夹，再点「引用」插入到会话：" + path : "单击选中文件或文件夹，再点「引用」插入到会话")
					: (fileMode
						? (pickFolder
							? (path.length > 0 ? "单击选中条目 · 再点「打开」；未选中时打开当前目录：" + path : "单击选中条目 · 再点「打开」；未选中时打开当前目录")
							: (path.length > 0 ? "单击选中文件，再点「打开」在本标签打开：" + path : "单击选中文件，再点「打开」在本标签打开"))
						: (openTarget.length > 0 ? openTarget : (searching ? "正在搜索：单击选中目录，再点「打开」进入" : "未选择目录"))));
			const primaryTitle = sel !== null
				? (insertMode
					? "在会话中引用选中的" + (sel.isDir === true ? "文件夹 " : "文件 ") + sel.path
					: (sel.isDir === true ? "打开选中的文件夹 " : "在拓展栏打开选中的文件 ") + sel.path)
				: (openTarget.length > 0 ? "打开 " + openTarget : "");
			return h("div", {
				className: embedded ? "vk_browseEmbed" : "vk_browseOverlay",
				role: "dialog",
				"aria-modal": embedded ? void 0 : "true",
				onClick: embedded ? void 0 : (e) => { if (e.target === e.currentTarget) props.onClose(); }
			},
				h("div", {
					className: "vk_browseCard" + (embedded ? " vk_browseCardEmbed" : ""),
					ref: embedded ? void 0 : cardRef,
					style: embedded ? void 0 : { "--vk-browse-dx": shiftX + "px" }
				},
					h("div", { className: "vk_browseHead" },
						h(VIcon, { name: "folderOpen", size: 15 }),
						h("span", { className: "vk_browseTitle" }, insertMode ? "引用本机文件或文件夹" : (fileMode ? (pickFolder ? "打开文件夹 / 文件" : "打开本机文件") : "打开文件夹")),
						h("button", {
							className: "vk_iconBtn" + (showHidden ? " vk_iconBtnOn" : ""),
							title: showHidden ? "隐藏系统/配置文件" : "显示系统/配置文件（node_modules、.git 等）",
							onClick: () => props.onToggleHidden()
						}, h(VIcon, { name: showHidden ? "eyeOff" : "eye", size: 14 })),
						h("button", {
							className: "vk_iconBtn",
							title: path.length > 0 ? "重新加载当前目录" : "重新检测磁盘与桌面",
							onClick: () => { if (path.length > 0) props.onGoto(path); else props.onReload(); }
						}, h(VIcon, { name: "refresh", size: 14 })),
						h("button", { className: "vk_iconBtn", title: "关闭 (Esc)", onClick: () => props.onClose() }, h(VIcon, { name: "close", size: 14 }))),
					h("div", { className: "vk_browsePathRow" },
						h("span", { className: "vk_browsePathIcon" }, h(VIcon, { name: "search", size: 12 })),
						h("input", {
							className: "vk_pickInput",
							placeholder: fileMode ? "搜索文件名（模糊匹配；知道完整路径也可直接粘贴后回车）" : "搜索文件夹名（模糊匹配；知道完整路径也可直接粘贴后回车）",
							value: query,
							spellCheck: false,
							autoFocus: true,
							onChange: (e) => props.onQuery(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter") {
									const v = query.trim();
									if (v.length > 0 && (v.includes("\\") || v.includes("/") || /^[A-Za-z]:/.test(v))) props.onGoto(v);
								}
								if (e.key === "Escape") props.onClose();
							}
						}),
						searching
							? h("button", { className: "vk_iconBtn", title: "清除搜索，回到目录浏览", onClick: () => props.onQuery("") }, h(VIcon, { name: "close", size: 12 }))
							: null),
					crumb.length > 0
						? h("div", { className: "vk_crumbs" },
							crumb.map((c, i) => h("span", {
								key: c.path,
								className: "vk_crumb" + (i === crumb.length - 1 ? " vk_crumbCur" : ""),
								title: c.path,
								onClick: i === crumb.length - 1 ? void 0 : () => props.onGoto(c.path)
							},
								c.label,
								i < crumb.length - 1 ? h(VIcon, { name: "chevronRight", size: 11 }) : null)),
							h("span", { className: "vk_crumbsSpacer" }),
							h("button", { className: "vk_iconBtn vk_crumbsBack", title: "回到磁盘与桌面列表", onClick: () => props.onRoots() }, h(VIcon, { name: "home", size: 13 })))
						: null,
					h("div", { className: "vk_browseBody" }, body),
					h("div", { className: "vk_browseFoot" },
						h("span", { className: "vk_browseFootPath", title: selPath }, footText),
						h("button", { className: "vk_pickBtn", onClick: () => props.onClose() }, embedded ? "关闭" : "取消"),
						h("button", {
							className: "vk_pickBtn vk_primaryBtn",
							disabled: !(sel !== null || openTarget.length > 0),
							title: primaryTitle,
							onClick: () => {
								// 选中的是文件 → 走 onPickFile（插入模式下它同样是「插 @引用」）；否则把选中项
								// （可能为 null）交给 onOpen，由调用点自己解释「null = 当前所在目录」。
								if (sel !== null && sel.isDir !== true) {
									if (typeof props.onPickFile === "function") props.onPickFile({ path: sel.path, name: sel.name });
									return;
								}
								if (typeof props.onOpen === "function") props.onOpen(sel);
							}
						}, actWord)))
			);
		}
		// ──────────────────────────────────────────────────────────────
		// 组件：文件树
		// ──────────────────────────────────────────────────────────────
		// onOpenInViewer 为可选：路线 A 下文件树住在官方左栏，点文件要在官方右侧栏多标签里打开，
		// 由挂载层传入；不传时完全保持旧行为（中栏编辑器），因此不影响任何既有调用点。
		function FileTree({ root, custom, onOpenFolder, onCloseFolder, onOpenFile, onOpenInViewer, onPickNative, activePath, recentDirs, autoRoot, onRemoveRecent, onRemoveAuto, fileList, onRememberFile, onRemoveFile, onDeleted, onDeleteTreeRow, sessionFiles, sessionDirs }) {
	const [, vkHomeBump] = react.useReducer((x) => x + 1, 0);
	react.useEffect(() => {
		const on = () => { try { vkHomeBump(); } catch { /* ignore */ } };
		window.addEventListener("vk-home-dirs", on);
		return () => { try { window.removeEventListener("vk-home-dirs", on); } catch { /* ignore */ } };
	}, []);
			// 诊断探针（临时）：实例挂载/卸载各记一次；探针 id 也挂到 DOM 上，DevTools 里能核对是不是换了实例。
			const vkProbeId = react.useRef("ft" + Math.random().toString(36).slice(2, 7));
			react.useEffect(() => {
				vkDiag.mounts += 1;
				vkDiag.lastMounts.push({ id: vkProbeId.current, at: new Date().toISOString().slice(11, 23), size: vkFileTreeState.expanded.size, root: String(root) });
				if (vkDiag.lastMounts.length > 12) vkDiag.lastMounts.shift();
				vkDiagEvent("mount", vkProbeId.current + " root=" + String(root));
				return () => {
					vkDiag.unmounts += 1;
					vkDiag.lastUnmounts.push({ id: vkProbeId.current, at: new Date().toISOString().slice(11, 23), size: vkFileTreeState.expanded.size });
					if (vkDiag.lastUnmounts.length > 12) vkDiag.lastUnmounts.shift();
					vkDiagEvent("unmount", vkProbeId.current + " size=" + vkFileTreeState.expanded.size);
				};
			}, []);
			// 诊断（临时）：把文件栏里的每次点击与栏目状态一起录下来，用来回答
			// 「点一下刚展开的栏目，到底是谁把它折回去的」。结果看 __VK_DIAG__.uiSeq。
			react.useEffect(() => {
				if (typeof document === "undefined" || typeof document.addEventListener !== "function") return;
				const record = (kind, e) => {
					try {
						const wrap = document.querySelector(".vk_treeWrap");
						if (wrap === null) return;
						const t = e.target;
						if (t === null || (typeof t.closest === "function" && t.closest(".vk_treeWrap") === null)) return;
						const sec = typeof t.closest === "function" ? t.closest('[data-vk-sec]') : null;
						vkDiagUI(kind, JSON.stringify({
							ft: wrap.dataset.vkFt || "",
							cls: String(t.className || "").slice(0, 60),
							sec: sec !== null ? String(sec.getAttribute("data-vk-sec")) : "",
							open: String(vkHomeState.open)
						}));
					} catch { /* 录不上不影响行为 */ }
				};
				const onPointer = (e) => record("pointer", e);
				const onMouse = (e) => record("mouse", e);
				document.addEventListener("pointerdown", onPointer, true);
				document.addEventListener("mousedown", onMouse, true);
				return () => {
					document.removeEventListener("pointerdown", onPointer, true);
					document.removeEventListener("mousedown", onMouse, true);
				};
			}, []);
			// 统一的「点开文件」入口：挂了 onOpenInViewer（路线 A：打开到官方右侧栏多标签）就走它，
			// 否则回落旧的中栏编辑器回调。全部调用点只走这一个函数，避免两套行为分叉。
			const activateFile = (file) => {
				if (typeof onOpenInViewer === "function") onOpenInViewer(file);
				else if (typeof onOpenFile === "function") onOpenFile(file);
			};
			// 展开集合是**模块级共享**的（vkFileTreeState，见文件顶部）：文件栏的多个入口（落地页四栏、
			// 目录树、@ 菜单旧行的兼容路径）读写同一份；这里留一个本地副本纯粹是为了触发重渲染。
			const [expanded, setExpanded] = react.useState(() => new Set(vkFileTreeState.expanded));
			react.useEffect(() => vkFileTreeSubscribe((list) => setExpanded(new Set(list))), []);
			// 栏目折叠（2026-09-11）：与 expanded 同理，订阅模块级状态后用一个 tick 触发重渲染。
			const [, setVkHomeTick] = react.useState(0);
			react.useEffect(() => vkHomeSubscribe(() => setVkHomeTick((n) => n + 1)), []);
			// 离开文件栏（切到别的 tab / 收起面板）即回到默认折叠：栏目展开态**不跨视图记忆**
			// （用户 2026-09-11 口径：切回来不该还是展开的）。
			// 2026-09-12 晚定稿：文件树的展开集同样「不跨视图记忆」，但**清空这件事只在布局层发生**
			// （VKSidebarBody 的 tab / wide effect 直接清，见那边注释）。这里只复位栏目态；
			// 卸载/重挂载**绝不**碰展开集 —— 那正是「点开一个目录立马又被收掉」的元凶。
			// 栏目在**被隐藏时**复位（切到会话/任务 Tab 或收起左栏都走布局层 effect；这里是隐藏态卸载的兜底），
			// 与文件树的「切走再切回来仍纯折叠」同口径：不做跨视图记忆。
			// 注意这里**只**复位栏目，不碰文件树展开集（展开集只由那两条确定性 effect 清）。
			react.useEffect(() => () => { vkHomeReset("unmount"); }, []);
			// ⚠️ 2026-09-13：这里原来有一条 IntersectionObserver「离开视口就把落地页栏目折回去」的兜底，
			// **已整条删除**。它的触发信号（元素不再相交）在「展开一栏导致重排 / 滚动 / 重挂载 / 隐藏」时
			// 都会出现，于是用户点一下「工作区目录」刚展开就被它折回去（用户报「点一次立马自动收起」）。
			// 落地页栏目的复位现在只在两处发生：切走文件栏（VKSidebarBody 的 tab/wide effect）与卸载。
			const [entries, setEntries] = react.useState(() => ({}));
			const [error, setError] = react.useState(null);
			const [picking, setPicking] = react.useState(false);
			const [pickErr, setPickErr] = react.useState(null);
			const [draft, setDraft] = react.useState("");
			// 选中态（B 项）：单击任意条目 = 选中它；再点一次才动作。Row 是 FileTree 内部组件，
			// 直接闭包读写这份状态，不必给 9 个调用点逐个加 props。
			const [selected, setSelected] = react.useState(null);
			// 换根/关根就清掉选中：选中态属于「当前这一屏」，留着会让下一次单击变成「第二次点击」。
			react.useEffect(() => { setSelected(null); }, [root]);
			const [showHidden, setShowHidden] = react.useState(false);
			// 「显示系统/隐藏项」也镜像给 @ 源：两边看到的条目必须一致（见模块顶部 vkFileTreeState）。
			react.useEffect(() => { vkFileTreeState.showHidden = showHidden === true; }, [showHidden]);
			const [git, setGit] = react.useState(null);
			react.useEffect(() => {
				setGit(null);
				if (typeof root === "string" && root.length > 0) {
					fetch("/vscode-files/git?path=" + encodeURIComponent(root))
						.then((r) => r.json())
						.then((d) => { if (d && d.ok && d.statuses) setGit(d.statuses); })
						.catch(() => {});
				}
			}, [root]);
			const [creating, setCreating] = react.useState(null);
			const [createName, setCreateName] = react.useState("");
			const [createErr, setCreateErr] = react.useState(null);
			const [searchOn, setSearchOn] = react.useState(false);
			const [searchQ, setSearchQ] = react.useState("");
			const [searchResults, setSearchResults] = react.useState(null);
			// 应用内「打开文件夹」目录浏览器状态（文件夹图标按钮；不依赖本机系统对话框）
			const [browseOpen, setBrowseOpen] = react.useState(false);
			const [browsePath, setBrowsePath] = react.useState("");
			const [browseInput, setBrowseInput] = react.useState("");
			const [browseDir, setBrowseDir] = react.useState(null);
			const [browseErr, setBrowseErr] = react.useState(null);
			const [drives, setDrives] = react.useState([]);
			const [drivesProbing, setDrivesProbing] = react.useState(false);
			const [desktopPath, setDesktopPath] = react.useState(null);
			const [showBrowseHidden, setShowBrowseHidden] = react.useState(false);
			// 弹窗顶部的模糊搜索：输入目录名关键词，在「当前浏览目录」或「探测到的全部磁盘」下递归匹配文件夹
			const [browseQ, setBrowseQ] = react.useState("");
			const [browseSearch, setBrowseSearch] = react.useState(null); // null | { busy, note, items:[{name,path,rel}] }
			const browseSeq = react.useRef(0);
			react.useEffect(() => {
				const q = browseQ.trim();
				if (q.length === 0) {
					setBrowseSearch(null);
					return;
				}
				const seq = ++browseSeq.current;
				const timer = setTimeout(() => {
					const roots = (typeof browsePath === "string" && browsePath.length > 0)
						? [browsePath]
						: [...(Array.isArray(drives) ? drives : []), ...(desktopPath !== null ? [desktopPath] : [])];
					if (roots.length === 0) {
						setBrowseSearch({ busy: false, note: "磁盘尚未检测完成，请稍候或先进入一个目录", items: [] });
						return;
					}
					setBrowseSearch({ busy: true, note: null, items: [] });
					const items = [];
					(async () => {
						for (const root of roots) {
							if (seq !== browseSeq.current) return;
							try {
								const r = await fetch("/vscode-files/search?path=" + encodeURIComponent(root) + "&q=" + encodeURIComponent(q) + "&kind=dir");
								const d = await r.json();
								if (d && d.ok && Array.isArray(d.results)) items.push(...d.results);
							} catch {}
						}
						if (seq !== browseSeq.current) return;
						setBrowseSearch({
							busy: false,
							note: items.length === 0 ? "没有匹配的文件夹，试试更短的关键词" : null,
							items: items.slice(0, 80)
						});
					})();
				}, 250);
				return () => { clearTimeout(timer); };
			}, [browseQ, browsePath, drives, desktopPath]);
			react.useEffect(() => {
				const q = searchQ.trim();
				if (q.length === 0) {
					setSearchResults(null);
					return;
				}
				if (typeof root !== "string" || root.length === 0) return;
				let dead = false;
				const timer = setTimeout(() => {
					fetch("/vscode-files/search?path=" + encodeURIComponent(root) + "&q=" + encodeURIComponent(q))
						.then((r) => r.json())
						.then((d) => { if (!dead) setSearchResults(d && d.ok ? d.results : []); })
						.catch(() => { if (!dead) setSearchResults([]); });
				}, 250);
				return () => { dead = true; clearTimeout(timer); };
			}, [searchQ, root]);
			// 换根 / 关根 → 回到默认折叠（只展开根那一层，子目录全收起）。
			// 只在 root **真的变了**时清：重挂载（root 未变）保留用户展开的目录，不再无声收掉。
			const lastRootSeenRef = react.useRef(root === undefined ? null : root);
			react.useEffect(() => {
				const changed = lastRootSeenRef.current !== root;
				lastRootSeenRef.current = root;
				if (changed) vkFileTreeClearExpanded("root-changed");
				setEntries({});
				setError(null);
				if (typeof root === "string" && root.length > 0) load(root);
			}, [root]);
			// 已展开但还没取过子项的目录，这里补一次请求：换根之外的另一种来源是「@ 菜单在 @ 里展开了一级」
			// （共享状态被对端改动），不补请求的话文件栏会一直停在「加载中…」。
			react.useEffect(() => {
				for (const p of expanded) if (entries[p] === void 0) load(p);
			}, [expanded, entries]);
			function load(path) {
				fetch("/vscode-files/list?path=" + encodeURIComponent(path))
					.then((r) => r.json())
					.then((d) => {
						if (d && d.ok) setEntries((m) => ({ ...m, [path]: d }));
						else setError((d && d.error) || "加载失败");
					})
					.catch((e) => setError(String(e)));
			}
			// ── 应用内目录浏览器（「打开文件夹」按钮；folderOpen 图标） ─────────
			function openBrowse() {
				setBrowseOpen(true);
				setBrowsePath("");
				setBrowseInput("");
				setBrowseDir(null);
				setBrowseErr(null);
				setShowBrowseHidden(false);
				setBrowseQ("");
				setBrowseSearch(null);
				probeRoots();
			}
			// 返回根视图（磁盘 + 桌面）：由面包屑行最右端固定按钮触发，任何层级可用、不随列表滚动消失
			function backToRoots() {
				setBrowsePath("");
				setBrowseInput("");
				setBrowseDir(null);
				setBrowseErr(null);
				setBrowseQ("");
				setBrowseSearch(null);
			}
			function gotoBrowse(target) {
				const t = String(target || "").trim();
				if (t.length === 0) return;
				setBrowseErr(null);
				setBrowseQ("");
				setBrowseSearch(null);
				const norm = /^[A-Za-z]:$/.test(t) ? t + "\\" : t;
				setBrowsePath(norm);
				setBrowseInput(norm);
				setBrowseDir(null);
				fetch("/vscode-files/list?path=" + encodeURIComponent(norm))
					.then((r) => r.json())
					.then((d) => {
						if (d && d.ok) { setBrowseDir(d); setBrowseErr(null); }
						else setBrowseErr((d && d.error) || "无法读取该目录");
					})
					.catch((e) => setBrowseErr(String(e)));
			}
			// 探测根视图候选：常见磁盘 + 桌面，仅展示存在的（打开弹窗时自动探测，可用头部刷新钮重试）
			function probeRoots() {
				const cands = ["C:\\", "D:\\", "E:\\", "F:\\"];
				let pending = cands.length + 1;
				const found = [];
				setDrivesProbing(true);
				setDrives([]);
				setDesktopPath(null);
				const settle = () => {
					pending -= 1;
					if (pending <= 0) {
						setDrives(found.slice().sort());
						setDrivesProbing(false);
					}
				};
				for (const p of cands) {
					fetch("/vscode-files/list?path=" + encodeURIComponent(p))
						.then((r) => r.json())
						.then((d) => { if (d && d.ok) found.push(p); })
						.catch(() => {})
						.finally(settle);
				}
				// 桌面（本机重定向）：探测到才与磁盘同级列出
				(async () => {
					for (const p of cands.map((d) => d + "Desktop")) {
						try {
							const r = await fetch("/vscode-files/list?path=" + encodeURIComponent(p));
							const d = await r.json();
							if (d && d.ok && typeof d.path === "string") { setDesktopPath(d.path); break; }
						} catch { /* next candidate */ }
					}
					settle();
				})();
			}
			function toggle(path) {
				// 展开/收起写进**模块级共享状态**（vkFileTreeToggle）：@ 菜单的「文件区」立刻跟着变；
				// 子项加载由上面那条 [expanded, entries] 的 effect 负责（两边任一方展开都会触发）。
				vkFileTreeToggle(path);
			}
			// 落地页：预载 drop-inbox 收件目录内容，让「贴入 · 文件名」行标签尽快可辨识；加载完成会自然触发重渲染
			react.useEffect(() => {
				if (typeof root === "string" && root.length > 0) return;
				const need = [];
				const pushIfDrop = (p) => { if (typeof p === "string" && p.length > 0 && isDropInboxDir(p) && entries[p] === void 0) need.push(p); };
				pushIfDrop(autoRoot);
				for (const rp of Array.isArray(recentDirs) ? recentDirs : []) pushIfDrop(rp);
				if (need.length > 0) need.forEach(load);
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [root, autoRoot, recentDirs, entries]);
			function rel(p) {
				if (typeof root !== "string") return null;
				if (p === root) return "";
				if (p.startsWith(root + "\\") || p.startsWith(root + "/")) return p.slice(root.length + 1).replace(/\\/g, "/");
				return null;
			}
			function badgeOf(code) {
				if (code === "??") return { text: "U", cls: " vk_gitU" };
				if (code.includes("M")) return { text: "M", cls: " vk_gitM" };
				if (code.includes("A")) return { text: "A", cls: " vk_gitA" };
				if (code.includes("D")) return { text: "D", cls: " vk_gitD" };
				if (code.includes("R")) return { text: "R", cls: " vk_gitR" };
				return null;
			}
			function dirBadge(dirPath) {
				if (git === null) return null;
				const base = rel(dirPath);
				if (base === null) return null;
				const prefix = base === "" ? "" : base + "/";
				let hasM = false;
				let hasOther = false;
				for (const k of Object.keys(git)) {
					const hit = prefix === "" ? !k.includes("/") : k.startsWith(prefix);
					if (!hit) continue;
					if (git[k].includes("M") || git[k].includes("D") || git[k].includes("R")) hasM = true;
					else hasOther = true;
				}
				if (hasM) return { text: "M", cls: " vk_gitM" };
				if (hasOther) return { text: "U", cls: " vk_gitU" };
				return null;
			}
			function refreshGit() {
				if (typeof root !== "string" || root.length === 0) return;
				fetch("/vscode-files/git?path=" + encodeURIComponent(root))
					.then((r) => r.json())
					.then((d) => { if (d && d.ok && d.statuses) setGit(d.statuses); })
					.catch(() => {});
			}
			function refreshAround(dirPath) {
				load(dirPath);
				setEntries((m) => {
					const next = {};
					for (const k of Object.keys(m)) {
						if (k === dirPath) continue;
						if (k.startsWith(dirPath + "\\") || k.startsWith(dirPath + "/")) continue;
						next[k] = m[k];
					}
					return next;
				});
				refreshGit();
			}
			function commitCreate() {
				const n = createName.trim();
				const kind = creating;
				if (n.length === 0 || kind === null) return;
				const parent = typeof root === "string" ? root : "";
				if (parent.length === 0) return;
				const endpoint = kind === "dir" ? "/vscode-files/mkdir" : "/vscode-files/mkfile";
				fetch(endpoint + "?path=" + encodeURIComponent(parent), {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ path: parent, name: n })
				})
					.then((r) => r.json())
					.then((d) => {
						if (d && d.ok) {
							setCreateErr(null);
							setCreating(null);
							setCreateName("");
							refreshAround(parent);
							if (kind === "file" && d.path) activateFile({ path: d.path, name: n });
						} else setCreateErr((d && d.error) || "创建失败");
					})
					.catch((e) => setCreateErr(String(e)));
			}
			function doDelete(path, name) {
				if (typeof confirm === "function" && !confirm(`删除「${name}」？\n（会送入回收站，可从回收站恢复）`)) return;
				fetch("/vscode-files/delete?path=" + encodeURIComponent(path), {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ path })
				})
					.then((r) => r.json())
					.then((d) => {
						if (d && d.ok) {
							refreshAround(parentOfPath(path));
							onDeleted?.(path);
						} else setError((d && d.error) || "删除失败");
					})
					.catch((e) => setError(String(e)));
			}
			// 真删除入口（送入回收站）：文件栏所有「目录/文件的树行」共用一份（见 Row 的 ops 与 deleteTreeRow）。
			const deleteTreeRow = (p, n) => {
				if (typeof onDeleteTreeRow === "function") { onDeleteTreeRow(p, n); return; }
				doDelete(p, n);
			};
			function rows(dir, depth, seen, allowRealDelete) {
				if (!dir) return [];
				const out = [];
				for (const d of dir.dirs) {
					if (d.hidden && !showHidden) continue;
					// 整树去重：同一目录若已在别处（顶层区块/更早的展开分支）渲染过，
					// 这里不再渲染第二份——重复的同路径行共享展开状态必然联动，导致折叠错乱
					if (seen !== void 0) {
						const k = normPath(d.path);
						if (seen.has(k)) continue;
						seen.add(k);
					}
					// 目录树行（2026-09-13 语义修订）：**单击 = 原地展开/收起**（用户口径：点工作区目录就该展开看内容）；
					// 「把这个文件夹设为文件栏的根」是另一件事，只留给行尾那颗方框图标 / 双击 —— 换根会按设计重置展开集，
					// 以前三者共用一个单击，所以用户点一下就觉得「展开完立马被收掉」。只有「工作区目录」那一栏展开出来的
					// 行才多一颗真删除（allowRealDelete，用户 2026-09-12 口径）。
					const rowOps = {
						enter: true,
						// 当前根自己不再「进入」（进入等于原地重建一次根，纯属白重置）
						onEnter: () => { if (normPath(d.path) !== normPath(root)) onOpenFolder(d.path); },
						onRealRemove: allowRealDelete === true ? () => deleteTreeRow(d.path, d.name) : void 0
					};
					out.push(h(Row, { key: d.path, path: d.path, name: d.name, isDir: true, hidden: d.hidden, active: false, badge: dirBadge(d.path), depth, expanded: vkFileTreeHas(d.path), ops: rowOps, onToggle: () => toggle(d.path) }));
					if (vkFileTreeHas(d.path) && entries[d.path] && entries[d.path].ok) out.push(...rows(entries[d.path], depth + 1, seen, allowRealDelete));
				}
				for (const f of dir.files) {
					if (f.hidden && !showHidden) continue;
					const code = git !== null ? git[rel(f.path) ?? ""] ?? null : null;
					// 文件树行：不给任何操作按钮（打开 = 单击选中 · 再点一次）
					out.push(h(Row, { key: f.path, path: f.path, name: f.name, isDir: false, hidden: f.hidden, active: f.path === activePath, badge: code !== null && rel(f.path) !== null ? badgeOf(code) : null, depth, ops: {}, onToggle: () => activateFile({ path: f.path, name: f.name }) }));
				}
				return out;
			}
			function Row(props) {
				const pad = { paddingLeft: 10 + props.depth * 16 + "px" };
				const isSelected = typeof selected === "string" && selected === props.path;
				// 左侧三角：单击行已改为「选中 / 再点一次进入」，所以**展开/收起挂在这颗三角上**
				// （不 stopPropagation 的话会连带触发行单击）。
				const caret = props.isDir
					? h("span", { className: "vk_caret vk_caretBtn", title: props.expanded ? "收起此文件夹" : "展开此文件夹", onClick: (e) => { e.stopPropagation(); props.onToggle(); } }, h(VIcon, { name: props.expanded ? "chevronDown" : "chevronRight", size: 12 }))
					: h("span", { className: "vk_caret" }, "\u00A0");
				// 缩进参考线（纯装饰）：对齐各级祖先目录的 caret 中心
				const guides = [];
				for (let i = 0; i < props.depth; i++) guides.push(h("span", { key: "g" + i, className: "vk_guide", style: { left: 17 + i * 16 + "px" } }));
				const ic = iconOf(props.name, props.isDir, props.isDir && props.expanded === true);
				const icon = renderFileIcon(ic);
				const name = props.isDir
					? h("span", { className: "vk_name vk_dirName" }, props.name)
					: h("span", { className: "vk_name" }, props.name);
				const badge = props.badge ? h("span", { className: "vk_gitBadge" + props.badge.cls }, props.badge.text) : null;
				// ── 行尾按钮（2026-09-12 用户口径重排）──────────────────────────────
				// 旧版：**每一行**都挂「重命名 + 删除」，连展开出来的二级文件也带垃圾桶 —— 用户报「不符合预期」。
				// 现在按钮由调用方用 props.ops 显式指定，三种形态：
				//   ① 列表行（落地页四栏的条目）：仅移出列表 / 仅打开，不碰磁盘；
				//   ② 目录树行：进入文件夹 + 真删除（送回收站，带确认）；
				//   ③ 文件树行：一颗都不给（打开靠单击选中 · 再点一次）。
				// 重命名整体退场：列表条目改名没有意义，树行改名用户已明确不要（见 ops 的调用点）。
				const ops = props.ops !== void 0 && props.ops !== null ? props.ops : {};
				const rowOpenable = props.isDir === true && typeof props.onOpenDir === "function";
				const opBtns = [];
				if (ops.enter === true) {
					opBtns.push(h("button", {
						className: "vk_rowBtn",
						title: "进入此文件夹（打开为文件栏当前根）",
						onClick: (e) => { e.stopPropagation(); (ops.onEnter ?? props.onOpenDir)(); }
					}, h(VIcon, { name: "folderOpen", size: 12 })));
				}
				if (typeof ops.onRemove === "function") {
					opBtns.push(h("button", {
						className: "vk_rowBtn",
						title: ops.removeTitle || "移除（仅移出列表，不删磁盘文件）",
						onClick: (e) => { e.stopPropagation(); ops.onRemove(); }
					}, h(VIcon, { name: "trash", size: 12 })));
				}
				if (typeof ops.onRealRemove === "function") {
					opBtns.push(h("button", {
						className: "vk_rowBtn vk_rowBtnDanger",
						title: "删除（送入回收站）",
						onClick: (e) => { e.stopPropagation(); ops.onRealRemove(); }
					}, h(VIcon, { name: "trash", size: 12 })));
				}
				const actions = opBtns.length > 0 ? h("span", { className: "vk_rowActions" }, opBtns) : null;
				// 单击语义（2026-09-13 修订）：
				//   · 目录行 → **原地展开/收起**（用户口径：点工作区目录就该展开看里面的东西）；
				//   · 文件行 → 先选中、再点一次才在拓展栏打开（保持原有防误触）；
				//   · 「把该目录设为文件栏的根」只留给行尾方框图标 / 双击（换根会按设计重置展开集）。
				const onClick = () => {
					if (props.isDir === true) { props.onToggle(); return; }
					if (!isSelected) { setSelected(props.path); return; }
					props.onToggle();
				};
				// titleText：非目录行（如「文件列表」里的文件）也要能挂 tooltip——目录行用固定的展开/打开提示，
				// 文件行以前 title 恒为 undefined，看不见完整路径。
				const rowTitle = typeof props.titleText === "string"
					? props.titleText
					: (props.isDir === true
						? props.name + "（单击展开/收起 · 双击或点行尾方框 = 设为文件栏根）"
						: props.name + "（单击选中 · 再点一次在拓展栏打开）");
				return h("div", { className: "vk_row" + (props.hidden ? " vk_rowHidden" : "") + (props.active ? " vk_rowActive" : "") + (isSelected ? " vk_rowSelected" : ""), style: pad, title: rowTitle, onClick: onClick, onDoubleClick: rowOpenable ? (e) => { e.preventDefault(); props.onOpenDir(); } : void 0 }, guides, caret, icon, name, badge, h("span", { className: "vk_rowTail" }, actions));
			}
			// 打开前先校验目录真实存在：ok→onOk(path)；不存在/不可读→onReject(path)（不进入，避免把编造的路径当文件夹打开）
			function tryOpenFolder(p, onOk, onReject) {
				const t = String(p || "").trim();
				if (t.length === 0) return;
				fetch("/vscode-files/list?path=" + encodeURIComponent(t))
					.then((r) => r.json())
					.then((d) => {
						if (d && d.ok) { if (typeof onOk === "function") onOk(t); }
						else if (typeof onReject === "function") onReject(t);
					})
					.catch(() => { if (typeof onReject === "function") onReject(t); });
			}
			function commitFolder() {
				const p = draft.trim();
				if (p.length === 0) return;
				tryOpenFolder(p,
					(path) => { setPicking(false); setDraft(""); setPickErr(null); onOpenFolder(path); },
					(path) => { setPickErr("当前文件夹不存在：" + path); }
				);
			}
			const title = typeof root === "string" && root.length > 0 ? (root.split(/[\\/]/).pop() || root) : "常用目录";
			const head = h("div", { className: "vk_treeHead" },
				h("span", { className: "vk_treeTitle", title: typeof root === "string" ? root : "" }, title),
				h("button", {
					className: "vk_treeBtn",
					title: "打开文件夹（应用内浏览目录）",
					onClick: () => openBrowse()
				}, h(VIcon, { name: "folderOpen", size: 13 })),
				h("button", { className: "vk_treeBtn" + (showHidden ? " vk_treeBtnActive" : ""), title: showHidden ? "隐藏系统/配置文件" : "显示系统/配置文件（node_modules、.git 等）", onClick: () => setShowHidden((v) => !v) }, h(VIcon, { name: "eye", size: 13 })),
				h("button", { className: "vk_treeBtn", title: "手动输入路径", onClick: () => { setPicking(true); setDraft(""); } }, h(VIcon, { name: "edit", size: 13 })),
				h("button", { className: "vk_treeBtn" + (creating !== null ? " vk_treeBtnActive" : ""), disabled: !(typeof root === "string" && root.length > 0), title: (typeof root === "string" && root.length > 0) ? "新建文件/文件夹" : "新建文件/文件夹：需先打开或双击进入一个文件夹", onClick: () => { if (!(typeof root === "string" && root.length > 0)) return; setCreating(creating === null ? "file" : null); setCreateName(""); setCreateErr(null); } }, "＋"),
				h("button", { className: "vk_treeBtn" + (searchOn ? " vk_treeBtnActive" : ""), disabled: !(typeof root === "string" && root.length > 0), title: (typeof root === "string" && root.length > 0) ? "搜索文件" : "搜索文件：需先打开或双击进入一个文件夹", onClick: () => { if (!(typeof root === "string" && root.length > 0)) return; setSearchOn(!searchOn); setSearchQ(""); } }, h(VIcon, { name: "search", size: 13 })),
				custom ? h("button", { className: "vk_treeBtn", title: "关闭当前文件夹（回到常用目录）", onClick: onCloseFolder }, "×") : null
			);
			const picker = picking ? h("div", { className: "vk_pickForm" },
				h("input", {
					className: "vk_pickInput",
					placeholder: "输入文件夹绝对路径，如 D:\\my-projects",
					value: draft,
					autoFocus: true,
					onChange: (e) => { setDraft(e.target.value); setPickErr(null); },
					onKeyDown: (e) => {
						if (e.key === "Enter") commitFolder();
						if (e.key === "Escape") { setPicking(false); setDraft(""); setPickErr(null); }
					}
				}),
				pickErr !== null ? h("div", { className: "vk_pickErr" }, pickErr) : null,
				h("div", { className: "vk_pickRow" },
					h("button", { className: "vk_pickBtn", onClick: commitFolder }, "打开"),
					h("button", { className: "vk_pickBtn", onClick: () => { setPicking(false); setDraft(""); setPickErr(null); } }, "取消")
				)
			) : null;
			const createForm = creating !== null ? h("div", { className: "vk_pickForm" },
				h("div", { className: "vk_pickRow" },
					h("button", { className: "vk_pickBtn" + (creating === "file" ? " vk_modeBtn" : ""), onClick: () => setCreating("file") }, "新建文件"),
					h("button", { className: "vk_pickBtn" + (creating === "dir" ? " vk_modeBtn" : ""), onClick: () => setCreating("dir") }, "新建文件夹")
				),
				h("input", {
					className: "vk_pickInput",
					placeholder: creating === "dir" ? "文件夹名" : "文件名",
					value: createName,
					autoFocus: true,
					onChange: (e) => setCreateName(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") commitCreate();
						if (e.key === "Escape") { setCreating(null); setCreateName(""); setCreateErr(null); }
					}
				}),
				createErr !== null ? h("span", { className: "vk_saveMsg" }, createErr) : null,
				h("div", { className: "vk_pickRow" },
					h("button", { className: "vk_pickBtn", onClick: commitCreate }, "创建"),
					h("button", { className: "vk_pickBtn", onClick: () => { setCreating(null); setCreateName(""); setCreateErr(null); } }, "取消")
				)
			) : null;
			const searchForm = searchOn ? h("div", { className: "vk_pickForm" },
				h("input", {
					className: "vk_pickInput",
					placeholder: "搜索文件名…（回车打开第一个结果）",
					value: searchQ,
					autoFocus: true,
					onChange: (e) => setSearchQ(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Escape") { setSearchOn(false); setSearchQ(""); }
						if (e.key === "Enter" && searchResults !== null && searchResults.length > 0) {
							const first = searchResults[0];
							activateFile({ path: first.path, name: first.name });
							setSearchOn(false);
							setSearchQ("");
						}
					}
				})
			) : null;
			const dir = typeof root === "string" && root.length > 0 ? entries[root] : void 0;
			const body = (() => {
				if (searchOn && searchQ.trim().length > 0) {
					if (searchResults === null) return h("div", { className: "vk_empty" }, "搜索中…");
					if (searchResults.length === 0) return h("div", { className: "vk_empty" }, "没有匹配的文件");
					return searchResults.map((r) => h("div", {
						key: r.path,
						className: "vk_row" + (selected === r.path ? " vk_rowSelected" : ""),
						style: { paddingLeft: 10 + "px" },
						title: r.path + "（单击选中 · 再点一次在拓展栏打开）",
						onClick: () => {
							// 与文件栏行同一套语义（B 项）：单击 = 选中，再点一次才打开。
							if (selected !== r.path) { setSelected(r.path); return; }
							activateFile({ path: r.path, name: r.name });
							setSearchOn(false);
							setSearchQ("");
						}
					},
						h("span", { className: "vk_caret" }, "\u00A0"),
						renderFileIcon(iconOf(r.name, false, false)),
						h("span", { className: "vk_name vk_nameFixed" }, r.name),
						h("span", { className: "vk_relPath" }, r.rel)
					));
				}
				if (typeof root !== "string" || root.length === 0) {
					const els = [];
					// 栏目头（2026-09-11 用户要求）：可点击折叠 / 展开，▾ = 展开中、▸ = 已收起，后面带条数。
					const secHead = (key, name, count) => h("div", {
						key: key,
						className: "vk_homeLabel vk_homeLabelToggle",
						"data-vk-sec": name,
						title: "点击折叠 / 展开「" + name + "」",
						onClick: () => vkHomeToggle(name)
					}, (vkHomeIsOpen(name) ? "\u25BE " : "\u25B8 ") + name + (count > 0 ? "（" + count + " 条）" : ""));
					// 落地页整树去重（顶层行与展开子行共用同一 seen 集合，由 rows(...,topSeen) 逐级登记）：
					// 同一目录若同时出现在工作区目录 / 会话建议根 / 最近打开 / 某目录的子层级里，只渲染最早一份——
					// 重复的同路径行共享展开状态必然联动，导致子项收不干净、串位、折叠错乱
					const topSeen = new Set();
					const topSeenAdd = (p) => {
						const k = normPath(p);
						if (topSeen.has(k)) return false;
						topSeen.add(k);
						return true;
					};
					vkHomeDirsSync();
					els.push(secHead("__wsHead", "工作区目录", HOME_DIRS.length));
					if (vkHomeIsOpen("工作区目录")) for (const hd of HOME_DIRS) {
						if (!topSeenAdd(hd.path)) continue;
						const open = vkFileTreeHas(hd.path);
						// 列表条目本身：只给「进入」（这两个是固定常用目录，不让人从列表里删掉）
						els.push(h(Row, { key: hd.path, path: hd.path, name: hd.name, isDir: true, hidden: false, active: false, badge: null, depth: 0, expanded: open, ops: { enter: true, onEnter: () => { if (normPath(hd.path) !== normPath(root)) onOpenFolder(hd.path); } }, onOpenDir: () => { if (normPath(hd.path) !== normPath(root)) onOpenFolder(hd.path); }, onToggle: () => toggle(hd.path) }));
						if (!open) continue;
						const sub = entries[hd.path];
						if (sub === void 0) els.push(h("div", { key: hd.path + "-loading", className: "vk_hiddenHint" }, "加载中…"));
						else if (sub.ok) els.push(...rows(sub, 1, topSeen, true)); // 只有这一栏的展开行带「真删除」
						else els.push(h("div", { key: hd.path + "-err", className: "vk_hiddenHint" }, sub.error || "读取失败"));
					}
					// 「当前会话文件」（第三轮微调第四批追加，用户要求**紧跟「工作区目录」**）：
					// 数据源 = host 的 /vscode-files/session-files；自 2026-09-12 起该接口只回 **src="paste"**
					// （用户自己贴进对话的路径）——原先还回「Agent 写/改过的文件」与「会话根下近期改动的文件」，
					// 于是会话里被 Agent 动过的文件全被当成「会话文件」混进来（用户口径：这一栏只该是我贴进来的）。
					// 行内只有垃圾桶 = **仅从列表移出**（不删磁盘文件，与「最近打开」那颗同义）。
					const sessFiles = (Array.isArray(sessionFiles) ? sessionFiles : [])
						.filter((it) => it !== null && typeof it === "object" && typeof it.path === "string" && it.path.length > 0);
					if (sessFiles.length > 0) {
						els.push(secHead("__sessionHead", "当前会话文件", sessFiles.length));
						if (vkHomeIsOpen("当前会话文件")) for (const it of sessFiles) {
							const fname = typeof it.name === "string" && it.name.length > 0 ? it.name : pathBase(it.path);
							els.push(h(Row, {
								key: "session:" + it.path,
								path: it.path,
								name: fname,
								isDir: false,
								hidden: false,
								active: typeof activePath === "string" && activePath === it.path,
								badge: null,
								depth: 0,
								titleText: it.path + "（当前会话文件 · 点一下在拓展栏打开）",
								ops: {
									onRemove: () => { if (typeof onRemoveRecent === "function") onRemoveRecent(it.path); },
									removeTitle: "从当前会话文件移出（不删除磁盘文件）"
								},
								onToggle: () => activateFile({ path: it.path, name: fname })
							}));
						}
					}
					const autoPath = (typeof autoRoot === "string" && autoRoot.length > 0) ? autoRoot : null;
					const autoShown = autoPath !== null && !isHomeDirPath(autoPath) && topSeenAdd(autoPath);
					if (autoShown) els.push(secHead("__recentHead", "最近打开", 0));
					if (autoShown && vkHomeIsOpen("最近打开")) {
						const open = vkFileTreeHas(autoPath);
						els.push(h(Row, { key: autoPath, path: autoPath, name: landingLabel(autoPath, entries[autoPath]), isDir: true, hidden: false, active: false, badge: null, depth: 0, expanded: open, ops: { enter: true, onEnter: () => onOpenFolder(autoPath), onRemove: () => { if (typeof onRemoveAuto === "function") onRemoveAuto(autoPath); }, removeTitle: "从最近打开移出（不删除磁盘文件）" }, onOpenDir: () => onOpenFolder(autoPath), onToggle: () => toggle(autoPath) }));
						if (open) {
							const sub = entries[autoPath];
							if (sub === void 0) els.push(h("div", { key: autoPath + "-loading", className: "vk_hiddenHint" }, "加载中…"));
							else if (sub.ok) els.push(...rows(sub, 1, topSeen));
							else els.push(h("div", { key: autoPath + "-err", className: "vk_hiddenHint" }, sub.error || "读取失败"));
						}
					}
					// 贴进对话的**文件夹**也进「最近打开」（用户口径：最近打开 = 我手动打开的 + 贴进对话的路径）；
					// host 侧现在只回 src="paste" 的目录（见 /vscode-files/session-files）。先后顺序：
					// 会话建议根 → 本会话贴入的文件夹 → 本会话自己打开过的目录（localStorage 那份）。
					const sessDirRows = (Array.isArray(sessionDirs) ? sessionDirs : [])
						.filter((it) => it !== null && typeof it === "object" && typeof it.path === "string" && it.path.length > 0 && !isHomeDirPath(it.path))
						.map((it) => ({ path: it.path, name: typeof it.name === "string" && it.name.length > 0 ? it.name : pathBase(it.path) }));
					const recents = (Array.isArray(recentDirs) ? recentDirs : []).filter((p) => typeof p === "string" && p.length > 0 && !isHomeDirPath(p) && (autoPath === null || normPath(p) !== normPath(autoPath)));
					const recentRows = [...sessDirRows, ...recents.map((p) => ({ path: p, name: landingLabel(p, entries[p]) }))];
					if (recentRows.length > 0) {
						if (!autoShown) els.push(secHead("__recentHead", "最近打开", recentRows.length));
						if (vkHomeIsOpen("最近打开")) for (const rr of recentRows) {
							if (!topSeenAdd(rr.path)) continue;
							const open = vkFileTreeHas(rr.path);
							els.push(h(Row, {
								key: rr.path, path: rr.path, name: rr.name, isDir: true, hidden: false, active: false, badge: null, depth: 0,
								expanded: open,
								ops: {
									enter: true,
									onEnter: () => { if (normPath(rr.path) !== normPath(root)) onOpenFolder(rr.path); },
									// 贴入的文件夹、自己打开过的目录：都从「最近打开」移出（磁盘文件一律不动）。
									// 贴入的那份还要在 host 侧抹掉记录，否则 3 秒轮询会把它带回来（调用方一并处理）。
									onRemove: () => { if (typeof onRemoveRecent === "function") onRemoveRecent(rr.path); },
									removeTitle: "从最近打开移出（不删除磁盘文件）"
								},
								onOpenDir: () => { if (normPath(rr.path) !== normPath(root)) onOpenFolder(rr.path); },
								onToggle: () => toggle(rr.path)
							}));
							if (open) {
								const sub = entries[rr.path];
								if (sub === void 0) els.push(h("div", { key: rr.path + "-loading", className: "vk_hiddenHint" }, "加载中…"));
								else if (sub.ok) els.push(...rows(sub, 1, topSeen));
								else els.push(h("div", { key: rr.path + "-err", className: "vk_hiddenHint" }, sub.error || "读取失败"));
							}
						}
					}
					// 文件列表（第二轮新增）：由文件夹图标那个自适应浏览器里「点中文件」写进来的，
					// 点条目 = 重新在拓展栏打开；垃圾桶 = 仅移出列表（不删磁盘文件）。
					const fileItems = (Array.isArray(fileList) ? fileList : []).filter((it) => it !== null && typeof it === "object" && typeof it.path === "string" && it.path.length > 0);
					if (fileItems.length > 0) {
						els.push(secHead("__fileHead", "文件列表", fileItems.length));
						if (vkHomeIsOpen("文件列表")) for (const it of fileItems) {
							const fname = typeof it.name === "string" && it.name.length > 0 ? it.name : pathBase(it.path);
							els.push(h(Row, {
								key: "file:" + it.path,
								path: it.path,
								name: fname,
								isDir: false,
								hidden: false,
								active: typeof activePath === "string" && activePath === it.path,
								badge: null,
								depth: 0,
								titleText: it.path + "（点一下在拓展栏重新打开）",
								ops: {
									onRemove: () => { if (typeof onRemoveFile === "function") onRemoveFile(it.path); },
									removeTitle: "从文件列表移出（不删除磁盘文件）"
								},
								onToggle: () => activateFile({ path: it.path, name: fname })
							}));
						}
					}
					return els;
				}
				if (error !== null) return h("div", { className: "vk_err" }, error);
				if (dir === void 0) return h("div", { className: "vk_empty" }, "加载中…");
				if (dir.ok) {
					const hiddenCount = showHidden ? 0 : dir.dirs.filter((d) => d.hidden).length + dir.files.filter((f) => f.hidden).length;
					return [...rows(dir, 0), hiddenCount > 0 ? h("div", { key: "__hiddenHint", className: "vk_hiddenHint" }, "⋯ 已折叠 " + hiddenCount + " 个隐藏项（点眼睛图标显示）") : null];
				}
				return h("div", { className: "vk_err" }, dir.error || "无法读取目录");
			})();
			// 浏览弹窗改用共用组件（VKBrowseModal）：与拓展栏「打开本机文件」是同一套 UI 与交互。
			// 第二轮起这里是**自适应**的：目录行照旧点进下一级，文件行可点（点了就在拓展栏打开并记入
			// 「文件列表」），底部「打开」则把当前所在目录加入列表——不再让人先选「目录 / 文件」模式，
			// 「打开了 A 但没选任何文件」= 选中 A，「进入了子目录 B」= 选中 B，「点了文件 C」= 选中 C。
			const openTarget = browseQ.trim().length > 0 ? "" : browseInput.trim();
			const browseModal = browseOpen ? h(VKBrowseModal, {
				fileMode: true,
				pickFolder: true,
				path: browsePath,
				dir: browseDir,
				err: browseErr,
				drives: drives,
				probing: drivesProbing,
				desktopPath: desktopPath,
				query: browseQ,
				search: browseSearch,
				showHidden: showBrowseHidden,
				openTarget: openTarget,
				onQuery: (v) => setBrowseQ(v),
				onGoto: (target) => gotoBrowse(target),
				onRoots: () => backToRoots(),
				onToggleHidden: () => setShowBrowseHidden((v) => !v),
				onReload: () => probeRoots(),
				onClose: () => setBrowseOpen(false),
				onOpen: (sel) => {
					// 选中了文件夹 → 打开**选中的**那个（B 项第 4 条）；没选中 → 原逻辑（打开当前所在目录）
					const target = sel !== null && sel !== undefined && sel.isDir === true ? sel.path : openTarget;
					if (target.length === 0) return;
					tryOpenFolder(target,
						(path) => { onOpenFolder(path); setBrowseOpen(false); },
						(path) => { setBrowseErr("当前文件夹不存在：" + path); }
					);
				},
				// 自适应分支之二：点中文件 → 在拓展栏打开 + 记入「文件列表」+ 关掉弹窗
				// （弹窗是覆盖全屏的，不关掉就看不见右栏刚打开的文件）。
				onPickFile: (f) => {
					if (f === null || typeof f !== "object" || typeof f.path !== "string") return;
					activateFile({ path: f.path, name: f.name });
					if (typeof onRememberFile === "function") onRememberFile({ path: f.path, name: f.name });
					setBrowseOpen(false);
				}
			}) : null;
			return h("div", { className: "vk_treeWrap", "data-vk-ft": vkProbeId.current }, head, picker, createForm, searchForm, h("div", { className: "vk_tree" }, body), browseModal);
		}

		// ──────────────────────────────────────────────────────────────
		/** 当前会话 cwd（sessions 服务快照）。 */
		function vkCurrentSessionCwd() {
			try {
				const svc = ctxRef.current.get("sessions");
				const snap = svc.list.getSnapshot();
				const row = snap !== undefined && snap !== null && typeof snap.current === "string" ? snap.byId[snap.current] : null;
				return row !== undefined && row !== null && row.blank !== true && typeof row.cwd === "string" ? row.cwd : "";
			} catch { return ""; }
		}

		function fileAddressFor(sessionId, cwd, path) {
			const prefix = "dsh-resource://file/session/";
			const norm = String(path === null || path === undefined ? "" : path).replace(/\\/g, "/");
			let relative = norm;
			const root = typeof cwd === "string" && cwd.length > 0 ? cwd.replace(/\\/g, "/").replace(/\/+$/, "") : "";
			if (root !== "" && relative.startsWith(root + "/")) relative = relative.slice(root.length + 1);
			const encodeSegment = (seg) => encodeURIComponent(seg).replace(/%3A/gi, ":");
			const encoded = relative.replace(/^(?:\.\/)+/, "").split("/").filter((s, i) => !(i === 0 && s === "")).map(encodeSegment).join("/");
			return prefix + encodeSegment(String(sessionId === null || sessionId === undefined ? "" : sessionId)) + "/" + encoded;
		}
		function vkAtSessionCwd() {
			return vkCurrentSessionCwd();
		}
		/**
		 * 文件栏**当前状态**的镜像（由侧栏组件在状态变化时写入），@ 源的落地页据此镜像文件栏的三组结构：
		 *   treeRoot   —— 文件栏当前打开的根（含 switch_workspace_root 写入的会话根），排在 @ 检索根的第一位
		 *   autoRoot   —— 文件栏「最近打开」里那条会话建议根（/vscode-files/root 轮询拿到）
		 *   recentDirs —— 文件栏「最近打开」列表（localStorage dsh-vscode-layout:recents:v1）
		 *   fileList   —— 文件栏「文件列表」（localStorage dsh-vscode-layout:filelist:v1，点过的文件）
		 *   sessionFiles —— 「当前会话文件」（host /vscode-files/session-files：本会话贴入 + Agent 写/改 + 会话根近期改动）
		 *   sessionDirs  —— 本会话贴进对话的**文件夹**（并入「最近打开」）
		 */

		/** 把文件栏的当前状态镜像给 @ 列表（骨架的 vkRoots 服务）。 */
		function vkRootsUpdate(patch) {
			try {
				const svc = ctxRef.current === null || ctxRef.current === undefined ? undefined : ctxRef.current.get("vkRoots");
				if (svc !== undefined && svc !== null && typeof svc.update === "function") svc.update(patch);
			} catch { /* 服务未就绪 */ }
		}
		/** 文件栏正文：状态与轮询都在这一层，FileTree 只收 props。 */
		function VKFilesPane(props) {
			const vkPaneActive = props === undefined || props === null ? void 0 : props.active;
			// 切走「文件」这一拍收回展开态（与 dsh-lt-tasks 的 TasksView 同一套写法）：
			// 骨架在切标签时把 active 由 true 变 false，栏目就地收自己的东西，不另挑时机。
			// 文件树的展开集是模块级 Set，DOM 上没有可点的折叠项，aria-expanded 扫描扫不到，只能在这里清。
			react.useEffect(() => {
				if (vkPaneActive !== false) return;
				try { vkFileTreeClearExpanded("pane-idle"); } catch { /* ignore */ }
			}, [vkPaneActive]);
			const [root, setRoot] = react.useState(null);
			const [autoRoot, setAutoRoot] = react.useState(null);
			const [recentDirs, setRecentDirs] = react.useState(() => readRecents(""));
			const [fileList, setFileList] = react.useState(() => readFileList(""));
			const [filesVisit, setFilesVisit] = react.useState(0);
			const [treeActive, setTreeActive] = react.useState(null);
			const [openError, setOpenError] = react.useState(null);
			const [sessionFiles, setSessionFiles] = react.useState([]);
			const [sessionDirs, setSessionDirs] = react.useState([]);
			const [sessionId, setSessionId] = react.useState("");
			const sessionSigRef = react.useRef("");
			const lastRootRef = react.useRef(null);
			const cwdRef = react.useRef("");

			// 会话 id / cwd 定时对齐：root 作用域槽拿不到 props.sessionId。
			react.useEffect(() => {
				const sync = () => {
					cwdRef.current = vkCurrentSessionCwd();
					const sid = vkCurrentSessionId();
					setSessionId((prev) => (prev === sid ? prev : sid));
				};
				sync();
				const t = setInterval(sync, 1500);
				return () => clearInterval(t);
			}, []);

			const readSessionId = react.useCallback(() => {
				const sid = vkCurrentSessionId();
				return sid.length > 0 ? sid : sessionId;
			}, [sessionId]);

			const pickNative = react.useCallback(() => {
				try {
					const ws = ctxRef.current.get("workspaces");
					if (ws !== undefined && ws !== null && typeof ws.pickDirectory === "function") return ws.pickDirectory();
				} catch { /* 目录选择器不可用 */ }
				return Promise.reject(new Error("native directory picker unavailable"));
			}, []);

			// 切会话 = 换整个文件栏：当前根回落地页、两份列表按会话重读、当前会话文件清空等轮询重采。
			react.useEffect(() => {
				if (sessionId.length === 0) return;
				setRoot(null);
				lastRootRef.current = null;
				setRecentDirs(readRecents(sessionId));
				setFileList(readFileList(sessionId));
				sessionSigRef.current = "";
				setSessionFiles([]);
				setSessionDirs([]);
			}, [sessionId]);

			// 会话建议根：跟随 switch_workspace_root 写入的 <会话ID>.txt。
			react.useEffect(() => {
				const sid = readSessionId();
				if (sid.length === 0) return void 0;
				let dead = false;
				const check = async () => {
					try {
						const r = await fetch("/vscode-files/root?session=" + encodeURIComponent(sid));
						const d = await r.json();
						if (dead || !(d && d.ok) || typeof d.root !== "string") return;
						const suggested = d.root.length > 0 ? d.root : null;
						setAutoRoot(suggested);
						if (suggested !== lastRootRef.current) {
							lastRootRef.current = suggested;
							if (suggested !== null && suggested !== cwdRef.current) setRoot((prev) => (prev === suggested ? prev : suggested));
						}
					} catch { /* 网络抖动忽略 */ }
				};
				check();
				const t = setInterval(check, 2000);
				return () => { dead = true; clearInterval(t); };
			}, [readSessionId]);

			// 当前会话文件：host 侧按会话采集（贴入的路径 + Agent 写改过的文件），只在签名变化时 setState。
			react.useEffect(() => {
				const sid = readSessionId();
				if (sid.length === 0) return void 0;
				let dead = false;
				const check = async () => {
					try {
						const r = await fetch("/vscode-files/session-files?session=" + encodeURIComponent(sid));
						const d = await r.json();
						if (dead || !(d && d.ok === true)) return;
						const files = Array.isArray(d.files) ? d.files : [];
						const dirs = Array.isArray(d.dirs) ? d.dirs : [];
						const sig = files.map((f) => f.path + "@" + f.mtimeMs).join("|") + "#" + dirs.map((x) => x.path).join("|");
						if (sig === sessionSigRef.current) return;
						sessionSigRef.current = sig;
						setSessionFiles(files);
						setSessionDirs(dirs);
					} catch { /* 网络抖动忽略 */ }
				};
				check();
				const t = setInterval(check, 3000);
				return () => { dead = true; clearInterval(t); };
			}, [readSessionId]);

			// 进入真实目录即置顶「最近打开」（上限 RECENTS_MAX）。
			react.useEffect(() => {
				if (typeof root !== "string" || root.length === 0 || root.startsWith("::")) return;
				if (isHomeDirPath(root)) return;
				if (root === autoRoot) return;
				setRecentDirs((prev) => {
					if (prev[0] === root) return prev;
					const next = [root, ...prev.filter((x) => x !== root)].slice(0, RECENTS_MAX);
					writeRecents(next, readSessionId());
					return next;
				});
			}, [root, autoRoot, readSessionId]);

			// 三组状态镜像给 @ 列表（旧实现里这段在 VKSidebarBody 内，拆包后搬到这里）。
			react.useEffect(() => { vkRootsUpdate({ treeRoot: root }); }, [root]);
			react.useEffect(() => {
				vkRootsUpdate({
					autoRoot: typeof autoRoot === "string" && autoRoot.length > 0 ? autoRoot : null,
					recentDirs: Array.isArray(recentDirs) ? recentDirs : [],
					fileList: Array.isArray(fileList) ? fileList : []
				});
			}, [autoRoot, recentDirs, fileList]);
			react.useEffect(() => {
				vkRootsUpdate({
					sessionFiles: Array.isArray(sessionFiles) ? sessionFiles : [],
					sessionDirs: Array.isArray(sessionDirs) ? sessionDirs : []
				});
			}, [sessionFiles, sessionDirs]);
			const openFolder = react.useCallback((p) => { setRoot(p); }, []);
			const closeFolder = react.useCallback(() => { setRoot(null); }, []);

			const removeRecentDir = react.useCallback((path) => {
				const key = normPath(path);
				setRecentDirs((prev) => { const next = prev.filter((p) => p !== path); writeRecents(next, readSessionId()); return next; });
				setSessionDirs((prev) => (Array.isArray(prev) ? prev.filter((x) => x === null || typeof x !== "object" || normPath(x.path) !== key) : prev));
				setSessionFiles((prev) => (Array.isArray(prev) ? prev.filter((x) => x === null || typeof x !== "object" || normPath(x.path) !== key) : prev));
				const sid = readSessionId();
				if (sid.length > 0) fetch("/vscode-files/session-touch/remove", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session: sid, path }) }).catch(() => {});
			}, [readSessionId]);

			const removeAutoRoot = react.useCallback((path) => {
				const sid = readSessionId();
				if (sid.length > 0) fetch("/vscode-files/root/forget", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session: sid }) }).catch(() => {});
				setAutoRoot((prev) => (prev === path ? null : prev));
				lastRootRef.current = null;
				setRecentDirs((prev) => {
					if (!prev.includes(path)) return prev;
					const next = prev.filter((x) => x !== path);
					writeRecents(next, readSessionId());
					return next;
				});
				setRoot((prev) => (prev === path ? null : prev));
			}, [readSessionId]);

			const onDeleted = react.useCallback(() => { setFilesVisit((v) => v + 1); }, []);

			// 真删除后把这条从三份列表里一并抹掉（最近打开 / 当前会话文件 / 文件列表）。
			const forgetPathEverywhere = react.useCallback((p) => {
				const key = normPath(p);
				setRecentDirs((prev) => {
					if (!Array.isArray(prev)) return prev;
					const next = prev.filter((x) => normPath(x) !== key);
					if (next.length === prev.length) return prev;
					writeRecents(next, readSessionId());
					return next;
				});
				setSessionFiles((prev) => (Array.isArray(prev) ? prev.filter((x) => x === null || typeof x !== "object" || normPath(x.path) !== key) : prev));
				setSessionDirs((prev) => (Array.isArray(prev) ? prev.filter((x) => x === null || typeof x !== "object" || normPath(x.path) !== key) : prev));
				setFileList((prev) => {
					if (!Array.isArray(prev)) return prev;
					const next = prev.filter((x) => x === null || typeof x !== "object" || normPath(x.path) !== key);
					if (next.length === prev.length) return prev;
					writeFileList(next, readSessionId());
					return next;
				});
			}, [readSessionId]);

			const deleteTreeRow = react.useCallback((p, n) => {
				const name = typeof n === "string" && n.length > 0 ? n : pathBase(p);
				if (typeof confirm === "function" && !confirm("删除「" + name + "」？\n（会送入回收站，可从回收站恢复）")) return;
				fetch("/vscode-files/delete?path=" + encodeURIComponent(p), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: p }) })
					.then((r) => r.json())
					.then((d) => { if (d && d.ok) { forgetPathEverywhere(p); onDeleted(); } else setOpenError((d && d.error) || ("删除失败：" + name)); })
					.catch((e) => setOpenError(String(e)));
			}, [onDeleted, forgetPathEverywhere]);

			const rememberFile = react.useCallback((f) => {
				if (f === null || typeof f !== "object" || typeof f.path !== "string" || f.path.length === 0) return;
				const name = typeof f.name === "string" && f.name.length > 0 ? f.name : pathBase(f.path);
				setFileList((prev) => {
					const k = normPath(f.path);
					const next = [{ path: f.path, name }, ...(Array.isArray(prev) ? prev : []).filter((x) => normPath(x.path) !== k)].slice(0, FILE_LIST_MAX);
					writeFileList(next, readSessionId());
					return next;
				});
			}, [readSessionId]);

			const removeFileItem = react.useCallback((p) => {
				setFileList((prev) => { const next = (Array.isArray(prev) ? prev : []).filter((x) => x.path !== p); writeFileList(next, readSessionId()); return next; });
			}, [readSessionId]);

			// 点文件 → 右栏多标签：地址拼装与打开都交给骨架的 vkOpenFile 服务。
			const onOpenInViewer = react.useCallback((file) => {
				const path = file && typeof file.path === "string" ? file.path : null;
				if (path === null) return;
				const liveSessionId = readSessionId();
				if (liveSessionId === "") { setTreeActive(null); setOpenError("先在中间栏打开一个会话"); return; }
				const svc = ctxRef.current === null || ctxRef.current === undefined ? undefined : ctxRef.current.get(VK_SERVICE.OPEN_FILE);
				if (svc === undefined || svc === null) { setTreeActive(null); setOpenError("打开失败"); return; }
				const address = svc.address(liveSessionId, cwdRef.current, path);
				// replaceTab：右栏里只有「开始」这种主页标签时，文件直接顶替它，不并排多开一个标签。
				if (svc.open(address, { replaceTab: true })) { setTreeActive(path); setOpenError(null); return; }
				setTreeActive(null);
				setOpenError("无法在右栏打开该文件");
			}, [readSessionId]);

			return h("div", { className: "vk_filesPane" },
				openError !== null ? h("div", { className: "vk_openErr", title: "点击关闭", onClick: () => setOpenError(null) }, openError) : null,
				h(FileTree, {
					key: "vk-files-" + filesVisit,
					root,
					custom: root !== null,
					onOpenFolder: openFolder,
					onCloseFolder: closeFolder,
					onOpenInViewer,
					onPickNative: pickNative,
					activePath: treeActive,
					recentDirs,
					autoRoot,
					onRemoveRecent: removeRecentDir,
					onRemoveAuto: removeAutoRoot,
					fileList,
					onRememberFile: rememberFile,
					onRemoveFile: removeFileItem,
					onDeleteTreeRow: deleteTreeRow,
					sessionFiles,
					sessionDirs,
					onDeleted
				})
			);
		}





		/** 原 dsh-files-tree 的模块体，整段原样包进来（只加外层函数与 id）。 */
		const composerFactory = (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/* Workspace directories, discovered not hardcoded: the distinct cwd values in the session list,
   which is what the official sidebar groups by. The merged bundle carries two module bodies (the
   tree and the composer that re-includes it); both HOME_DIRS point at this one table so the
   landing page and the @ source always agree. */
const VK_HOME_DIRS = [];
let vkLtWsPath = null;
let vkLtWsAt = 0;
/** 长任务产出工作区根：问 dsh-lt-tasks 的 host（/lt-tasks/roots），再用 list 确认它真实存在。 */
function vkLtWsSync() {
	const now = Date.now();
	if (now - vkLtWsAt < 15000) return;
	vkLtWsAt = now;
	fetch("/lt-tasks/roots")
		.then((r) => (r.ok === true ? r.json() : null))
		.then((d) => {
			const p = d !== null && d !== undefined && d.ok === true && typeof d.workspaceRoot === "string" ? d.workspaceRoot : "";
			if (p.length === 0) return null;
			return fetch("/vscode-files/list?path=" + encodeURIComponent(p))
				.then((r) => (r.ok === true ? r.json() : null))
				.then((l) => {
					if (l === null || l === undefined || l.ok !== true || typeof l.path !== "string") return;
					if (vkLtWsPath === l.path) return;
					vkLtWsPath = l.path;
					try { window.dispatchEvent(new Event("vk-home-dirs")); } catch { /* ignore */ }
				});
		})
		.catch(() => {});
}
/** 工作区目录（探测，不写死路径）：官方 workspaces 列表 ∪ 会话 cwd ∪ 长任务产出工作区。 */
function vkHomeDirsSync() {
	vkLtWsSync();
	const next = [];
	const seen = new Set();
	const add = (p, title) => {
		const s = typeof p === "string" ? p.replace(/[\\/]+$/, "") : "";
		if (s.length === 0) return;
		const k = s.toLowerCase();
		if (seen.has(k)) return;
		seen.add(k);
		next.push({ name: typeof title === "string" && title.length > 0 ? title : pathBase(s), path: s });
	};
	try {
		const ws = ctxRef.current.get("workspaces");
		const snap = ws !== null && ws !== undefined && ws.list !== null && ws.list !== undefined && typeof ws.list.getSnapshot === "function" ? ws.list.getSnapshot() : null;
		const items = snap !== null && snap !== undefined && Array.isArray(snap.items) ? snap.items : [];
		for (const it of items) { if (it !== null && it !== undefined) add(it.path, it.title); }
	} catch { /* 官方工作区服务未就绪时回退到会话 cwd */ }
	try {
		const snapshot = ctxRef.current.get("sessions").list.getSnapshot();
		const byId = snapshot !== undefined && snapshot !== null && snapshot.byId !== undefined && snapshot.byId !== null ? snapshot.byId : {};
		for (const key of Object.keys(byId)) {
			const row = byId[key];
			if (row === null || row === undefined || row.blank === true) continue;
			add(row.cwd, "");
		}
	} catch { /* 会话服务未就绪时保持空表 */ }
	add(vkLtWsPath, "");
	next.sort((a, b) => a.path.localeCompare(b.path));
	VK_HOME_DIRS.length = 0;
	for (const d of next) VK_HOME_DIRS.push(d);
}


		const CSS = [
			".vk_pickInput{box-sizing:border-box;width:100%;background:var(--dsw-specific-input-major);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;color:var(--dsw-alias-label-primary);font-size:12px;padding:6px 9px;outline:none;font-family:inherit;transition:border-color .12s,box-shadow .12s}",
			".vk_pickInput:hover{border-color:var(--dsw-alias-border-l3)}",
			".vk_pickInput:focus{border-color:var(--vk-accent);box-shadow:0 0 0 2px var(--vk-accent-ring)}",
			".vk_pickInput::placeholder{color:var(--dsw-alias-label-tertiary)}",
			".vk_row .vk_pickInput{padding:3px 8px}",
			".vk_pickRow{display:flex;gap:6px;justify-content:flex-end;min-width:0;container-type:inline-size}@container (width<=360px){.vk_pickBtn{padding:4px 8px;font-size:11px}}",
			".vk_pickBtn{appearance:none;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;font-size:12px;padding:4px 12px;font-family:inherit;transition:background-color .12s,border-color .12s,color .12s}",
			".vk_pickBtn:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}",
			".vk_name{overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary)}",
			".vk_relPath{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".vk_rowBtn{appearance:none;border:none;background:none;cursor:pointer;font-size:11px;width:20px;height:20px;padding:0;border-radius:5px;line-height:1;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:center;transition:background-color .1s,color .1s}",
			".vk_rowBtn:hover{background:var(--dsw-alias-interactive-bg-hover-accent);color:var(--dsw-alias-label-primary)}",
			// ── 应用内「打开文件夹」目录浏览器弹窗 ──────────────────────
			// z-index：官方 @ 菜单自身是 z-index:100（dsh-client-ui-input-trigger 的 ._3e4SsG_menu），
			// 官方 UI 里最高的浮层是 1100。原来这里是 90 → **@ 菜单浮在弹窗之上**，正好压在卡片上半截，
			// 就是用户 2026-09-13 报的「@ 列表搜索框还是存在遮挡关系」。取 1200 让它置顶到所有官方浮层之上。
			".vk_browseOverlay{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.52);display:flex;align-items:center;justify-content:center;padding:24px;animation:vkFadeIn .12s ease-out}",
			// 固定尺寸（2026-09-12 用户要求：点开文件夹后不能变大，弹窗自始至终一个大小）：
			// 卡片给死高度、内容区只滚不撑 —— 条数少（磁盘列表）与条数多（文件夹里几十项）都是同一块框。
			// 高度取 300px = 「刚打开那一屏」的自然高度（头部 + 路径行 + 磁盘/桌面约 5 行条目 ≈ 285px），
			// 也就是用户口径里的「原来那个刚进搜索栏的大小」；480px 那种大框会顶到窗口边缘被遮挡。
			// --vk-browse-dx：水平对齐偏移（2026-09-13 用户要求「相对对话框水平居中」）。
			// 浮层模式由 VKBrowseModal 按锚点算出像素值写成内联变量；嵌入式不设 → 默认 0px，行为不变。
			// transform 既写在常规态（动画结束后由它生效）也写进 vkBrowseIn（动画期间不丢偏移）。
			".vk_browseCard{width:min(520px,94vw);height:min(300px,72vh);max-height:min(300px,72vh);background:var(--dsw-alias-bg-layer-2,var(--dsw-specific-menu));border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:var(--dsw-shadow-lv3),0 24px 60px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;transform:translateX(var(--vk-browse-dx,0px));animation:vkBrowseIn .14s cubic-bezier(.2,.7,.3,1)}",
			".vk_browseHead{display:flex;align-items:center;gap:8px;padding:11px 12px 10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}",
			".vk_browseTitle{flex:1;min-width:0;font-size:13px;font-weight:600;letter-spacing:.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".vk_iconBtn{appearance:none;border:none;background:none;cursor:pointer;color:var(--dsw-alias-label-tertiary);padding:0;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex:none;transition:background-color .1s,color .1s,transform .08s}",
			".vk_iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_iconBtn:active{transform:scale(.94)}",
			".vk_iconBtnOn{color:var(--vk-accent)}",
			".vk_iconBtnOn:hover{color:var(--vk-accent)}",
			".vk_browsePathRow{display:flex;gap:6px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
			".vk_browsePathRow .vk_pickInput{flex:1;min-width:0}",
			".vk_browsePathIcon{display:flex;color:var(--dsw-alias-label-tertiary);flex:none}",
			".vk_crumbs{display:flex;align-items:center;gap:1px;overflow-x:auto;scrollbar-width:none;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;user-select:none}",
			".vk_crumbs::-webkit-scrollbar{display:none}",
			".vk_crumb{display:inline-flex;align-items:center;gap:1px;padding:2px 5px;border-radius:5px;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}",
			".vk_crumb:not(.vk_crumbCur){cursor:pointer}",
			".vk_crumb:not(.vk_crumbCur):hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_crumbCur{color:var(--dsw-alias-label-primary);font-weight:600}",
			".vk_crumbsSpacer{flex:1;min-width:8px}",
			".vk_crumbsBack{margin-left:auto}",
			// 内容区：只负责滚动，不再用 max-height 让卡片跟着内容长高（尺寸由 .vk_browseCard 定死）
			".vk_browseBody{flex:1;min-height:0;overflow:auto;padding:6px;display:flex;flex-direction:column;gap:1px}",
			".vk_browseErr{margin:2px 4px 4px;padding:7px 10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);color:var(--dsw-alias-state-error-primary);border-radius:7px;font-size:12px;line-height:16px;flex:none}",
			".vk_browseHint{display:flex;align-items:center;justify-content:center;gap:6px;padding:20px 10px;font-size:12px;color:var(--dsw-alias-label-tertiary);text-align:center}",
			".vk_browseRow{display:flex;align-items:center;gap:9px;padding:4px 10px;line-height:24px;font-size:13px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:7px;white-space:nowrap;user-select:none;flex:none}",
			".vk_browseRow:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".vk_browseRowIcon{display:flex;color:var(--dsw-alias-label-tertiary);flex:none;transition:color .1s}",
			".vk_browseRow:hover .vk_browseRowIcon{color:var(--dsw-alias-label-primary)}",
			".vk_browseRow .vk_name{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis}",
			".vk_browseRowUp{color:var(--dsw-alias-label-secondary)}",
			// 选中态（第三轮 B 项）：单击选中（底纹 + accent 描边），再点一次才动作
			".vk_browseRowSelected{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1px var(--vk-accent-ring)}",
			".vk_browseRowEnter{flex:none;width:20px;height:20px}",
			".vk_browseRowSelected .vk_browseOpenHint{opacity:1}",
			".vk_browseRowHidden{opacity:.55}",
			".vk_browseShowHidden{color:var(--dsw-alias-label-tertiary);font-size:12px}",
			// 文件行（"打开本机文件"弹窗的文件模式）：与目录行同款，光标给 pointer，末端的回车提示常显
			".vk_browseFileRow{color:var(--dsw-alias-label-primary)}",
			".vk_browseFileRow .vk_name{flex:0 1 auto}",
			".vk_browseOpenHint{flex:none;margin-left:auto;font-size:10.5px;line-height:16px;padding:0 6px;border-radius:999px;background:var(--vk-accent-soft);color:var(--vk-accent);opacity:0;transition:opacity .12s}",
			".vk_browseFileRow:hover .vk_browseOpenHint{opacity:1}",
			// ── @ 列表右上角：「搜索本机文件」放大镜（2026-09-12 用户要求，从对话框工具行搬到这里） ──
			// 绝对定位钉在官方 @ 菜单容器（[data-trigger-menu]）的右上角；按钮本体是原生 DOM，
			// 由 vkInstallAtSearchButton 注入（原因见那里的长注释：菜单是官方 React 树，插不进去）。
			"[data-trigger-menu] .vk_atSearchBtn{position:absolute;top:5px;right:5px;z-index:3;appearance:none;border:none;background:none;cursor:pointer;width:24px;height:24px;padding:0;border-radius:6px;color:var(--dsw-alias-label-tertiary);display:flex;align-items:center;justify-content:center;transition:background-color .12s,color .12s}",
			"[data-trigger-menu] .vk_atSearchBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			"[data-trigger-menu] .vk_atSearchBtn.vk_atSearchBtnOn{background:var(--vk-accent-soft);color:var(--vk-accent)}",
			// @ 菜单里「单击选中」的描边高亮：与弹窗 .vk_browseRowSelected 同款（底纹 + accent 内描边）。
			// 官方候选行是 role=option 的按钮（容器带 data-trigger-menu），候选对象没有样式字段，
			// 选中态只能由本插件在 DOM 上标类（见 vkAtMarkPicked）。
			"[data-trigger-menu] [role=option].vk-at-picked{background:var(--dsw-alias-interactive-bg-hover)!important;box-shadow:inset 0 0 0 1px var(--vk-accent-ring);border-radius:8px}",
			// 浏览态第一行「↑ 返回上一级」：position:sticky 钉在菜单顶部，滚动时不动（用户口径：随时能点返回）。
			// 必须有实底背景，否则下面的行会从它底下透出来；sticky 的参照就是官方 listbox 那个滚动视口。
			"[data-trigger-menu] [role=option].vk-at-pinned{position:sticky;top:0;z-index:2;background:var(--dsw-specific-menu);border-bottom:1px solid var(--dsw-alias-border-l1)}",
			// 标签正文内嵌（拓展栏「打开本机文件」）：不浮层、不遮罩，改成**居中卡片**（高度约栏高 1/3，
			// 内容超出时卡片内部滚动）。原先铺满整列（height:100%）会把「只有几行目录」的内容拉成一大片空白，
			// 上下顶到栏的两端，观感很差；改成自适应高度（flex:0 1 auto）+ 上限 22vh 后：内容少则卡片矮、
			// 内容多则卡片内部滚动，卡片始终竖向居中。
			".vk_browseEmbed{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:12px;overflow:hidden}",
			// 内嵌（拓展栏标签正文）形态：这条**不受上面那个固定高度管**，卡片按内容自适应（height:auto 覆盖），
			// 否则几行目录会被 480px 的框拉出一大片空白。
			".vk_browseCardEmbed{width:100%;max-width:520px;height:auto;max-height:100%;border-radius:12px;box-shadow:var(--dsw-shadow-lv3)}",
			".vk_browseCardEmbed .vk_browseBody{flex:0 1 auto;min-height:0;max-height:min(22vh,230px)}",
			".vk_browseFoot{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid var(--dsw-alias-border-l1)}",
			".vk_browseFootPath{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".vk_primaryBtn{background:var(--vk-accent);color:#fff;border-color:var(--vk-accent);font-weight:600}",
			".vk_primaryBtn:hover{background:var(--vk-accent);color:#fff;filter:brightness(1.1);border-color:var(--vk-accent)}",
			".vk_primaryBtn:disabled{opacity:.45;cursor:not-allowed;filter:none}",
			"@keyframes vkBrowseIn{from{opacity:0;transform:translateX(var(--vk-browse-dx,0px)) scale(.97) translateY(4px)}to{opacity:1;transform:translateX(var(--vk-browse-dx,0px))}}",
			".vk_imgToolbar{display:flex;align-items:center;gap:2px;padding:4px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;flex:none}",
			".vk_imgToolbarSpacer{flex:1;min-width:8px}",
			".vk_imgZoomBtn{display:inline-flex;align-items:center;gap:4px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;padding:4px 7px;border-radius:6px;cursor:pointer;font-family:inherit}",
			".vk_imgZoomBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".vk_imgZoomBtnOn{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
			".vk_imgZoomPct{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));min-width:52px;text-align:center;font-variant-numeric:tabular-nums}",
			".vk_imgWrap{flex:1;min-height:0;display:flex;overflow:auto;background:repeating-conic-gradient(var(--dsw-alias-interactive-bg-hover) 0% 25%,transparent 0% 50%) 0 0/22px 22px;position:relative;cursor:grab}",
			".vk_imgWrap.vk_imgPan{cursor:grabbing}",
			".vk_imgWrap img{display:block;margin:auto;user-select:none;-webkit-user-drag:none;box-shadow:0 2px 16px rgba(0,0,0,.35);background:#fff;border-radius:4px}",
			// ── 文件图标徽章（浅色基准；深色在文末覆盖） ─────────────────
			".vk_icon{flex:none;width:17px;height:17px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1}",
			".vk_iconSvg{color:var(--dsw-alias-label-secondary)}",
			".vk_iconChip{width:16px;height:16px;border-radius:4px;font-size:8.5px;font-weight:700;font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;letter-spacing:.1px}",
			".vk_iJs{color:#9c8205;background:rgba(241,224,90,.28)}",
			".vk_iTs{color:#3178c6;background:rgba(49,120,198,.16)}",
			".vk_iReact{color:#0e9fc9;background:rgba(97,218,251,.2)}",
			".vk_iPy{color:#3572a5;background:rgba(53,114,165,.14)}",
			".vk_iJson{color:#a87b00;background:rgba(203,182,65,.18)}",
			".vk_iHtml{color:#e34c26;background:rgba(227,76,38,.12)}",
			".vk_iXml{color:#7d4b8f;background:rgba(125,75,143,.12)}",
			".vk_iSvg{color:#b8563e;background:rgba(184,86,62,.12)}",
			".vk_iCss{color:#2965f1;background:rgba(41,101,241,.12)}",
			".vk_iScss{color:#c6538c;background:rgba(198,83,140,.12)}",
			".vk_iLess{color:#2a4d8f;background:rgba(42,77,143,.12)}",
			".vk_iVue{color:#41b883;background:rgba(65,184,131,.16)}",
			".vk_iSvelte{color:#ff3e00;background:rgba(255,62,0,.1)}",
			".vk_iMd{color:#519aba;background:rgba(81,154,186,.14)}",
			".vk_iYaml{color:#c93c3c;background:rgba(203,60,60,.1)}",
			".vk_iShell{color:#4e9a06;background:rgba(137,224,81,.18)}",
			".vk_iConf{color:#6d8086;background:rgba(109,128,134,.14)}",
			".vk_iTxt{color:#7f8c8d;background:rgba(127,140,141,.14)}",
			".vk_iSql{color:#e38c00;background:rgba(227,140,0,.12)}",
			".vk_iVisio{color:#3955a3;background:rgba(57,85,163,.14)}",
			".vk_iGql{color:#e535ab;background:rgba(229,53,171,.12)}",
			".vk_iRs{color:#b4713d;background:rgba(222,165,132,.22)}",
			".vk_iGo{color:#00add8;background:rgba(0,173,216,.12)}",
			".vk_iC{color:#5c6bc0;background:rgba(92,107,192,.14)}",
			".vk_iCpp{color:#d1477b;background:rgba(243,75,125,.12)}",
			".vk_iCs{color:#2c8c1e;background:rgba(35,145,32,.12)}",
			".vk_iRb{color:#cc342d;background:rgba(204,52,45,.1)}",
			".vk_iPhp{color:#777bb4;background:rgba(119,123,180,.14)}",
			".vk_iKt{color:#7f52ff;background:rgba(127,82,255,.12)}",
			".vk_iSwift{color:#f05138;background:rgba(240,81,56,.12)}",
			".vk_iLua{color:#4a4ab8;background:rgba(74,74,184,.12)}",
			".vk_iR{color:#276dc3;background:rgba(39,109,195,.12)}",
			".vk_iWasm{color:#654ff0;background:rgba(101,79,240,.12)}",
			".vk_iFont{color:#a074c4;background:rgba(160,116,196,.14)}",
			".vk_iBin{color:#6e7681;background:rgba(110,118,129,.16)}",
			".vk_iGit{color:#e94e32;background:rgba(240,80,51,.12)}",
			".vk_iNpm{color:#cb3837;background:rgba(203,56,55,.12)}",
			".vk_iJava{color:#b07219;background:rgba(176,114,25,.14)}",
			// ── 键盘聚焦可见态（统一 accent 光圈） ──────────────────────
			".vk_tabBtn:focus-visible,.vk_railBtn:focus-visible,.vk_treeBtn:focus-visible,.vk_rowBtn:focus-visible,.vk_pickBtn:focus-visible,.vk_editBtn:focus-visible,.vk_tabClose:focus-visible{outline:2px solid var(--vk-accent-ring);outline-offset:-2px}",
			// ── 深色主题覆盖：徽章/角标颜色提亮 ─────────────────────────
			"body[data-ds-dark-theme] .vk_iJs{color:#f1e05a;background:rgba(241,224,90,.14)}",
			"body[data-ds-dark-theme] .vk_iTs{color:#5496d8}",
			"body[data-ds-dark-theme] .vk_iReact{color:#61dafb;background:rgba(97,218,251,.12)}",
			"body[data-ds-dark-theme] .vk_iPy{color:#6aa5e0}",
			"body[data-ds-dark-theme] .vk_iJson{color:#cbcb41}",
			"body[data-ds-dark-theme] .vk_iHtml{color:#ff7a59}",
			"body[data-ds-dark-theme] .vk_iXml{color:#b47fd4}",
			"body[data-ds-dark-theme] .vk_iSvg{color:#e08a70}",
			"body[data-ds-dark-theme] .vk_iCss{color:#6ea8ff}",
			"body[data-ds-dark-theme] .vk_iLess{color:#7a9ee0}",
			"body[data-ds-dark-theme] .vk_iYaml{color:#ff7b72}",
			"body[data-ds-dark-theme] .vk_iShell{color:#89e051}",
			"body[data-ds-dark-theme] .vk_iConf{color:#9aa7b0}",
			"body[data-ds-dark-theme] .vk_iTxt{color:#9aa7b0}",
			"body[data-ds-dark-theme] .vk_iSql{color:#f0a63c}",
			"body[data-ds-dark-theme] .vk_iVisio{color:#8aa4e8}",
			"body[data-ds-dark-theme] .vk_iRs{color:#dea584}",
			"body[data-ds-dark-theme] .vk_iC{color:#8fa3e8}",
			"body[data-ds-dark-theme] .vk_iCs{color:#6fbf4a}",
			"body[data-ds-dark-theme] .vk_iRb{color:#ff7b72}",
			"body[data-ds-dark-theme] .vk_iLua{color:#8b8bff}",
			"body[data-ds-dark-theme] .vk_iR{color:#6aa5e0}",
			"body[data-ds-dark-theme] .vk_iBin{color:#9aa7b0}",
			"body[data-ds-dark-theme] .vk_iGit{color:#f05033}",
			"body[data-ds-dark-theme] .vk_iJava{color:#e6b84f}",
			".vk_imgToolbar{display:flex;align-items:center;gap:2px;padding:4px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}",
			".vk_imgZoomBtn{display:inline-flex;align-items:center;gap:4px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;padding:4px 7px;border-radius:6px;cursor:pointer}",
			".vk_imgZoomBtn:disabled{opacity:.4;cursor:default}",
			// 对话里 read/write 卡片的路径按钮（官方 `_fileLink`）：自研把点击改成「在拓展栏打开」，
			// 于是补一颗小箭头做**可见提示**——不 hover 不占位（宽度 0、opacity 0），hover 才展开，
			// 因此官方那一行文字的位置、宽度、省略号行为一字不变（不碰官方 DOM，全是 CSS + 捕获阶段拦截）。
			".vk_chatFileHint{display:inline-block;flex:none;width:0;margin-left:0;overflow:hidden;white-space:nowrap;color:var(--vk-accent);opacity:0;transition:width .12s,opacity .12s,margin-left .12s}",
			"[data-vk-chat-file]:hover .vk_chatFileHint,[data-vk-chat-file]:focus-visible .vk_chatFileHint{width:14px;margin-left:4px;opacity:1}",
		].join("");

		(function injectComposerCss() {
			if (typeof document === 'undefined') return;
			const plugin = 'dsh-vk-composer';
			for (const old of document.querySelectorAll('style[data-plugin="' + plugin + '"]')) { try { old.remove(); } catch { /* ignore */ } }
			const tag = document.createElement('style');
			tag.dataset.plugin = plugin;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		})();

		// 文件树落地页（未打开具体文件夹时）：折叠展示的常用根目录，展开即可浏览；要固定展示自己的目录，在这里补条目
		const HOME_DIRS = VK_HOME_DIRS;
		/** 是否落在工作区 / 长期任务的固定目录里（这类目录不进「最近打开」，也不写记录）。 */
		function isHomeDirPath(p) {
			const n = normPath(p);
			return HOME_DIRS.some((d) => normPath(d.path) === n);
		}
		const vkFileTreeState = { expanded: new Set(), showHidden: false, subs: new Set() };
		try { globalThis.__VK_DIAG__ = vkDiag; } catch { /* 非浏览器环境 */ }
		function vkFileTreeSetExpanded(next) {
			vkFileTreeState.expanded = next instanceof Set ? new Set(next) : new Set(next);
			const list = [...vkFileTreeState.expanded];
			for (const fn of [...vkFileTreeState.subs]) { try { fn(list); } catch { /* 订阅方可能已卸载 */ } }
		}
		// ── 展开集什么时候被清空（2026-09-13 定稿：与 @ 列表彻底解绑）──────────────────────
		// 只有**确定性的两个来源**：
		//   ① 用户离开文件栏：切到会话/任务 Tab、或收起左栏 —— 由 VKSidebarBody 的 tab/wide effect
		//      直接清（见那边注释）；切回来时 DOM 还没渲染就已经是空的，天然「纯折叠」。
		//   ② 在文件栏里换根 / 关根（setRoot 到不同值）—— 由 FileTree 的 [root] effect 清。
		// 写入方只有文件栏自己（那颗三角 / 单击目录行）。
		// **@ 列表与文件栏完全分离**（用户第一轮口径：两边只是内容一致）：@ 菜单的关闭复位、@ 的旧目录行
		// 分支都不再读写这份状态；IntersectionObserver 那条「看可见性」的兜底也已删除。
		// 展开状态在文件栏内也不跨视图记忆：切走再切回来仍是纯折叠。
		/** 某目录是否处于展开态（按归一化路径比较，忽略大小写与尾斜杠）。 */
		function vkFileTreeHas(path) {
			const k = normPath(path);
			for (const p of vkFileTreeState.expanded) if (normPath(p) === k) return true;
			return false;
		}
		/** 展开 / 收起一个目录（收起时级联收起全部后代）；返回切换后的状态（true = 已展开）。 */
		function vkFileTreeToggle(path) {
			const k = normPath(path);
			const next = new Set();
			let wasOpen = false;
			for (const p of vkFileTreeState.expanded) {
				const pk = normPath(p);
				if (pk === k) { wasOpen = true; continue; }
				if (pk.startsWith(k + "\\") || pk.startsWith(k + "/")) continue;
				next.add(p);
			}
			if (!wasOpen) next.add(String(path));
			vkFileTreeSetExpanded(next);
			return !wasOpen;
		}

		// 两份状态都不落盘：刷新页面即回到默认（全折叠）。
		const vkSectionState = { open: null, subs: new Set() }; // open = 当前展开的栏目名；null = 全折叠
		/** 栏目是否展开（@ 落地页；默认为 null → 全折叠）。 */
		function vkSectionIsOpen(name) {
			return vkSectionState.open !== null && vkSectionState.open === String(name);
		}
		/** 切换栏目展开态（@ 落地页）：开一栏即收其他栏，返回切换后的状态。 */
		function vkSectionToggle(name) {
			const k = String(name);
			vkSectionState.open = vkSectionState.open === k ? null : k;
			for (const fn of [...vkSectionState.subs]) { try { fn(k); } catch { /* 订阅方可能已卸载 */ } }
			return vkSectionState.open === k;
		}


		function vkStripTrailingAtToken(text) {
			const s = typeof text === "string" ? text : "";
			// 引号（含尾随空白）先摘掉再 trim，一次正则同时覆盖 `@"/vscode-files/x` 这种未闭合形态
			const mQuoted = /(^|\s)@"[^"\n]*"?\s*$/u.exec(s);
			if (mQuoted !== null) return (s.slice(0, mQuoted.index) + (mQuoted[1] === "" ? "" : mQuoted[1])).replace(/\s+$/u, "");
			// 普通 `@关键词` / 裸 `@`：从最后一个 @ 起摘掉（@ 前必须是空白或行首，
			// 否则当作文本里的邮箱等用法，原样保留）
			const at = s.lastIndexOf("@");
			if (at < 0) return s;
			if (at > 0 && !/\s/u.test(s.charAt(at - 1))) return s;
			return s.slice(0, at).replace(/\s+$/u, "");
		}

		function VKComposerFileSearch(props) {
			const inputActions = props.inputActions;
			// 末段追加需要先读到当前草稿；useInput 是官方 session 作用域的标准 selector hook
			const draftText = typeof props.useInput === "function"
				? props.useInput((s) => (s !== void 0 && s !== null && typeof s.draft === "string" ? s.draft : ""))
				: "";
			const [open, setOpen] = react.useState(false);
			const [path, setPath] = react.useState("");
			const [dir, setDir] = react.useState(null);
			const [err, setErr] = react.useState(null);
			const [drives, setDrives] = react.useState([]);
			const [probing, setProbing] = react.useState(false);
			const [desktopPath, setDesktopPath] = react.useState(null);
			const [query, setQuery] = react.useState("");
			const [search, setSearch] = react.useState(null);
			const [showHidden, setShowHidden] = react.useState(false);
			const seqRef = react.useRef(0);
			// 「对话框」水平中心（视口坐标 x；量不到为 null）—— 打开弹窗那一刻量，见 openDialog。
			const [anchorX, setAnchorX] = react.useState(null);
			// 模糊搜索：与文件栏弹窗同一端点（kind 缺省即文件），根取「当前目录」或「全部磁盘 + 桌面」
			react.useEffect(() => {
				if (open !== true) return void 0;
				const q = query.trim();
				if (q.length === 0) { setSearch(null); return void 0; }
				const seq = ++seqRef.current;
				const timer = setTimeout(() => {
					const roots = path.length > 0 ? [path] : [...drives, ...(desktopPath !== null ? [desktopPath] : [])];
					if (roots.length === 0) { setSearch({ busy: false, note: "磁盘尚未检测完成，请稍候或先进入一个目录", items: [] }); return; }
					setSearch({ busy: true, note: null, items: [] });
					const items = [];
					(async () => {
						for (const root of roots) {
							if (seq !== seqRef.current) return;
							try {
								const r = await fetch("/vscode-files/search?path=" + encodeURIComponent(root) + "&q=" + encodeURIComponent(q));
								const d = await r.json();
								if (d && d.ok && Array.isArray(d.results)) items.push(...d.results);
							} catch { /* 网络抖动忽略 */ }
						}
						if (seq !== seqRef.current) return;
						setSearch({ busy: false, note: items.length === 0 ? "没有匹配的文件，试试更短的关键词" : null, items: items.slice(0, 80) });
					})();
				}, 250);
				return () => { clearTimeout(timer); };
			}, [open, query, path, drives, desktopPath]);
			// 根视图候选：常见磁盘 + 桌面，只展示真实存在的（与文件栏那颗按钮同一套候选与端点）
			const probeRoots = react.useCallback(() => {
				const cands = ["C:\\", "D:\\", "E:\\", "F:\\"];
				let pending = cands.length + 1;
				const found = [];
				setProbing(true);
				setDrives([]);
				setDesktopPath(null);
				const settle = () => {
					pending -= 1;
					if (pending <= 0) { setDrives(found.slice().sort()); setProbing(false); }
				};
				for (const p of cands) {
					fetch("/vscode-files/list?path=" + encodeURIComponent(p))
						.then((r) => r.json())
						.then((d) => { if (d && d.ok) found.push(p); })
						.catch(() => {})
						.finally(settle);
				}
				(async () => {
					for (const p of cands.map((d) => d + "Desktop")) {
						try {
							const r = await fetch("/vscode-files/list?path=" + encodeURIComponent(p));
							const d = await r.json();
							if (d && d.ok && typeof d.path === "string") { setDesktopPath(d.path); break; }
						} catch { /* next candidate */ }
					}
					settle();
				})();
			}, []);
			const goto = react.useCallback((target) => {
				const t = String(target || "").trim();
				if (t.length === 0) return;
				setErr(null);
				setQuery("");
				setSearch(null);
				const norm = /^[A-Za-z]:$/.test(t) ? t + "\\" : t;
				setPath(norm);
				setDir(null);
				fetch("/vscode-files/list?path=" + encodeURIComponent(norm))
					.then((r) => r.json())
					.then((d) => { if (d && d.ok) { setDir(d); setErr(null); } else setErr((d && d.error) || "无法读取该目录"); })
					.catch((e) => setErr(String(e)));
			}, []);
			const openDialog = () => {
				// 先把「对话框」的水平中心量下来再开：此刻按钮所在的 @ 菜单还在 DOM 里
				// （按钮走 mousedown + preventDefault，菜单不会因失焦收摊），而弹窗一开遮罩压上来，
				// 菜单随时可能被官方流水线收掉 —— 那时候就量不到了。
				setAnchorX(vkMeasureComposerCenterX());
				setOpen(true);
				setPath("");
				setDir(null);
				setErr(null);
				setQuery("");
				setSearch(null);
				setShowHidden(false);
				probeRoots();
			};
			// 选中条目 → 不打开标签页、也不进入目录，而是把 @引用（文件 / 文件夹都行）追加进输入框。
			// 注意：先摘掉唤起 @ 菜单的那段未完成触发文本（`@` / `@关键词` / `@"关键词`），否则
			// 输入框里会留下一个孤立的 @（用户 2026-09-12 报的「多注入一个 @」就是这里）。
			const pickEntry = react.useCallback((entry) => {
				const abs = entry !== null && entry !== undefined && typeof entry.path === "string" ? entry.path : "";
				if (abs.length === 0) return;
				const mention = vkInsertMentionOf(abs, entry.isDir === true);
				if (mention.length === 0) return;
				const current = vkStripTrailingAtToken(typeof draftText === "string" ? draftText : "");
				const head = current.replace(/\s+$/u, "");
				const next = (head.length > 0 ? head + " " : "") + mention + " ";
				try {
					if (inputActions !== void 0 && inputActions !== null && typeof inputActions.setDraft === "function") inputActions.setDraft(next);
				} catch { /* 输入机不可写（提交中/无会话）：静默，弹窗照常关闭 */ }
				setOpen(false);
				setPath("");
				setDir(null);
				setErr(null);
				setQuery("");
				setSearch(null);
			}, [draftText, inputActions]);
			// @ 菜单右上角那颗原生按钮点下来时，靠这里回到 React：登记本组件的「开弹窗」动作
			// （每次渲染都重登一次，保证登记的是最新闭包；卸载时只清自己那一份）。
			react.useEffect(() => {
				vkAtSearchOpenDialog = openDialog;
				// 顺带补一次：宿主就位的这一刻 @ 菜单可能已经开着，而 observer 那次早于本 effect 跑完了。
				vkAtSearchEnsureButton();
				return () => { if (vkAtSearchOpenDialog === openDialog) vkAtSearchOpenDialog = null; };
			});
			// 弹窗开着时点亮右上角那颗按钮（与之前的 vk_cfBtnOn 同义；按钮被菜单重挂后由
			// vkAtSearchSyncBtnState 重新贴回高亮态）。
			react.useEffect(() => {
				vkAtSearchDialogOpen = open === true;
				vkAtSearchSyncBtnState();
			}, [open]);
			// 工具行里不再出按钮（2026-09-12 用户要求：这颗放大镜搬到 @ 列表右上角，
			// 见 vkInstallAtSearchButton）——但组件必须继续挂载：它既是弹窗的宿主，也是右上角那颗
			// DOM 按钮的落点，所以这里渲染 null，而不是把自己卸载掉。
			if (open !== true) return null;
			return h(react.Fragment, null,
				h(VKBrowseModal, {
					fileMode: true,
					mode: "insert",
					// 相对「对话框」水平居中用的锚点（见 vkMeasureComposerCenterX）
					anchorX: anchorX,
					path: path,
					dir: dir,
					err: err,
					drives: drives,
					probing: probing,
					desktopPath: desktopPath,
					query: query,
					search: search,
					showHidden: showHidden,
					onQuery: (v) => setQuery(v),
					onGoto: (t) => goto(t),
					onRoots: () => { setPath(""); setDir(null); setErr(null); setQuery(""); setSearch(null); },
					onToggleHidden: () => setShowHidden((v) => !v),
					onReload: () => probeRoots(),
					onClose: () => setOpen(false),
					onPickFile: (f) => pickEntry({ path: f.path, name: f.name, isDir: false }),
					// 底部「引用」：选中的是文件夹就插 `@目录/`，是文件就插 `@文件` —— 都不再「进入 / 打开」
					onOpen: (sel) => { if (sel !== null && sel !== undefined) pickEntry({ path: sel.path, name: sel.name, isDir: sel.isDir === true }); }
				})
			);
		}


		/** 每个目录分组首屏条数上限。 */
		const VK_AT_GROUP_LIMIT = 8;
		/** 「展开更多」后单组条数上限。 */
		const VK_AT_GROUP_MAX = 40;
		/** 一次菜单最多回传的总条数（防止把上千条一口气铺开）。 */
		const VK_AT_TOTAL_LIMIT = 200;
		/** 检索命中条数上限（host /vscode-files/search 递归到 8 层、每根最多 200 条）。 */
		const VK_AT_ITEM_LIMIT = 120;
		/** 「展开更多」那一行在候选 value 里的标记，onPick 据此识别。 */
		const VK_AT_EXPAND_TAG = "vk-at-expand";
		/** 「展开更多目录」那一行在候选 value 里的标记。 */
		const VK_AT_MORE_TAG = "vk-at-more";
		/** 栏目（section）折叠行在候选 value 里的标记：点它 = 展开 / 收起整栏（2026-09-11 用户要求）。 */
		const VK_AT_SECTION_TAG = "vk-at-section";
		/** 落地页的目录行标记：点它 = 展开/收起那一级（不插入引用），与文件栏左右三角同义。 */
		const VK_AT_ROW_TAG = "vk-at-row";
		/** 首发列出的目录分组数 / 「展开更多目录」后的目录数上限。 */
		const VK_AT_GROUP_SHOW = 10;
		const VK_AT_GROUP_SHOW_MAX = 40;
		/** 本源在菜单里的节标题前缀（要能和官方源的「文件与文件夹」区分开）。 */
		const VK_AT_SECTION = "本机常用目录";
		/**
		 * onPick 回写 token 用的文本。
		 * 官方 shell 的 insertText 是「替换 token span」：文本必须与当前 token 一致才算应用成功
		 * （给空串会被判失败 → 菜单关掉、drilled 复位，实测踩过），所以「展开更多」这类不插入文字的动作
		 * 必须把 `@<当前 query>` 原样写回 + `continue:true` 让菜单继续开着重新取候选。
		 */
		let vkAtRestoreText = "";
		/**
		 * 「展开更多目录」是否已被点开：**跨查询保留**（第二轮改动）。
		 * 以前这里存的是「那一轮对应的查询」，查询一变就作废、菜单又收回 10 个目录；
		 * 现在点开一次就一直全展开，直到刷新页面（列表本身仍有 VK_AT_TOTAL_LIMIT 硬上限）。
		 */
		let vkAtShowAllGroups = false;
		/**
		 * 已展开的目录集合（键 = 归一化目录路径）。
		 * 同样**跨查询保留**（第二轮改动）：换关键词后之前展开过的目录保持展开，不必再点一次。
		 */
		const vkAtExpanded = new Set();
		/**
		 * @ 菜单的浏览 / 选中态（2026-09-12 第六轮用户口径）：
		 *   q        = 上一屏的查询（换关键词即作废选中）；
		 *   root     = 本次浏览的起点目录 ——「返回上一级」最多退到这里，再点就回落地页（不再无限往上退）；
		 *   dir      = 当前浏览的目录（null = 落地页 / 搜索结果那一屏）；
		 *   sel/selEntry = 单击选中的条目（路径 + 完整 value）；
		 *   mousePick    = 被鼠标**第二次**点击的那一行（onPick 靠它区分「鼠标再点一次」与「回车」）。
		 * 交互：单击 = 选中（DOM 描边高亮，不重取候选所以不闪）；再点同一行 = 目录进下一级 / 文件引用；
		 *       回车 = **一律在会话引用**（不管选中的是文件还是文件夹）。
		 * 菜单关闭时全部复位（见 vkInstallAtMenuReset）。
		 */
		const vkAtBrowse = { q: null, root: null, dir: null, sel: null, selEntry: null, mousePick: null };
		/**
		 * 「单击选中」的拦截 + 描边高亮（2026-09-12 第五轮：这是唯一可行的做法）。
		 *
		 * 官方 pipeline 的 settle() 在**任何鼠标 pick 之后都会无条件 reduce({type:'close'})**
		 * （见 ui-input-trigger/lib/client.js 的 settle），只有 outcome 带 continue 才会重开菜单。
		 * 所以「返回 undefined 让菜单别关」做不到 —— 那样菜单会被关掉（实测：整个 @ 列表消失）。
		 * 改法：在 **document 捕获阶段**拦下第一次 mousedown（document 早于 React 的 root 监听器，
		 * stopPropagation 后官方收不到事件 → settle 不执行 → 菜单原地不动、候选不重取 → 不闪），
		 * 只把描边打在那一行上；同一行的**第二次**点击直接放行给官方（目录进下一级 / 文件引用）。
		 * 行号来自官方 option 的 id：`dsh-slash-option-<source>-<index>`（ui-input-trigger 的 optionId）。
		 */
		const VK_AT_PICKED_CLASS = "vk-at-picked";
		/** 浏览态里那一行导航（kind === "nav"）的「钉住」标记类（CSS 做 sticky，钉在菜单顶部）。 */
		const VK_AT_PINNED_CLASS = "vk-at-pinned";
		/** 本屏候选的最后一份（拦点击时按 option 行号取回自己的 value；贴描边时按路径找回行号）。 */
		let vkAtLastItems = [];
		/** 清掉所有「已选中」描边与「钉住」标记（换屏 / 进入下一级 / 菜单关闭 / 引用之后都要清）。 */
		function vkAtClearPicked() {
			try {
				for (const el of document.querySelectorAll("." + VK_AT_PICKED_CLASS)) el.classList.remove(VK_AT_PICKED_CLASS);
				for (const el of document.querySelectorAll("." + VK_AT_PINNED_CLASS)) el.classList.remove(VK_AT_PINNED_CLASS);
			} catch { /* 非浏览器环境：跳过 */ }
		}
		/** 选中项在本屏候选里的行号（找不到给 -1）—— 官方 option 的 id 就是按这个行号编的。 */
		function vkAtPickedRowIndex() {
			if (vkAtBrowse.sel === null) return -1;
			for (let i = 0; i < vkAtLastItems.length; i += 1) {
				const it = vkAtLastItems[i];
				if (it === null || it === void 0 || typeof it.value !== "string") continue;
				try {
					const v = JSON.parse(it.value);
					if (v !== null && typeof v.path === "string" && normPath(v.path) === normPath(vkAtBrowse.sel)) return i;
				} catch { /* 坏 value：跳过 */ }
			}
			return -1;
		}
		/**
		 * 把描边重新贴到选中行上。
		 *
		 * 为什么不能只贴一次：候选行是 React 渲染的，**鼠标在行间移动就会触发 hover 高亮 → 整行重渲染 →
		 * className 被官方重算覆盖**，我们加的 vk-at-picked 就被冲掉（用户实测：描边一闪就没）。
		 * 所以每次菜单子树变动后都重新贴一次：按选中路径找回行号（与官方 option 的 id 同源），
		 * 只做一次 getElementById + classList 读写，幂等、开销可忽略。
		 */
		function vkAtSyncPicked() {
			try {
				const index = vkAtPickedRowIndex();
				const wantId = index < 0 ? null : "dsh-slash-option-vk-extended-" + index;
				for (const el of document.querySelectorAll("." + VK_AT_PICKED_CLASS)) {
					if (wantId === null || el.id !== wantId) el.classList.remove(VK_AT_PICKED_CLASS);
				}
				if (wantId === null) return;
				const row = document.getElementById(wantId);
				if (row !== null && !row.classList.contains(VK_AT_PICKED_CLASS)) row.classList.add(VK_AT_PICKED_CLASS);
			} catch { /* 非浏览器环境：跳过 */ }
		}
		/** 浏览态里那一行导航（kind === "nav"）在本屏候选里的行号；不在浏览态给 -1。 */
		function vkAtNavRowIndex() {
			if (vkAtBrowse.dir === null) return -1;
			for (let i = 0; i < vkAtLastItems.length; i += 1) {
				const it = vkAtLastItems[i];
				if (it === null || it === void 0 || typeof it.value !== "string") continue;
				try {
					const v = JSON.parse(it.value);
					if (v !== null && v.kind === "nav") return i;
				} catch { /* 坏 value：跳过 */ }
			}
			return -1;
		}
		/**
		 * 给导航行钉上 vk-at-pinned（CSS 的 sticky，滚动时固定在菜单顶部；用户口径：随时能点返回）。
		 * 与描边同理：React 重渲染会覆盖 className，所以要反复贴。
		 */
		function vkAtSyncPinnedNav() {
			try {
				const index = vkAtNavRowIndex();
				const wantId = index < 0 ? null : "dsh-slash-option-vk-extended-" + index;
				for (const el of document.querySelectorAll("." + VK_AT_PINNED_CLASS)) {
					if (wantId === null || el.id !== wantId) el.classList.remove(VK_AT_PINNED_CLASS);
				}
				if (wantId === null) return;
				const row = document.getElementById(wantId);
				if (row !== null && !row.classList.contains(VK_AT_PINNED_CLASS)) row.classList.add(VK_AT_PINNED_CLASS);
			} catch { /* 非浏览器环境：跳过 */ }
		}
		/** 装捕获阶段的 mousedown 拦截 + 描边续贴（详见上面的长注释）。 */
		function vkInstallAtPickHighlight() {
			try {
				document.addEventListener("mousedown", (e) => {
					const t = e === null || e === void 0 ? null : e.target;
					const row = t !== null && typeof t.closest === "function" ? t.closest("[role=option]") : null;
					if (row === null || row.closest("[data-trigger-menu]") === null) return;
					const parsed = /^dsh-slash-option-(.+)-(\d+)$/.exec(String(row.id === void 0 || row.id === null ? "" : row.id));
					if (parsed === null || parsed[1] !== "vk-extended") return; // 官方「对话」等条目照旧走官方 pick
					const item = vkAtLastItems[Number(parsed[2])];
					if (item === void 0 || typeof item.value !== "string") return;
					let value = null;
					try { value = JSON.parse(item.value); } catch { return; }
					if (value === null || value.kind !== "file") return; // 只有条目行参与「两段式」
					const p = String(value.path === null || value.path === undefined ? "" : value.path);
					if (p.length === 0) return;
					// 第二次点击同一行：记下「这一行是鼠标点的」，然后放行给官方。
					// （官方 settle() 里 via 恒为 "menu" —— 鼠标与回车都走它，所以 onPick 只能靠这个标记区分。）
					if (vkAtBrowse.sel !== null && normPath(vkAtBrowse.sel) === normPath(p)) {
						vkAtBrowse.mousePick = p;
						return;
					}
					e.preventDefault();
					e.stopPropagation();
					vkAtBrowse.mousePick = null; // 第一次点击：清掉可能残留的标记
					vkAtBrowse.sel = p;
					vkAtBrowse.selEntry = value;
					vkAtSyncPicked();
				}, true);
				// 官方每次重渲染都会覆盖 className → 菜单子树（含 class 变化）一动就补一次描边与顶部钉住。
				const obs = new MutationObserver(() => {
					if (vkAtBrowse.sel !== null) vkAtSyncPicked();
					vkAtSyncPinnedNav();
				});
				obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
			} catch { /* 非浏览器环境：跳过 */ }
		}

		/** @ 菜单右上角那颗放大镜的类名（样式见 CSS 的 `[data-trigger-menu] .vk_atSearchBtn`）。 */
		const VK_AT_SEARCH_BTN_CLASS = "vk_atSearchBtn";

		/**
		 * 量出「对话框」的水平中心（视口坐标 x）。
		 *
		 * 锚点两级回退：① 当前聚焦的 textarea / 可编辑区（就是对话框本体，最准）；② 官方 @ 菜单容器
		 * `[data-trigger-menu]` —— 它 `position:absolute;left:0;right:0` 铺满输入栏那一层，中心一致。
		 * 两级都量不到时返回 null，调用方回退到视口居中（旧行为）。
		 */
		function vkMeasureComposerCenterX() {
			try {
				// ① 最准的一档：此刻聚焦的那个输入框。按钮走 mousedown + preventDefault（见
				//    vkAtSearchEnsureButton），焦点仍在 textarea 上，量的就是「对话框」本体。
				const active = document.activeElement;
				if (active !== null && active !== void 0 && typeof active.getBoundingClientRect === "function"
					&& (active.tagName === "TEXTAREA" || active.isContentEditable === true)) {
					const ra = active.getBoundingClientRect();
					if (ra.width > 0) return ra.left + ra.width / 2;
				}
				// ② 次选：官方 @ 菜单容器（position:absolute;left:0;right:0 铺满输入栏那一层，中心一致）
				const menu = document.querySelector("[data-trigger-menu]");
				if (menu === null) return null;
				const r = menu.getBoundingClientRect();
				if (!(r.width > 0)) return null;
				return r.left + r.width / 2;
			} catch {
				return null;
			}
		}
		/** 它的图标：官方 IconSearch 同款的放大镜（原生 DOM 按钮拿不到 VIcon，用内联 SVG）。 */
		const VK_AT_SEARCH_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.6-3.6"></path></svg>';
		/** 右上角按钮的 DOM 引用（同步高亮态用；菜单重挂后由 observer 补回）。 */

		let vkAtSearchBtnEl = null;
		/** 弹窗当前开着没有（组件侧同步过来，供按钮重建后恢复高亮态）。 */
		let vkAtSearchDialogOpen = false;
		/** 组件登记进来的「打开弹窗」动作（点右上角按钮时调它）。 */
		let vkAtSearchOpenDialog = null;
		/** 观察器只装一次（apply 理论上只跑一次，这里仍加个闸）。 */
		let vkAtSearchBtnInstalled = false;

		/** 把「弹窗已打开」的高亮态贴回右上角按钮（幂等；按钮不在就什么都不做）。 */
		function vkAtSearchSyncBtnState() {
			try {
				if (vkAtSearchBtnEl === null || typeof vkAtSearchBtnEl.classList === "undefined") return;
				vkAtSearchBtnEl.classList.toggle("vk_atSearchBtnOn", vkAtSearchDialogOpen === true);
			} catch { /* 非浏览器环境：跳过 */ }
		}

		/**
		 * 把「搜索本机文件」放大镜钉到官方 @ 菜单（`[data-trigger-menu]`）的右上角
		 * （2026-09-12 用户要求：从对话框工具行搬到这里）。
		 *
		 * 为什么只能走 DOM：菜单是 ui-input-trigger 自己的 React 树（MenuView），自研插不进去 ——
		 * 同一个菜单里「单击描边」「顶部钉住」两处也是这个理由（见 vkAtSyncPicked / vkAtSyncPinnedNav）。
		 * 做法与它们一致：append 一个原生 button 到菜单容器，再由 MutationObserver 在菜单重挂后补回。
		 *
		 * 交互上两个要点：
		 * ① 用 mousedown + preventDefault（而不是 onClick）：不让输入框失焦 —— 焦点一离开 textarea，
		 *    官方的 @ 补全流水线就收摊、菜单跟着消失；
		 * ② 不会误关菜单：官方 MenuView 的「点到别处就收」判据是 `listRef.contains(target)`
		 *    （见其 onPointerDown），而按钮是菜单容器的后代 → 判据为真 → 菜单原地不动。
		 */
		function vkAtSearchEnsureButton() {
			try {
				// 快路径：按钮还在菜单里就只同步高亮态（DOM 变动很频繁，不做多余的 querySelector）
				if (vkAtSearchBtnEl !== null && vkAtSearchBtnEl.isConnected === true) {
					vkAtSearchSyncBtnState();
					return;
				}
				vkAtSearchBtnEl = null;
				// 没有宿主就不注入：搬家前那颗工具行按钮本来也只在 conversation.input.left 里渲染
				// （官方 InputBar 的判据是 `input === void 0 || sessionId === void 0 ? null : renderSlot(...)`，
				// 无会话时它根本不出现）。与其留一颗点了没反应的按钮，不如与搬家前保持同一个可用范围。
				if (typeof vkAtSearchOpenDialog !== "function") return;
				const menu = document.querySelector("[data-trigger-menu]");
				if (menu === null) return; // @ 菜单没开：什么都不做
				let btn = menu.querySelector("." + VK_AT_SEARCH_BTN_CLASS);
				if (btn === null) {
					btn = document.createElement("button");
					btn.type = "button";
					btn.className = VK_AT_SEARCH_BTN_CLASS;
					btn.title = "搜索本机文件 / 文件夹（浏览或模糊搜索，选中后在会话里插入 @ 引用）";
					btn.setAttribute("aria-label", "搜索本机文件");
					btn.innerHTML = VK_AT_SEARCH_ICON;
					btn.addEventListener("mousedown", (e) => {
						e.preventDefault();
						e.stopPropagation();
						const open = vkAtSearchOpenDialog;
						if (typeof open === "function") {
							try { open(); } catch { /* 输入机不可写（提交中/无会话）：静默 */ }
						}
					});
					menu.appendChild(btn);
				}
				vkAtSearchBtnEl = btn;
				vkAtSearchSyncBtnState();
			} catch { /* 非浏览器环境：跳过 */ }
		}

		/**
		 * 装上「观察 → 注入」这一套：body 每次变动都试着把按钮补进当时打开着的 @ 菜单。
		 * 官方菜单整棵由 React 管理、候选重取时还会重挂，所以只能这样反复补
		 * （与 vkAtSyncPicked / vkAtSyncPinnedNav 同一个理由）。
		 */
		function vkInstallAtSearchButton() {
			if (vkAtSearchBtnInstalled === true) return;
			vkAtSearchBtnInstalled = true;
			try {
				vkAtSearchEnsureButton();
				const obs = new MutationObserver(vkAtSearchEnsureButton);
				obs.observe(document.body, { childList: true, subtree: true });
			} catch { vkAtSearchBtnInstalled = false; /* 非浏览器环境：跳过 */ }
		}

		/** 该路径是否在一个根的子树内（Windows 大小写不敏感）。 */
		function vkAtInside(root, path) {
			const r = String(root === null || root === undefined ? "" : root).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
			const p = String(path === null || path === undefined ? "" : path).replace(/\\/g, "/").toLowerCase();
			return r.length > 0 && (p === r || p.startsWith(r + "/"));
		}
		/** 相对会话根的斜杠路径（官方插入格式）；不在根内给 null。 */
		function vkAtRelTo(cwd, path) {
			const c = String(cwd === null || cwd === undefined ? "" : cwd);
			if (c.length === 0 || !vkAtInside(c, path)) return null;
			const rel = String(path).replace(/\\/g, "/").slice(c.replace(/\\/g, "/").replace(/\/+$/, "").length + 1);
			return rel.length > 0 ? rel : null;
		}
		/**
		 * 选中文件**或文件夹**后写进输入框的 @ 引用文本（纯函数，写法与官方 @ 源一致）：
		 * 会话根内用相对路径、根外用绝对路径；含空格（或引号）用 @"…"；
		 * 文件夹**带尾斜杠**（`@目录/`）—— 正是官方 grammar 里目录候选的形态。
		 * @param absPath - 磁盘绝对路径（反斜杠或正斜杠皆可）。
		 * @param isDir - 该路径是文件夹（true）还是文件（缺省 / false）。
		 * @returns mention 文本；空路径返回空串。
		 */
		function vkInsertMentionOf(absPath, isDir) {
			const p = String(absPath === null || absPath === undefined ? "" : absPath);
			if (p.length === 0) return "";
			let cwd = "";
			try { cwd = vkAtSessionCwd(); } catch { cwd = ""; }
			const rel = vkAtRelTo(cwd, p);
			const text = rel !== null ? rel : p.replace(/\\/g, "/");
			return vkAtMention(text, isDir === true);
		}
		/** 模糊命中评分：命中越靠前越小，文件名命中优先于仅路径命中；不命中给 null（纯函数）。 */
		function vkAtScore(name, rel, q) {
			const n = String(name).toLowerCase();
			const r = String(rel).toLowerCase();
			if (q.length === 0) return r.length / 1000;
			const base = n.indexOf(q);
			if (base === 0) return r.length / 1000;
			if (base > 0) return 100 + base + r.length / 1000;
			const inPath = r.indexOf(q);
			return inPath < 0 ? null : 300 + inPath + r.length / 1000;
		}
		/** 会话工作区根（root 作用域组件拿不到 sessionId，一律现取；@ 扩域与地址解析共用）。 */
		function vkCurrentSessionCwd() {
			try {
				const snapshot = ctxRef.current.get("sessions").list.getSnapshot();
				const row = snapshot !== undefined && snapshot.current !== undefined ? snapshot.byId[snapshot.current] : undefined;
				return row !== undefined && typeof row.cwd === "string" && row.cwd.length > 0 ? row.cwd : "";
			} catch { return ""; }
		}
		/** 会话工作区根（vkAtSearch 用；实现见 vkCurrentSessionCwd）。 */
		function vkAtSessionCwd() {
			return vkCurrentSessionCwd();
		}
		/**
		 * 读「最近打开」：**按会话隔离**（键 = dsh-vscode-layout:recents:v1:<sessionId>；取不到会话落 "none" 桶）。
		 * 读取即清洗：剔掉工作区固定目录与重复项（大小写/尾斜杠变体算同一个）。
		 * 旧版全局键的残留数据不读取、也不清理，留给用户自己处置。
		 */
		function readRecents(sid) {
			const s = typeof sid === "string" && sid.length > 0 ? sid : vkCurrentSessionId();
			let arr = [];
			try {
				const raw = localStorage.getItem(vkSessionKey(s, "recents"));
				const parsed = raw === null ? [] : JSON.parse(raw);
				if (Array.isArray(parsed)) arr = parsed;
			} catch { return []; }
			const seen = new Set();
			const out = [];
			for (const p of arr) {
				if (typeof p !== "string" || p.length === 0 || isHomeDirPath(p)) continue;
				const k = normPath(p);
				if (seen.has(k)) continue;
				seen.add(k);
				out.push(p);
				if (out.length >= RECENTS_MAX) break;
			}
			return out;
		}

		// ──────────────────────────────────────────────────────────────
		// 组件：应用内文件浏览弹窗（三处调用点共用）
		//
		// 数据与交互都长在调用方（目录、查询词、显隐开关），这里只负责画与转发：
		//   ① 左栏文件栏那颗文件夹图标——自适应（fileMode + pickFolder）：进目录/点文件都算选中，
		//      点文件就在拓展栏打开，点「打开」则把当前目录加入列表；
		//   ② 拓展栏「新标签页 → 打开本机文件」——文件模式，最终必须选中一个文件；
		//   ③ 对话输入区 @ 菜单右上角那颗放大镜——插入模式（insertMode），底部动作叫「引用」。
		// 三处的根视图、面包屑、模糊搜索、隐藏项开关、上下级导航完全一致。
		//
		// props: { fileMode, mode, pickFolder, embedded, anchorX, openTarget, onOpenUrl,
		//          path, dir, err, drives, probing, desktopPath, query, search, showHidden,
		//          onQuery, onGoto, onRoots, onToggleHidden, onReload, onClose, onPickFile, onOpen }
		// ──────────────────────────────────────────────────────────────
		function VKBrowseModal(props) {
			const fileMode = props.fileMode === true;
			const insertMode = props.mode === "insert";
			const pickFolder = props.pickFolder === true;
			const embedded = props.embedded === true;
			const actWord = insertMode ? "引用" : "打开";
			const anchorX = typeof props.anchorX === "number" && isFinite(props.anchorX) ? props.anchorX : null;
			const path = typeof props.path === "string" ? props.path : "";
			const query = typeof props.query === "string" ? props.query : "";
			const showHidden = props.showHidden === true;
			const openTarget = typeof props.openTarget === "string" ? props.openTarget : "";
			const dir = props.dir;
			const search = props.search;
			const err = props.err === null || props.err === undefined ? null : props.err;
			const probing = props.probing === true;
			const drives = Array.isArray(props.drives) ? props.drives : [];
			const desktopPath = props.desktopPath === null || props.desktopPath === undefined ? null : props.desktopPath;
			const loaded = dir !== null && dir !== undefined && dir.ok === true;
			const dirs = loaded ? (dir.dirs || []).filter((d) => showHidden || !d.hidden) : [];
			const files = loaded && fileMode ? (dir.files || []).filter((f) => showHidden || !f.hidden) : [];
			const hiddenCount = loaded ? (dir.dirs || []).filter((d) => d.hidden).length + (fileMode ? (dir.files || []).filter((f) => f.hidden).length : 0) : 0;
			const crumb = crumbPartsOf(path);
			const searching = query.trim().length > 0;
			const busy = search !== null && search !== undefined && search.busy === true;
			const hits = search !== null && search !== undefined && Array.isArray(search.items) ? search.items : [];
			// 选中态只属于当前这一屏：第一次点选中（底纹），再点一次才动作；换目录或换查询即清空。
			const [sel, setSel] = react.useState(null);
			react.useEffect(() => { setSel(null); }, [path, query]);
			const chosen = (p) => sel !== null && sel.path === p;
			const tapDir = (p, name) => { if (chosen(p)) props.onGoto(p); else setSel({ path: p, name: name, isDir: true }); };
			const tapFile = (p, name) => { if (chosen(p)) props.onPickFile({ path: p, name: name }); else setSel({ path: p, name: name, isDir: false }); };
			// 浮层贴着对话框水平居中：整张卡片 translateX，量到宽度后限幅，保证不出视口。
			// 首帧还没量到宽度时按 CSS 的 min(520px,94vw) 兜底，rAF 里再校正一次。
			const cardRef = react.useRef(null);
			const [shiftX, setShiftX] = react.useState(0);
			react.useEffect(() => {
				if (embedded) return void 0;
				const place = () => {
					try {
						if (anchorX === null) { setShiftX(0); return; }
						const vw = window.innerWidth;
						const box = cardRef.current === null ? null : cardRef.current.getBoundingClientRect();
						const cw = box !== null && box.width > 0 ? box.width : Math.min(520, vw * 0.94);
						const limit = Math.max(0, vw / 2 - cw / 2 - 12);
						const want = anchorX - vw / 2;
						setShiftX(Math.round(want > limit ? limit : want < -limit ? -limit : want));
					} catch { setShiftX(0); }
				};
				place();
				let raf = 0;
				try {
					if (typeof requestAnimationFrame === "function") raf = requestAnimationFrame(place);
					window.addEventListener("resize", place);
				} catch { /* 非浏览器环境（离线冒烟）：算一次就够 */ }
				return () => {
					try {
						if (raf !== 0 && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
						window.removeEventListener("resize", place);
					} catch { /* 同上 */ }
				};
			}, [anchorX, embedded]);
			const fileIcon = (name, isDir, expanded) => renderFileIcon(iconOf(name, isDir, expanded));
			const enterBtn = (target, title) => h("button", {
				className: "vk_rowBtn vk_browseRowEnter",
				title: title,
				onClick: (e) => { e.stopPropagation(); props.onGoto(target); }
			}, h(VIcon, { name: "folderOpen", size: 12 }));
			const goDeeper = h(VIcon, { name: "chevronRight", size: 12 });
			const rowIcon = (ic) => h("span", { className: "vk_browseRowIcon" }, ic);
			/** 一行条目：key 既是 React key 也是选中态判定的路径。 */
			const entry = (key, extraClass, title, onClick, icon, name, tail) => h("div", {
				className: "vk_browseRow" + extraClass + (chosen(key) ? " vk_browseRowSelected" : ""),
				key: key,
				title: title,
				onClick: onClick
			}, icon, h("span", { className: "vk_name" }, name), tail);
			const body = searching
				? [
					busy ? h("div", { key: "__busy", className: "vk_browseHint" }, h(VIcon, { name: "refresh", size: 12 }), "搜索中…") : null,
					...hits.map((r) => entry(r.path, "", r.path,
						() => (fileMode ? tapFile(r.path, r.name) : tapDir(r.path, r.name)),
						rowIcon(h(VIcon, { name: "folder", size: 15 })), r.name,
						h(react.Fragment, null, h("span", { className: "vk_relPath" }, r.rel), goDeeper))),
					hits.length === 0 && !busy
						? h("div", { key: "__none", className: "vk_browseHint" },
							(search !== null && search !== undefined && search.note !== null && search.note !== void 0 ? search.note : "")
							|| (fileMode ? "没有匹配的文件，试试更短的关键词" : "没有匹配的文件夹"))
						: null
				]
				: path.length === 0
					? [
						err !== null ? h("div", { key: "__err", className: "vk_browseErr" }, err) : null,
						probing === true
							? h("div", { key: "__probe", className: "vk_browseHint" }, h(VIcon, { name: "refresh", size: 12 }), "正在检测磁盘与桌面…")
							: (drives.length === 0 && desktopPath === null
								? h("div", { key: "__nodrv", className: "vk_browseHint" }, "未检测到磁盘与桌面，可点右上角刷新或在上方输入路径")
								: h("div", { key: "__roots" },
									desktopPath === null ? null : entry(desktopPath, "", desktopPath + "（本机桌面；单击选中 · 再点一次进入）",
										() => tapDir(desktopPath, "桌面"),
										rowIcon(h(VIcon, { name: "monitor", size: 15 })), "桌面",
										h(react.Fragment, null, enterBtn(desktopPath, "进入此文件夹"), goDeeper)),
									...drives.map((p) => entry(p, "", p + "（单击选中 · 再点一次进入）",
										() => tapDir(p, p),
										rowIcon(h(VIcon, { name: "hardDrive", size: 15 })), p,
										h(react.Fragment, null, enterBtn(p, "进入此盘"), goDeeper)))))
					]
					: [
						!isRootDriveOf(path)
							? h("div", { key: "__up", className: "vk_browseRow vk_browseRowUp", title: parentOfPath(path), onClick: () => props.onGoto(parentOfPath(path)) },
								rowIcon(h(VIcon, { name: "arrowUp", size: 14 })), h("span", { className: "vk_name" }, "上一级"))
							: null,
						!loaded && err === null ? h("div", { key: "__loading", className: "vk_browseHint" }, "加载中…") : null,
						...dirs.map((d) => entry(d.path, d.hidden ? " vk_browseRowHidden" : "",
							d.path + (insertMode ? "（单击选中 · 再点一次进入；选中后点「引用」插入 @引用）" : "（单击选中 · 再点一次进入）"),
							() => tapDir(d.path, d.name),
							rowIcon(fileIcon(d.name, true, false)), d.name,
							h(react.Fragment, null, enterBtn(d.path, "进入此文件夹"), goDeeper))),
						...files.map((f) => entry(f.path, " vk_browseFileRow" + (f.hidden ? " vk_browseRowHidden" : ""),
							f.path + (insertMode ? "（单击选中 · 再点一次或点「引用」插入到会话）" : "（单击选中，再点一次或点「打开」在拓展栏打开）"),
							() => tapFile(f.path, f.name),
							rowIcon(fileIcon(f.name, false, false)), f.name,
							h("span", { className: "vk_browseOpenHint" }, actWord))),
						loaded && dirs.length === 0 && files.length === 0 && hiddenCount === 0
							? h("div", { key: "__empty", className: "vk_browseHint" }, fileMode ? "该目录下没有子文件夹与文件" : "该目录下没有子文件夹")
							: null,
						loaded && hiddenCount > 0 && !showHidden
							? h("div", { key: "__hidden", className: "vk_browseRow vk_browseShowHidden", title: "显示隐藏条目", onClick: () => props.onToggleHidden() },
								h("span", { className: "vk_name" }, "⋯ " + hiddenCount + " 个隐藏项"), h(VIcon, { name: "eye", size: 12 }))
							: null
					];
			const selPath = sel !== null ? sel.path : path;
			const footText = sel !== null
				? (insertMode
					? (sel.isDir === true ? "已选中文件夹（点「引用」插入 @引用）：" : "已选中文件（点「引用」插入 @引用）：") + sel.path
					: (sel.isDir === true ? "已选中文件夹（点「打开」进入）：" : "已选中文件（点「打开」在拓展栏打开）：") + sel.path)
				: (insertMode
					? (path.length > 0 ? "单击选中文件或文件夹，再点「引用」插入到会话：" + path : "单击选中文件或文件夹，再点「引用」插入到会话")
					: (fileMode
						? (pickFolder
							? (path.length > 0 ? "单击选中条目 · 再点「打开」；未选中时打开当前目录：" + path : "单击选中条目 · 再点「打开」；未选中时打开当前目录")
							: (path.length > 0 ? "单击选中文件，再点「打开」在本标签打开：" + path : "单击选中文件，再点「打开」在本标签打开"))
						: (openTarget.length > 0 ? openTarget : (searching ? "正在搜索：单击选中目录，再点「打开」进入" : "未选择目录"))));
			const primaryTitle = sel !== null
				? (insertMode
					? "在会话中引用选中的" + (sel.isDir === true ? "文件夹 " : "文件 ") + sel.path
					: (sel.isDir === true ? "打开选中的文件夹 " : "在拓展栏打开选中的文件 ") + sel.path)
				: (openTarget.length > 0 ? "打开 " + openTarget : "");
			return h("div", {
				className: embedded ? "vk_browseEmbed" : "vk_browseOverlay",
				role: "dialog",
				"aria-modal": embedded ? void 0 : "true",
				onClick: embedded ? void 0 : (e) => { if (e.target === e.currentTarget) props.onClose(); }
			},
				h("div", {
					className: "vk_browseCard" + (embedded ? " vk_browseCardEmbed" : ""),
					ref: embedded ? void 0 : cardRef,
					style: embedded ? void 0 : { "--vk-browse-dx": shiftX + "px" }
				},
					h("div", { className: "vk_browseHead" },
						h(VIcon, { name: "folderOpen", size: 15 }),
						h("span", { className: "vk_browseTitle" }, insertMode ? "引用本机文件或文件夹" : (fileMode ? (pickFolder ? "打开文件夹 / 文件" : "打开本机文件") : "打开文件夹")),
						h("button", {
							className: "vk_iconBtn" + (showHidden ? " vk_iconBtnOn" : ""),
							title: showHidden ? "隐藏系统/配置文件" : "显示系统/配置文件（node_modules、.git 等）",
							onClick: () => props.onToggleHidden()
						}, h(VIcon, { name: showHidden ? "eyeOff" : "eye", size: 14 })),
						h("button", {
							className: "vk_iconBtn",
							title: path.length > 0 ? "重新加载当前目录" : "重新检测磁盘与桌面",
							onClick: () => { if (path.length > 0) props.onGoto(path); else props.onReload(); }
						}, h(VIcon, { name: "refresh", size: 14 })),
						h("button", { className: "vk_iconBtn", title: "关闭 (Esc)", onClick: () => props.onClose() }, h(VIcon, { name: "close", size: 14 }))),
					h("div", { className: "vk_browsePathRow" },
						h("span", { className: "vk_browsePathIcon" }, h(VIcon, { name: "search", size: 12 })),
						h("input", {
							className: "vk_pickInput",
							placeholder: fileMode ? "搜索文件名（模糊匹配；知道完整路径也可直接粘贴后回车；粘贴网址回车即开网页）" : "搜索文件夹名（模糊匹配；知道完整路径也可直接粘贴后回车）",
							value: query,
							spellCheck: false,
							autoFocus: true,
							onChange: (e) => props.onQuery(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter") {
									const v = query.trim();
									// 粘贴网址回车即在本标签开网页（只有认领了 onOpenUrl 的调用点走这条）
									if (v.length > 0 && /^https?:\/\//i.test(v) && typeof props.onOpenUrl === "function") { props.onOpenUrl(v); return; }
									if (v.length > 0 && (v.includes("\\") || v.includes("/") || /^[A-Za-z]:/.test(v))) props.onGoto(v);
								}
								if (e.key === "Escape") props.onClose();
							}
						}),
						searching
							? h("button", { className: "vk_iconBtn", title: "清除搜索，回到目录浏览", onClick: () => props.onQuery("") }, h(VIcon, { name: "close", size: 12 }))
							: null),
					crumb.length > 0
						? h("div", { className: "vk_crumbs" },
							crumb.map((c, i) => h("span", {
								key: c.path,
								className: "vk_crumb" + (i === crumb.length - 1 ? " vk_crumbCur" : ""),
								title: c.path,
								onClick: i === crumb.length - 1 ? void 0 : () => props.onGoto(c.path)
							},
								c.label,
								i < crumb.length - 1 ? h(VIcon, { name: "chevronRight", size: 11 }) : null)),
							h("span", { className: "vk_crumbsSpacer" }),
							h("button", { className: "vk_iconBtn vk_crumbsBack", title: "回到磁盘与桌面列表", onClick: () => props.onRoots() }, h(VIcon, { name: "home", size: 13 })))
						: null,
					h("div", { className: "vk_browseBody" }, body),
					h("div", { className: "vk_browseFoot" },
						h("span", { className: "vk_browseFootPath", title: selPath }, footText),
						h("button", { className: "vk_pickBtn", onClick: () => props.onClose() }, embedded ? "关闭" : "取消"),
						h("button", {
							className: "vk_pickBtn vk_primaryBtn",
							disabled: !(sel !== null || openTarget.length > 0),
							title: primaryTitle,
							onClick: () => {
								// 选中的是文件 → 走 onPickFile（插入模式下它同样是「插 @引用」）；否则把选中项
								// （可能为 null）交给 onOpen，由调用点自己解释「null = 当前所在目录」。
								if (sel !== null && sel.isDir !== true) {
									if (typeof props.onPickFile === "function") props.onPickFile({ path: sel.path, name: sel.name });
									return;
								}
								if (typeof props.onOpen === "function") props.onOpen(sel);
							}
						}, actWord)))
			);
		}
		function fileAddressFor(sessionId, cwd, path) {
			const prefix = "dsh-resource://file/session/";
			const norm = String(path === null || path === undefined ? "" : path).replace(/\\/g, "/");
			let relative = norm;
			const root = typeof cwd === "string" && cwd.length > 0 ? cwd.replace(/\\/g, "/").replace(/\/+$/, "") : "";
			if (root !== "" && relative.startsWith(root + "/")) relative = relative.slice(root.length + 1);
			const encodeSegment = (seg) => encodeURIComponent(seg).replace(/%3A/gi, ":");
			const encoded = relative.replace(/^(?:\.\/)+/, "").split("/").filter((s, i) => !(i === 0 && s === "")).map(encodeSegment).join("/");
			return prefix + encodeSegment(String(sessionId === null || sessionId === undefined ? "" : sessionId)) + "/" + encoded;
		}

		/** 文件栏镜像过来的根与列表（骨架的 vkRoots 服务；服务未就绪时给空对象，读法与旧实现一致）。 */
		const VK_EMPTY_ROOTS = { treeRoot: null, autoRoot: null, recentDirs: [], fileList: [], sessionFiles: [], sessionDirs: [] };
		function vkRootsNow() {
			try {
				const svc = ctxRef.current === null || ctxRef.current === undefined ? undefined : ctxRef.current.get("vkRoots");
				return svc !== undefined && svc !== null && svc.ref !== undefined ? svc.ref : VK_EMPTY_ROOTS;
			} catch { return VK_EMPTY_ROOTS; }
		}
		/**
		 * 本源要检索的根目录（按优先级降序，去重）：
		 * 文件栏当前根（第二轮新增，首要）→ 会话工作区根 → 常用目录 → 最近打开。
		 * 会话根同时是「相对路径」的基准，插入格式一律由 vkAtRelTo(cwd, path) 决定。
		 */
		function vkAtRoots() {
			const out = [];
			const seen = new Set();
			const push = (p) => {
				if (typeof p !== "string" || p.trim().length === 0) return;
				const v = p.trim();
				if (v.startsWith("::")) return;
				const k = normPath(v);
				if (seen.has(k)) return;
				seen.add(k);
				out.push(v);
			};
			push(vkRootsNow().treeRoot);
			push(vkAtSessionCwd());
			for (const d of HOME_DIRS) push(d.path);
			// 最近打开按会话隔离：与左栏文件栏读同一把键（会话 id 现取）
			for (const p of readRecents(vkCurrentSessionId())) push(p);
			return out;
		}
		/** 组标签：相对该根的最多两段（例：`session-002-flyback-transformer`、`…/模型文件`）。 */
		function vkAtGroupLabel(root, dir) {
			const rel = vkAtRelTo(root, dir);
			const base = rel === null ? String(dir).replace(/\\/g, "/") : rel;
			const segs = base.split("/").filter((s) => s.length > 0);
			if (segs.length === 0) return rootBaseLabel(root);
			return segs.length <= 2 ? base : "…/" + segs.slice(-2).join("/");
		}
		/** 末段名（空则回落整串）。 */
		function rootBaseLabel(dir) {
			const segs = String(dir).replace(/\\/g, "/").split("/").filter((s) => s.length > 0);
			return segs.length > 0 ? segs[segs.length - 1] : String(dir);
		}
		/**
		 * 列一个目录的**直接子项**（目录在前、文件在后，与 FileTree 的 rows() 同序）。
		 * 隐藏项过滤跟文件栏那颗「眼睛」对齐（默认关，即两边都不显示 node_modules / .git 那类条目）：
		 * 「内容一致」的口径落到这一层 —— 两边看到的是同一批条目，而展开状态各记各的。
		 */
		async function vkAtListDir(dir, signal) {
			let d = null;
			try {
				const r = await fetch("/vscode-files/list?path=" + encodeURIComponent(dir), { signal });
				d = await r.json();
			} catch { return []; }
			if (d === undefined || d === null || d.ok !== true) return [];
			const showHidden = vkFileTreeState.showHidden === true;
			const dirs = (Array.isArray(d.dirs) ? d.dirs : []).filter((x) => showHidden || x.hidden !== true);
			const files = (Array.isArray(d.files) ? d.files : []).filter((x) => showHidden || x.hidden !== true);
			return [...dirs.map((y) => ({ y: y, isDir: true })), ...files.map((y) => ({ y: y, isDir: false }))]
				.map((e) => ({ path: e.y.path, name: e.y.name, isDir: e.isDir, hidden: e.y.hidden === true }));
		}
		/**
		 * 浏览态的一屏候选（2026-09-12 第六轮）：**第一行**是「↑ 返回上一级」，
		 * 由本插件在 DOM 上给它加 vk-at-pinned 类 → CSS `position:sticky;top:0`，滚动时钉在菜单顶部
		 * （用户口径：随时能点返回）；其余是该目录的直接子项（目录在前、文件在后，与文件栏 rows() 同序）。
		 * 返回**有边界**：最多退到本次浏览的起点 vkAtBrowse.root（从 DeepSeek 进来的不能一路退到 D 盘往上）；
		 * 已经到 root 时那一行变成「⌂ 回到目录首页」，点了回落地页。
		 * @param dir - 正在浏览的目录绝对路径。
		 * @param signal - 请求取消信号。
		 * @param query - 当前 query（continue 回写 token 用）。
		 * @returns 候选数组（直接交给菜单，不经栏目折叠）。
		 */
		async function vkAtBrowseRows(dir, signal, query) {
			const cwd = vkAtSessionCwd();
			const root = vkAtBrowse.root;
			const atRoot = root === null || root === undefined || normPath(dir) === normPath(root);
			const parent = parentOfPath(dir);
			const canUp = !atRoot && typeof parent === "string" && parent.length > 0;
			// 导航行必须在**首位**：sticky 只能钉在它自己的文档位置之上，放末尾就只能钉到列表底部。
			const rows = [{
				name: canUp ? "↑ 返回上一级" : "⌂ 回到目录首页",
				description: canUp ? parent : "回到落地页",
				icon: "folder",
				section: "浏览 · " + dir,
				value: JSON.stringify({ kind: "nav", to: canUp ? parent : "", q: query })
			}];
			const list = await vkAtListDir(dir, signal);
			for (const it of list) {
				const rel = vkAtRelTo(cwd, it.path);
				const mentionPath = rel !== null ? rel : String(it.path).replace(/\\/g, "/");
				rows.push({
					name: it.name,
					description: it.path,
					icon: it.isDir === true ? "folder" : "file",
					section: "浏览 · " + dir,
					value: JSON.stringify({
						kind: "file",
						fileKind: it.isDir === true ? "directory" : "file",
						path: it.path,
						isDir: it.isDir === true,
						label: it.name,
						mention: vkAtMention(mentionPath, it.isDir === true),
						q: query
					})
				});
			}
			if (list.length === 0) {
				rows.push({ name: "（这个文件夹是空的）", section: "浏览 · " + dir, value: JSON.stringify({ kind: "info" }) });
			}
			return rows.slice(0, VK_AT_TOTAL_LIMIT);
		}
		/** 一次「@ 后输入」的检索：串行扫各个根（并发容易把 host 打满），命中即按目录分组。 */
		async function vkAtSearch(query, signal, session) {
			const cwd = vkAtSessionCwd();
			const roots = vkAtRoots();
			const q = String(query === null || query === undefined ? "" : query).toLowerCase();
			// 浏览态优先（用户点开了某个文件夹）：无论此刻输入框里有没有关键词，都显示该目录的内容 ——
			// 「再点一次进入下一级」必须真的换屏，不能还停在搜索结果上。输入关键词会退出浏览态（见 candidates）。
			if (vkAtBrowse.dir !== null) {
				const rows = await vkAtBrowseRows(vkAtBrowse.dir, signal, query);
				return { cwd: cwd, items: rows, sections: { "浏览目录": rows.length }, mode: "browse" };
			}
			if (q.length === 0) {
				// 空查询 = @ 文件区落地页：**与左栏文件栏落地页逐项对齐**（第三轮微调第四批，取代旧版
				// 「列各根的直接子项」做法——那既不是文件栏的层级，也不同步展开状态）。
				//   ① 结构：工作区目录（**只有 DeepSeek / DSHlongtasks 两条目录行本身**，不铺子项）
				//      → 最近打开（会话建议根 + 最近列表）→ 文件列表（文件栏里点过的文件）。
				//      组名就是文件栏那三个 .vk_homeLabel 的原文，字字一致。
				//   ② 层级：目录行只有**处于展开态**时才把子项接在它下面（缩进 + ▸/▾），可以一层层点进去。
				//   ③ 展开态 = 文件栏那份共享集合（vkFileTreeHas / vkFileTreeToggle）：文件栏里收起，
				//      @ 里就收起；@ 里点开，文件栏立刻跟着展开（双向，见模块顶部的 vkFileTreeState）。
				//   ④ 去重与文件栏同一套：归一化路径整树去重、先到先得（工作区目录优先于最近打开）。
				// 注：这里**不再**单独出「文件栏当前根」一组——用户口径是「一级只有那两个目录条目」；
				//     「当前根优先」只保留在检索模式（vkAtRoots 仍把 treeRoot 排第一）。
				const out = [];
				vkHomeDirsSync();
				const sections = { "工作区目录": 0, "当前会话文件": 0, "最近打开": 0, "文件列表": 0 };
				const seen = new Set();
				const seenAdd = (p) => {
					const k = normPath(p);
					if (seen.has(k)) return false;
					seen.add(k);
					return true;
				};
				/**
				 * 一条菜单条目（2026-09-12 第四轮用户口径）：
				 *   单击 = 选中（由 vkAtMarkPicked 在 DOM 上打描边高亮，候选文本本身不变 → 不重取所以不闪）；
				 *   再点同一行 = 目录打开下一级 / 文件在会话引用；回车 = 在会话引用。
				 * @param it - 条目（path / name / isDir）。
				 * @param depth - 保留参数（历史缩进用），现在一律平铺。
				 * @param section - 该行所属栏目名。
				 */
				const pushRow = (it, depth, section) => {
					const isDir = it.isDir === true;
					const rel = vkAtRelTo(cwd, it.path);
					const mentionPath = rel !== null ? rel : String(it.path).replace(/\\/g, "/");
					out.push({
						name: it.name,
						description: it.path,
						icon: isDir ? "folder" : "file",
						section: section,
						value: JSON.stringify({
							kind: "file",
							fileKind: isDir ? "directory" : "file",
							path: it.path,
							isDir: isDir,
							label: it.name,
							mention: vkAtMention(mentionPath, isDir),
							q: query
						})
					});
					sections[section] = (sections[section] === void 0 ? 0 : sections[section]) + 1;
				};
				// 注（2026-09-12 第三轮用户口径）：这里**不再内联展开**、也不进下一级 —— 目录/文件行就是可引用条目
				// （单击选中、回车引用），原先那套与文件栏共享展开态的 walk() 递归已删除；
				// 文件栏自己那份内联展开（vkFileTreeState.expanded）照旧保留、互不影响。
				// 一、工作区目录：两条**目录行本身**（一级不铺子项）
				for (const hd of HOME_DIRS) {
					if (out.length >= VK_AT_TOTAL_LIMIT) break;
					if (!seenAdd(hd.path)) continue;
					pushRow({ path: hd.path, name: hd.name, isDir: true }, 0, "工作区目录");
				}
				// 二、当前会话文件：与文件栏同位置（紧跟工作区目录）、同一份 host 采集结果。
				// 目录行点进去 = 展开（与文件栏一致），文件行照旧插入引用。
				const sessFiles = (Array.isArray(vkRootsNow().sessionFiles) ? vkRootsNow().sessionFiles : [])
					.filter((it) => it !== null && typeof it === "object" && typeof it.path === "string" && it.path.length > 0);
				for (const it of sessFiles) {
					if (out.length >= VK_AT_TOTAL_LIMIT) break;
					pushRow({ path: it.path, name: typeof it.name === "string" && it.name.length > 0 ? it.name : pathBase(it.path), isDir: false }, 0, "当前会话文件");
				}
				// 三、最近打开：文件栏那条会话建议根（autoRoot）+ **本会话贴进对话的文件夹** + 最近打开列表；
				//    工作区目录不进这一组（去重仍走同一套 seenAdd）。
				const autoRoot = typeof vkRootsNow().autoRoot === "string" && vkRootsNow().autoRoot.length > 0 ? vkRootsNow().autoRoot : null;
				/** 文件栏用 landingLabel(路径, 该目录的 list 结果) 取名（拖入收件目录显示「贴入 · 文件名」），这里照办。 */
				const recentLabel = async (p) => {
					if (!isDropInboxDir(p)) return rootBaseLabel(p);
					const list = await vkAtListDir(p, signal);
					const files = list.filter((x) => x.isDir !== true).map((x) => ({ name: x.name }));
					return dropDirLabel(p, files.length > 0 ? { ok: true, files: files } : null);
				};
				if (autoRoot !== null && !isHomeDirPath(autoRoot) && seenAdd(autoRoot)) {
					pushRow({ path: autoRoot, name: await recentLabel(autoRoot), isDir: true }, 0, "最近打开");
				}
				const sessDirs = (Array.isArray(vkRootsNow().sessionDirs) ? vkRootsNow().sessionDirs : [])
					.filter((it) => it !== null && typeof it === "object" && typeof it.path === "string" && it.path.length > 0 && !isHomeDirPath(it.path));
				for (const sd of sessDirs) {
					if (out.length >= VK_AT_TOTAL_LIMIT) break;
					if (autoRoot !== null && normPath(sd.path) === normPath(autoRoot)) continue;
					if (!seenAdd(sd.path)) continue;
					pushRow({ path: sd.path, name: typeof sd.name === "string" && sd.name.length > 0 ? sd.name : rootBaseLabel(sd.path), isDir: true }, 0, "最近打开");
				}
				for (const rp of readRecents(vkCurrentSessionId())) {
					if (out.length >= VK_AT_TOTAL_LIMIT) break;
					if (isHomeDirPath(rp)) continue;
					if (autoRoot !== null && normPath(rp) === normPath(autoRoot)) continue;
					if (!seenAdd(rp)) continue;
					pushRow({ path: rp, name: await recentLabel(rp), isDir: true }, 0, "最近打开");
				}
				// 四、文件列表：**文件**（不是某个目录的直接子项），单独成一组直接给条目
				const listed = (Array.isArray(vkRootsNow().fileList) ? vkRootsNow().fileList : [])
					.filter((it) => it !== null && typeof it === "object" && typeof it.path === "string" && it.path.length > 0);
				for (const it of listed) {
					if (out.length >= VK_AT_TOTAL_LIMIT) break;
					pushRow({
						path: it.path,
						name: typeof it.name === "string" && it.name.length > 0 ? it.name : pathBase(it.path),
						isDir: false
					}, 0, "文件列表");
				}
				// 五、对话：条目**原样复用官方源那一份**（value 与 option 文案都不动，插入语义因此与官方逐字一致），
				// 只把 section 统一成「对话」，好让本源把它当成一个可折叠的栏目统一处理。
				const sessionCands = await vkAtSessionItems(session, signal);
				if (Array.isArray(sessionCands)) {
					for (const c of sessionCands) {
						if (out.length >= VK_AT_TOTAL_LIMIT) break;
						if (c === null || c === undefined) continue;
						out.push({ ...c, section: "对话" });
						sections["对话"] = (sections["对话"] === void 0 ? 0 : sections["对话"]) + 1;
					}
				}
				// 栏目折叠（2026-09-11 用户要求）：默认每栏只出一行「▸ 栏目（N 条）」，点开才铺内容。
				return { cwd, items: vkAtCollapseSections(out, query), sections: sections, mode: "toplevel" };
			}
			const groups = new Map();
			let total = 0;
			for (const root of roots) {
				if (signal !== undefined && signal.aborted) break;
				if (total >= VK_AT_ITEM_LIMIT) break;
				// 以前这里会跳过「会话工作区根本身」（那批文件交给官方源覆盖，免得菜单里出现两份）。
				// 现在官方源的「文件与文件夹」一节已被定向摘掉（见 vkPatchOfficialAtSource），会话根不再有人覆盖，
				// 必须自己搜——否则最常用的那个根（会话工作区）在 @ 里一条都搜不到。
				let items = [];
				try {
					const r = await fetch("/vscode-files/search?path=" + encodeURIComponent(root) + "&q=" + encodeURIComponent(query), { signal });
					const d = await r.json();
					if (d !== undefined && d !== null && d.ok === true && Array.isArray(d.results)) items = d.results;
				} catch { continue; }
				for (const it of items) {
					if (total >= VK_AT_ITEM_LIMIT) break;
					const path = String(it.path);
					const dir = path.slice(0, Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/")));
					const key = normPath(dir);
					let g = groups.get(key);
					if (g === void 0) {
						g = { dir: dir, root: root, label: vkAtGroupLabel(root, dir), items: [] };
						groups.set(key, g);
					}
					g.items.push({ name: it.name, path: path, rel: typeof it.rel === "string" ? it.rel : vkAtRelTo(root, path), isDir: false });
					total += 1;
				}
			}
			const list = [...groups.values()];
			for (const g of list) {
				g.items = g.items
					.map((it) => ({ it: it, s: vkAtScore(it.name, it.rel === null ? it.name : it.rel, q) }))
					.filter((x) => x.s !== null)
					.sort((x, y) => x.s - y.s)
					.map((x) => x.it);
			}
			// 组间连续：同目录的条目始终排在一起，section 头不重复出现；组顺序按各组最佳命中
			const nonEmpty = list.filter((g) => g.items.length > 0);
			nonEmpty.sort((x, y) => vkAtScore(x.items[0].name, x.items[0].rel, q) - vkAtScore(y.items[0].name, y.items[0].rel, q));
			return { cwd, groups: nonEmpty, query: q };
		}
		/** 把一组命中转成菜单条目（含「展开更多」）。groupLimit 是「跨组公平」后本组能占的条数。 */
		function vkAtGroupItems(cwd, group, q, groupLimit) {
			const key = normPath(group.dir);
			const expanded = vkAtExpanded.has(key);
			const cap = expanded ? VK_AT_GROUP_MAX : Math.max(1, groupLimit);
			const shown = Math.min(cap, group.items.length);
			const out = [];
			// 组标题：**只管检索模式**——落地页（空查询）现在由 vkAtSearch 直接产出条目（见那里的 ①-④），
			// 不再经过这个函数。检索模式的组标签一律「本机常用目录 · <目录相对路径>」。
			const head = typeof group.section === "string" && group.section.length > 0 ? group.section : VK_AT_SECTION;
			const sectionText = group.label === head ? head : head + " · " + group.label;
			for (const it of group.items.slice(0, shown)) {
				const rel = vkAtRelTo(cwd, it.path);
				// 会话根内写相对路径（官方约定），根外退回绝对斜杠路径
				const mentionPath = rel !== null ? rel : String(it.path).replace(/\\/g, "/");
				out.push({
					name: it.name,
					description: group.label,
					icon: it.isDir === true ? "folder" : "file",
					section: sectionText,
					value: JSON.stringify({ kind: "file", fileKind: it.isDir === true ? "directory" : "file", path: it.path, isDir: it.isDir === true, label: it.name, mention: vkAtMention(mentionPath, it.isDir === true), q: q })
				});
			}
			if (group.items.length > shown) {
				out.push({
					name: "展开更多（本目录还有 " + (group.items.length - shown) + " 条）",
					description: group.label,
					section: sectionText,
					value: JSON.stringify({ kind: VK_AT_EXPAND_TAG, group: key, q: q })
				});
			}
			return out;
		}
		/**
		 * 把落地页条目按栏目折叠（2026-09-11 用户要求：栏目可折叠、默认折叠，且形态与文件栏对齐）。
		 * 与文件栏同一套形态：**栏目头永远在内容上方**，点它 = 收起 / 展开。
		 *   · 收起：`▸ 对话（12 条）`
		 *   · 展开：`▾ 对话（12 条）` + 紧随其后的条目（条目一律去掉 section 字段，
		 *     否则官方会在下面再渲染一个同名 section 标题，变成「两层标题」；内容行再加一个全角空格
		 *     的缩进，看起来才像挂在这一栏下面）。
		 * 展开态记在模块级 vkSectionState（跨查询保留，刷新即复位）。
		 */
		function vkAtCollapseSections(items, query) {
			const out = [];
			let i = 0;
			while (i < items.length) {
				const sec = items[i].section;
				if (typeof sec !== "string" || sec.length === 0) {
					out.push(items[i]);
					i += 1;
					continue;
				}
				const group = [];
				while (i < items.length && items[i].section === sec) {
					group.push(items[i]);
					i += 1;
				}
				const open = vkSectionIsOpen(sec);
				const value = JSON.stringify({ kind: VK_AT_SECTION_TAG, section: sec, q: query });
				out.push({
					name: (open ? "\u25BE " : "\u25B8 ") + sec + "（" + group.length + " 条）",
					description: "",
					value: value
				});
				if (open) for (const it of group) out.push({ ...it, section: void 0, name: "\u3000" + (typeof it.name === "string" ? it.name : "") });
			}
			return out;
		}
		/** 官方插入语法：`@路径`；含空格用 `@"路径"`（与官方 formatFileMention 同规则，目录带尾斜杠）。 */
		function vkAtMention(mentionPath, isDir) {
			const p = String(mentionPath) + (isDir === true ? "/" : "");
			return /[\s"]/.test(p) ? '@"' + p + '"' : "@" + p;
		}
		/**
		 * 「对话」栏（2026-09-11 用户要求：@ 里会话栏目也要折叠）。
		 * 官方 reference 源的会话条目点击走它自己的 onPick，我们拦不到 → 做不出「点标题展开」的栏目行。
		 * 但本插件**没有注入 typert registry**，`ctx.remote.sessionReferenceResolver` 用不了
		 * （实测 `ctx.remote` 不存在）。所以改走一条更稳的路：patch 官方源时留存它的**原始 candidates**，
		 * 由本源直接调用它拿会话条目（含官方生成的 mention），条目原样复用、只换一个可以折叠的 section。
		 * 拿不到（patch 未生效 / 调用失败）时返回 null：本源不出「对话」栏，官方那节保留，功能绝不回退。
		 */
		let vkOfficialAtSource = null; // 官方 reference 源对象
		let vkOfficialAtCandidates = null; // 它的原始 candidates
		let vkSessionPool = []; // 官方会话条目缓存（orig 调用失败时的兜底）
		async function vkAtSessionItems(session, signal) {
			// 每次都向官方源要最新列表（pool 只在官方源拿不到时兜底，避免 @ 里永远是旧会话）。
			if (typeof vkOfficialAtCandidates !== "function") return vkSessionPool.length > 0 ? vkSessionPool : null;
			try {
				const items = await vkOfficialAtCandidates.call(vkOfficialAtSource, session, {
					query: "", quoted: false, drilled: false, signal: signal
				});
				if (!Array.isArray(items)) return vkSessionPool.length > 0 ? vkSessionPool : null;
				const sess = items.filter((it) => {
					if (it === null || it === undefined || typeof it.value !== "string") return false;
					try { return JSON.parse(it.value).kind === "session"; } catch { return false; }
				});
				if (sess.length > 0) vkSessionPool = sess;
				return sess;
			} catch { return vkSessionPool.length > 0 ? vkSessionPool : null; }
		}
		/**
		 * 构建 @ 扩域源对象（供 inputTriggers.registerSource）。
		 * @returns 源定义。
		 */
		/**
		 * 哪些候选在官方菜单里带 `drill: true`（那颗独立小箭头）。
		 *
		 * 2026-09-30 重定：**只给「什么都不插入、只换一屏」的行**（栏目行 / 展开更多 / 返回上一级）。
		 * 目录行与文件行不再带 drill —— 点整行就是官方的 settling pick（插入引用），一次点击到位；
		 * 想展开目录走那颗小箭头（官方 drill 通道，返回 continue 保持菜单开）。
		 *
		 * 为什么以前给目录行也标 drill：那时靠「点行展开」的拦截方案，需要让箭头出现提示可展开；
		 * 但那条链路（mousedown 拦截 + 写回同文本触发重扫）依赖太多内部行为，一直只推进一点点。
		 */
		function vkAtNeedsDrill(item) {
			if (item === null || typeof item !== "object") return false;
			// 栏目行 / 展开更多目录 / 目录行的旧形态 / 展开-收起：这些点了不插入内容，只换一屏
			const label = String(item.label === undefined ? item.name || "" : item.label);
			if (label.indexOf(VK_AT_SECTION) >= 0) return true;
			if (label.indexOf("展开更多") >= 0) return true;
			const raw = typeof item.value === "string" ? item.value : "";
			if (raw.length === 0) return false;
			if (raw.indexOf(VK_AT_SECTION_TAG) >= 0) return true;
			if (raw.indexOf(VK_AT_EXPAND_TAG) >= 0) return true;
			if (raw.indexOf(VK_AT_MORE_TAG) >= 0) return true;
			if (raw.indexOf(VK_AT_ROW_TAG) >= 0) return true;
			// 官方风格目录行：{kind:"file", fileKind:"directory"}（dsh-client-ui-reference 就这样标）
			return raw.indexOf("\"fileKind\":\"directory\"") >= 0 || raw.indexOf("\"directory\"") >= 0;
		}
		/**
		 * 零宽空格：让「返回同一段 @ 文本」在官方看来**真的变了**。
		 *
		 * 官方 `onEditorUpdate()` → `inputTriggers.track()` 里有一条 `same` 短路：草稿文本与 span
		 * 都没变就 return，**不会重取候选**。我们以前把 `@<query>` 原样写回，于是菜单列表纹丝不动
		 * （用户看到的「点了没反应」）。官方 `insertText` 走的是 `span.draftRev` CAS，
		 * 只要求「替换成功」——所以文本里带一个不可见字符即可，扫描时再剥掉。
		 */
		const VK_AT_ZWSP = "\u200B";
		/** 本轮回写用不用带零宽空格：每次翻转，保证相邻两次文本一定不同。 */
		let vkAtZwspOn = false;
		/** 剥掉所有的零宽空格（query 与回写文本都走它，保证扫描/匹配只看用户真正打的内容）。 */
		function vkAtStripZwsp(text) {
			return String(text === null || text === undefined ? "" : text).split(VK_AT_ZWSP).join("");
		}
		/** 回写 token 的文本：始终带上与上一轮不同的零宽空格后缀（见上）。 */
		function vkAtRedraftText(query) {
			vkAtZwspOn = !vkAtZwspOn;
			return "@" + vkAtStripZwsp(query) + (vkAtZwspOn ? VK_AT_ZWSP : "");
		}
		function vkAtSourceDefinition() {
			return {
				trigger: "@",
				name: "vk-extended",
				order: 70,
				showGroupTitle: false,
				async candidates(session, req) {
					// 零宽空格只用于让官方「看到变化」，搜索与匹配一律用剥掉之后的查询
					const query = vkAtStripZwsp(req.query === null || req.query === undefined ? "" : req.query);
					// 换了关键词 = 换了一屏内容：选中态作废、并退出目录浏览态（回到搜索结果那一屏）；
					// 否则回车可能引用已经不在列表里的旧条目、或搜索打字没反应。
					if (vkAtBrowse.q !== query) {
						vkAtBrowse.q = query;
						vkAtBrowse.sel = null;
						vkAtBrowse.selEntry = null;
						vkAtBrowse.mousePick = null;
						vkAtBrowse.dir = null;
						vkAtBrowse.root = null;
						vkAtClearPicked();
					}
					// 带斜杠的查询是「钻进目录」的路径式查询，交给官方源（它按目录列实时状态）
					if (query.includes("/") || query.includes("\\")) return [];
					const found = await vkAtSearch(query, req.signal, session);
					if (req.signal !== undefined && req.signal.aborted) return [];
					// 落地页（空查询）：候选由 vkAtSearch 一次算好（文件栏落地页的镜像：顺序、层级、
					// 展开态都按文件栏那份共享状态），不走下面的「跨组公平配额」——那套是给检索结果用的。
					if (Array.isArray(found.items)) {
						globalThis.__VK_AT_LAST__ = {
							at: new Date().toISOString(), query: query, cwd: found.cwd, roots: vkAtRoots(),
							treeRoot: vkRootsNow().treeRoot,
							groups: Object.keys(found.sections === void 0 ? {} : found.sections).map((k) => ({ dir: "::" + k, label: k, n: found.sections[k] })),
							shown: found.items.length, drilled: vkAtShowAllGroups,
							expandedDirs: [...vkFileTreeState.expanded],
							hits: found.items.length, mode: "toplevel"
						};
						return found.items.slice(0, VK_AT_TOTAL_LIMIT);
					}
					// ── 以下为检索模式（query 非空）─────────────────────────────────
					// 跨组公平：先每组给 2 条铺开各目录，剩余配额按组顺序补到 VK_AT_GROUP_LIMIT；
					// 组数很多时也不会只剩某一个目录的条目。展开过的组单独放开（见 vkAtGroupItems）。
					//
					// 组数上限：命中散落在很多备份/版本目录时（实测 DSHlongtasks 下十几个 backups/vN/workspace），
					// 一次只列 VK_AT_GROUP_SHOW 个目录，尾部给一行「展开更多目录」，点开后放到
					// VK_AT_GROUP_SHOW_MAX 个——所以「@ 打开」永远是一屏可读，绝不会一次铺开几千条。
					const allGroups = Array.isArray(found.groups) ? found.groups : [];
					const drilled = vkAtShowAllGroups;
					const showGroups = drilled ? VK_AT_GROUP_SHOW_MAX : VK_AT_GROUP_SHOW;
					const groups = allGroups.slice(0, showGroups);
					globalThis.__VK_AT_LAST__ = {
						at: new Date().toISOString(), query: query, cwd: found.cwd, roots: vkAtRoots(),
						treeRoot: vkRootsNow().treeRoot,
						groups: allGroups.map((g) => ({ dir: g.dir, label: g.label, n: g.items.length })),
						shown: groups.length, drilled: drilled, expandedDirs: [...vkAtExpanded],
						hits: allGroups.reduce((n, g) => n + g.items.length, 0), mode: "search"
					};
					const quota = groups.map(() => 2);
					let used = groups.reduce((n, g) => n + Math.min(2, g.items.length), 0);
					for (let i = 0; i < groups.length; i += 1) {
						while (quota[i] < VK_AT_GROUP_LIMIT && used < VK_AT_TOTAL_LIMIT && quota[i] < groups[i].items.length) {
							quota[i] += 1;
							used += 1;
						}
					}
					const out = [];
					for (let i = 0; i < groups.length; i += 1) {
						if (out.length >= VK_AT_TOTAL_LIMIT) break;
						out.push(...vkAtGroupItems(found.cwd, groups[i], query, quota[i]));
					}
					if (allGroups.length > groups.length && out.length < VK_AT_TOTAL_LIMIT) {
						out.push({
							name: "展开更多目录（还有 " + (allGroups.length - groups.length) + " 个目录命中）",
							description: "本机常用目录",
							section: VK_AT_SECTION + " · 更多目录",
							value: JSON.stringify({ kind: VK_AT_MORE_TAG, q: query })
						});
					}
					return out.slice(0, VK_AT_TOTAL_LIMIT);
				},
				// 不再发布 header（crumbs）：旧版那条「文件栏里的根目录」面包屑在新落地页里是多余的一行——
				// 三组内容已由 section 标题（工作区目录 / 最近打开 / 文件列表）自报家门，且文件栏里没有对应物。
				onPick({ candidate, action, via }) {
					let value = null;
					try { value = JSON.parse(candidate.value); } catch { return void 0; }
					if (value === null || value === void 0) return void 0;
					// 链路痕迹：一次点击走了哪条分支、回写的 token 长什么样（CDP 一条表达式读全）
					const trace = (branch, extra) => {
						try {
							globalThis.__VK_AT_PICK__ = Object.assign({
								at: new Date().toISOString(),
								action: action === undefined ? "pick" : action,
								via: via === undefined ? "?" : via,
								kind: value.kind,
								branch: branch,
								q: vkAtRestoreText,
								zwsp: vkAtZwspOn
							}, extra === undefined ? {} : extra);
						} catch { /* 痕迹只给取证用 */ }
					};
					// ① 浏览态末尾的「↑ 返回上一级 / ⌂ 回到目录首页」（有边界：最多退到本次起点 vkAtBrowse.root）
					if (value.kind === "nav") {
						vkAtBrowse.dir = typeof value.to === "string" && value.to.length > 0 ? value.to : null;
						if (vkAtBrowse.dir === null) vkAtBrowse.root = null;
						vkAtBrowse.sel = null;
						vkAtBrowse.selEntry = null;
						vkAtBrowse.mousePick = null;
						vkAtClearPicked();
						vkAtRestoreText = String(value.q === null || value.q === undefined ? "" : value.q);
						trace("redraft"); return { text: vkAtRedraftText(vkAtRestoreText), continue: true };
					}
					// ② 条目行：单击 = 选中（描边高亮，菜单不关、不插入）；同一行再点一次 = 目录进下一级 / 文件插入引用
					if (value.kind === "file") {
						const p = String(value.path === null || value.path === undefined ? "" : value.path);
						const isDir = value.fileKind === "directory" || value.isDir === true;
						const insertOf = (v) => ({ insert: {
							source: "reference",
							ref: v.mention,
							label: v.label,
							appearance: v.isDir === true || v.fileKind === "directory" ? "folder" : "file",
							clipboardText: v.mention
						} });
						const restore = () => {
							vkAtRestoreText = String(value.q === null || value.q === undefined ? "" : value.q);
							return { text: vkAtRedraftText(vkAtRestoreText), continue: true };
						};
						// 点小箭头（drill）= 展开这一级目录：菜单保持打开，列表换成该目录内容
						if (action === "drill" && isDir) {
							if (vkAtBrowse.root === null) vkAtBrowse.root = p; // 记起点：「返回上一级」不越过它
							vkAtBrowse.dir = p;
							vkAtBrowse.sel = null;
							vkAtBrowse.selEntry = null;
							vkAtClearPicked();
							trace("redraft"); return restore();
						}
						// 鼠标「在同一行上的第二次点击」才会被 mousedown 拦截留下 mousePick 标记。
						// **不能看 via**：官方 settle() 里 via 恒为 "menu"（回车触发的 pick 也是它），
						// 早先按 via 判断导致「选中后回车 = 打开了文件夹」。
						const byMouse = p.length > 0 && vkAtBrowse.mousePick !== null && normPath(vkAtBrowse.mousePick) === normPath(p);
						vkAtBrowse.mousePick = null;
						if (!byMouse) {
							// 回车（以及其它不是「鼠标再点一次」的途径）= 在会话引用：
							// 有选中项就引用选中项（避免与官方「高亮项」错位），没有则引用当前这一条。
							vkAtClearPicked();
							trace("insert"); return insertOf(vkAtBrowse.selEntry !== null ? vkAtBrowse.selEntry : value);
						}
						// 已选中的目录再点一次（鼠标）：打开下一级（整份列表替换成该文件夹的内容）
						if (isDir) {
							if (vkAtBrowse.root === null) vkAtBrowse.root = p;
							vkAtBrowse.dir = p;
							vkAtBrowse.sel = null;
							vkAtBrowse.selEntry = null;
							vkAtClearPicked();
							trace("redraft"); return restore();
						}
						// 已选中的文件再点一次（鼠标）：在会话引用
						vkAtClearPicked();
						trace("insert"); return insertOf(value);
					}
					// 目录行的旧形态（VK_AT_ROW_TAG）：点小箭头展开那一级
					if (value.kind === VK_AT_ROW_TAG || (value.dirRow === true && action === "drill")) {
						const dir = String(value.dir === undefined ? value.path || "" : value.dir);
						if (action === "drill" && dir.length > 0) {
							if (vkAtBrowse.root === null) vkAtBrowse.root = dir;
							vkAtBrowse.dir = dir;
						}
						vkAtRestoreText = String(value.q === null || value.q === undefined ? "" : value.q);
						trace("redraft"); return { text: vkAtRedraftText(vkAtRestoreText), continue: true };
					}
					if (value.kind === "session") {
						// 会话引用：与官方 reference 源的 onPick 逐字一致（条目本身也是官方原样复制过来的）。
						return { insert: {
							source: "reference",
							ref: value.mention,
							label: value.label,
							appearance: "session",
							clipboardText: value.mention
						} };
					}
					if (value.kind === VK_AT_SECTION_TAG) {
						// 栏目折叠 / 展开（2026-09-11）：与「展开更多」同一套 continue 机制——
						// token 文本必须原样写回（官方 insertText 是「替换 span」，空串会被判失败 → 菜单关闭）。
						const nowOpen = vkSectionToggle(value.section);
						try {
							const trace = globalThis.__VK_AT_LAST__;
							if (trace !== undefined && trace !== null) trace.section = { name: value.section, nowOpen: nowOpen };
						} catch { /* 痕迹只给 CDP 取证用 */ }
						vkAtRestoreText = String(value.q === null || value.q === undefined ? "" : value.q);
						trace("redraft"); return { text: vkAtRedraftText(vkAtRestoreText), continue: true };
					}
					if (value.kind === VK_AT_EXPAND_TAG) {
						vkAtExpanded.add(value.group);
						// 把 token 原样写回（官方 insertText 是「替换 span」，文本必须与原样一致才算应用成功；
						// 给空串会被判失败 → 菜单关掉并复位。实测踩过），continue 让菜单继续开着重新取候选
						vkAtRestoreText = String(value.q === null || value.q === undefined ? "" : value.q);
						trace("redraft"); return { text: vkAtRedraftText(vkAtRestoreText), continue: true };
					}
					if (value.kind === VK_AT_MORE_TAG) {
						vkAtShowAllGroups = true;
						vkAtRestoreText = String(value.q === null || value.q === undefined ? "" : value.q);
						trace("redraft"); return { text: vkAtRedraftText(vkAtRestoreText), continue: true };
					}
					// 其余 kind（理论上不该出现）→ 无动作
					return void 0;
				},
				codec: {
					clipboardText: (ref) => ref,
					serialize: (ref) => Promise.resolve(ref)
				}
			};
		}
		/**
		 * 官方 @ 源（name="reference"，由 @deepseek-ai/dsh-client-ui-reference 注册）的**定向改造**：
		 *   ① 去掉它的「文件与文件夹」一节 —— 文件区只留自研那套「与文件栏逐项对齐」的镜像；
		 *   ② 它那一节里的「对话」（@ 某个会话）**保留**，只是排到菜单最下面（order 调到最大）。
		 *
		 * 为什么是「包一层 candidates + 改 order」而不是从 live.sources 里摘掉整个源：
		 *   官方这一个源同时产出两种条目（实测 27 条 = 22 条 kind:"file" 的文件夹/文件 + 5 条 kind:"session" 的会话），
		 *   而**插入引用**这条路（`slash/input-insert-reference`）与 @ chip 的渲染都挂在它身上 —— 整个摘掉会把
		 *   自研的 `{insert:{source:"reference"}}` 一起弄坏。所以只过滤条目、不碰 onPick / codec / header。
		 *   过滤判据用 **value 里的 kind==="file"**（不看 section 文案，locale 无关，也不怕官方改中文标题）。
		 * 官方源可能比自研晚注册，所以和自研注册一样用「轻量轮询」等它出现（最多 VK_AT_REGISTER_TRIES 次）。
		 */
		const VK_AT_REF_ORDER = 900;
		/** 官方源「对话」一节在空查询落地页的首屏条数上限（2026-09-11 用户要求不再一次铺开几十条）。 */
		const VK_AT_REF_SESSION_KEEP = 8;
		function vkPatchOfficialAtSource(ctx) {
			let tries = 0;
			const retry = () => {
				tries += 1;
				if (tries >= VK_AT_REGISTER_TRIES) {
					globalThis.__VK_AT_REF__ = { stage: "no-source", tries: tries };
					return;
				}
				try { setTimeout(attempt, VK_AT_REGISTER_INTERVAL); } catch { /* 无定时器环境：放弃 */ }
			};
			const attempt = () => {
				let list = null;
				try {
					const service = ctx.get("inputTriggers");
					if (service !== void 0 && service.live !== void 0 && Array.isArray(service.live.sources)) list = service.live.sources;
				} catch { list = null; }
				if (list === null) { retry(); return; }
				const src = list.find((s) => s !== null && s !== undefined && s.name === "reference" && s.trigger === "@");
				if (src === undefined) { retry(); return; }
				if (src.__vkPatched === true) return;
				try {
					src.__vkPatched = true;
					const orig = src.candidates;
					src.__vkOrigOrder = src.order;
					src.order = VK_AT_REF_ORDER;
					// 本源要复用官方 candidates 取「对话」栏条目（本插件拿不到 ctx.remote），这里先留存引用。
					vkOfficialAtSource = src;
					vkOfficialAtCandidates = orig;
					src.candidates = async function vkPatchedAtCandidates(session, req) {
						const items = await orig.call(this, session, req);
						if (!Array.isArray(items)) return items;
						// 2026-09-29 用户口径：@ 列表**只留自研那套栏目**（本机文件搜索 / 工作区目录 /
						// 最近打开 / 对话），官方源的「文件与文件夹」一节整节摘掉 —— 用户截图里它和自研的
						// 「工作区目录」在列同一批目录，重复；而自研本源自带「点文件夹进下一级 + 面包屑 +
						// 按关键词全根搜索」，官方的 drill 行为由它顶上。判据用 value 里的 kind==="file"
						// （不看 section 文案，locale 无关，也不怕官方改中文标题）。
						const sess = [];
						const kept = items.filter((it) => {
							if (it === null || it === undefined || typeof it.value !== "string") return true;
							try {
								const kind = JSON.parse(it.value).kind;
								if (kind === "session") { sess.push(it); return false; }
								if (kind === "file") return false;
								return true;
							} catch { return true; }
						});
						if (sess.length > 0 && vkSessionPool.length === 0) vkSessionPool = sess;
						// 2026-09-11（「栏目默认可收起」的官方侧折中）：官方源的「对话」一节随会话数无限增长
						// （实测一次 50 条），而它的条目不带 section、点击走官方 onPick（我们拦不到，做不出
						// 「点标题展开」的栏目行）。这里只在**空查询落地页**收敛首屏条数，让 @ 一打开不再铺满；
						// 输入关键词检索时不受影响，全量照旧（官方自己的按关键词过滤）。
						// 2026-09-29：会话已全部摘进 vkSessionPool、kind:"file" 已整节过滤，kept 到这里基本
						// 只剩官方其余零散条目；下面这段截断留着当兜底，不再影响自研栏目的呈现。
						const q = vkAtStripZwsp(req !== null && req !== undefined && req.query !== null && req.query !== undefined ? req.query : "");
						if (q.length > 0 || kept.length <= VK_AT_REF_SESSION_KEEP) return kept;
						return kept.slice(0, VK_AT_REF_SESSION_KEEP);
					};
					globalThis.__VK_AT_REF__ = { stage: "patched", at: new Date().toISOString(), order: VK_AT_REF_ORDER };
				} catch (e) {
					globalThis.__VK_AT_REF__ = { stage: "throw", error: String(e && e.message ? e.message : e) };
				}
			};
			attempt();
		}
		/**
		 * 把 @ 扩域源挂到官方 inputTriggers 上。
		 *
		 * 不写进 inject 数组（那会让整条插件依赖它；万一该服务缺失，整套布局会连带不上）。
		 * 改为：立刻试一次，没就绪就轻量轮询（最多 VK_AT_REGISTER_TRIES 次、每次 VK_AT_REGISTER_INTERVAL 毫秒），
		 * 拿到服务就注册并留一条痕迹（__VK_AT_SOURCE__）供 CDP 取证。
		 * @param ctx - 插件 ctx。
		 */
		const VK_AT_REGISTER_TRIES = 40;
		const VK_AT_REGISTER_INTERVAL = 500;
		/**
		 * @ 菜单关闭时**只复位 @ 菜单自己那一族状态**（2026-09-11 口径：默认折叠、不跨次记忆）：
		 *   ① vkSectionState —— @ 落地页的栏目折叠；
		 *   ② vkAtBrowse     —— @ 菜单的选中/浏览态（单击选中的那一行、钻进的目录）。
		 *
		 * ⚠️ 2026-09-13 按用户口径**彻底解绑**（原话：让 @ 列表与文件栏分离，两边只是内容一致）：
		 * 这里**不再碰左栏文件栏的任何状态** —— 既不碰文件树展开集（早已去掉），
		 * 也不再碰 `vkHomeState`（左栏落地页栏目折叠）。此前那句 `vkHomeReset("at-menu-close")` 就是
		 * 「点一次工作区目录、250ms 后被折回」的直接原因：菜单从没打开过，这个观察器也照样判定「菜单刚关」。
		 *
		 * 官方菜单是它自己的 React 树，我们插不进去，所以用 DOM 侧观察：菜单节点消失即复位。
		 * 另外要求「本次确实见过菜单打开」（sawMenuOpen），没见过就不许判定它关闭。
		 */
		function vkInstallAtMenuReset() {
			let timer = null;
			/** 菜单真的在这次会话里出现过（只有它才能把「菜单不在」解释成「菜单刚关」）。 */
			let sawMenuOpen = false;
			/** @ 菜单自己那族还有没有需要复位的展开态（全都没开就直接跳过，避免每次 DOM 变动都进防抖）。 */
			const anyOpen = () => vkSectionState.open !== null
				|| vkAtBrowse.dir !== null
				|| vkAtBrowse.sel !== null;
			const menuPresent = () => document.querySelector("[data-trigger-menu]") !== null;
			try {
				const obs = new MutationObserver(() => {
					if (menuPresent()) { sawMenuOpen = true; return; }
					if (!sawMenuOpen) return; // 菜单没开过 → 「没有菜单节点」不构成「菜单关闭」
					if (!anyOpen()) return;
					// 防抖 250ms：continue 重取候选时官方菜单会短暂重挂载，不能把那次当成「菜单已关闭」。
					if (timer !== null) return;
					timer = setTimeout(() => {
						timer = null;
						if (menuPresent()) return;
						sawMenuOpen = false;
						vkSectionState.open = null;
						for (const fn of [...vkSectionState.subs]) { try { fn(null); } catch { /* 订阅方可能已卸载 */ } }
						vkAtBrowse.sel = null;
						vkAtBrowse.selEntry = null;
						vkAtBrowse.mousePick = null;
						vkAtBrowse.dir = null;
						vkAtBrowse.root = null;
						vkAtClearPicked();
						// 左栏文件栏（vkHomeState / vkFileTreeState）一概不动：与 @ 列表完全解绑。
					}, 250);
				});
				obs.observe(document.body, { childList: true, subtree: true });
			} catch { /* 非浏览器环境：跳过 */ }
		}
		function vkRegisterAtSource(ctx) {
			let tries = 0;
			let done = false;
			const attempt = () => {
				if (done) return;
				let service;
				try { service = ctx.get("inputTriggers"); } catch { service = void 0; }
				if (service !== void 0 && typeof service.registerSource === "function") {
					done = true;
					try {
						// 包一层 candidates：把本屏候选原样留一份，供 mousedown 拦截时
						// 按官方 option 的行号（dsh-slash-option-<source>-<index>）取回自己那条的 value。
						const def = vkAtSourceDefinition();
						const origCandidates = def.candidates;
						def.candidates = async (session, req) => {
							const items = await origCandidates.call(def, session, req);
							if (!Array.isArray(items)) return items;
							vkAtLastItems = items;
							// DOM 还没渲染完，等一帧再补「选中描边 / 顶部钉住」（重取后 React 会重建整行）
							try {
								requestAnimationFrame(() => { vkAtSyncPicked(); vkAtSyncPinnedNav(); });
							} catch { /* 无 rAF 环境：靠 MutationObserver 兜底 */ }
							// 官方 pick 的判据是候选对象上的 `drill === true`：带上它，行尾才会出现那颗
							// 「展开/进入下一级」的小箭头（走官方 drill 通道，菜单保持打开）。
							return items.map((it) => (vkAtNeedsDrill(it) ? Object.assign({}, it, { drill: true }) : it));
						};
						service.registerSource(def);
						globalThis.__VK_AT_SOURCE__ = { stage: "ok", at: new Date().toISOString(), roots: vkAtRoots() };
						// 顺手把官方 @ 源的「文件与文件夹」一节定向摘掉、会话一节排到最后（见上）
						vkPatchOfficialAtSource(ctx);
						// 菜单关掉后栏目回到全折叠，不跨次记忆（见 vkInstallAtMenuReset）
						vkInstallAtMenuReset();
						// 单击选中的描边高亮：捕获阶段记住被点的那一行（见 vkInstallAtPickHighlight）
						vkInstallAtPickHighlight();
					} catch (e) {
						globalThis.__VK_AT_SOURCE__ = { stage: "throw", error: String(e && e.message ? e.message : e) };
					}
					return;
				}
				tries += 1;
				if (tries >= VK_AT_REGISTER_TRIES) {
					globalThis.__VK_AT_SOURCE__ = { stage: "no-service", tries };
					return;
				}
				try { setTimeout(attempt, VK_AT_REGISTER_INTERVAL); } catch { /* 无定时器环境：放弃 */ }
			};
			attempt();
		}


		/**
		 * 在官方右侧栏多标签里打开一个地址。
		 * **不传 kind**：让官方 sidebarRightTabs 注册表按优先级打分挑类型——自研类型是 extension 段且只认
		 * Office / http(s)（canOpen 会拒绝别的），其余地址自然落到官方 viewer（文本高亮 / 图片 / PDF / Markdown）。
		 * 实测教训：传了 kind 就等于「强制该类型」，它的 canOpen 一拒绝就抛
		 * `tab type "anoslide.view" refuses "<address>"`——分发必须交给注册表。
		 */
		function vkOpenInViewer(ctx, address) {
			// 自报告痕迹：浏览器控制台执行 `__VK_LAST_OPEN__` 即可看到「最后一次点击文件」走了哪条路、
			// 拿到的地址与控制台服务状态。客户端 logger 不进 DevTools console，靠日志排查是白费功夫（实测）。
			try {
				globalThis.__VK_LAST_OPEN__ = { at: new Date().toISOString(), address, stage: "enter" };
			} catch { /* ignore */ }
			if (ctx === null || ctx === undefined) {
				try { globalThis.__VK_LAST_OPEN__.stage = "no-ctx"; } catch { /* ignore */ }
				return false;
			}
			const controller = ctx.get("sidebarRight");
			if (controller === void 0 || typeof controller.openResource !== "function") {
				try { globalThis.__VK_LAST_OPEN__.stage = "no-service"; } catch { /* ignore */ }
				try { ctx.logger.warn("[vscode-layout] sidebarRight 服务不可用：地址=" + address); } catch { /* ignore */ }
				return false;
			}
			try {
				// 与文件栏点文件同一条路：走骨架的 vkOpenFile（它会把「开始」这类主页标签顶替掉），
				// 服务不在场才退回官方 openResource。
				const vk = ctx.get("vkOpenFile");
				if (vk !== void 0 && vk !== null && typeof vk.open === "function") {
					if (vk.open(address, { replaceTab: true }) !== true) throw new Error("vkOpenFile.open 返回失败");
				} else {
					controller.openResource(address);
				}
				try { globalThis.__VK_LAST_OPEN__.stage = "ok"; } catch { /* ignore */ }
				return true;
			} catch (e) {
				// 失败必须留下可诊断的痕迹（最常见两种：没有已挂载会话面 / 没有任何类型认领该地址）。
				const message = String(e && e.message ? e.message : e);
				try { globalThis.__VK_LAST_OPEN__.stage = "throw"; globalThis.__VK_LAST_OPEN__.error = message; } catch { /* ignore */ }
				try { ctx.logger.warn("[vscode-layout] openResource 失败 address=" + address + " err=" + message); } catch { /* ignore */ }
				return false;
			}
		}

		/**
		 * 官方左栏**正文洞**（`sidebar.workspaces`）的自研占位：文件树 / 会话 双 Tab。
		 *
		 * 定位（路线 B 定稿）：官方 `ui-sidebar` 的 SidebarRoot **原样保留**（品牌行 / 新会话按钮 /
		 * 全局面板列 / 页脚钱包与归档 / 设置入口都是官方的），自研只在它声明的正文洞里以 priority:-1
		 * 胜出、接管正文区——所以这里拿到的 owner props 就是官方给的 `{wide, expandSidebar}`，
		 * 窄态（官方把侧栏收成图标轨道，wide=false）由本组件自己画紧凑入口。
		 *
		 * 会话 Tab 的正文是**官方会话浏览器本体**（由 apply 里的 browserMirror 镜像到 VK_SIDEBAR_BROWSER），
		 * 文件 Tab 里是自研 FileTree；两个 body 都用 CSS 隐藏而非卸载，切回来不丢滚动位置与内部状态。
		 */

		const VK_CHAT_FILE_LINK = true;
		const VK_FILE_LINK_CLASS_RE = /_fileLink$/;
		const VK_CHAT_HINT_CLASS = "vk_chatFileHint";
		function vkChatLinkText(btn) {
			let out = "";
			for (const node of btn.childNodes) {
				if (node.nodeType === 3) { out += node.nodeValue; continue; }
				if (node.nodeType !== 1) continue;
				const cls = String(node.className || "");
				if (cls.indexOf(VK_CHAT_HINT_CLASS) >= 0) continue;
				out += node.textContent;
			}
			return out;
		}
		/** 算一条「看起来就是路径」的按钮文本；不满足返回 null（调用方一律放行）。 */
		function vkChatFilePathOf(text) {
			const s = String(text === null || text === undefined ? "" : text).trim();
			if (s.length < 4 || s.length > 512) return null;
			if (s.indexOf("\n") >= 0) return null;
			if (/^[A-Za-z]:[\\/][^\\/:*?"<>|]+/.test(s)) return s;          // Windows 绝对路径：D:\… / D:/…
			if (s.startsWith("\\\\") && s.length > 5) return s;             // UNC
			if (s.startsWith("/") && /^\/[^\0]+$/.test(s)) return s;        // POSIX 绝对路径
			return null;
		}
		/** 点击那一刻的当前会话（id + 工作区根）。 */
		function vkLiveSession(ctx) {
			try {
				const snap = ctx.get("sessions").list.getSnapshot();
				const id = snap === null || snap === undefined ? null : snap.current;
				const entry = id !== null && snap.byId !== undefined ? snap.byId[id] : null;
				const cwd = entry !== null && entry !== undefined && typeof entry.cwd === "string" ? entry.cwd : "";
				return { id: id === null || id === undefined ? "" : String(id), cwd };
			} catch {
				return { id: "", cwd: "" };
			}
		}
		/**
		 * 在对话里点官方 read/write 卡片的路径 → 拓展栏打开；其余一律返回 false（放行官方行为）。
		 * @param ctx - 插件 ctx。
		 * @param event - 捕获阶段拿到的点击事件。
		 */
		function vkHandleChatFileClick(ctx, event) {
			if (VK_CHAT_FILE_LINK !== true) return false;
			if (event === null || event === undefined || event.defaultPrevented === true) return false;
			// 只认主键单击：带修饰键（ctrl 新标签 / shift / alt）与右键一律放行，留给官方与浏览器各家语义。
			if (event.button !== void 0 && event.button !== 0) return false;
			if (event.metaKey === true || event.ctrlKey === true || event.shiftKey === true || event.altKey === true) return false;
			const target = event.target;
			if (target === null || target === undefined || typeof target.closest !== "function") return false;
			const btn = target.closest("button");
			if (btn === null || btn === undefined) return false;
			if (!VK_FILE_LINK_CLASS_RE.test(String(btn.className || ""))) return false;
			const path = vkChatFilePathOf(vkChatLinkText(btn));
			if (path === null) return false;
			const live = vkLiveSession(ctx);
			if (live.id.length === 0) return false;                          // 没有当前会话 → 右栏开不了，放行走官方
			const address = fileAddressFor(live.id, live.cwd, path);
			// 自报告痕迹：CDP 一行 `__VK_LAST_OPEN__` 就能看出「拦到没有 / 打开成功没有 / 地址对不对」。
			try { globalThis.__VK_LAST_OPEN__ = { at: new Date().toISOString(), stage: "chat", path, address, sessionId: live.id, cwd: live.cwd }; } catch { /* ignore */ }
			if (vkOpenInViewer(ctx, address) !== true) return false;          // 右栏没开成 → 放行，让官方中间栏照旧工作
			// 只有真打开了才吃掉这次点击（吃掉的是官方那次 openFile → 中间栏保持原样）。
			event.preventDefault();
			event.stopPropagation();
			if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
			return true;
		}
		/**
		 * 给命中白名单的路径按钮挂「点了在拓展栏打开」的可见提示（一颗 hover 才出现的小箭头）。
		 * 只改自研自己加的那个 `<span>`，官方 DOM 结构与文本一字不动。用 MutationObserver 追新卡片。
		 */
		function vkDecorateChatFileLinks(root) {
			let links = [];
			const scope = root !== null && root !== undefined && typeof root.querySelectorAll === "function" ? root : document;
			try { links = scope.querySelectorAll("button[class$='_fileLink']"); } catch { links = []; }
			for (const btn of links) {
				if (btn.getAttribute("data-vk-chat-file") === "1") continue;
				if (vkChatFilePathOf(vkChatLinkText(btn)) === null) continue;
				try {
					btn.setAttribute("data-vk-chat-file", "1");
					btn.setAttribute("title", "在拓展栏打开");
					btn.appendChild(document.createElement("span")).className = VK_CHAT_HINT_CLASS;
					btn.lastChild.textContent = "↗";
				} catch { /* 单个装饰失败不影响其它 */ }
			}
		}
		/** 装上捕获阶段监听 + 新卡片观察者；返回 dispose。 */
		function vkInstallChatFileHooks(ctx) {
			const onClick = (event) => { try { vkHandleChatFileClick(ctx, event); } catch { /* 拦截出错一律放行 */ } };
			// capture=true：必须在 React 的冒泡 onClick 之前拿到这次点击（否则官方 openFile 已经调过了）。
			document.addEventListener("click", onClick, true);
			let obs = null;
			try {
				obs = new MutationObserver((records) => {
					for (const r of records) {
						for (const n of r.addedNodes) {
							if (n !== null && n !== undefined && n.nodeType === 1) vkDecorateChatFileLinks(n);
						}
					}
				});
				obs.observe(document.body, { childList: true, subtree: true });
			} catch { /* 无 MutationObserver 也不影响拦截本身 */ }
			vkDecorateChatFileLinks(document);
			return () => {
				try { document.removeEventListener("click", onClick, true); } catch { /* ignore */ }
				try { if (obs !== null) obs.disconnect(); } catch { /* ignore */ }
			};
		}

		// ──────────────────────────────────────────────────────────────
		// 插件主体
		// ──────────────────────────────────────────────────────────────
		// sessions / workspaces / layout 都是官方 boot 条目提供的客户端服务：
		// 会话 Tab 的会话列表与切换、文件树的目录选择、侧栏折叠都要用它们，写进 inject 让 cordis 保证就绪。
		const inject = ["slots", "theme", "connection", "sessions", "workspaces", "layout"];

		function apply(ctx) {
			ctxRef.current = ctx;
			// 这一条必须注册在**官方** conversation.input.left 上：组件要官方的 inputActions / useInput，
			// 骨架自渲染只会给空 props（搜索按钮的「追加 @引用」会失效）。
			ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
				name: "conversation.input.left",
				id: "vk-composer-file-search",
				order: 30,
				priority: -1
			}, VKComposerFileSearch));
			vkRegisterAtSource(ctx);
			vkInstallAtSearchButton();
			try { ctx.effect(() => vkInstallChatFileHooks(ctx), "dsh-files-tree: chat file links"); } catch { /* ignore */ }
		}

		exports.apply = apply;
		exports.inject = ["slots"];
		return module.exports;
		};

		function apply(ctx) {
			ctxRef.current = ctx;
			vkCard(ctx, { slot: VK.sidebar.files, id: "files", order: 10, component: VKFilesPane });
			// 输入区 @（原 dsh-files-tree）并进本包：同一个 ctx、同一份客户端模块，逻辑一行没改。
			try {
				composerFactory(require).apply(ctx);
			} catch (error) {
				try { ctx.logger.warn("[vk-files-tree] 输入区扩域 apply 失败：" + String(error && error.message ? error.message : error)); } catch { /* ignore */ }
			}
		}
		exports.apply = apply;
		exports.inject = ["slots"];
				return module.exports;
	}
});
