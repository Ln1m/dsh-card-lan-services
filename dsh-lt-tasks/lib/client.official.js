// 公开版：只注册官方槽，不引用任何 vk 槽。装不装 dsh-vk-suite 行为一致。
window.__ModuleLoader__.load({
  id: "dsh-lt-tasks",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    let ui = require("@deepseek-ai/dsh-client-ui-primitives");
    const h = react.createElement;
    const IconPlus = ui.IconPlusOutline16;
    const IconSearch = ui.IconSearchOutline16;
    const IconClose = ui.IconCloseFill14;
    const IconTrash = ui.IconTrashOutline16;
    const IconEdit = ui.IconEditOutline16;
    const Modal = ui.Modal;
    const Button = ui.Button;
    const Frag = react.Fragment;

    const STATUS_META = {
      planning: { label: "筹划中", color: "var(--dsw-alias-label-tertiary)" },
      active: { label: "进行中", color: "var(--dsw-alias-state-success-primary)" },
      paused: { label: "已暂停", color: "var(--dsw-alias-state-warn-primary)" },
      blocked: { label: "已阻塞", color: "var(--dsw-alias-state-error-primary)" },
      review: { label: "待审", color: "var(--dsw-alias-state-business-primary)" },
      completed: { label: "已完成", color: "var(--dsw-alias-label-dimmed, #8a919f)" }
    };
    const STATUS_ORDER = ["planning", "active", "paused", "blocked", "review", "completed"];
    const FIELDS = [
      { label: "目标", doc: "goal", editable: false },
      { label: "状态", doc: "meta.status", editable: true },
      { label: "当前状态（下一步 + 清单）", doc: "state", editable: true },
      { label: "已确认不可修改列表", doc: "frozen", editable: true },
      { label: "推进流水", doc: "log", editable: false },
      { label: "备忘（阻塞 / 审查 / 错误 / 参考资料）", doc: "notes", editable: true },
      { label: "完整工作流目录", doc: "index", editable: false }
    ];

    const CSS = `
@keyframes lt-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.lt-pulse{ animation: lt-pulse 1.6s ease-in-out infinite; }
.lt-card{ transition: background .2s ease; }
.lt-card:hover{ background: var(--dsw-alias-interactive-bg-hover, #eef); }
.lt-group{ transition: background .2s ease; }
.lt-group:hover{ background: var(--dsw-alias-interactive-bg-hover, #f2f3f5); }
`;

    async function api(path, opts) {
      try {
        const r = await fetch(path, opts);
        const j = await r.json();
        return { ok: !!j.ok, data: j, error: j.error || "" };
      } catch (e) {
        return { ok: false, data: null, error: String((e && e.message) || e) };
      }
    }

    // ── 模块级任务 store（学官方 useSessions 的响应式订阅：数据源 + 订阅 + 快照）──
    let taskListCache = [];
    const taskListeners = new Set();
    const emitTasks = () => { taskListeners.forEach((l) => { try { l(); } catch {} }); };
    const subscribeTasks = (l) => { taskListeners.add(l); return () => taskListeners.delete(l); };
    const getTasksSnapshot = () => taskListCache;

    async function loadTasks() {
      const res = await api("/lt-tasks/list");
      if (!res.ok) return { ok: false, error: res.error || "加载失败" };
      const next = res.data.tasks || [];
      if (JSON.stringify(taskListCache) !== JSON.stringify(next)) {
        taskListCache = next;
        emitTasks();
      }
      return { ok: true };
    }

    function renderMarkdown(text) {
      if (!text) return h("span", { style: { color: "#999" } }, "（空）");
      const lines = String(text).split("\n");
      const nodes = [];
      lines.forEach((line, i) => {
        if (/^#{1,4}\s+/.test(line)) {
          nodes.push(h("div", { key: i, style: { fontWeight: 600, marginTop: i ? 8 : 0, fontSize: 12.5 } }, line.replace(/^#{1,4}\s+/, "")));
        } else if (/^[-*]\s+/.test(line)) {
          nodes.push(h("div", { key: i, style: { paddingLeft: 12, fontSize: 12.5 } }, "• " + line.replace(/^[-*]\s+/, "")));
        } else if (line.trim() === "") {
          nodes.push(h("div", { key: i, style: { height: 5 } }));
        } else {
          nodes.push(h("div", { key: i, style: { fontSize: 12.5 } }, line));
        }
      });
      return h("div", { style: { lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" } }, nodes);
    }

    function StatusDot({ status, pulse }) {
      const m = STATUS_META[status] || { color: "#999" };
      return h("span", {
        className: pulse ? "lt-pulse" : undefined,
        style: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: m.color, flex: "none" }
      });
    }

    // 内联锁图标（stroke=currentColor，随文字颜色变化，替代 emoji 🔒）
    function LockIcon({ size }) {
      return h("svg", {
        viewBox: "0 0 24 24", width: size || 12, height: size || 12, fill: "none", stroke: "currentColor",
        strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
        style: { flex: "none", display: "block" },
        dangerouslySetInnerHTML: { __html: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' }
      });
    }

    // 自定义状态下拉（原生 select 下拉面板无法圆角，故自绘；用 grid 过渡，与分组一致）
    function StatusSelect({ value, onSelect }) {
      const [open, setOpen] = react.useState(false);
      const rootRef = react.useRef(null);
      react.useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
          if (!(e.target instanceof Node) || rootRef.current?.contains(e.target)) return;
          setOpen(false);
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
      }, [open]);
      const m = STATUS_META[value] || { label: value };
      return h("div", { ref: rootRef, style: { position: "relative" } },
        h("button", {
          onClick: () => setOpen((o) => !o),
          style: { display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 11.5, lineHeight: "20px", padding: "0 8px", borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", color: "var(--dsw-alias-label-primary)" }
        },
          h(StatusDot, { status: value }),
          h("span", null, m.label),
          h("span", { style: { fontSize: 9, display: "inline-block", transition: "transform .15s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" } }, "▼")
        ),
        h("div", {
          style: { position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 20, display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .3s cubic-bezier(.22,.61,.36,1)" }
        },
          h("div", { style: { overflow: "hidden", minHeight: 0, background: "var(--dsw-alias-bg-layer-3)", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,.12)" } },
            STATUS_ORDER.map((s) => h("button", {
              key: s,
              onClick: () => { onSelect(s); setOpen(false); },
              style: { display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", cursor: "pointer", padding: "6px 10px", fontSize: 12, border: "none", background: s === value ? "var(--dsw-alias-interactive-bg-hover, #eef)" : "transparent", color: "var(--dsw-alias-label-primary)" }
            },
              h(StatusDot, { status: s }),
              h("span", null, STATUS_META[s].label)
            ))
          )
        )
      );
    }

    function TaskCard({ task, selected, onSelect, highlight, onDelete }) {
      const [hover, setHover] = react.useState(false);
      const m = STATUS_META[task.status] || { label: task.status };
      const q = (highlight || "").trim();
      let nameNode = task.name;
      if (q) {
        const idx = task.name.toLowerCase().indexOf(q.toLowerCase());
        if (idx >= 0) {
          nameNode = h("span", null,
            task.name.slice(0, idx),
            h("span", { style: { background: "var(--dsw-alias-state-business-primary)", color: "#fff", borderRadius: 3, padding: "0 1px" } }, task.name.slice(idx, idx + q.length)),
            task.name.slice(idx + q.length)
          );
        }
      }
      return h("div", {
        className: "lt-card",
        onClick: () => onSelect(task),
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          cursor: "pointer", padding: "7px 10px", borderBottom: "1px solid var(--dsw-alias-border-l1, #eee)",
          background: selected ? "var(--dsw-alias-interactive-bg-hover, #eef)" : "transparent",
          display: "flex", alignItems: "center", gap: 8
        }
      },
        h(StatusDot, { status: task.status, pulse: task.status === "active" }),
        h("div", { style: { flex: 1, minWidth: 0 } },
          h("div", { style: { fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, nameNode),
          h("div", { style: { fontSize: 11, color: "#999", display: "flex", alignItems: "center", gap: 4 } },
            h("span", null, (q ? m.label + " · " : "") + "v" + task.version + (task.taskTotal > 0 ? " · " + task.taskDone + "/" + task.taskTotal : "")),
            task.locked ? h(LockIcon, { size: 10 }) : null
          )
        ),
        hover && onDelete ? h("button", {
          onClick: (e) => { e.stopPropagation(); onDelete(task); },
          title: "删除任务",
          style: { cursor: "pointer", border: "none", background: "transparent", padding: "3px 5px", color: "#e74c3c", flex: "none", borderRadius: 4, lineHeight: 1, display: "inline-flex", alignItems: "center" }
        }, h(IconTrash, { size: 14 })) : null
      );
    }

    function TaskList({ tasks, search, selectedId, onSelect, onDelete }) {
      const [open, setOpen] = react.useState({ planning: false, active: false, paused: false, blocked: false, review: false, completed: false });
      const toggle = (s) => setOpen((o) => ({ ...o, [s]: !o[s] }));
      const q = (search || "").trim().toLowerCase();
      // 搜索模式：扁平模糊匹配列表（按名字或 id 子串匹配）
      if (q) {
        const matched = tasks.filter((t) =>
          (t.name || "").toLowerCase().includes(q) || (t.id || "").toLowerCase().includes(q)
        );
        return h("div", { style: { overflow: "auto" } },
          matched.length === 0
            ? h("div", { style: { padding: 24, color: "#999", textAlign: "center", fontSize: 12 } }, "无匹配任务")
            : matched.map((t) => h(TaskCard, { key: t.id, task: t, selected: selectedId === t.id, onSelect, highlight: search, onDelete }))
        );
      }
      return h("div", { style: { display: "flex", flexDirection: "column", overflow: "auto" } },
        STATUS_ORDER.map((s) => {
          const items = tasks.filter((t) => t.status === s);
          const isOpen = open[s];
          return h("div", { key: s },
            h("div", {
              className: "lt-group",
              onClick: () => toggle(s),
              style: { cursor: "pointer", padding: "6px 12px", fontWeight: 600, fontSize: 11.5, borderBottom: "1px solid var(--dsw-alias-border-l1, #eee)", display: "flex", justifyContent: "space-between", alignItems: "center" }
            },
              h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, h(StatusDot, { status: s }), STATUS_META[s].label + " (" + items.length + ")"),
              h("span", { style: { transition: "transform .15s ease", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" } }, "▸")
            ),
            h("div", {
              style: { display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows .4s cubic-bezier(.22,.61,.36,1)" }
            },
              h("div", { style: { overflow: "hidden", minHeight: 0 } },
                items.map((t) => h(TaskCard, { key: t.id, task: t, selected: selectedId === t.id, onSelect, onDelete }))
              )
            )
          );
        }),
        tasks.length === 0 ? h("div", { style: { padding: 28, color: "#999", textAlign: "center", fontSize: 12 } },
          "暂无长期任务", h("br"), "点上方「＋」创建") : null
      );
    }

    function FieldCard({ label, doc, value, metaStatus, taskId, onSave }) {
      const [editing, setEditing] = react.useState(false);
      const [expanded, setExpanded] = react.useState(false);
      const [draft, setDraft] = react.useState("");
      const [saving, setSaving] = react.useState(false);
      const [msg, setMsg] = react.useState("");
      const isStatus = doc === "meta.status";
      const editable = !isStatus && FIELDS.find((f) => f.doc === doc)?.editable;
      const text = isStatus ? (metaStatus || "") : (value || "");
      const long = !editing && text.length > 140;

      const startEdit = () => { setDraft(text); setEditing(true); setMsg(""); };
      const cancel = () => { setEditing(false); setDraft(""); setMsg(""); };
      const save = async () => {
        setSaving(true);
        const res = await api("/lt-tasks/doc", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: taskId, doc: doc, content: draft })
        });
        setSaving(false);
        if (res.ok) { setEditing(false); setMsg(""); onSave(); }
        else setMsg(res.error || "保存失败");
      };

      return h("div", {
        style: { border: "1px solid var(--dsw-alias-border-l1, #e5e7eb)", borderRadius: 8, padding: "8px 10px", marginBottom: 8, background: "var(--dsw-alias-bg-base, transparent)" }
      },
        h("div", { className: "lt-fhead", style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, minWidth: 0 } },
          h("span", { className: "lt-fhead-label", style: { fontWeight: 600, fontSize: 11, color: "#777", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, label),
          isStatus ? h(StatusSelect, {
            value: text,
            onSelect: async (status) => {
              const res = await api("/lt-tasks/status", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: taskId, status })
              });
              if (res.ok) onSave(); else setMsg(res.error || "保存失败");
            }
          })
          : editable ? (
            editing
              ? h("span", { style: { display: "flex", gap: 4 } },
                h("button", { onClick: save, disabled: saving, style: { fontSize: 11, cursor: "pointer" } }, saving ? "保存中…" : "保存"),
                h("button", { onClick: cancel, style: { fontSize: 11, cursor: "pointer" } }, "取消"))
              : h("span", { style: { fontSize: 11, color: "#5b8def", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }, onClick: startEdit }, h(IconEdit, { size: 12 }), h("span", { className: "lt-edit-text" }, "编辑"))
          ) : null
        ),
        editing ? h("textarea", {
          value: draft,
          onChange: (e) => setDraft(e.target.value),
          autoFocus: true,
          rows: 5,
          style: { width: "100%", boxSizing: "border-box", fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.6, border: "1px solid #d0d5dd", borderRadius: 6, padding: 6, resize: "vertical" }
        }) : h("div", { style: long && !expanded ? { maxHeight: 92, overflow: "hidden" } : undefined }, renderMarkdown(text)),
        long ? h("button", {
          onClick: () => setExpanded((v) => !v),
          style: { cursor: "pointer", border: "none", background: "transparent", padding: "2px 0 0", fontSize: 11, color: "#5b8def", fontFamily: "inherit" }
        }, expanded ? "收起" : "展开全部") : null,
        msg ? h("div", { style: { color: "#e74c3c", fontSize: 11, marginTop: 4 } }, msg) : null
      );
    }

    function TaskDetail({ task, onClose, onRefresh, openSession, startSession, prefillNew }) {
      const [detail, setDetail] = react.useState(null);
      const [loading, setLoading] = react.useState(true);
      const [error, setError] = react.useState("");

      const openedRef = react.useRef(null);
      const load = react.useCallback(async (silent) => {
        if (!silent) { setLoading(true); setError(""); }
        const res = await api("/lt-tasks/get?id=" + encodeURIComponent(task.id));
        if (res.ok) {
          setDetail(res.data);
          if (openedRef.current !== task.id && res.data.meta?.lastSessionId) {
            openedRef.current = task.id;
            openSession(res.data.meta.lastSessionId);
          }
        } else if (!silent) setError(res.error || "加载失败");
        if (!silent) setLoading(false);
      }, [task.id, openSession]);

      react.useEffect(() => { load(); }, [load]);

      // 详情页轮询：与列表对齐，每 3 秒静默刷新（不闪烁"加载中"），让状态/内容自动更新
      react.useEffect(() => {
        const timer = setInterval(() => { load(true); }, 3000);
        return () => clearInterval(timer);
      }, [load]);

      const meta = detail?.meta || {};
      const docs = detail?.docs || {};

      return h("div", {
        style: {
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 5,
          background: "var(--dsw-alias-bg-base, #fff)",
          overflow: "auto", padding: 12, boxSizing: "border-box"
        }
      },
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } },
          h("div", { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 } },
            h(StatusDot, { status: meta.status, pulse: meta.status === "active" }),
            h("strong", { style: { fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, task.name)
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: 6, flex: "none" } },
            h("button", {
              onClick: () => { if (prefillNew) prefillNew("推进长期任务 " + task.name); else startSession(); },
              title: "新建对话窗口推进此任务",
              style: { cursor: "pointer", fontSize: 11, lineHeight: "20px", color: "var(--dsw-alias-label-secondary, #666)", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", borderRadius: 8, padding: "0 8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }
            }, "＋ 新对话"),
            h("button", { onClick: onClose, style: { cursor: "pointer", border: "none", background: "none", fontSize: 16, padding: "2px 6px", lineHeight: 1 }, title: "关闭" }, "×")
          )
        ),
        h("div", { style: { fontSize: 11, color: "#999", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
          h("span", null, "v" + (meta.version || 0) + " · " + (meta.updatedAt || "").slice(0, 16).replace("T", " ")),
          Number(meta.taskTotal) > 0 ? h("span", null, "任务 " + (meta.taskDone || 0) + "/" + meta.taskTotal) : null,
          Number(detail?.frozenCount) > 0 ? h("span", { title: "frozen.md 里的冻结/已定条目数" }, "冻结 " + detail.frozenCount + " 条") : null,
          task.locked ? h("span", { style: { color: "#e67e22", display: "inline-flex", alignItems: "center", gap: 4 } }, h(LockIcon, { size: 11 }), h("span", null, (task.lockSessionId || "推进中") + (task.lockTs ? " · " + new Date(task.lockTs).toLocaleString() : ""))) : null,
          task.locked ? h("button", {
            onClick: async () => {
              const res = await api("/lt-tasks/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: task.id }) });
              if (res.ok) { onRefresh(); onClose(); } else setError(res.error || "解锁失败");
            },
            style: { cursor: "pointer", fontSize: 11, color: "#e67e22", border: "1px solid currentColor", background: "transparent", borderRadius: 6, padding: "0 6px" }
          }, "解锁") : null
        ),
        loading ? h("div", { style: { padding: 20, color: "#999", textAlign: "center", fontSize: 12 } }, "加载中…") : null,
        error ? h("div", { style: { padding: 12, color: "#e74c3c", fontSize: 12 } }, error, h("br"), h("button", { onClick: load, style: { cursor: "pointer", marginTop: 6 } }, "重试")) : null,
        !loading && !error ? FIELDS.filter((f) => f.doc === "meta.status" || f.editable || String(docs[f.doc] || "").trim() !== "").map((f) => h(FieldCard, {
          key: f.doc, label: f.label, doc: f.doc, value: docs[f.doc] || "", metaStatus: meta.status, taskId: task.id,
          onSave: () => { load(); onRefresh(); }
        })) : null
      );
    }

    function TasksView({ startSession, openSession, active, prefillNew }) {
      const tasks = react.useSyncExternalStore(subscribeTasks, getTasksSnapshot);
      const [loading, setLoading] = react.useState(true);
      const [error, setError] = react.useState("");
      const [selected, setSelected] = react.useState(null);
      const [creating, setCreating] = react.useState(false);
      const [form, setForm] = react.useState({ name: "", goal: "" });
      const [formMsg, setFormMsg] = react.useState("");
      const [search, setSearch] = react.useState("");
      const [searchOpen, setSearchOpen] = react.useState(false);
      const [resetKey, setResetKey] = react.useState(0);
      const searchRootRef = react.useRef(null);

      // 切回任务 tab 时重置：收起详情/搜索、刷新列表、分组折叠（TaskList remount）
      react.useEffect(() => {
        if (!active) return;
        setSelected(null);
        setCreating(false);
        setSearch("");
        setSearchOpen(false);
        setResetKey((k) => k + 1);
        loadTasks();
      }, [active]);

      // 点击搜索框外部时收起（有搜索词则保留，学习官方行为）
      react.useEffect(() => {
        if (!searchOpen) return;
        const onClick = (e) => {
          if (!(e.target instanceof Node) || searchRootRef.current?.contains(e.target)) return;
          if (search.trim() !== "") return;
          setSearchOpen(false);
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
      }, [searchOpen, search]);

      const refresh = react.useCallback(async () => {
        const res = await loadTasks();
        if (!res.ok) setError(res.error);
        else setError("");
        setLoading(false);
      }, []);

      react.useEffect(() => { refresh(); }, [refresh]);

      // 组件内常驻轮询：TasksView 始终挂载（布局用 CSS 隐藏非当前 tab），不依赖 active
      react.useEffect(() => {
        loadTasks();
        const timer = setInterval(() => { loadTasks(); }, 3000);
        return () => clearInterval(timer);
      }, []);

      // 窗口重新获得焦点时刷新（切走再切回、或后台改数据后回来时即时同步）
      react.useEffect(() => {
        const onFocus = () => { loadTasks(); };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
      }, []);

      const submitNew = async () => {
        if (!form.name.trim() || !form.goal.trim()) { setFormMsg("请填写任务名与目标"); return; }
        const res = await api("/lt-tasks/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), goal: form.goal.trim() })
        });
        if (res.ok) { setCreating(false); setForm({ name: "", goal: "" }); setFormMsg(""); refresh(); }
        else setFormMsg(res.error || "创建失败");
      };

      return h("div", { style: { position: "relative", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { className: "lt-head", style: { padding: "4px 8px", borderBottom: "1px solid var(--dsw-alias-border-l1, #ddd)", display: "flex", alignItems: "center", gap: 5, flex: "none", minHeight: 32, overflow: "hidden" } },
          h("strong", { className: "lt-head-title", style: { fontSize: 12, flex: "1 1 auto", minWidth: 0, display: searchOpen ? "none" : "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "长期任务 (" + tasks.length + ")"),
          h("div", {
            ref: searchRootRef,
            onClick: () => { if (!searchOpen) setSearchOpen(true); },
            style: {
              flex: searchOpen ? "1 1 0%" : "0 0 auto",
              minWidth: 0,
              display: "flex", alignItems: "center", gap: 5,
              padding: searchOpen ? "4px 9px" : "4px",
              borderRadius: 7,
              border: searchOpen ? "1px solid var(--dsw-alias-border-l2)" : "1px solid transparent",
              background: searchOpen ? "var(--dsw-alias-bg-layer-1)" : "transparent",
              cursor: "pointer",
              transition: "border-color .15s ease, background .15s ease"
            }
          },
            h(IconSearch, { size: searchOpen ? 13 : 15 }),
            searchOpen ? h("input", {
              value: search, onChange: (e) => setSearch(e.target.value),
              onKeyDown: (e) => { if (e.key === "Escape") { setSearch(""); setSearchOpen(false); } },
              placeholder: "搜索任务…", autoFocus: true,
              style: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 12, padding: 0, color: "var(--dsw-alias-label-primary, inherit)" }
            }) : null,
            searchOpen ? h("button", { onClick: () => { setSearch(""); setSearchOpen(false); }, title: "清除", style: { cursor: "pointer", border: "none", background: "transparent", padding: 0, display: "inline-flex", alignItems: "center", color: "var(--dsw-alias-label-secondary, #666)" } }, h(IconClose, { size: 11 })) : null
          ),
          h("button", { onClick: () => setCreating(true), title: "新建长期任务", style: { cursor: "pointer", border: "none", background: "transparent", padding: 3, borderRadius: 4, display: "inline-flex", alignItems: "center", color: "var(--dsw-alias-label-secondary, #666)", opacity: searchOpen ? 0 : 1, transition: "opacity .18s ease" } }, h(IconPlus, { size: 15 }))
        ),
        h("div", { style: { flex: 1, minHeight: 0, overflow: "auto" } },
          loading ? h("div", { style: { padding: 24, color: "#999", textAlign: "center", fontSize: 12 } }, "加载中…") : null,
          error ? h("div", { style: { padding: 16, color: "#e74c3c", fontSize: 12, textAlign: "center" } }, error, h("br"), h("button", { onClick: refresh, style: { cursor: "pointer", marginTop: 6 } }, "重试")) : null,
          !loading && !error ? h(TaskList, { key: resetKey, tasks, search, selectedId: selected?.id, onSelect: setSelected, onDelete: async (task) => {
            if (!window.confirm("确定删除任务「" + task.name + "」？此操作不可恢复。")) return;
            const res = await api("/lt-tasks/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: task.id }) });
            if (res.ok) { setSelected(null); refresh(); }
          } }) : null
        ),
        selected ? h(TaskDetail, { task: selected, onClose: () => setSelected(null), onRefresh: refresh, openSession, startSession, prefillNew }) : null,
        h(Modal, {
          open: creating,
          onClose: () => setCreating(false),
          title: "新建长期任务",
          footer: h(Frag, null,
            h(Button, { variant: "outline", onClick: () => setCreating(false) }, "取消"),
            h(Button, { variant: "primary", onClick: submitNew }, "创建")
          ),
          children: h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
            h("div", null,
              h("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 } }, "任务名"),
              h("input", {
                value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), autoFocus: true,
                onKeyDown: (e) => { if (e.key === "Enter") submitNew(); },
                style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "6px 10px", fontSize: 13, borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", color: "var(--dsw-alias-label-primary)" }
              })
            ),
            h("div", null,
              h("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 } }, "目标"),
              h("textarea", { value: form.goal, onChange: (e) => setForm({ ...form, goal: e.target.value }), rows: 4, style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "6px 10px", fontSize: 13, borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", color: "var(--dsw-alias-label-primary)", fontFamily: "inherit", resize: "vertical" } })
            ),
            formMsg ? h("div", { style: { color: "#e74c3c", fontSize: 12 } }, formMsg) : null
          )
        })
      );
    }

    const inject = ["slots"];
    function TaskGlyph(props) {
      const s = (props && props.size) || 18;
      return h("svg", { viewBox: "0 0 24 24", width: s, height: s, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, dangerouslySetInnerHTML: { __html: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' } });
    }

    function apply(ctx) {
      const styles = ctx.get("styles");
      if (styles) ctx.effect(() => styles.insert(CSS), "lt-tasks: styles");
      // 轮询刷新任务列表：文件系统数据无事件，用模块级 store + 定时拉取（学官方响应式订阅）
      ctx.effect(() => {
        loadTasks();
        const timer = setInterval(() => { loadTasks(); }, 3000);
        return () => clearInterval(timer);
      }, "lt-tasks: poll tasks");
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      const startSession = () => {
        // 2026-09-13 修：startSession 是 UI 服务 uiWorkspace 的方法（官方 ui-sidebar 同样这样调），
        // 纯数据控制器 workspaces 上没有它 → 旧写法 typeof 检查必然失败 → 点击静默无反应。
        const nav = ctx.get("uiWorkspace");
        if (nav && typeof nav.startSession === "function") { nav.startSession(); return; }
        const ws = ctx.get("workspaces");
        if (ws && typeof ws.startSession === "function") ws.startSession();
      };
      const openSession = (sessionId) => {
        const sessions = ctx.get("sessions");
        if (!sessions || typeof sessions.open !== "function" || !sessionId) return;
        try {
          sessions.open(sessionId);
        } catch {
          // 会话不存在（如重启后未加载），fallback 到新建对话
          const ws = ctx.get("workspaces");
          if (ws && typeof ws.startSession === "function") ws.startSession();
        }
      };
      // 新建对话 → 轮询拿到新会话 id → 把一句话预填进输入框（不自动发送）
      const prefillNew = (text) => {
        // 2026-09-13 修：同上——新建会话必须走 uiWorkspace，否则下面的 typeof 判定失败直接 return
        // （表现为点「＋ 新对话」完全无反应，会话也不新建）。
        const nav = ctx.get("uiWorkspace");
        const ws = nav && typeof nav.startSession === "function" ? nav : ctx.get("workspaces");
        const sessions = ctx.get("sessions");
        const conv = ctx.get("conversation");
        if (!ws || typeof ws.startSession !== "function" || !sessions || !sessions.list) return;
        const before = sessions.list.getSnapshot?.()?.current;
        ws.startSession();
        const deadline = Date.now() + 15000;
        const tick = () => {
          if (Date.now() > deadline) return;
          const cur = sessions.list.getSnapshot?.()?.current;
          if (!cur || cur === before) { setTimeout(tick, 100); return; }
          try {
            const shell = conv?.input?.shell?.(cur);
            if (shell?.actions?.setDraft) { shell.actions.setDraft(text); return; }
          } catch {}
          setTimeout(tick, 100);
        };
        tick();
      };
            insertStyles(LT_CSS);
      slots.inject("sidebar.panellist", () => slots.register(
        { name: "sidebar.panellist", id: "dsh-lt-tasks", order: 30, label: "任务" },
        (props) => (h(TaskGlyph, props)),
      ));
      slots.inject("main", () => slots.register(
        { name: "main", key: "dsh-lt-tasks" },
        () => (h(TasksView, { startSession, openSession, prefillNew, active: true })),
      ));
    }

        // 窄宽自适应：照输入框底行「模型选择胶囊」的容器查询口径——容器越窄越先收起次要文字，始终同行，绝不换行错位；.lt-head / .lt-fhead 各自是查询容器。
    const LT_CSS = ".lt-head{container-type:inline-size}.lt-fhead{container-type:inline-size}"
      + "@container (width<=216px){.lt-head-title{display:none}}"
      + "@container (width<=230px){.lt-edit-text{display:none}}";
    function insertStyles(css) {
      try {
        // 先摘掉本插件此前注入的样式表：否则插件热重载后旧规则会留着，改动看不到。
        for (const old of document.querySelectorAll("style[data-lt-tasks]")) { try { old.remove(); } catch { /* ignore */ } }
        const style = document.createElement("style");
        style.setAttribute("data-lt-tasks", "");
        style.textContent = css;
        document.head.appendChild(style);
      } catch { /* ignore */ }
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
