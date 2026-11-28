<div align="center">

# 📓 Changelog

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](LICENSE) ![Version](https://img.shields.io/badge/version-1.4.1-blue.svg) ![Keep a Changelog](https://img.shields.io/badge/keep%20a%20changelog-1.1.0-orange) ![SemVer](https://img.shields.io/badge/semver-2.0.0-blue)

All notable changes to **IDLE CITY — Ages of Growth** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

</div>

## [Unreleased]

## [1.4.1] — 2026-11-28

- **The shop window described a different game: eight ages, and three files naming three
  versions.** The site's progression band stopped at the Fusion Age and its headline read
  "Eight ages" while the game has had nine since 1.2.0 — so the one thing the page never showed
  was the endgame the whole 1.4.0 Legacy ladder is built around: the Orbital Age, ×12 income, the
  Dyson Ring, Ascension. `docs/GAMEPLAY.md` §3 had the same stale count in its own heading, directly
  above a table that already listed nine rows. Separately, the version badge read **1.1.0** on the
  site, **1.2.0** in the README and **1.4.0** in the changelog, against `package.json`'s 1.4.0 —
  three answers to one question.
  - **The band now ends at Orbital.** A ninth chip (`Age 8 · Orbital · ×12.0`) and a `--era-8`
    colour continue the ramp, the `--grad` gradient spans all nine, and the rail is a 9-column grid
    with a 5-column step at 1100 px so the chips stay legible.
  - **One version, one place.** Every badge now reads 1.4.1, and `test/content.test.js` compares
    them to `package.json` so they cannot drift apart again.
  - **Proved, not asserted.** A new §11 in `test/content.test.js` reads the era chips out of
    `docs/index.html` and compares them to `AGES` one by one — count, order, name and multiplier —
    and checks that the band's headline and `GAMEPLAY.md`'s heading spell the number of ages the
    tables actually hold. Every one of those assertions fails on 1.4.0: the rail had 8 chips where
    `AGES.length` is 9, the headline said "Eight ages", and both headings said "eight".

## [1.4.0] — 2026-11-21

- **The endgame is worth something, and Legacy is a ladder.** Ascension used to award a flat `+1`
  whatever the run did, so a city that finished the Orbital Age — the Dyson Ring, nine wonders, the
  whole research tree — scored exactly the same as one that limped to 2,500 citizens. The ring was
  the last thing the game asked for and it was worth nothing, and Legacy was a number with no name
  and no next step. Both are fixed by one new pure module, `src/legacy.js`, which the page loads
  before `game.js` and `build/build.js` inlines into both shipped files.
  - **`Legacy.award(run)`** scores the run: **1** for ascending, **+1** for the Dyson Ring,
    **+1 per 3 wonders** (up to 9), **+1 per 1,000 citizens past 2,500** (up to +3,000) and **+1**
    for all 10 techs — a bare ascension is still 1, so no existing save loses value, and a finished
    Orbital run is 9.
  - **`Legacy.rank(points)`** walks a named ladder: Settler (0), Founder (3), Steward (6),
    Architect (10), Worldsmith (15), Ringbearer (21), Star-founder (28), with `nextRank()`,
    `toNext()` and `label()` for the HUD.
  - **What did not change:** +25% income per point (`incomePct()`), and the starting seed of 1,500
    money and 600 materials per point (`startBonus()`) — both now read from one place instead of two
    literals in `restartCity()`.
  - **In the UI:** the Ascend button previews the award (`ASCEND → +4 Legacy · Architect`), the age
    pill shows `🏛️ Founder · 3`, and crossing a threshold announces the rank-up and the points to
    the next one.
- **Proved, not asserted.** `test/legacy.test.js` (42 assertions) is new: the property that was false
  is now the first assertion (a ring run scores strictly more than a bare one), each term of the
  score is tested on its own, the award is checked monotonic in population, every junk input
  (`null`, `NaN`, `Infinity`, `-5000`, a string, `[]`) is refused to a whole point ≥ 1, the ladder is
  checked strictly ascending from 0 with unique names, and the two pre-existing rewards are pinned.
  `test/content.test.js` gained six checks that the ladder is *wired* — the page loads `legacy.js`
  before `game.js`, `game.js` calls `Legacy.award()`, and the flat `+1` has not come back — and
  `test/build.test.js` now requires `src/legacy.js` and a `Ringbearer` marker in both shipped files.
  Three mutations were run and all three were caught: dropping the ring term, making the award a
  flat 1, and loading `legacy.js` after `game.js`.
- Docs follow the code: README's feature row, `docs/GAMEPLAY.md` §8, the site's Prestige stat, the
  Ascension card and the FAQ answer all describe the scored award and the ladder.

## [1.3.0] — 2026-11-18

- **The ninth age: the ORBITAL AGE.** The game ended at the Fusion Age with the
  Space Elevator standing in a city that had nowhere left to go. The Orbital Age
  (×12.0 income, the largest multiplier in the game) gives that elevator a
  destination and four things to build there: the **Orbital Solar Array** (🛰,
  700 power, and the sun multiplier applies — no atmosphere in the way), the
  **Orbital Academy** (🎓, education, radius 16 — the widest in the game), the
  **Ring Park** (🌌, +26 fun, the largest in the game) and the **Dyson Ring**
  (🪐, a wonder: +6 happiness and +5% income, one per city). Four new quests gate
  it, and the last of them asks for the whole research tree as well as the wonder.
- **Ascension is the last age, not the eighth one.** Two places compared
  `S.age >= 7` while the rest of the game said `AGES.length - 1`. That was
  invisible while there were eight ages and wrong the moment a ninth existed:
  the new final age would have handed out ascension an age early, at the Fusion
  Age, where it was already possible. Both now read `AGES.length - 1`, and the
  ascension label and its toast name the last age from `AGES` instead of saying
  "Fusion Age" in a string.
- **Two superlatives were retired rather than left false.** The Holo Garden
  claimed "+18 city fun, the largest in the game" and the Nano Clinic "the widest
  health coverage in the game (r 14)" — both true until a bigger park and a wider
  academy existed. The garden now just says +18; the clinic's claim was about
  health and still holds, so it stands.
- **`test/content.test.js` now checks the two tables it could never see.** It
  cut `src/game.js` at `ageCost()` — which is above `AGES`, `DEFS` and `QUESTS`
  and below nothing else that mattered, except that `TECHS` and `CHALS` are
  declared further down, so the research tree and the three challenges were
  checked by nothing at all. They are pulled out by brace matching now, and the
  assertions are the failures that do not throw: a `req` that names a tech that
  does not exist (unbuyable for ever), a research cycle (both locked, looking
  healthy), a definition whose `tech` names a tech that does not exist
  (unbuildable, refused with the raw key), a tech read by neither `hasTech()` nor
  a building's gate (bought, and it changes no number), a challenge with a goal of
  zero (won on the first tick).
- **The numbers the shop window advertises are now a test.** "36 quests", "10
  research techs", "3 timed challenges" and "8 Ages of progress" are written in
  the README and twice in `docs/index.html`. Three files, one set of numbers, and
  nothing compared them to the tables. Now `npm test` does — which is how the
  ninth age forced all of them to be updated in the same commit instead of
  drifting one batch at a time.
- **Proof.** 46 assertions in `test/content.test.js` (was 23), 139 in the whole
  suite, and four mutations each turn it red: a prerequisite pointed at a
  non-existent tech, a challenge goal set to 0, a tech's only reader removed, and
  the final-age gate rewritten as the literal `S.age < 8`.



- **The Fusion Age finally has a city in it, not just a reactor.** Ages 0–6 each
  unlock a service or a decoration that makes the city better to live in; age 7
  unlocked exactly two buildings, a Fusion Reactor and the Space Elevator, so the
  final era had power and a monument and nothing civic. Two buildings close that
  gap: the **Nano Clinic** (🧬, services → health, radius 14 — the widest in the
  game, 2.4/s upkeep, 4 power) and the **Holo Garden** (🌸, decor, +18 fun — the
  largest in the game). Both are priced for a Fusion-Age economy (9,000/4,500 and
  6,000/3,000) and need no new drawing code: a service is drawn from its `ic` and
  a decor reuses the park shape.
- **The three content tables are now checked against each other.**
  `test/content.test.js` loads `AGES`, `DEFS` and `QUESTS` out of `src/game.js` in
  a `vm` sandbox (no DOM, no canvas) and asserts the agreements nothing else could:
  every building's `age` is an age that exists, every `svc` is one of the four
  buckets `computeCity()` collects (`safety`/`health`/`edu`/`waste`), every service
  has a radius or it covers nothing, every age has a wonder and at least three
  quests, `QUESTS.length === AGES.length` (a missing group made `checkQuests()`
  index `undefined` on the tick a city reached that age), quest ids are unique, and
  every building a quest's `countDef()` names really exists. 23 checks, and the
  final-age-service check is what would have caught this gap: it reported
  `age 7 (FUSION AGE) has 0` before the two buildings were added.

- **A bad save can no longer take the game down — and a bad import can no longer
  overwrite a good city.** `loadGame()` used to copy whatever JSON it found straight
  onto the live state: `age: 999` made `AGES[999]` undefined and threw on the next
  render, a hand-edited `1e999` became `Infinity` so every cost comparison was false
  forever, and a building off the grid or of an unknown type was placed anyway. A
  `{}` was worse than either: it loaded as an empty, unplayable city. Import had the
  same hole with a sting — it wrote the pasted code into the live slot *before*
  checking it was a city, so a bad paste cost the player the city they had.
  New `src/save.js` is a pure gate in front of both: it **refuses** what it cannot
  interpret (not an object, a version this build does not know, buildings that are
  not a list, a city with no Town Hall), **repairs** what is merely damaged (clamps
  an age past the last age, caps an absurd balance, drops off-grid or unknown
  buildings and roads, normalises every list the loader indexes) and names what it
  did. The raw text is kept under a `.refused` / `.repaired` key, so nothing is
  silently destroyed. `test/save.test.js` proves 41 cases; the build test gains a
  marker so the gate cannot be lost by a rebuild. **74 assertions, 0 failing.**

- **The shipped bundles are back, and the demo is the app again.** The 2026-11-05 page sweep
  deleted the root `index.html` and `idle-city.min.html` as "duplicate landing pages". They are
  not landing pages: they are the build of `src/`, and `npm test` fails without them (it rebuilds
  from source and requires the committed files to be byte-identical). `docs/play/index.html` had
  also drifted two builds behind — it was missing the backup export, the restore import, the undo
  hook, the keyboard layer, the focus ring and the mobile-width fix — so the public demo was
  running older code than the app. Both are rebuilt from `src/` and the demo is re-synced:
  **31 assertions, 0 failing**.

## [1.2.0] — 2026-11-12

### Fixed

- **A saved city can no longer carry two buildings on the same ground, or a
  building half off the map.** The save gate checked a building's *origin* and
  never its *footprint*. Two consequences, both reachable from a hand-edited save,
  a bad import code or a truncated write: a 2×2 Town Hall at `x=43` drew off the
  map, and two buildings sharing a tile were both kept — but `bAt()` returns the
  **first** match, so the second could never be selected or demolished again while
  still counting toward population, quests and the level tallies, and a duplicated
  `unique` wonder locked the real one out for the rest of the run. A duplicated
  road tile was likewise kept twice.
  The gate now mirrors `canPlace()`: the **whole footprint** must be on the grid,
  a building must not stand on ground a building kept earlier already holds, and a
  road tile is kept once. Each repair is named — `buildings-overlap:N`,
  `roads-duplicate:N` — and a dropped duplicate never costs the city its Town Hall:
  one hall survives, so the save loads instead of being refused. Footprints arrive
  through `opt.sizes` (`defSizes()` in `src/game.js`), so a caller that supplies
  none still gets the 1×1 rule and an older embed keeps working.
  `test/save.test.js` grows from 41 to 56 cases, and the build test now requires
  both artefacts to carry the new strings.

## [1.1.1] — 2026-10-25

- **Licence: PolyForm Noncommercial 1.0.0.** Every repository now carries the canonical text
  from polyformproject.org with the Required Notice line, and the four places a repo states
  its licence agree: LICENSE, the SPDX headers, the README and package.json.
- **The public demo is the app.** A build now fails if `docs/play/index.html` is not the app,
  because a demo running older code is two code paths for one program.

## [1.1.0] — 2026-10-20

Published to GitHub with GitHub Pages, and relicensed.

### Changed
- **Licence changed from MIT to the [PolyForm Noncommercial License 1.0.0](LICENSE).**
  The project is now **source-available**: free for non-commercial use, **attribution is
  mandatory** for all copies and derivative works (via the licence's `Required Notice`
  mechanism), and **commercial use requires a separate paid licence** from the author.
  See [ATTRIBUTION.md](ATTRIBUTION.md) for the full breakdown and alternatives.
- `README.md`, `ATTRIBUTION.md`, `CONTRIBUTING.md`, `package.json` and all source-file headers
  updated to reflect the new licence.
- Version bumped to `1.1.0` throughout.

### Added
- GitHub repository and **GitHub Pages** deployment.
- Repository metadata: topics, description, homepage.
- `Required Notice` attribution lines embedded in `LICENSE`, `ATTRIBUTION.md` and the source headers.

> **Note for reusers:** if you were relying on the previous PolyForm Noncommercial licence, be aware that the current
> version restricts commercial use. Code obtained under the earlier MIT release remains MIT for
> that copy.

## [1.0.0] — 2026-10-19

First public, documented release: a repository-ready package with both minified and readable
builds, full documentation and an open-source licence.

### Fixed
- **Mobile toolbar was unusable.** The top bar laid its contents out to roughly 980 px and hid
  the overflow, so on phones the pause/speed controls (⏸ 1x 2x 4x 8x ⟲) and the menu buttons
  (💾 🎯 ? 🔔) sat entirely off-screen with no visible way to reach them. The bar is now split
  into a resources row and a controls row and wraps into two lines on narrow screens, keeping
  every control reachable down to 320 px.
- **Distorted map on load.** The canvas backing buffer was sized before the build panel filled
  with items, so the buffer stayed larger than the element (for example 430×824 buffer against a
  430×704 element) and the whole map was vertically squashed and blurred. Buffer and element are
  now kept in sync via a `ResizeObserver` plus a self-healing size check, so the aspect ratio is
  exact at every viewport.
- **Safe-area insets were inert.** The viewport lacked `viewport-fit=cover`, so `env(safe-area-*)`
  always resolved to 0 on notched devices. Added, together with `theme-color` and web-app meta tags.
- **Over-aggressive mobile zoom.** The default mobile view was pinned at the maximum 4× zoom,
  showing only ~11 tiles. It now frames a comfortable ~16 tiles centred on the Town Hall.
- Very narrow screens (< 380 px) could still clip the controls; the controls row now wraps and
  the buttons tighten.

### Changed
- Top bar restructured into a scrollable resources row plus a dedicated controls row.
- Status bar no longer wraps on mobile (single ellipsised line); safe-area padding added to the
  sidebar, build panel and status bar.
- Added `overscroll-behavior: none` to suppress pull-to-refresh mid-game.
- Larger touch targets for the zoom buttons and speed controls on mobile.

### Performance
- Canvas resolution is capped to a ~2.6 MP budget, so high-DPI phones no longer allocate
  needlessly large drawing buffers.
- The render loop is capped at 60 fps and fully idles while the tab is hidden.
- Canvas resize work only runs when the measured size actually drifts.

### Added
- Repository structure: `src/` (readable source), `build/build.js` (single-file build pipeline),
  and two shipped bundles — `index.html` (readable) and `idle-city.min.html` (minified).
- Full documentation: README with badges, `docs/GAMEPLAY.md`, `docs/ARCHITECTURE.md`,
  `docs/BUILDING.md`, `docs/FAQ.md`.
- Project files: `LICENSE` (MIT), `ATTRIBUTION.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, `.gitignore`, `.editorconfig`, `.gitattributes`.
- Screenshots in `assets/`.

### Notes
- Minification reduces the bundle from **123 KB → 81 KB** (≈ 34 % smaller) with identical behaviour.

<!-- Link references — replace drsamonline/idle-city-ages-of-growth with your repository to enable them.
[Unreleased]: https://github.com/drsamonline/idle-city-ages-of-growth/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/drsamonline/idle-city-ages-of-growth/releases/tag/v1.0.0
-->
