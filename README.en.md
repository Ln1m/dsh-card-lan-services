# dsh-side-suite

[中文](README.md) | English

Left column: file tree, file opener, tools tab, LAN services, long-running tasks

> Requires [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) first.

## Packages

| Directory | What it does |
|---|---|
| `dsh-files-tree` | File tab in the left column plus the @ file picker in the composer |
| `dsh-files-open` | Open any local file in the right column |
| `dsh-extensions-panel` | Tools tab: toggle cards for LAN services and mobile access |
| `dsh-lan-services` | Probe ports 3090-3099, list titles and LAN URLs, start/stop in one click |
| `dsh-lt-tasks` | Multi-window long-running task management: a task is a durable folder |

## Install

```sh
# one package
dsh plugin --profile web add file:<this repo>/dsh-files-tree
```

Or install the whole family on Windows PowerShell:

```powershell
./install.ps1
```

Install straight from the release, no clone needed:

```sh
dsh plugin --profile web add "https://github.com/Ln1m/dsh-side-suite/releases/download/v0.1.0/dsh-files-tree-0.1.0.tgz"
dsh plugin --profile web add "https://github.com/Ln1m/dsh-side-suite/releases/download/v0.1.0/dsh-files-open-0.1.0.tgz"
dsh plugin --profile web add "https://github.com/Ln1m/dsh-side-suite/releases/download/v0.1.0/dsh-extensions-panel-0.1.0.tgz"
dsh plugin --profile web add "https://github.com/Ln1m/dsh-side-suite/releases/download/v0.1.0/dsh-lan-services-0.1.0.tgz"
dsh plugin --profile web add "https://github.com/Ln1m/dsh-side-suite/releases/download/v0.1.0/dsh-lt-tasks-0.7.0.tgz"
```

Restart the web instance afterwards. Each package directory carries its own README.

## Screenshots

![dsh-extensions-panel](dsh-extensions-panel/assets/dsh-extensions-panel.png)

![dsh-lan-services](dsh-lan-services/assets/dsh-lan-services.png)

## License

MIT
