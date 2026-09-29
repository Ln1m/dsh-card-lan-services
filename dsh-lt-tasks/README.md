# dsh-lt-tasks

> 两个版本：`main` = **vk 版**（只注册 vk 槽，需先装 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) 契约 + 骨架）；`official` 分支 = **官方挂载版**（零 vk 依赖，挂官方槽）。**推荐 vk 版** —— 位置：左栏「任务」Tab（`vk.sidebar.tasks`）。
> 冲突：一个槽位只渲染优先级最高的一条，同优先级重复注册会直接抛错；与占同一位置的插件互斥（详见 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) 的「推荐怎么用 / 会跟谁冲突」）。

多窗口接力推进长期任务的 DeepSeek Harness 插件。

任务 = 持久文件夹（11 个存档文档 + 对接文档 + 锁），不绑定任何窗口；靠「对接文档 + 存档」交接，AI 按需定位文档，把长上下文 / 遗忘降到最低。

[English](README.en.md)

## 界面

![Tasks 视图](https://cdn.jsdelivr.net/gh/Ln1m/dsh-side-tasks@main/docs/screenshot.png)

## 功能

- **11 业务文档 + meta**：`meta`（机器元数据）+ `handoff / goal / frozen / tasklist / next / progress / refs / index / errors / blockers / review` 共 11 个业务文档，一类内容一个文档。
- **一次拿全的交接**：`advance_task` 直接内联 `next` 全文、`tasklist` 全文、冻结清单摘要与文档规模表，接手窗口读完返回值即可开工，不必再逐个读档案文件。
- **按需分段读**：`get_task` 默认只回文档清单（名 / 字节 / 行数 / 标题）；单个文档超过 8000 字符必须用 `lines:"120-180"` 或 `grep:"正则"` 分段，整读会被拒绝。
- **冻结清单生效**：`freeze_task` 把已确认事项与口径写进 `frozen.md`（追加式，不动已有手写内容），此后每次 `advance_task` 都带冻结摘要，已定的东西不再被当待定项重问；`save_progress` 若命中冻结触发词，会在返回值里告警（不阻断）。
- **对接文档分区**：`handoff.md` 的自动区由工具重写（产出路径 / 开工必读 / 最近 10 条决策），`## 人工补充` 手写区工具永不覆盖。
- **多窗口接力**：任何窗口「推进长期任务 xxx」→ `advance_task` 拿全 → 执行 → `save_progress`，不依赖历史对话。
- **6 态状态机**：筹划中 / 进行中 / 已暂停 / 已阻塞 / 待审 / 已完成。
- **并发锁**：`.lock`（session + 时间戳），单窗口推进，超时可配。
- **参考资料可增补**：建任务时给 `refs`，之后随时用 `add_refs` 补 / 更新——复制前自动解除旧只读再覆盖；超过 200 个文件或 100 MB 的目录只登记绝对路径，不复制。复制进 `refs/` 的按 Windows 只读属性锁定。
- **目录索引**：`index.md` 记录产出文件绝对路径 + Markdown 章节，可定位到文档内部；`notes.md` 的参考资料小节记录 `refs/` 清单。
- **任务完成度**：tasklist 的 checkbox 自动统计完成/总数。
- **前端视图**：左栏「任务」Tab（`vk.sidebar.tasks` 槽，需先装 dsh-vk-suite），分组折叠列表 + 搜索 + 详情抽屉 + inline 编辑（含参考资料备注与冻结条目数）+ 状态下拉。
- **任务↔对话关联**：推进时记录对话 session，点任务详情自动打开对应对话。
- **输入框预填**：点「＋」新建任务 / 详情页「＋新对话」时，自动在对话输入框预填引导语（`请帮我新建一个长期任务：` / `推进长期任务 xxx`），不自动发送。
- **自成长**：完成时生成归档建议，确认后写入知识库 / skill。

## 安装

1. 把本包放到 profile 可解析位置（如 `~/.dsh/profiles/node_modules/dsh-lt-tasks`）。
2. 在 profile 的 `cordis.patch.yml` 追加：

```yaml
- insert:
    - id: dsh-lt-tasks
      name: 'dsh-lt-tasks'
```

3. 重启 dsh web 后端。

## 配置

| 变量 | 默认 | 说明 |
|---|---|---|
| `DSH_LT_TASKS_ROOT` | `~/.dsh/lt-tasks/` | 任务库根目录（内部约定 / 管理文档） |
| `DSH_LT_WS_ROOT` | `<用户桌面>\DSHlongtasks` | 产出工作区根目录（实际产出，桌面侧） |
| `DSH_LT_TASKS_LOCK_TTL` | `24` | 锁超时（小时） |
| `DSH_LT_SNAPSHOT` | 空 | 设 `full` 时忽略增量基线、每版全量复制工作区产物（默认只落本轮改动） |

## 用法

### 模型工具（6 个）

模型注册 6 个工具；建 / 删 / 暂停 / 恢复 / 解冻 / 参考资料走左侧栏任务面板（面板与工具读写同一套档案）。不可修改列表**模型可写**（`freeze_task` 或 `save_progress` 的 `frozen` 参数），但只收基础事实。

| 工具 | 作用 |
|---|---|
| `list_tasks` | 列出所有任务及状态 |
| `get_task` | 读档案：默认只回文档清单；`docs` 点名取正文，超过 8000 字符必须配 `lines` / `grep` 分段 |
| `advance_task` | 推进：加锁、置进行中，并一次返回 state（下一步 + 编号清单）/ 目标 / 冻结摘要 / 最近阻塞·错误·审查 / 本轮条目变化 / 里程碑进度 / 交接自检 / 距上次推进多久 / 文档规模表 |
| `save_progress` | 存档：流水进 `log`、状态写回 `state`（清单条目自动分配稳定编号 `#N`）、刷新 handoff；可追加冻结项 / 卡点 / 错误 / 审查（进 `notes` 对应小节）；回报本轮条目变化与里程碑进度；版本 +1、解锁，并把本轮产物快照进 lt 工作区 |
| `freeze_task` | 往不可修改列表追加**基础事实**；`section` 可指定落进哪一章（如「禁提」）。含原因 / 后果 / 推测词的条目会被拒收 |
| `complete_task` | 完成，生成归档建议（错误与总结各取最近 15 条，不自动写知识库） |

典型流程：面板建任务 → `advance_task` → 工作 → `freeze_task` 钉死已定值 → `save_progress` → … → `complete_task`。

### 文档读取纪律

| 场景 | 做法 |
|---|---|
| 接手开工 | 只调 `advance_task`，返回值已含 state（下一步 + 编号清单）/ 目标 / 冻结摘要 / 最近备忘 / **本轮条目变化** / **里程碑进度** / 交接自检 / 距上次推进多久 |
| 要别的档案 | `get_task` 先看清单，再 `docs` 点名取正文 |
| 大文档（>8000 字符，如 log / index / frozen） | 用 `grep` 定位行号，或 `lines:"a-b"` 取段；整读被拒 |
| 冻结 / 已定项 | 带 `[禁改]` / `[已定]` 前缀的条目在 `advance_task` 摘要里**全量内联**；其余按预算内联并标注行号。改动前按行号补齐，确需改先说明 |

### 条目编号、状态与里程碑（借 GitHub issue 的可寻址性）

- 清单条目形如 `- [ ] #12 内容`：`#N` 由工具分配、**永不复用**（删掉的号不回收），文档里可以直接写「见 #12」。
- 状态位：`[ ]` 未开工 / `[~]` 进行中 / `[!]` 阻塞 / `[x]` 已关闭；关闭时补归因（`—— 已完成` / `—— 用户否决` / `—— 转为 #19`）。
- 分组标题（`## 进行中` 等）与说明行原样保留，只有条目行会被编号。
- 里程碑写在 `goal.md` 的 `## 里程碑` 节：`- M1 恢复调制：#1 #2 #3`；`advance_task` 与 `save_progress` 回报每个里程碑的 `closed/total`，并标出指向不存在的条目。
- **交接自检**随 `advance_task` 返回三类问题：悬空 `#N` 引用、已关闭却没写归因的条目、没编号的条目。

### 不可修改列表（`frozen.md`）的写法纪律

只存**可核验的基础事实**：一条一个「对象 + 值/状态 + 来源」。

- 来源写 `文件:行`、实测批次，或「谁 何时定」。
- **不写原因、不写后果、不写推测**——这三类会随代码与时间腐烂，也是模型幻觉的源头。命中 `因为 / 所以 / 导致 / 否则 / 说明 / 意味着 / 推测 / 可能 / 理论上` 等词的条目，`freeze_task` 与 `save_progress` 会**拒收并回报命中的词**；原因与后果请写进 `log.md` / `notes.md`。
- 条目行以 `- [禁改]` 或 `- [已定]` 开头：这是硬约束标记，摘要必出。

## 目录结构（产出与内部约定分离）

```
<DSH_LT_TASKS_ROOT>/<任务名>/          # 内部约定（任务库，存管理文档）
  meta.md / handoff.md / goal.md / frozen.md / state.md /
  log.md / notes.md / index.md
  .lock

<DSH_LT_WS_ROOT>/lt-task-NNN-<主题>/   # 实际产出（桌面工作区，与会话文件夹同编号规则）
  ...产出文件...
  refs/                                # 参考资料（已复制的部分为只读）
  backups/v<N>/changed/                # 版本快照：本轮改动的产出文件（见下）
  backups/v<N>/external/<盘符>/<原路径>  # 版本快照：工作区外被改的作业文件
  backups/v<N>/manifest.json           # 本版全量清单 + changed/external/跳过项
```

任务库只存「内部约定」（7 文档 + 锁）；实际产出一律落在桌面产出工作区 `lt-task-NNN-<主题>` 文件夹（NNN 为已有序号 + 1，独立编号）。`handoff.md` / `index.md` 记录产出区路径，创建任务后请把文件树切到产出区（`switch_workspace_root`）再开工。

### 文档职责（一个写入者，一处真源）

| 文档 | 谁写 | 内容 |
|---|---|---|
| `goal.md` | 建任务时一次 | 目标 + 验收判据 |
| `state.md` | 只有 `save_progress` | `## 下一步`（唯一真源）+ `## 任务清单` |
| `frozen.md` | `save_progress` 的 `frozen` 参数 / 面板 | 禁改与已定口径（`advance_task` 每次带摘要） |
| `log.md` | `save_progress` 追加 | 流水：每轮总结 / 改动文件 / 决策（自动分卷到 `archive/`） |
| `notes.md` | `save_progress` 的 blockers / errors / review 参数 + 参考资料重建 | 阻塞 / 审查 / 错误 / 参考资料（`refs/` 清单） |
| `handoff.md` / `index.md` | 工具自动生成 | 指针与产出文件树索引，面板只读 |

### 参考资料（`refs/` 与 `notes.md` 的参考资料小节）

- `notes.md` 的「## 参考资料」小节由工具重建：位置 + `refs/` 实际文件清单 + 仅登记未复制的绝对路径（其余小节不受影响）。
- 复制策略：单个文件或目录按 200 文件 / 100 MB 阈值判定——未超阈值复制进 `refs/` 并置只读；超过则只在 `notes.md` 登记绝对路径。
- 补 / 更新：面板或 `store.addRefs` 会先解除 `refs/` 旧只读属性再覆盖，因此文件可以更新，不会因只读失败。

## 版本快照与回退（备份规则）

每次存档（`save_progress`，版本 +1）把**实际产物文件的内容**备份进对应产出工作区；**不备份任务库自身文档**：

- **快照路径**：`<产出工作区>/backups/v<N>/`（N = 版本号；`create_task` 时生成 **v1 基线**）
  - `changed/<相对路径>` —— 本轮新增或修改的产出文件（与上一版 `manifest.json` 的字节 / 时间戳比对，只落改动）
  - `external/<盘符>/<原路径>` —— 本轮被改、且位于产出工作区**之外**的作业文件（路径取自 `save_progress` 的 `filesChanged`）
  - `manifest.json` —— 本版全量清单（相对路径 / 字节 / 修改时间）+ `changed` / `external` / 跳过项 / 基准版本号 `base`
- **不备份什么**：任务库的 7 个文档与 `meta.md` 不进快照（旧版曾写 `task-docs/`）；`<DSH_LT_TASKS_ROOT>/<任务名>/` 内不产生任何备份目录。
- **回退口径**：把 `v1`…`vN` 的 `changed/` 与 `external/` 依次叠加回工作区（后版覆盖前版），即得到第 N 版状态。
- **体积护栏**：单文件 >20 MB 或单版累计 >200 MB 时只登记路径与大小、不复制；`DSH_LT_SNAPSHOT=full` 忽略增量基线、每版全量。
- **删除任务**（`delete_task`）会连同工作区 `backups/` 一并删除、不另行保留 —— 删除前先列明细经你确认。

## 开发

```
plugins/lt-tasks/
├── lib/index.js      # host 入口：注册工具 + HTTP 路由
├── lib/store.js      # 任务存储、状态机、文档读写、refs 分区、快照、冻结清单
├── lib/lock.js       # 并发锁
├── lib/readonly.js   # 只读属性（标记 / 解除）
├── lib/tools.js      # 5 个模型工具
├── lib/routes.js     # HTTP 接口（/lt-tasks/*）
├── lib/client.js     # 前端「任务」视图
├── test.mjs          # 核心逻辑单测（node test.mjs）
├── package.json
└── cordis.patch.yml
```

- host 改动需重启 dsh 后端；client 改动刷新页面即可。
- 测试：`node test.mjs`。

## License

MIT
