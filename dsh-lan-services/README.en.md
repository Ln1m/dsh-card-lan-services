# dsh-lan-services

> Two builds: `main` is the **vk build** (vk slots only — install the [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite) contract + skeleton first); the `official` branch is the **vk-free build** (no vk dependency, official slots only). **Use the vk build** — position: one card inside the sidebar Tools tab (`vk.sidebar.extensions`); **the panel and the card pattern live in [dsh-side-tools](https://github.com/Ln1m/dsh-side-tools)**, and the cards this one hangs internally are not open source.
> Conflicts: a slot renders only its highest-priority entry, and two registrations at the same priority throw; mutually exclusive with anything claiming the same position (see "How to use it / what it conflicts with" in [dsh-vk-suite](https://github.com/Ln1m/dsh-vk-suite)).

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
