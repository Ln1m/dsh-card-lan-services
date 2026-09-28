# dsh-lan-services

> This branch is the **vk build**: vk slots only, and [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) (contract + layout) must be installed first. The vk-free build is on the [official branch](https://github.com/Ln1m/dsh-lan-services/tree/official).

[中文](README.md) · English

![LAN services card in the Extensions tab](assets/dsh-lan-services.png)

*Screenshot of a running DSH instance; demo content is sanitized.*

A local network service manager: it probes local HTTP services on ports 3090–3099, lists their titles and LAN URLs in a sidebar panel, starts/stops the processes with one click, and updates the URLs when the network changes.

## Install

```sh
dsh plugin --profile web add file:<this repo>
```

## Site list

`servers/sites.json`, keyed by port:

```json
{
  "3090": { "title": "Demo site", "root": "D:\\sites\\demo", "index": "index.html" }
}
```

## Requirements

- Windows
- Phone access goes through the 3081 reverse proxy, which is a separate concern (dsh-wifi-access / dsh-pocket)

## Seats

Registers in the vk layout's left-column "Tools" tab (`vk.sidebar.extensions`). Requires the [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) contract and layout.
