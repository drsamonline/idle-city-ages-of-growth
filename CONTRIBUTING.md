<div align="center">

# 🤝 Contributing to IDLE CITY — Ages of Growth

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](LICENSE) ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Good first issues](https://img.shields.io/badge/good%20first%20issues-open-7057ff)

</div>

Thanks for wanting to help! This is a small, dependency-free project, so contributing is
straightforward: edit a file, open it in a browser, and see your change.

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🐛 Reporting bugs & suggesting ideas

Open an [issue](../../issues) and include:

- **What happened** and **what you expected** to happen.
- **Steps to reproduce** (the smaller, the better).
- Your **browser and OS**, and whether it was **desktop or mobile**.
- A screenshot or the exact text from the status bar, if relevant.

Before opening a new issue, please search existing ones to avoid duplicates.

---

## 🧑‍💻 Development setup

There is **no build step required to run the game**.

```bash
git clone https://github.com/drsamonline/idle-city-ages-of-growth.git
cd REPO

# Option A — just open the source page
xdg-open src/index.html        # or double-click it

# Option B — serve it (recommended; matches production more closely)
python3 -m http.server 8000
# then visit http://localhost:8000/src/
```

To produce the shipped single-file bundles you need Node.js 18+:

```bash
npm install            # installs terser + html-minifier-terser (dev-only)
node build/build.js    # rewrites index.html and idle-city.min.html from src/
```

Full details live in **[docs/BUILDING.md](docs/BUILDING.md)**.

---

## ✏️ Where to make changes

| Change | Edit |
|---|---|
| Gameplay, simulation, rendering, data tables | `src/game.js` |
| Layout, colours, responsive/mobile rules | `src/style.css` |
| Page shell, meta tags, markup | `src/index.html` |
| Build pipeline | `build/build.js` |
| Docs | `README.md`, `docs/*.md` |

**Do not edit `index.html` or `idle-city.min.html` at the repository root by hand** — they are
generated. Change `src/` and run `node build/build.js`.

---

## 🎨 Code style

The project is plain vanilla JavaScript in a single IIFE-free script with deliberately small
helper functions.

- **Indentation:** 2 spaces, no tabs (see [`.editorconfig`](.editorconfig)).
- **Quotes:** double quotes in JavaScript.
- **Semicolons:** yes.
- **Naming:** `camelCase` for variables/functions, `SCREAMING_SNAKE_CASE` for data tables
  (`AGES`, `DEFS`, `TECHS`…).
- **Keep it dependency-free.** No libraries, no frameworks, no build-time runtime code.
- **Keep it offline.** No network calls, no external assets, no analytics.
- Prefer small, well-named functions over clever one-liners — but keep the shipped file lean.

---

## ✅ Before you open a pull request

1. **Run it.** Open `src/index.html` and confirm the game loads with no errors in the console.
2. **Test the small screen.** Resize the window down to ~360 px wide and check the toolbar,
   build panel and map are all usable. Mobile is a first-class target here.
3. **Rebuild the bundles.** Run `node build/build.js` and commit the regenerated
   `index.html` and `idle-city.min.html` alongside your `src/` change.
4. **Keep the credit.** Do not remove or alter the `Dr. Sohil Momin` attribution or the link to the
   original repository in the source headers, the `LICENSE` or this documentation. By contributing
   you agree that your contribution is licensed under the project's
   [PolyForm Noncommercial License 1.0.0](LICENSE) (see [ATTRIBUTION.md](ATTRIBUTION.md)).
5. **Update the docs** if you change behaviour a player would notice, and add a line to
   [`CHANGELOG.md`](CHANGELOG.md) under *Unreleased*.

### Pull request checklist

- [ ] Change is scoped and explained in the description
- [ ] Game runs without console errors (desktop **and** ~360 px mobile)
- [ ] `node build/build.js` re-run and generated files committed
- [ ] `CHANGELOG.md` updated under *Unreleased*
- [ ] Author attribution left intact

---

## 💡 Good first contributions

- Balance tuning (costs, growth rates, quest difficulty)
- New buildings, techs, quests or wonders
- New languages / localisation
- Accessibility improvements (keyboard play, colour contrast, reduced motion)
- Small UI polish and clearer tooltips

---

<div align="center"><sub>Thank you for helping make IDLE CITY better. 🏙</sub></div>
