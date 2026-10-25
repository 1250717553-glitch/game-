# Xiuxian Game

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Phaser](https://img.shields.io/badge/Phaser-3.70-8a2be2.svg)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-f7df1e.svg)

[中文](README.md) | **English**

An ink-wash-style cultivation (xianxia) web game built with **Phaser 3 + vanilla JavaScript**. No build step, no frameworks, no dependency manager — open `index.html` and it runs.

<div align="center">
  <img src="docs/screenshots/world-map.jpg" width="880" alt="World map">
  <p><sub>World map — click a monster to fight, click the sect to return</sub></p>
</div>

---

## Features

- **Sect map** — abode, farmland, training ground, sect hall, manual pavilion, wilderness gate
- **World map** — 8 monster nodes (including a boss), defeated marks plus per-node respawn timers
- **Turn-based combat** — pick a skill, spend qi, deal damage; enemy turn restores qi. Pills, flee, proficiency growth
- **Cultivation** — Qi Refining → Foundation → Golden Core, 9 layers each; 7 manuals, 10 skills
- **Farming** — two plots (abode + sect), 3 crops, 4 growth stages with dedicated sprites
- **Sect systems** — quest hall, treasure pavilion (spirit stones), merit hall (contribution)
- **Inventory + storage** — 50-slot bag, six-tier quality colouring
- **Saving** — 3 save slots in LocalStorage, autosave every 10s

## Tech stack

| Item | Detail |
|---|---|
| Engine | [Phaser 3.70](https://phaser.io/) via CDN |
| Language | Vanilla ES6+ (no TypeScript, no bundler) |
| Renderer | WebGL with Canvas fallback |
| Persistence | `localStorage` |
| Assets | Images inlined as base64 inside `*_data.js` to dodge `file://` CORS |
| Art | Ink wash: paper `#f5f0e1`, cinnabar `#c44536`, azure `#3a6b8c`, gold `#c9a84c` |

## Running

> **Do not open `index.html` directly via `file://`.** The inventory background is referenced through CSS `url()`, which browsers block under the `file://` protocol.

```bash
npx serve . -l 8000
# or
python -m http.server 8000
```

Then open <http://localhost:8000>.

Any static host (GitHub Pages / Vercel / Netlify) works — there is no build step. The repository is roughly 154 MB (82 MB of it inlined base64 assets), so the first clone takes a while.

## Layout

```
xiuxian-game/
├── index.html               # single entry: inline styles + ordered script tags
├── src/
│   ├── main.js              # Phaser instance, scene registry, global click bus
│   ├── config/constants.js  # every data table: realms/manuals/skills/items/monsters/seeds
│   ├── modules/player/      # stats, breakthroughs, pills, proficiency, skill loadout
│   ├── scenes/              # 10 scenes (login / sect / world / battle / abode / farm …)
│   ├── battle/              # turn-based combat
│   ├── farm/                # crop growth and plot quality
│   ├── inventory/           # bag data + inventory UI
│   ├── systems/             # save system, event bus
│   └── ui/                  # status bar / panels / manual panel
├── assets/
│   ├── images/              # original PNGs + 7 base64 data bundles
│   └── custom/              # custom asset slots (manifest.json)
├── editors/                 # three in-browser authoring tools
└── docs/screenshots/        # README images
```

## Bundled authoring tools

`editors/` contains three standalone HTML tools:

| Tool | Purpose |
|---|---|
| `asset-generator.html` | Procedurally generate ink-wash PNG assets |
| `map-editor.html` | Place, lock, import and export map layouts as JSON |
| `ui-designer.html` | Drag-and-drop UI panel layout, exported as JSON |

Press **F2** in-game to reach the editor panel.

## Known issues

The project is archived; the following are **known and unfixed**, kept as a future TODO list:

| # | Issue | Location |
|---|---|---|
| 1 | Farm / sect-hall actions never persist: `saveGame()` reads `window.gameState.saveSlot`, which is never assigned | `FarmScene.js:520` / `SectHallScene.js:697` |
| 2 | The save-manager button is broken: `saveToSlot()` is called with one argument and throws in `inventory.toJSON()` | `BaseMapScene.js:959` / `SaveSystem.js:51` |
| 3 | Realm breakthroughs are unreachable: `tryBreakthrough()` has no caller and no UI entry point | `Player.js:245` |
| 4 | Cultivation exp has almost no source; the training ground grants none | `TrainingGroundScene.js` |
| 5 | The kill-quest never completes: `killCount` is read but never written | `BaseMapScene.js:1589` |
| 6 | Quest rewards use non-existent item ids (`lingshi` / `ling_cao_seed`), producing invisible ghost items | `BaseMapScene.js:1627` |
| 7 | Planting consumes no seeds — infinite seed supply | `FarmManager.js:126` |
| 8 | Player `attack` / `defense` never enter the combat formula | `BattleScene.js:684` |
| 9 | Lifespan is not wired up; `trainingPerSecond` is unreferenced | `constants.js:42` |
| 10 | Debug resources are always granted on entering the sect map | `BaseMapScene.js:143` |

**This is a playable work-in-progress.** The main loop (login → sect → world map → battle → drops → farming → shop) works end to end, but saving and the cultivation progression are not closed loops yet.

## License

[MIT](LICENSE) © 2026 1250717553-glitch
