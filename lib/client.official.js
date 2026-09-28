// 公开版：只注册官方槽，不引用任何 vk 槽。装不装 dsh-vk-suite 行为一致。
// dsh-lan-services —— Client 半端
// 入口：左栏下方常驻面板（sidebar.footer.action slot，位于「移动端访问」下方）。
// 内容：自动探测 3090~3099 端口段上的局域网服务（复习网站 server.cjs），每项显示
//       标题（可改名）+ 局域网网址 + 启停开关；打开面板/手动刷新时探测一次（无常驻轮询）。
// 风格对齐 dsh-wifi-access（同套 token，深/浅色自适应，SVG 图标无 emoji）。

window.__ModuleLoader__.load({
  id: 'dsh-lan-services',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    var React = require('react');
    const h = React.createElement;

    function insertStyles(css) {
      try {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        return () => { try { style.remove() } catch { /* ignore */ } };
      } catch {
        return () => {};
      }
    }

    const CSS = `
.dls-dock{box-sizing:border-box;width:100%;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-sidebar-fill);display:flex;flex-direction:column;padding:6px 10px 8px;font-size:11px;color:var(--dsw-alias-label-primary);position:relative;overflow:visible;}
.dls-row1{display:flex;align-items:center;gap:6px;min-height:22px;flex:none;min-width:0;}
.dls-title{font-weight:600;font-size:11px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;cursor:pointer;user-select:none;}
.dls-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-success-primary);flex:none;}
.dls-dot-off{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-warn-primary);flex:none;}
.dls-cnt{font-size:10px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:none;}
.dls-ibar{width:20px;height:20px;border-radius:6px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none;padding:0;}
.dls-ibar:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.dls-ibar svg{display:block;}
.dls-collapse{display:grid;grid-template-rows:0fr;transition:grid-template-rows .25s ease;}
.dls-collapse.dls-open{grid-template-rows:1fr;}
.dls-collapse-inner{overflow:hidden;min-height:0;display:flex;flex-direction:column;gap:3px;padding-top:3px;max-height:46vh;opacity:0;transition:opacity .18s ease;}
.dls-collapse.dls-open .dls-collapse-inner{opacity:1;}
.dls-list{display:flex;flex-direction:column;gap:4px;overflow-y:auto;min-height:0;padding-right:2px;}
.dls-svc{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 7px 5px;display:flex;flex-direction:column;gap:1px;background:color-mix(in srgb,var(--dsw-alias-border-l1) 35%,transparent);flex:none;}
.dls-svc-h{display:flex;align-items:center;gap:5px;min-width:0;}
.dls-svc-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--dsw-alias-label-primary);display:inline-flex;align-items:center;gap:4px;cursor:pointer;}
.dls-svc-name:hover{opacity:.85;}

.dls-editname{flex:1;min-width:0;background:transparent;border:1px solid var(--dsw-alias-brand-primary);border-radius:4px;color:var(--dsw-alias-label-primary);font-size:11px;font-family:inherit;padding:0 4px;height:18px;box-sizing:border-box;outline:none;}
.dls-ren{border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:1px 2px;border-radius:4px;display:inline-flex;align-items:center;flex:none;}
.dls-ren:hover{color:var(--dsw-alias-brand-primary);}
.dls-ren svg{display:block;}
.dls-btn{border:none;background:transparent;color:var(--dsw-alias-brand-primary);cursor:pointer;font-size:11px;padding:1px 7px;border-radius:6px;font-family:inherit;line-height:1.5;flex:none;height:18px;}
.dls-btn:hover{background:var(--dsw-alias-interactive-bg-hover);}
.dls-btn.dls-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground);}
.dls-btn.dls-primary:hover{filter:brightness(1.08);}
.dls-btn.dls-danger{color:var(--dsw-alias-state-error-primary);}
.dls-btn.dls-danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);}
.dls-btn:disabled{opacity:.5;cursor:default;}
.dls-url-row{display:flex;align-items:center;gap:6px;min-width:0;line-height:1.5;}
.dls-addr{font-size:10px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--dsw-alias-brand-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;text-decoration:none;}
.dls-addr:hover{opacity:.85;}
.dls-copy{display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--dsw-alias-label-secondary);cursor:pointer;border:none;background:transparent;padding:0;font-family:inherit;flex:none;}
.dls-copy:hover{color:var(--dsw-alias-brand-primary);}
.dls-copy svg{display:block;}
.dls-ok{color:var(--dsw-alias-state-success-primary);}
.dls-empty{font-size:10px;color:var(--dsw-alias-label-secondary);line-height:1.6;padding:2px 1px;}
.dls-err{font-size:10px;color:var(--dsw-alias-state-error-primary);line-height:1.5;word-break:break-all;}
.dls-connecting{font-size:10px;color:var(--dsw-alias-label-secondary);padding:2px 1px;}
`;

    function svgIcon(d, size, fill) {
      return h('svg', { viewBox: '0 0 24 24', width: size || 14, height: size || 14, fill: fill || 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, dangerouslySetInnerHTML: { __html: d } });
    }
    function ServerIcon() { return svgIcon('<rect x="2" y="3" width="20" height="7" rx="2"/><rect x="2" y="14" width="20" height="7" rx="2"/><path d="M6 6.5h4"/><path d="M6 17.5h4"/>'); }
    function RefreshIcon() { return svgIcon('<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>', 13); }
    function ChevronIcon(props) {
      return h('svg', { viewBox: '0 0 24 24', width: 12, height: 12, fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { transform: props.up ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }, dangerouslySetInnerHTML: { __html: '<path d="M6 9l6 6 6-6"/>' } });
    }
    function PencilIcon() { return svgIcon('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>', 11); }
    function CopyIcon() { return svgIcon('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', 11); }
    function CheckIcon() { return svgIcon('<path d="M20 6 9 17l-5-5"/>', 11); }

    async function copyText(text) {
      try {
        if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
      } catch { /* fallthrough */ }
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch { return false; }
    }

    const api = (name) => '/lan-services/api/' + name;

    function LanServicesDock() {
      const [view, setView] = React.useState(null);
      const [loading, setLoading] = React.useState(false);
      const [open, setOpen] = React.useState(false);
      const [busyPort, setBusyPort] = React.useState(null);
      const [err, setErr] = React.useState('');
      const [editPort, setEditPort] = React.useState(null);
      const [editVal, setEditVal] = React.useState('');
      const [copiedPort, setCopiedPort] = React.useState(null);

      const refresh = React.useCallback(async (silent) => {
        if (!silent) setLoading(true);
        try {
          const res = await fetch(api('status'), { cache: 'no-store' });
          if (res.ok) { const j = await res.json(); setView(j); if (j.ok) setErr(''); }
        } catch { /* keep last */ }
        if (!silent) setLoading(false);
      }, []);

      // 挂载 + 展开时各探测一次（用户选择：打开时探测 + 手动刷新，无常驻轮询）
      React.useEffect(() => {
        refresh(true);
      }, [refresh]);
      React.useEffect(() => {
        if (open) refresh(true);
      }, [open, refresh]);

      const toggle = async (port, wantRunning) => {
        if (busyPort) return;
        setBusyPort(port);
        setErr('');
        try {
          const res = await fetch(api(wantRunning ? 'start' : 'stop'), { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ port }) });
          if (res.ok) {
            const j = await res.json();
            if (j.ok && j.status) setView(j.status);
            else setErr(j.error || '操作失败');
          } else setErr('请求失败');
        } catch { setErr('网络错误'); }
        setBusyPort(null);
      };

      const beginRename = (svc) => {
        setEditPort(svc.port);
        setEditVal(svc.title);
      };
      const commitRename = async (port) => {
        setEditPort(null);
        const t = editVal.trim();
        if (!t) return;
        try {
          const res = await fetch(api('rename'), { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ port, title: t }) });
          if (res.ok) { const j = await res.json(); if (j.ok && j.status) setView(j.status); else setErr(j.error || '改名失败'); }
        } catch { setErr('网络错误'); }
      };
      const onCopy = async (port, url) => {
        const ok = await copyText(url);
        if (ok) { setCopiedPort(port); setTimeout(() => setCopiedPort(null), 1500); }
      };

      const services = (view && view.services) || [];
      const anyRunning = services.some((s) => s.running);

      return h('div', { className: 'dls-dock' },
        h('div', { className: 'dls-row1' },
          h('span', { className: anyRunning ? 'dls-dot' : 'dls-dot-off', title: anyRunning ? '有服务在运行' : '无服务在运行' }),
          h('span', { className: 'dls-title', title: open ? '点击收起' : '点击展开', onClick: () => setOpen(!open) },
            h(ServerIcon), '局域网服务'),
          h('span', { className: 'dls-cnt' }, view ? (view.runningCount || 0) + ' 运行中' : '…'),
          h('button', { type: 'button', className: 'dls-ibar', title: '刷新', onClick: () => refresh(false), 'aria-label': '刷新' }, h(RefreshIcon)),
          h('button', { type: 'button', className: 'dls-ibar', title: open ? '收起' : '展开', onClick: () => setOpen(!open), 'aria-label': open ? '收起' : '展开', 'aria-expanded': open }, h(ChevronIcon, { up: open })),
        ),
        h('div', { className: 'dls-collapse' + (open ? ' dls-open' : '') },
          h('div', { className: 'dls-collapse-inner' },
            err ? h('div', { className: 'dls-err' }, err) : null,
            loading && !services.length ? h('div', { className: 'dls-connecting' }, '探测中…') : null,
            !loading && !services.length && !err ? h('div', { className: 'dls-empty', title: '探测 3090~3099 端口：复习网站 server.cjs 跑起来后会自动出现在这里，停止后仍保留、可一键重启' }, '3090~3099 未发现服务') : null,
            h('div', { className: 'dls-list' },
              services.map((svc) => {
                const busy = busyPort === svc.port;
                const editing = editPort === svc.port;
                return h('div', { key: svc.port, className: 'dls-svc' },
                  h('div', { className: 'dls-svc-h' },
                    editing
                      ? h('input', { className: 'dls-editname', autoFocus: true, value: editVal, onChange: (e) => setEditVal(e.target.value), onBlur: () => commitRename(svc.port), onKeyDown: (e) => { if (e.key === 'Enter') commitRename(svc.port); if (e.key === 'Escape') setEditPort(null); } })
                      : h('span', { className: 'dls-svc-name', title: '点击改名：' + svc.title, onClick: () => beginRename(svc) },
                          h('span', { className: svc.running ? 'dls-dot' : 'dls-dot-off' }),
                          h('span', { style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } }, svc.title),
                          h('span', { className: 'dls-ren', onClick: (e) => { e.stopPropagation(); beginRename(svc); }, title: '改名', 'aria-label': '改名' }, h(PencilIcon))),
                    svc.running
                      ? h('button', { type: 'button', className: 'dls-btn dls-danger', disabled: busy, onClick: () => toggle(svc.port, false) }, busy ? '…' : '停止')
                      : h('button', { type: 'button', className: 'dls-btn dls-primary', disabled: busy || !svc.canStart, title: svc.canStart ? '' : '未记录启动路径：先手动运行一次该服务', onClick: () => toggle(svc.port, true) }, busy ? '…' : '启动'),
                  ),
                  svc.mainUrl
                    ? h('div', { className: 'dls-url-row' },
                        h('a', { className: 'dls-addr', href: svc.mainUrl, target: '_blank', rel: 'noreferrer', title: '在浏览器打开：' + svc.mainUrl }, svc.mainUrl.replace(/^https?:\/\//, '')),
                        h('button', { type: 'button', className: 'dls-copy', onClick: () => onCopy(svc.port, svc.mainUrl), title: '复制地址' },
                          copiedPort === svc.port ? h(React.Fragment, null, h('span', { className: 'dls-ok' }, h(CheckIcon)), '已复制') : h(CopyIcon)),
                      )
                    : null,
                );
              }),
            ),
          ),
        ),
      );
    }

    const inject = ['slots'];
    function apply(ctx) {
      insertStyles(CSS);
      const slots = ctx.get('slots');
      if (slots === undefined) return;
      slots.inject('sidebar.panellist', () => slots.register(
        { name: 'sidebar.panellist', id: 'dsh-lan-services', order: 120, label: '局域网服务' },
        (props) => (h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: (props && props.size) || 22, height: (props && props.size) || 22 } }, h(ServerIcon))),
      ));
      slots.inject('main', () => slots.register(
        { name: 'main', key: 'dsh-lan-services' },
        () => (h(LanServicesDock)),
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
