## 1.1.1 — 2026-10-25

- **Licence: PolyForm Noncommercial 1.0.0.** Every repository now carries the canonical text
  from polyformproject.org with the Required Notice line, and the four places a repo states
  its licence agree: LICENSE, the SPDX headers, the README and package.json.
- **The public demo is the app.** A build now fails if `docs/play/index.html` is not the app,
  because a demo running older code is two code paths for one program.

<div align="center">

# 📓 Changelog

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](LICENSE) ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg) ![Keep a Changelog](https://img.shields.io/badge/keep%20a%20changelog-1.1.0-orange) ![SemVer](https://img.shields.io/badge/semver-2.0.0-blue)

All notable changes to **IDLE CITY — Ages of Growth** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

</div>

## [Unreleased]

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

> **Note for reusers:** if you were relying on the previous MIT licence, be aware that the current
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
