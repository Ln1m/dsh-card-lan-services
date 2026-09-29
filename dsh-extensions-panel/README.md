# dsh-extensions-panel

> 本分支是 **vk 版**：只注册 vk 槽，需先装 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite)（契约 + 骨架）。零 vk 版见 [official 分支](https://github.com/Ln1m/dsh-extensions-panel/tree/official)。

> 两个版本：`main` = **vk 版**（只注册 vk 槽，需先装 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) 契约 + 骨架）；`official` 分支 = **官方挂载版**（零 vk 依赖，挂官方槽）。**推荐 vk 版** —— 位置：左栏「工具」Tab 里的一条卡（`vk.sidebar.extensions`）。
> 冲突：一个槽位只渲染优先级最高的一条，同优先级重复注册会直接抛错；与占同一位置的插件互斥（详见 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) 的「推荐怎么用 / 会跟谁冲突」）。

[English](README.en.md) · 中文

![功能栏虚拟显示器卡片界面实拍](assets/dsh-extensions-panel.png)

*界面实拍：截自本机运行中的 DSH 实例，示例内容已脱敏。*

在左栏「功能」Tab（`vk.sidebar.extensions` 槽）里注册一张虚拟显示器开关卡片。

## 装

```sh
dsh plugin --profile web add file:<本仓库>
```

装完重启 web 实例。
