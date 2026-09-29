// 公开版：只注册官方槽，不引用任何 vk 槽。装不装 dsh-vk-suite 行为一致。
// dsh-extensions-panel —— Client 半端。
// 入口：官方 sidebar.panellist + main（左栏图标与中央面板同一个 id 配对）。
// 卡片 UI 与「移动端访问」同款（圆点 + 标题 + 开关 + 刷新 + 折叠箭头），样式 token 全部走主题变量，深浅色自适应。

window.__ModuleLoader__.load({
  id: 'dsh-extensions-panel',
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

    const POLL_MS = 20000;

    const CSS = `
.dxp-dock{box-sizing:border-box;width:100%;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-sidebar-fill);display:flex;flex-direction:column;padding:6px 10px 8px;font-size:11px;color:var(--dsw-alias-label-primary);position:relative;}
.dxp-row1{display:flex;align-items:center;gap:6px;min-height:22px;flex:none;min-width:0;}
.dxp-title{font-weight:600;font-size:11px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;cursor:pointer;user-select:none;}
.dxp-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-warn-primary);flex:none;}
.dxp-dot-ok{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-success-primary);flex:none;}
.dxp-dot-err{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-error-primary);flex:none;}
.dxp-btn{border:none;background:transparent;color:var(--dsw-alias-brand-primary);cursor:pointer;font-size:11px;padding:1px 7px;border-radius:6px;font-family:inherit;line-height:1.4;flex:none;}
.dxp-btn:hover{background:var(--dsw-alias-interactive-bg-hover);}
.dxp-btn.dxp-primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground);}
.dxp-btn.dxp-primary:hover{filter:brightness(1.08);}
.dxp-btn.dxp-danger{color:var(--dsw-alias-state-error-primary);}
.dxp-btn.dxp-danger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);}
.dxp-ibar{width:20px;height:20px;border-radius:6px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none;padding:0;}
.dxp-ibar:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.dxp-ibar svg{display:block;}
.dxp-collapse{display:grid;grid-template-rows:0fr;transition:grid-template-rows .25s ease;}
.dxp-collapse.dxp-open{grid-template-rows:1fr;}
.dxp-collapse-inner{overflow:hidden;min-height:0;display:flex;flex-direction:column;gap:3px;padding-top:3px;opacity:0;transition:opacity .18s ease;}
.dxp-collapse.dxp-open .dxp-collapse-inner{opacity:1;}
.dxp-row2{display:flex;align-items:center;gap:6px;min-width:0;line-height:1.5;flex:none;}
.dxp-hint{font-size:10px;color:var(--dsw-alias-label-secondary);line-height:1.6;}
.dxp-ok{color:var(--dsw-alias-state-success-primary);}
.dxp-err{color:var(--dsw-alias-state-error-primary);font-size:10px;line-height:1.5;word-break:break-all;}
.dxp-note{font-size:10px;color:var(--dsw-alias-label-secondary);line-height:1.6;border-top:1px dashed var(--dsw-alias-border-l1);padding-top:4px;margin-top:2px;}
.dxp-addr{font-size:10px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--dsw-alias-brand-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;text-decoration:none;border-bottom:1px dashed color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);}
.dxp-addr:hover{opacity:.85;}
.dxp-copy{display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--dsw-alias-label-secondary);cursor:pointer;border:none;background:transparent;padding:0;font-family:inherit;flex:none;}
.dxp-copy:hover{color:var(--dsw-alias-brand-primary);}
.dxp-copy svg{display:block;}
.dxp-qrwrap{display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:3px;}
.dxp-qr{width:100%;max-width:190px;height:auto;border-radius:6px;background:#fff;padding:4px;box-sizing:border-box;}
.dxp-agree{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--dsw-alias-label-secondary);cursor:pointer;line-height:1.6;user-select:none;}
.dxp-agree input{width:12px;height:12px;margin:0;flex:none;cursor:pointer;}
`;

    function svgIcon(d, size) {
      return h('svg', { viewBox: '0 0 24 24', width: size || 14, height: size || 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, dangerouslySetInnerHTML: { __html: d } });
    }
    function DisplayIcon() { return svgIcon('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>'); }
    function RefreshIcon() { return svgIcon('<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>', 13); }
    function ChevronIcon(props) { return svgIcon(props && props.up ? '<path d="m18 15-6-6-6 6"/>' : '<path d="m6 9 6 6 6-6"/>', 13); }

    function VddDock() {
      const [view, setView] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [open, setOpen] = React.useState(false);

      const refresh = React.useCallback(async () => {
        try {
          const res = await fetch('/extensions/api/vdd', { cache: 'no-store' });
          if (res.ok) setView(await res.json());
        } catch { /* keep last */ }
      }, []);

      React.useEffect(() => {
        refresh();
        const t = setInterval(refresh, POLL_MS);
        return () => clearInterval(t);
      }, [refresh]);

      const toggle = async (wantOn) => {
        if (busy) return;
        setBusy(true);
        try {
          const res = await fetch('/extensions/api/vdd?mode=' + (wantOn ? 'on' : 'off'), { cache: 'no-store' });
          if (res.ok) setView(await res.json());
        } catch { /* ignore */ }
        setBusy(false);
      };

      const device = (view && view.device) || 'unknown';
      const installed = device === 'installed';
      const extended = !!(view && view.extended);
      const dotCls = device === 'installed' ? (extended ? 'dxp-dot-ok' : 'dxp-dot') : (device === 'absent' ? 'dxp-dot-err' : 'dxp-dot');

      const statusRow = !view
        ? h('div', { className: 'dxp-hint' }, '读取中…')
        : device === 'absent'
          ? h('div', { className: 'dxp-hint' }, '未检测到虚拟显示器驱动')
          : device === 'disabled'
            ? h('div', { className: 'dxp-hint' }, '虚拟显示器已停用')
            : h('div', { className: 'dxp-hint' }, extended ? '虚拟屏已参与桌面（扩展模式）' : '虚拟屏未参与桌面（仅电脑屏幕）');

      return h('div', { className: 'dxp-dock' },
        h('div', { className: 'dxp-row1' },
          h('span', { className: cls(dotCls) }),
          h('span', { className: 'dxp-title', title: open ? '点击收起' : '点击展开', onClick: () => setOpen(!open) }, h(DisplayIcon), '虚拟显示器'),
          device === 'installed'
            ? (extended
              ? h('button', { type: 'button', className: 'dxp-btn dxp-danger', disabled: busy, onClick: () => toggle(false) }, busy ? '…' : '停用')
              : h('button', { type: 'button', className: 'dxp-btn dxp-primary', disabled: busy, onClick: () => toggle(true) }, busy ? '…' : '启用'))
            : null,
          h('button', { type: 'button', className: 'dxp-ibar', title: '刷新状态', onClick: refresh, 'aria-label': '刷新' }, h(RefreshIcon)),
          h('button', { type: 'button', className: 'dxp-ibar', title: open ? '收起' : '展开', onClick: () => setOpen(!open), 'aria-label': open ? '收起' : '展开', 'aria-expanded': open }, h(ChevronIcon, { up: open })),
        ),
        h('div', { className: 'dxp-collapse' + (open ? ' dxp-open' : '') },
          h('div', { className: 'dxp-collapse-inner' },
            h('div', { className: 'dxp-row2' }, statusRow),
            h('div', { className: 'dxp-note' }, '开关只切显示模式（等同 Win+P），不碰显示设备——实测禁用/启用该设备会导致蓝屏。'),
          ),
        ),
      );
    }

    function PhoneIcon() { return svgIcon('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>'); }
    function CopyIcon() { return svgIcon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 11); }
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

    const POCKET_PHASE = { idle: '未开启', downloading: '正在下载 cloudflared…', starting: '正在启动隧道…', registering: '正在连接 Cloudflare…', ready: '就绪', error: '隧道失败' };

    function PocketDock() {
      const [st, setSt] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [open, setOpen] = React.useState(false);
      const [qr, setQr] = React.useState('');
      const [copied, setCopied] = React.useState('');
      const [err, setErr] = React.useState('');
      const [agree, setAgree] = React.useState(false);

      async function rpcCall(endpoint, payload) {
        const c = globalThis.crypto;
        const rpcId = (c && typeof c.randomUUID === 'function')
          ? c.randomUUID()
          : ('rpc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
        const res = await fetch('/dsh-pocket/' + endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'client-request', rpcId: rpcId, method: endpoint, payload: payload || {} }),
        });
        if (!res.ok) throw new Error('RPC ' + endpoint + ' → HTTP ' + res.status);
        const full = await res.json();
        if (!full || full.rpcId !== rpcId) throw new Error('RPC 响应不匹配');
        const result = full.result;
        if (!result || typeof result !== 'object') throw new Error('RPC 响应格式异常');
        if (result.ok !== true) {
          const e = result.error || {};
          throw new Error(String(e.message || e.code || 'RPC 调用失败'));
        }
        return result.value;
      }

      const pull = async () => {
        try {
          const v = await rpcCall('pocket.status', {});
          setSt(v);
          setErr('');
        } catch (e) {
          setErr(String((e && e.message) || e));
        }
      };

      React.useEffect(() => {
        let alive = true;
        const run = () => { if (alive) void pull(); };
        run();
        const t = setInterval(run, 8000);
        return () => { alive = false; clearInterval(t); };
      }, []);

      const action = async (fn) => {
        if (busy || !st) return;
        setBusy(true);
        setErr('');
        try {
          await fn();
          setSt(await rpcCall('pocket.status', {}));
        } catch (e) {
          setErr(String((e && e.message) || e));
        }
        setBusy(false);
      };
      const toggleLan = () => action(() => rpcCall('lan.setEnabled', { on: !st.lanEnabled }));
      const toggleTunnel = () => action(() => rpcCall(st.tunnelRunning ? 'tunnel.stop' : 'tunnel.start', st.tunnelRunning ? {} : { disclaimer: true }));

      const doCopy = async (key, text) => {
        if (!text) return;
        const done = await copyText(text);
        setCopied(done ? key : '');
        setTimeout(() => setCopied(''), 1600);
      };

      const phase = (st && st.tunnelState && st.tunnelState.phase) || 'idle';
      const running = !!(st && st.tunnelRunning);
      const lanOn = !!(st && st.lanEnabled);
      const pending = phase === 'downloading' || phase === 'starting' || phase === 'registering';
      const dotCls = !st ? 'dxp-dot' : (running ? 'dxp-dot-ok' : (st.proxyRunning ? 'dxp-dot' : 'dxp-dot-err'));
      const lanUrl = (st && st.lanUrl) || '';
      const tunnelUrl = (st && st.tunnelUrl) || '';
      const tunnelQr = (st && st.tunnelQr) || '';

      const copyBtn = (key, text) => h('button', { type: 'button', className: 'dxp-copy', onClick: () => doCopy(key, text) }, h(copied === key ? CheckIcon : CopyIcon), copied === key ? '已复制' : '复制');
      const switchBtn = (on, onClick, disabled) => h('button', { type: 'button', className: 'dxp-btn ' + (on ? 'dxp-danger' : 'dxp-primary'), disabled: disabled, onClick: onClick }, disabled ? '…' : (on ? '关闭' : '开启'));
      const label = (text) => h('span', { className: 'dxp-hint', style: { flex: 'none', width: '48px' } }, text);

      return h('div', { className: 'dxp-dock' },
        h('div', { className: 'dxp-row1' },
          h('span', { className: cls(dotCls) }),
          h('span', { className: 'dxp-title', title: open ? '点击收起' : '点击展开', onClick: () => setOpen(!open) }, h(PhoneIcon), '移动端访问'),
          h('button', { type: 'button', className: 'dxp-ibar', title: '刷新状态', onClick: pull, 'aria-label': '刷新' }, h(RefreshIcon)),
          h('button', { type: 'button', className: 'dxp-ibar', title: open ? '收起' : '展开', onClick: () => setOpen(!open), 'aria-label': open ? '收起' : '展开', 'aria-expanded': open }, h(ChevronIcon, { up: open })),
        ),
        h('div', { className: 'dxp-collapse' + (open ? ' dxp-open' : '') },
          h('div', { className: 'dxp-collapse-inner' },
            h('div', { className: 'dxp-row2' },
              label('局域网'),
              switchBtn(lanOn, toggleLan, !st || busy),
            ),
            h('div', { className: 'dxp-row2' },
              lanUrl ? h('a', { className: 'dxp-addr', href: lanUrl, target: '_blank', rel: 'noreferrer', title: lanUrl }, lanUrl) : h('span', { className: 'dxp-hint' }, '未就绪'),
              lanUrl ? copyBtn('lan', lanUrl) : null,
            ),
            h('div', { className: 'dxp-row2' },
              label('公网服务'),
              switchBtn(running, toggleTunnel, !st || busy || pending || (!running && !agree)),
            ),
            !running ? h('label', { className: 'dxp-agree' },
              h('input', { type: 'checkbox', checked: agree, onChange: (e) => setAgree(!!(e.target && e.target.checked)) }),
              '我已知情',
            ) : null,
            h('div', { className: 'dxp-row2' },
              tunnelUrl ? h('a', { className: 'dxp-addr', href: tunnelUrl, target: '_blank', rel: 'noreferrer', title: tunnelUrl }, tunnelUrl) : h('span', { className: 'dxp-hint' }, POCKET_PHASE[phase] || '未开启'),
              tunnelUrl ? copyBtn('tunnel', tunnelUrl) : null,
            ),
            tunnelQr ? h('div', { className: 'dxp-row2' }, h('button', { type: 'button', className: 'dxp-btn', onClick: () => setQr(qr === 'tunnel' ? '' : 'tunnel') }, '二维码')) : null,
            (qr === 'tunnel' && tunnelQr) ? h('div', { className: 'dxp-qrwrap' }, h('img', { className: 'dxp-qr', alt: '公网访问二维码', src: tunnelQr })) : null,
            err ? h('div', { className: 'dxp-err' }, err) : null,
          ),
        ),
      );
    }

    // 小工具：拼 className（避免 undefined）
    function cls() {
      var out = [];
      for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
      return out.join(' ');
    }

    const inject = ['slots'];
    function apply(ctx) {
      insertStyles(CSS);
      const slots = ctx.get('slots');
      if (slots === undefined) return;
      slots.inject('sidebar.panellist', () => slots.register(
        { name: 'sidebar.panellist', id: 'dsh-extensions-panel', order: 130, label: '虚拟显示器' },
        (props) => (h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: (props && props.size) || 22, height: (props && props.size) || 22 } }, h(DisplayIcon))),
      ));
      slots.inject('main', () => slots.register(
        { name: 'main', key: 'dsh-extensions-panel' },
        () => (h(VddDock)),
      ));
      slots.inject('sidebar.panellist', () => slots.register(
        { name: 'sidebar.panellist', id: 'dsh-pocket-dock', order: 140, label: '移动端访问' },
        (props) => (h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: (props && props.size) || 22, height: (props && props.size) || 22 } }, h(PhoneIcon))),
      ));
      slots.inject('main', () => slots.register(
        { name: 'main', key: 'dsh-pocket-dock' },
        () => (h(PocketDock)),
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
