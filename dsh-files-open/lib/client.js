window.__ModuleLoader__.load({
	id: 'dsh-files-open',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

// dsh-files-open —— 右栏「打开本机文件」标签。样式标记独立，避免与 dsh-files-tree 互相删除。

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
			".vk_browseOverlay{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.38);display:flex;align-items:center;justify-content:center;padding:24px;animation:vkFadeIn .12s ease-out}",
			// 固定尺寸（2026-09-12 用户要求：点开文件夹后不能变大，弹窗自始至终一个大小）：
			// 卡片给死高度、内容区只滚不撑 —— 条数少（磁盘列表）与条数多（文件夹里几十项）都是同一块框。
			// 高度取 300px = 「刚打开那一屏」的自然高度（头部 + 路径行 + 磁盘/桌面约 5 行条目 ≈ 285px），
			// 也就是用户口径里的「原来那个刚进搜索栏的大小」；480px 那种大框会顶到窗口边缘被遮挡。
			// --vk-browse-dx：水平对齐偏移（2026-09-13 用户要求「相对对话框水平居中」）。
			// 浮层模式由 VKBrowseModal 按锚点算出像素值写成内联变量；嵌入式不设 → 默认 0px，行为不变。
			// transform 既写在常规态（动画结束后由它生效）也写进 vkBrowseIn（动画期间不丢偏移）。
			".vk_browseCard{width:min(520px,94vw);height:min(300px,72vh);max-height:min(300px,72vh);background:var(--dsw-specific-menu);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:var(--dsw-shadow-lv3),0 24px 60px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;transform:translateX(var(--vk-browse-dx,0px));animation:vkBrowseIn .14s cubic-bezier(.2,.7,.3,1)}",
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
			const plugin = 'dsh-files-open';
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
		const HOME_DIRS = [];
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
			try {
				const snapshot = ctxRef.current.get("sessions").list.getSnapshot();
				return snapshot !== undefined && snapshot !== null && typeof snapshot.current === "string" ? snapshot.current : "";
			} catch { return ""; }
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
/* ── 右栏「打开本机文件」类型（从旧实现搬迁）── */
		/**
		 * 本类型的 id。**必须等于右栏栏目的槽名**（`VK.rightbar.files`）：官方右栏正文是 keyed 槽，
		 * 用 `definition.id` 去 `sidebar.right.pane.tab` 的 entries 里找 `options.key` 相同的正文条目
		 * （源码 renderer：`entriesOfSlot(slotKey).find(e => e.options.key === opts.entryKey)`），
		 * 找不到就渲染官方兜底文案「这类内容还没有可用的查看方式」。
		 * vk 骨架（dsh-vk-layout）登记正文条目时用的 key 是**栏目槽名**，所以 id 与槽名不一致就等于没有正文。
		 * 旧值 "@anoslide/dsh-client-vscode-layout/pick" 是旧单机布局插件的私有 id —— 那时正文由旧布局
		 * 用同一个 id 自行登记，配对成立；2026-09-26 换 vk 骨架后配对断裂，本标签只剩兜底文案。
		 */
		const PICK_TAB_ID = VK.rightbar.files;
		/**
		 * 该类型的 kind。**故意的**取官方的 "files"：
		 * 官方 ui-sidebar-files 的 files 类型是 builtin 段，右侧栏注册表允许「extension 段登记一个 builtin
		 * 已持有的 kind 并顶替它，直到自己注销」（同段第二次注册、或撞上 fallback 段才是装配错误）。
		 * 顶替之后 `active()` 里只剩自研这条，官方那条被 shadow、`guide()` 里也就只剩自研这一条
		 * ——「新标签页」里那句「浏览会话区文件」自然消失，不用去改官方包、也不用 CSS 隐藏。
		 * files 类型**没有 patterns**（从不参与 candidates 排序，只被「按 kind 点名打开」），
		 * 所以这次顶替不会截胡任何按地址打开的请求。
		 */
		const PICK_TAB_KIND = "files";
		/**
		 * 「打开本机文件」这个标签类型。
		 */
		function vkPickTabDefinition() {
			return {
				id: PICK_TAB_ID,
				kind: PICK_TAB_KIND,
				priority: "extension",
				title: () => "打开本机文件",
				guide: [{
					order: 10,
					title: () => "打开本机文件",
					description: () => "在应用内的文件浏览器里选一个文件，在本标签打开",
					icon: ({ size }) => h(VIcon, { name: "folderOpen", size: size === undefined || size === null ? 22 : size })
				}]
			};
		}
		/**
		 * 「打开本机文件」标签的正文：一块和文件栏那颗文件夹图标**完全同款**的应用内浏览弹窗（文件模式）。
		 *
		 * 版面（第二轮调整）：这块正文不再是「从上到下铺满整列」的卡片（那样只有几行内容时会被拉成
		 * 一大片空白），而是**竖向居中的卡片、高度约栏高 1/3**，内容超出时卡片内部滚动。
		 *
		 * 选中文件后走与文件栏点文件**同一条路**：
		 *   fileAddressFor(会话id, cwd, 绝对路径) → sidebarRight.openResource(address)（**不传 kind**，让注册表挑类型），
		 * 差别只在 `replaceTab`：这里要把**本次新建的这个标签**换成文件，而不是再开一个。
		 * `useTabInfo()` 拿到的 `tab.actions.openResource` 恰好带 replaceTab 语义（官方 TabActions 自带），
		 * 所以「点了新建 → 选文件 → 本标签变成该文件」一步到位。
		 */
		function VKPickTabBody({ useTabInfo }) {
			const { tab } = useTabInfo();
			const [path, setPath] = react.useState("");
			const [dir, setDir] = react.useState(null);
			const [err, setErr] = react.useState(null);
			const [drives, setDrives] = react.useState([]);
			const [probing, setProbing] = react.useState(false);
			const [desktopPath, setDesktopPath] = react.useState(null);
			const [query, setQuery] = react.useState("");
			const [search, setSearch] = react.useState(null);
			const [showHidden, setShowHidden] = react.useState(false);
			const [openError, setOpenError] = react.useState(null);
			const seqRef = react.useRef(0);
			// 磁盘与桌面探测（与文件栏同一套候选）
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
			react.useEffect(() => { probeRoots(); }, [probeRoots]);
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
					.then((d) => { if (d && d.ok) setDir(d); else setErr((d && d.error) || "无法读取该目录"); })
					.catch((e) => setErr(String(e)));
			}, []);
			// 模糊搜索：在当前目录下递归找**文件**（与文件栏弹窗同一端点，kind 缺省即文件）
			react.useEffect(() => {
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
			}, [query, path, drives, desktopPath]);
			// 选中文件 → 与文件栏点文件同一条路：拼官方资源地址 → 在本标签里打开（replaceTab）
			const pickFile = react.useCallback((file) => {
				const liveSessionId = (() => {
					try {
						const snapshot = ctxRef.current.get("sessions").list.getSnapshot();
						if (snapshot !== undefined && typeof snapshot.current === "string" && snapshot.current.length > 0) return snapshot.current;
					} catch { /* 服务未就绪 */ }
					return "";
				})();
				const cwd = (() => { try { return vkAtSessionCwd(); } catch { return ""; } })();
				try {
					globalThis.__VK_LAST_OPEN__ = { at: new Date().toISOString(), stage: "pick-tab-click", path: file && file.path, sessionId: liveSessionId, cwd: cwd };
				} catch { /* ignore */ }
				if (liveSessionId === "") {
					setOpenError("请先在中间栏打开或新建一个会话，再选文件");
					try { globalThis.__VK_LAST_OPEN__.stage = "no-session"; } catch { /* ignore */ }
					return;
				}
				const address = fileAddressFor(liveSessionId, cwd, file.path);
				try {
					// replaceTab 语义：不传 tabId 时官方 place() 会带上本标签的 tabId（见 TabActions.openResource）
					tab.actions.openResource(address, { replaceTab: true });
					try { globalThis.__VK_LAST_OPEN__.stage = "ok"; } catch { /* ignore */ }
				} catch (e) {
					const message = String(e && e.message ? e.message : e);
					setOpenError("无法打开该文件：" + message);
					try { globalThis.__VK_LAST_OPEN__.stage = "throw"; globalThis.__VK_LAST_OPEN__.error = message; } catch { /* ignore */ }
				}
			}, [tab]);
			return h("div", { className: "vk_pickTab", style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 } },
				openError !== null ? h("div", { className: "vk_openErr" }, openError) : null,
				h(VKBrowseModal, {
					fileMode: true,
					embedded: true,
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
					onClose: () => { try { tab.actions.close(); } catch { /* 关不掉就留着 */ } },
					onPickFile: pickFile,
					// 底部「打开」：选中目录 → 进入该目录（这个标签是「选一个文件/目录」用的，
					// 「进入」正是它需要的语义）；选中文件由弹窗自己走 onPickFile；没选中则按钮禁用。
					onOpen: (sel) => { if (sel !== null && sel !== undefined && sel.isDir === true) goto(sel.path); }
				})
			);
		}

		function apply(ctx) {
			ctxRef.current = ctx;
			vkCard(ctx, { slot: VK.rightbar.files, id: "pick", order: 20, component: VKPickTabBody });
			// 「新标签页」里的「浏览会话区文件」换成自研这条：extension 段登记一个 builtin 已持有的 kind 会顶替它。
			let disposePickType = null;
			let pickTries = 0;
			const ensurePickType = () => {
				let registry;
				try { registry = ctx.get("sidebarRightTabs"); } catch { registry = undefined; }
				if (registry === undefined || registry === null || typeof registry.register !== "function") {
					pickTries += 1;
					if (pickTries < 40) setTimeout(ensurePickType, 500);
					return;
				}
				try { disposePickType = registry.register(vkPickTabDefinition()); } catch { /* 已有注册就沿用 */ }
			};
			ensurePickType();
			try { ctx.on("dispose", () => { if (typeof disposePickType === "function") { try { disposePickType(); } catch { /* ignore */ } } }); } catch { /* ignore */ }
		}
		exports.apply = apply;
		exports.inject = ["slots"];
				return module.exports;
	}
});
