<div align="center">

# 🏗 Architecture

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](../LICENSE) ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) ![Canvas](https://img.shields.io/badge/Canvas-2D-4ade80)

*How the single file is put together.*

</div>

IDLE CITY is one vanilla-JavaScript file (`src/game.js`) plus one stylesheet (`src/style.css`),
assembled into a single HTML page. There is **no framework, no bundler and no runtime dependency**.
This document is a map of the code so you can find your way around quickly.

---

## 1. High-level shape

```
src/index.html      page shell — markup for the HUD, panels and modals
src/style.css       all styling + the responsive / mobile layout
src/game.js         the entire engine (data → simulation → rendering → UI → input)
```

`game.js` is organised top-to-bottom in roughly this order:

| Section | Representative functions | Responsibility |
|---|---|---|
| **PRNG** | `srand`, `rnd` | Seeded xorshift so map generation is reproducible per save |
| **Data tables** | `AGES`, `T`, `DEFS`, `CATS`, `QUESTS`, `TECHS`, `CHALS`, `EVENTS`, `PETS`, `TUT` | Every building, age, quest, tech, challenge, event and tutorial step lives in plain data |
| **State** | `newState`, `S`, `keyOf` | The whole game state is one `S` object |
| **World generation** | `genMap`, `blob`, `buildRoadNet` | Procedural terrain + hall placement + road-connectivity graph |
| **Rules & economy** | `canPlace`, `placeCost`, `pay`, `tryBuild`, `demolishAt`, `computeCity`, `simTick` | Placement validation, costs, and the per-tick economy |
| **Progression** | `checkQuests`, `tryAgeUp`, `buyTech`, `checkAch`, `checkChal`, `tryAscend` | Quests, ages, research, achievements, challenges, ascension |
| **Events** | `fireEvent`, `setWeather`, `triggerDisaster`, `newPetition` | Random events, weather and disasters |
| **Rendering** | `prerenderTerrain`, `render`, `drawBuilding`(+ `drawHall`, `drawHouse`, …), `drawAgent`, `drawMinimap`, `drawStats` | Canvas drawing |
| **Camera & input** | `camS`, `camClamp`, `zoomAt`, `canvasPos`, mouse/touch/wheel handlers | Pan, zoom, place |
| **UI** | `rebuildTabs`, `rebuildItems`, `updateHUD`, `updateInfo`, `updateQuests`, `scanAlerts`, `toast` | DOM panels and HUD |
| **Persistence** | `saveGame`, `loadGame`, `exportCode`, `importCode` | `localStorage` + shareable save codes |
| **Loop** | `frame` | The `requestAnimationFrame` game loop |

---

## 2. The world

- **Grid:** `GW × GH = 44 × 28` tiles, `TS = 26` px each.
- **Tile types (`T`):** `GRASS`, `WATER`, `FOREST`, `STONE`, `ROAD`.
- **`genMap()`** seeds the PRNG from the save, scatters water blobs and a winding river, adds forest
  and stone, clears a plaza in the middle and drops the **Town Hall**, then paints a short starter
  road. Terrain is stored as `map[z][x]`.
- **`buildRoadNet()`** floods outward from the Town Hall across road tiles to build `roadNet[][]` —
  the connectivity graph. A building only functions if it is adjacent to this network.

---

## 3. State & persistence

The entire game is a single plain object:

```js
S = { age, money, mats, fuel, food, waste, legacy, weather, pop, hap, time, speed,
      buildings: [ { d, x, y, lvl, dev, xp, st } … ], questsDone, tech, ach, medals, … }
```

- **Autosave:** `saveGame()` writes a compact array form into `localStorage` under
  `idleCity_s<slot>` (three slots), triggered on a timer and on page hide.
- **Portability:** `exportCode()` serialises the save to a text code prefixed **`IDLE1:`**;
  `importCode()` parses it back. This is how cities move between devices.
- **No server, no network** — persistence is entirely browser-local.

---

## 4. Simulation loop

```
requestAnimationFrame
        │
        ├─ 60 fps cap  +  full idle while the tab is hidden
        │
        ├─ dt = clamp(frame delta)
        ├─ simAcc += dt × speed          ──► while (simAcc ≥ 1) simTick(1)
        ├─ updateAgents(dt × speed)
        ├─ autosave every ~10 s
        ├─ HUD refresh every 0.5 s
        ├─ rebuild panels only when `uiDirty`
        ├─ re-render terrain only when `terrainDirty`
        └─ render()
```

`simTick()` is a **fixed one-unit step**, so the economy behaves identically at 1× and 8× speed.
It advances time, recomputes the city (`computeCity()`), decays event timers, rolls weather and
events, and applies power/fuel/waste/happiness effects.

`computeCity()` is the single source of truth for derived values — capacity, jobs, power produced
vs used, pollution, fun, income rates — and everything else reads from it.

---

## 5. Rendering

Everything is **drawn with Canvas 2D vector primitives — there are no sprite sheets.**

- **Terrain is pre-rendered once** into an offscreen canvas (`gT`, `GW·TS × GH·TS`) by
  `prerenderTerrain()` and then blitted each frame. It is only redrawn when terrain changes or the
  Age changes (each Age has its own palette in `AGES`).
- **Buildings** are drawn procedurally by `drawBuilding()` which dispatches to `drawHall`,
  `drawHouse`, `drawShop`, `drawFactory`, `drawPark`, `drawUtil`, `drawPlant`, `drawSvc`,
  `drawWonder`, so a building's appearance reflects its level and the current Age.
- **Culling:** `render()` computes the visible tile window from the camera and skips off-screen
  buildings.
- **Overlays:** day/night tint with lit road lamps, rain/snow/heat effects, service-radius circles,
  hover and selection outlines.
- **Camera:** `cam = { z, ox, oy }`; `camS()` gives the world→screen scale and `camClamp()` keeps
  the map framed. `zoomAt()` zooms around a screen point (used by wheel, pinch and the +/- buttons).
- A separate small canvas draws the **minimap**.

---

## 6. Input

| Input | Action |
|---|---|
| Click / tap | Place the selected tool, or select a building to inspect |
| Drag | Paint roads / demolish (when a tool is active), otherwise **pan** the map |
| Wheel / pinch | Zoom around the pointer |
| Double-tap | Zoom in |
| Buttons | Zoom in/out/fit, undo, speed, tabs |

`canvasPos()` converts pointer coordinates into tile coordinates, accounting for the canvas
backing-buffer scale so it stays correct at every device-pixel-ratio.

---

## 7. UI & the responsive/mobile layer

The HUD is plain HTML/CSS, not canvas. `updateHUD()` writes the resource bar and status line on a
throttled timer; the build panel, quests and alerts are rebuilt only when `uiDirty` is set.

The responsive design is deliberate:

- **CSS breakpoints** at **900 px** (narrower panels) and **700 px** (mobile layout).
- Below 700 px the layout flips to `column-reverse` — **map on top, build panel at the bottom** —
  and the side panel becomes a **slide-in drawer** behind the ☰ button.
- The **top bar wraps into two rows**: a controls row (menu + speed) that always stays on-screen,
  and a horizontally scrollable resources row. This is what keeps the speed controls reachable on
  a phone.
- **Safe-area insets** (`env(safe-area-inset-*)`) are honoured on notched devices.

The JS side complements it:

- `resizeCanvas()` sizes the canvas backing buffer to the element with a **device-pixel-ratio cap
  of 2** and a **~2.6 MP pixel budget**, so high-DPI phones don't allocate huge buffers.
- A **`ResizeObserver`** on the map container, plus a **self-healing size check** in the loop,
  keep the buffer matched to the element — preventing the aspect-ratio distortion that appears when
  the layout settles after load.
- `mobileDefaultView()` frames a sensible default view (~16 tiles) centred on the Town Hall on
  first load.

---

## 8. Performance notes

- Terrain pre-rendered once; buildings culled per frame.
- Render loop capped at **60 fps** and **fully idle while the tab is hidden**.
- Canvas resolution capped by pixel budget (see above).
- DOM writes throttled (HUD at 0.5 s; panels only on change).
- The simulation is fixed-step, so it never "spirals" when a frame is slow.

---

## 9. Extending the game

Because everything is data-driven, most additions are a few lines in a table:

- **New building** → add an entry to `DEFS` with a `cat` matching a tab in `CATS`.
- **New tech** → add to `TECHS` (with `age`, `cost`, optional `req`).
- **New quest** → add to the right array in `QUESTS` with a `c()` predicate and a reward.
- **New Age** → extend `AGES` (palette + `mult`) and add a quest set.
- **New event / petition** → add to `EVENTS` / `PETS`.

Then run `node build/build.js` to regenerate the single-file bundles.

---

<div align="center"><sub>One file, one loop, endless cities.</sub></div>
