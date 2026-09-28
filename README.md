# dsh-lan-services

> 本分支是 **零 vk 版**：只注册官方槽，代码不引用任何 vk 槽，装不装 dsh-vk-suite 都一样。vk 版见 [main 分支](https://github.com/Ln1m/dsh-lan-services/tree/main)。

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

注册官方 `sidebar.panellist` 槽（左栏图标）与 `main` 槽（中央面板，同一个 id 配对），不依赖 dsh-vk-suite。
