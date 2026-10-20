<div align="center">

# ❓ Frequently Asked Questions

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](../LICENSE) ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg) ![Offline ready](https://img.shields.io/badge/offline-ready-success) ![Single file](https://img.shields.io/badge/single--file-yes-blueviolet)

</div>

<details>
<summary><b>How do I play it? Do I need to install anything?</b></summary>

No. Download `idle-city.min.html` (or `index.html`) and **double-click it**. It runs in any modern
browser, fully offline, with no installation, no server and no internet connection.
</details>

<details>
<summary><b>What's the difference between <code>index.html</code> and <code>idle-city.min.html</code>?</b></summary>

They are **the same game**. `index.html` is the readable, formatted build (~123 KB) — nice for
reading or reviewing the source. `idle-city.min.html` is the minified build (~81 KB, about 34 %
smaller) — the one to share or host. See [docs/BUILDING.md](BUILDING.md).
</details>

<details>
<summary><b>My buildings aren't working / nothing is growing.</b></summary>

Almost always **roads**. A building only functions when a road connects it back to the **Town Hall**.
Read the **status bar** at the bottom — it names the exact blocker (*no housing capacity*, *no power*,
*fuel shortage*, *unemployed*…).
</details>

<details>
<summary><b>Why did my city collapse?</b></summary>

Happiness reached **zero**. That's the game-over condition. Happiness falls with pollution,
unemployment, power/fuel shortages, waste and bad weather, and rises with jobs, Fun districts,
services and decor. Keep it off the floor.
</details>

<details>
<summary><b>How do I advance to the next Age?</b></summary>

Complete **all the quests** for your current Age, then press **ADVANCE AGE** in the side panel.
The button only lights up when the set is finished. Quest lists are in
[docs/GAMEPLAY.md](GAMEPLAY.md#5-quests).
</details>

<details>
<summary><b>What is Ascension / Legacy?</b></summary>

Once you reach the **Fusion Age** with **2,500+ citizens**, the **🌟 ASCEND** button lets you start
a brand-new city while keeping a permanent **Legacy** bonus — **+25 % income per ascension**.
</details>

<details>
<summary><b>Does it work on my phone?</b></summary>

Yes — mobile is a first-class target. The layout adapts down to **320 px** wide, the top bar wraps
so the speed controls always stay reachable, and you can **drag to pan** and **pinch to zoom**.
Add it to your home screen for a full-screen, app-like experience.
</details>

<details>
<summary><b>Is my progress saved? Where?</b></summary>

Yes. There are **3 save slots** plus an **autosave every ~10 seconds**. Saves live in your
browser's own `localStorage` — nothing is sent anywhere. Use the 💾 **Export** code to back up a
city or move it to another device, and **Import** to load it back.
</details>

<details>
<summary><b>I cleared my browser data and lost my city. Can I get it back?</b></summary>

Only if you exported a save code (💾 → Export) beforehand — the game keeps no copy anywhere else.
That's why exporting is worth doing before clearing site data or switching devices.
</details>

<details>
<summary><b>Is it really one file with no dependencies?</b></summary>

Yes. No frameworks, no libraries at runtime, no external images, fonts or data, no analytics and no
network calls. The dev tools (`terser`, `html-minifier-terser`) are only used to build the minified
file and are never shipped.
</details>

<details>
<summary><b>Can I use this in my own project / modify it?</b></summary>

Yes — it's released under the **MIT License**, so you can use, modify and redistribute it, even
commercially. **You must keep the copyright notice and author credit** (**Dr. Sohil Momin**) —
see [LICENSE](../LICENSE) and [ATTRIBUTION.md](../ATTRIBUTION.md).
</details>

<details>
<summary><b>Something's broken or I have an idea. Where do I say so?</b></summary>

Open an [issue](../../../issues). Please include your browser/OS, whether it's desktop or mobile, and
what the status bar said. For security problems, use the private route in
[SECURITY.md](../SECURITY.md) instead.
</details>

---

<div align="center"><sub>Didn't find your answer? Open an issue and ask. 🏙</sub></div>
