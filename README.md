> 不装 dsh-vk-suite 的零 vk 版在 [https://github.com/Ln1m/dsh-lan-services/tree/official](https://github.com/Ln1m/dsh-lan-services/tree/official)；当前 main 是双路版（没有 vk-suite 时自动走官方槽，装了才用 vk 的布局位）。

# dsh-lan-services

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

## 给局域网 / 公网链接留的位置

本插件走官方 sidebar 槽，不依赖三栏 layout，当前也不占下面这两个位。若你同时装了 `dsh-vk-suite`，那两个位是留着给链接类插件的：

| 预留位 | 用途 |
|---|---|
| `vk.statusbar.left` | 局域网链接：本机 LAN 访问地址、局域网服务清单 |
| `vk.statusbar.right` | 公网链接：隧道 / 反代 / 分享地址 |

谁实现谁填，用 `vkCard` 占位，见 dsh-vk-suite 的 README。
