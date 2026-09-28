# dsh-lan-services

> 本分支是 **vk 版**：只注册 vk 槽，需先装 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite)（契约 + 骨架）。零 vk 版见 [official 分支](https://github.com/Ln1m/dsh-lan-services/tree/official)。

[English](README.en.md) · 中文

![功能栏局域网服务卡片界面实拍](assets/dsh-lan-services.png)

*界面实拍：截自本机运行中的 DSH 实例，示例内容已脱敏。*

局域网服务管理器：自动探测 3090~3099 端口段上的本地 HTTP 服务，左栏面板列出标题与局域网网址，一键启停进程，换网络后网址自动更新。

## 装

```sh
dsh plugin --profile web add file:<本仓库>
```

## 站点清单

`servers/sites.json`，键是端口：

```json
{
  "3090": { "title": "示例站点", "root": "D:\\sites\\demo", "index": "index.html" }
}
```

## 前提

- Windows
- 手机访问走 3081 反代，那部分归 dsh-wifi-access

## 入口

注册在 vk 布局的左栏「功能」Tab（`vk.sidebar.extensions` 槽）。需先装 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) 的契约与骨架。
