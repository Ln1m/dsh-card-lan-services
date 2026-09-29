# dsh-lt-tasks

> Two builds: `main` is the **vk build** (vk slots only — install the [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) contract + skeleton first); the `official` branch is the **vk-free build** (no vk dependency, official slots only). **Use the vk build** — position: the sidebar Tasks tab (`vk.sidebar.tasks`).
> Conflicts: a slot renders only its highest-priority entry, and two registrations at the same priority throw; mutually exclusive with anything claiming the same position (see "How to use it / what it conflicts with" in [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite)).

Multi-window, long-running task management plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

A task is a persistent folder (11 archived documents + a handoff document + a lock), **not bound to any window**. Windows hand a task over through the handoff document and the archive, and the agent reads only what it needs — keeping long context and forgetting to a minimum.

[中文](README.md) · English

## Screenshot

![Tasks view](https://cdn.jsdelivr.net/gh/Ln1m/dsh-side-tasks@main/docs/screenshot.png)

## Features

- **11 business documents + meta**: `meta` (machine metadata) + `handoff / goal / frozen / tasklist / next / progress / refs / index / errors / blockers / review` (11 business docs) — one concern per file.
- **One call to pick up a task**: `advance_task` returns the full `next`, the full `tasklist`, a frozen-list digest and a document size table in a single response, so the next window can start working without reading any file.
- **Read on demand, by segment**: `get_task` returns only a document index (name / bytes / lines / title) by default. A document over 8000 characters must be read with `lines:"120-180"` or `grep:"pattern"`; reading it whole is refused.
- **The frozen list actually applies**: `freeze_task` appends confirmed decisions and settled values to `frozen.md` (append-only, never rewrites existing hand-written content). Every `advance_task` then carries the frozen digest, so settled points are no longer re-opened as open questions; `save_progress` warns (without blocking) when its content touches a frozen trigger word.
- **Zoned handoff**: the auto zone of `handoff.md` is rewritten by tools (workspace path / required reading / last 10 decisions) while the `## 人工补充` manual zone is never overwritten.
- **Multi-window handoff**: any window says "advance task X" → `advance_task` gets everything → work → `save_progress`, with no dependence on chat history.
- **6-state machine**: planning / active / paused / blocked / review / completed.
- **Concurrency lock**: `.lock` (session + timestamp), single window at a time, configurable expiry.
- **References you can keep adding**: pass `refs` when creating a task, then extend or refresh any time with `add_refs` — it clears the old read-only attribute before copying, so files can be updated. Directories over 200 files or 100 MB are only registered by absolute path, not copied. Everything copied into `refs/` is locked with the Windows read-only attribute.
- **Directory index**: `index.md` records artifact paths + Markdown headings, so you can jump straight to a section; the references section of `notes.md` lists `refs/`.
- **Progress tracking**: tasklist checkboxes auto-count done/total.
- **Frontend view**: a "Tasks" tab in the left sidebar (`vk.sidebar.tasks`, dsh-vk-suite required) — grouped collapsible list, search, slide-in detail drawer, inline editing (including reference notes and the frozen-entry count), status dropdown.
- **Task↔session link**: advancing records the session; opening a task detail auto-opens that conversation.
- **Composer prefill**: the "＋" new-task button and the detail "＋ new chat" button prefill a hint into the composer (`请帮我新建一个长期任务：` / `推进长期任务 xxx`) without auto-sending.
- **Self-growth**: on completion, generates an archive suggestion for confirmation before writing to skills.

## Install

1. Place this package where the profile can resolve it (e.g. `~/.dsh/profiles/node_modules/dsh-lt-tasks`).
2. Append to the profile `cordis.patch.yml`:

```yaml
- insert:
    - id: dsh-lt-tasks
      name: 'dsh-lt-tasks'
```

3. Restart the dsh web backend.

## Config

| Var | Default | Meaning |
|---|---|---|
| `DSH_LT_TASKS_ROOT` | `~/.dsh/lt-tasks/` | task library root (management docs / internal contract) |
| `DSH_LT_WS_ROOT` | `<user desktop>\DSHlongtasks` | output workspace root (actual artifacts, desktop side) |
| `DSH_LT_TASKS_LOCK_TTL` | `24` | lock expiry (hours) |
| `DSH_LT_SNAPSHOT` | empty | set to `full` to ignore the incremental baseline and copy the whole workspace every version (by default only this round's changes are written) |

## Tools (6)

Six tools are registered; create / delete / pause / resume / unfreeze / references go through the left-sidebar task panel (panel and tools read and write the same files). The immutable list is **model-writable** (`freeze_task`, or the `frozen` argument of `save_progress`), but only bare facts are accepted.

| Tool | Purpose |
|---|---|
| `list_tasks` | list tasks with status |
| `get_task` | read the archive: document index by default; name docs in `docs` for text, over 8000 chars requires `lines` / `grep` |
| `advance_task` | lock, mark active, and return state (next step + numbered checklist) / goal / frozen digest / recent blockers·errors·review / this round's item changes / milestone progress / handoff self-check / time since last push / document size table in one call |
| `save_progress` | save: append to `log`, write back `state` (checklist items get stable `#N` ids), refresh handoff; optionally append frozen items / blockers / errors / review (into the matching `notes` sections); reports item changes and milestone progress; bump version, unlock, and snapshot this round's artifacts into the lt workspace |
| `freeze_task` | append **bare facts** to the immutable list; `section` picks the target chapter (e.g. 禁提). Entries containing reason / consequence / guess words are rejected |
| `complete_task` | complete, generate an archive suggestion (last 15 errors + 15 summaries; never writes to skills by itself) |

Typical flow: create via panel → `advance_task` → work → `freeze_task` to pin settled values → `save_progress` → … → `complete_task`.

### Document reading discipline

| Situation | Do this |
|---|---|
| Picking a task up | call only `advance_task`; the response already carries state (next step + numbered checklist) / goal / frozen digest / recent notes / **item changes this round** / **milestone progress** / handoff self-check / time since last push |
| Needing other docs | `get_task` for the index, then name the docs you want |
| Large docs (>8000 chars, e.g. log / index / frozen) | `grep` to locate a line, or `lines:"a-b"` for a slice; reading whole is refused |
| Frozen / settled items | entries prefixed `[禁改]` / `[已定]` are **always inlined in full** by `advance_task`; the rest are inlined within budget with line ranges. Read those lines before changing, and explain first if a change is truly needed |

### Item ids, states and milestones (addressing borrowed from GitHub issues)

- Checklist items look like `- [ ] #12 text`: `#N` is assigned by the tool and **never reused** (deleted numbers are not recycled), so any document can say "see #12".
- State marks: `[ ]` todo / `[~]` in progress / `[!]` blocked / `[x]` closed; closed items carry an attribution (`—— 已完成` / `—— 用户否决` / `—— 转为 #19`).
- Group headings (`## 进行中` etc.) and prose lines are preserved verbatim; only item lines are numbered.
- Milestones live in the `## 里程碑` section of `goal.md`: `- M1 恢复调制：#1 #2 #3`. Both `advance_task` and `save_progress` report each milestone's `closed/total` and flag ids that no longer exist.
- **Handoff self-check** comes back with `advance_task`: dangling `#N` references, closed items without attribution, items missing an id.

### Writing discipline for the immutable list (`frozen.md`)

It holds **verifiable bare facts only**: one "object + value/state + source" per line.

- Source is a `file:line`, a measurement batch, or "who decided when".
- **No reasons, no consequences, no guesses** — those rot with the code and time, and they are the main hallucination source. Entries matching `因为 / 所以 / 导致 / 否则 / 说明 / 意味着 / 推测 / 可能 / 理论上` are rejected by `freeze_task` and `save_progress` (the matched words are reported back); put reasons and consequences in `log.md` / `notes.md` instead.
- Lines start with `- [禁改]` or `- [已定]`: that prefix marks a hard constraint and is always inlined.

## Directory layout (outputs separated from internal contract)

```
<DSH_LT_TASKS_ROOT>/<task>/          # internal contract (task library: management docs)
  meta.md / handoff.md / goal.md / frozen.md / state.md /
  log.md / notes.md / index.md
  .lock

<DSH_LT_WS_ROOT>/lt-task-NNN-<topic>/   # actual outputs (desktop workspace, same numbering rule as session folders)
  ...artifact files...
  refs/                              # references (copied parts are read-only)
  backups/v<N>/changed/              # snapshot: artifacts changed this round (see below)
  backups/v<N>/external/<drive>/...  # snapshot: changed job files outside the workspace
  backups/v<N>/manifest.json         # full manifest + changed/external/skipped
```

The task library holds only the internal contract (7 docs + lock). All actual outputs live in the desktop workspace folder `lt-task-NNN-<topic>` (NNN = last sequence + 1, independent numbering). `handoff.md` / `index.md` record the workspace path; after creating a task, switch the file tree to the output folder (`switch_workspace_root`) before working.

### Document ownership (one writer per doc)

| Doc | Written by | Content |
|---|---|---|
| `goal.md` | once at creation | goal + acceptance criteria |
| `state.md` | `save_progress` only | `## 下一步` (single source of truth) + `## 任务清单` |
| `frozen.md` | `save_progress` `frozen` arg / panel | frozen and settled values (digest carried by every `advance_task`) |
| `log.md` | `save_progress` appends | running log: per-round summary / changed files / decisions (auto-rotated into `archive/`) |
| `notes.md` | `save_progress` blockers/errors/review args + reference rebuild | blockers / review / errors / references (`refs/` list) |
| `handoff.md` / `index.md` | tool-generated | pointer and artifact-tree index; read-only in the panel |

### References (`refs/` and the references section of `notes.md`)

- The `## 参考资料` section of `notes.md` is rebuilt by the tool: location + actual `refs/` file list + registered-only absolute paths (other sections are untouched).
- Copy policy: a file or directory is measured against the 200-file / 100 MB threshold. Under it, it is copied into `refs/` and marked read-only; over it, only its absolute path is registered in `notes.md`.
- Adding / refreshing: the panel or `store.addRefs` clears the stale read-only attribute on `refs/` before copying, so updates never fail on read-only files.

## Version snapshots & rollback (backup rule)

Every `save_progress` (version +1) backs up the **content of the real artifact files** into the task's workspace; **task-library docs are never backed up**:

- **Snapshot path**: `<workspace>/backups/v<N>/` (N = version; `create_task` writes the **v1 baseline**)
  - `changed/<relative path>` — artifacts added or modified this round (compared against the previous `manifest.json` by bytes/mtime)
  - `external/<drive>/<original path>` — job files changed this round that live **outside** the workspace (paths come from `save_progress`'s `filesChanged`)
  - `manifest.json` — full manifest (relative path / bytes / mtime) plus `changed` / `external` / skipped entries / baseline version `base`
- **What is never backed up**: the 7 task-library docs and `meta.md` (older builds wrote `task-docs/`); no backup directory is created under `<DSH_LT_TASKS_ROOT>/<task>/`.
- **Rollback**: overlay `changed/` and `external/` from `v1`…`vN` in order (later versions win) to reconstruct version N.
- **Size guards**: files over 20 MB, or a version totalling over 200 MB, are recorded by path and size only; `DSH_LT_SNAPSHOT=full` ignores the incremental baseline and copies everything.
- **Deleting a task** (`delete_task`) removes the workspace `backups/` too — nothing is kept separately; the itemized list is confirmed before deleting.

## Development

```
plugins/lt-tasks/
├── lib/index.js      # host entry: tools + HTTP routes
├── lib/store.js      # task storage, state machine, doc I/O, refs zones, snapshots, frozen list
├── lib/lock.js       # concurrency lock
├── lib/readonly.js   # read-only attribute (mark / clear)
├── lib/tools.js      # 5 model tools
├── lib/routes.js     # HTTP API (/lt-tasks/*)
├── lib/client.js     # frontend "Tasks" view
├── test.mjs          # core logic tests (node test.mjs)
├── package.json
└── cordis.patch.yml
```

- Host changes require a dsh backend restart; client changes require a page refresh.
- Tests: `node test.mjs`.

## License

MIT
