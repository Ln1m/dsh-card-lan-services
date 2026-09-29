# dsh-lan-services

> 本分支是 **vk 版**：只注册 vk 槽，需先装 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite)（契约 + 骨架）。零 vk 版见 [official 分支](https://github.com/Ln1m/dsh-lan-services/tree/official)。

DSH 局域网服务管理器（左栏面板）：把「复习网站等本地 HTTP 服务」的**网址查看 + 启停开关**收进 DSH 侧栏，换网络后局域网网址自动更新，无需记端口、无需命令行。

- 范围：`3090~3099` 端口段（源码 `lib/index.js` 顶部 `PORT_FROM/PORT_TO` 可改）；
- **自动发现**：对端口段逐端口 GET `http://127.0.0.1:<p>/api/net`（复习网站 `server.cjs` 自带），应答即视为受管服务并自动出现在面板；
- **标题**：从服务脚本所在目录自动推断（取上层课程目录名），点标题旁的 ✎ 可改名（存 `~/.dsh/dsh-lan-services.json`）；
- **托管启停**：启动 = 插件 `spawn node <server.cjs> <port>`（detached）；停止 = 按监听端口查 PID 结束进程；
- **停止后仍在面板**：探测时会把脚本路径记入持久化文件，服务关掉后条目保留、可一键再启动（无需先手动跑一次）；
- 面板默认折叠为一行，展开/点击刷新时探测一次，无常驻轮询。

## 安装

```sh
# 源码真源：<DSH 安装根>\plugins\dsh-lan-services（改代码后须 remove + add 刷新）
node <DSH 安装根>\node_modules\@deepseek-ai\dsh\lib\bin.js plugin --profile web add file:<DSH 安装根>/plugins/dsh-lan-services
```

装完重启 DSH web 生效。

## 与 dsh-wifi-access 的分工

| 插件 | 管什么 | 端口 |
|---|---|---|
| dsh-wifi-access（移动端访问） | DSH web 本身的局域网反代（Host/Origin 改写 + polyfill，逻辑专属） | 3081 |
| dsh-lan-services（本插件） | 复习网站等其它本地 HTTP 服务（探测 /api/net + 托管启停） | 3090~3099 |

## 路由

- `GET  /lan-services/api/status`  — 状态（探测结果 / 服务列表 / 局域网地址）
- `POST /lan-services/api/start`   — 启动 `{port}`
- `POST /lan-services/api/stop`    — 停止 `{port}`
- `POST /lan-services/api/rename`  — 改名 `{port, title}`

## 说明

- 新复习网站：**先把它跑起来一次**（node server.cjs 或让 DSH 帮跑），刷新面板即自动收录，之后即可一键启停；跑起来之前插件无从得知它的脚本路径。
- 服务需自带 `/api/net`（现有两个复习网站 server.cjs 模板均有）；监听 `0.0.0.0`，局域网内设备可访问，仅适合可信家庭/办公网络。
- **收录启动路径的时机**：只有「服务正在运行时」被探测到，才会把 `script`（启动路径）写进状态文件；一个新服务必须先被跑起来一次，面板才可能一键启动它。
- **两个已知坑（2026-09-13 修复/记录）**：① 原 `const title = overrides[p] || mergeKnown(p, {script, title: dflt}).title || dflt;` 短路——端口一旦改过名（override 非空），`mergeKnown` 被整段跳过 → `script` 恒为空、面板「启动」按钮长期禁用（实测案例：3092「日历-备考」）。现改为无条件调用 `mergeKnown`（见 `lib/index.js` 内注释）。② **启动脚本必须用绝对路径**：插件靠进程命令行解析脚本路径，`node server.cjs` 这种相对路径解析不出来（引号里是 `node.exe`，会被 `.exe` 判掉），会被记成空。
- 依赖零（纯 Node 内置模块），官方源码零改动。
