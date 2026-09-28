# dsh-lan-services

> This branch is the **vk-free build**: official slots only, no vk slot references; identical behaviour with or without dsh-vk-suite. The vk build is on the [main branch](https://github.com/Ln1m/dsh-lan-services/tree/main).

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

Registers the official `sidebar.panellist` slot (left-rail icon) and the `main` slot (centre panel, same id pairs them); no dsh-vk-suite needed.
