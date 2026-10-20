<div align="center">

# 📜 Attribution & Licensing

</div>

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](LICENSE) ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg) ![Attribution required](https://img.shields.io/badge/attribution-required-important) ![Commercial use](https://img.shields.io/badge/commercial%20use-licence%20required-orange)

This file records **who made this project**, **the licence you get**, **what open-source software was used**, and **exactly how to give credit**.

---

## 1. Original author

| | |
|---|---|
| **Project** | IDLE CITY — Ages of Growth |
| **Original author / creator** | **Dr. Sohil Momin** |
| **Original repository** | https://github.com/drsamonline/idle-city-ages-of-growth |
| **Licence** | PolyForm Noncommercial License 1.0.0 (see [LICENSE](LICENSE)) |
| **Copyright** | © 2026 Dr. Sohil Momin |

The game concept, design, source code, rendering and styling are the original work of
**Dr. Sohil Momin**.

---

## 2. Your licence at a glance

| Use | Allowed? | Condition |
|---|---|---|
| Personal use, hobby, private entertainment | ✅ Yes | Attribution |
| Study, research, teaching, non-profit, charity, government | ✅ Yes | Attribution |
| Modify, remix, fork, redistribute | ✅ Yes | Attribution + same licence terms |
| **Any commercial use** (selling, monetising, bundling into a paid product, SaaS, ads) | ❌ **No** | **Requires a separate paid licence** |

### ✅ Attribution is mandatory

The PolyForm Noncommercial License requires that the following plain-text `Required Notice:` lines
travel with the software. **This is the credit requirement — it applies to the original work and to
every derivative work.**

```
Required Notice: IDLE CITY — Ages of Growth — Copyright (c) 2026 Dr. Sohil Momin.
Required Notice: You must credit the author, "Dr. Sohil Momin", and link the original
Required Notice: repository — https://github.com/drsamonline/idle-city-ages-of-growth —
Required Notice: in every copy, fork and derivative work.
```

In practice, that means keeping the author credit in your `README`, in your `LICENSE`, and in the
header comments of `src/game.js` and `src/style.css`.

### 💼 Commercial use requires a licence

Commercial use is **not** a permitted purpose under the PolyForm Noncommercial License. To use
IDLE CITY — Ages of Growth, or any derivative of it, commercially, first obtain a separate written
commercial licence from the copyright holder:

* **Copyright holder:** Dr. Sohil Momin
* **How to request:** open an issue titled *"Commercial licence request"* on the
  [repository](https://github.com/drsamonline/idle-city-ages-of-growth), or contact the author
  through GitHub (https://github.com/drsamonline).

### ℹ️ A note on the words "open source"

Because commercial use is restricted, this licence is **source-available** (sometimes called
*fair source*) — it is **not** OSI-approved open source, since the Open Source Definition does not
allow restrictions on fields of endeavour. The source is public, readable, modifiable and free for
non-commercial use; that is the intended trade-off.

If you would prefer a recognised standard licence instead, the closest drop-in alternatives are:

| Alternative | Credit required | Commercial use | Notes |
|---|---|---|---|
| **PolyForm Noncommercial 1.0.0** *(current)* | via `Required Notice` | Paid licence needed | Software-oriented, professionally drafted |
| **CC BY-NC-SA 4.0** | Yes (BY) | Paid permission needed | Widely used for games; not recommended for pure software |
| **Business Source License 1.1** | Yes | Restricted until a change date, then open | Time-delayed open sourcing |
| **MIT / Apache-2.0** | Yes | Fully allowed | True open source — but drops the commercial restriction |

---

## 3. Runtime dependencies

**None.** The playable game (`index.html` / `idle-city.min.html`) is a single self-contained HTML file:

- No JavaScript libraries or frameworks
- No web fonts fetched at runtime
- No external images, audio or data files
- No analytics, tracking or network calls of any kind

It runs fully offline. Icons are standard Unicode emoji, rendered by the **operating system's own
emoji font** (for example *Apple Color Emoji*, *Segoe UI Emoji* or *Noto Color Emoji*). Those fonts
are not bundled or redistributed here.

---

## 4. Development-only tooling

These packages are used **only** by `build/build.js` to produce the minified bundle. They are
**not** shipped inside the game and are not needed to play it.

| Tool | Used for | Licence | Copyright |
|---|---|---|---|
| [terser](https://github.com/terser/terser) | JavaScript minification | **BSD-2-Clause** | © 2012–2024 Mihai Bazon and contributors |
| [html-minifier-terser](https://github.com/terser/html-minifier-terser) | HTML/CSS minification | **MIT** | © 2010–2019 Juriy "kangax" Zaytsev, © 2019–2024 contributors |
| [js-beautify](https://github.com/beautifier/js-beautify) | Formatting the readable source | **MIT** | © 2007–2024 Einar Lielmanis and contributors |

Their full licence texts are distributed with each package under `node_modules/` after `npm install`.

### Screenshots

The images in [`assets/`](assets/) were rendered in headless Chromium. For those captures only, the
[**Noto Color Emoji**](https://fonts.google.com/noto/specimen/Noto+Color+Emoji) webfont (© Google,
licensed under the **SIL Open Font License 1.1**) was loaded so emoji icons display correctly on a
machine without a system emoji font. This font is **not** part of the game and is **not** redistributed.

---

## 5. How to credit (copy-paste)

If you build on this project, use a credit like the following:

> Based on **IDLE CITY — Ages of Growth** by **Dr. Sohil Momin** —
> https://github.com/drsamonline/idle-city-ages-of-growth
> Licensed under the PolyForm Noncommercial License 1.0.0.

Thank you for respecting the original author's work.
