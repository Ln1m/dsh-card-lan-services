# dsh-side-suite

中文 | [English](README.en.md)

左栏家族：文件树、文件打开、工具 Tab、局域网服务、长期任务

> 前置：先装 [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite)。

## 包

| 目录 | 作用 |
|---|---|
| `dsh-files-tree` | 左栏文件 Tab，以及输入区 @ 文件选择 |
| `dsh-files-open` | 在右栏打开任意本机文件 |
| `dsh-extensions-panel` | 左栏「工具」Tab：局域网服务与移动端访问的开关卡片 |
| `dsh-lan-services` | 探测 3090~3099 端口的本地服务，列出标题与局域网网址，一键启停 |
| `dsh-lt-tasks` | 多窗口长期任务管理：一个任务 = 一个持久文件夹 |

## 装

```sh
# 只装其中一个包
dsh plugin --profile web add file:<本仓库>/dsh-files-tree
```

整族一次装完（Windows PowerShell）：

```powershell
./install.ps1
```

装完重启 web 实例。每个包目录里还有它自己的 README。

## 界面

![dsh-extensions-panel](dsh-extensions-panel/assets/dsh-extensions-panel.png)

![dsh-lan-services](dsh-lan-services/assets/dsh-lan-services.png)

## 许可

MIT
