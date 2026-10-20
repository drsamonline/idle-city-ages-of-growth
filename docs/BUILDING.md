<div align="center">

# 🔧 Building & Publishing

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](../LICENSE) ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg) ![Node.js](https://img.shields.io/badge/node-%E2%89%A518-339933?logo=node.js&logoColor=white) ![Build](https://img.shields.io/badge/build-node%20build%2Fbuild.js-informational)

</div>

The game runs with **no build step** — but this repo ships two single-file bundles and a small
build script that keeps them in sync with `src/`.

---

## 1. Requirements

| To… | You need |
|---|---|
| **Play the game** | Nothing but a modern browser |
| **Edit and run from source** | Nothing but a browser (open `src/index.html`) |
| **Rebuild the bundles** | [Node.js](https://nodejs.org) 18 or newer |

No global tools, no bundler, no framework.

---

## 2. Running from source

```bash
git clone https://github.com/drsamonline/idle-city-ages-of-growth.git
cd REPO
```

**Option A — just open it**

```bash
xdg-open src/index.html      # macOS: open src/index.html
```

**Option B — serve it** (closer to how it behaves when deployed)

```bash
python3 -m http.server 8000
# then open http://localhost:8000/src/
```

---

## 3. The build pipeline

```
src/index.html  ─┐
src/style.css   ─┼─►  build/build.js  ─►  index.html            (readable single file)
src/game.js     ─┘                    └─►  idle-city.min.html    (minified single file)
```

`build/build.js`:

1. reads the three files in `src/`,
2. **inlines** `style.css` and `game.js` into `src/index.html` to make the readable bundle,
3. **minifies** that bundle (HTML + CSS + JS via `terser`) into `idle-city.min.html`.

```bash
npm install            # dev-only dependencies (terser, html-minifier-terser)
node build/build.js    # regenerate both bundles
```

Expected output:

```
index.html          122.6 KB
idle-city.min.html   81.2 KB
saved 33.7%
```

### What gets minified

| Step | Tool | Notes |
|---|---|---|
| HTML whitespace + attributes | `html-minifier-terser` | comments stripped, quotes trimmed |
| CSS | `html-minifier-terser` (clean-css) | |
| JavaScript | `terser` | `compress` + `mangle` (including top-level) |

> **Editing rule:** never hand-edit the root `index.html` or `idle-city.min.html` — they are
> generated. Change `src/` and re-run the build.

---

## 4. Which file do I ship?

| File | Size | Use it when… |
|---|--:|---|
| `idle-city.min.html` | ~81 KB | **Sharing / hosting.** Smallest, fastest to load. |
| `index.html` | ~123 KB | **Reading / reviewing.** Same game, formatted source. |

Both are fully self-contained — email one, drop it on a USB stick, or open it with no internet.

---

## 5. Publishing to GitHub Pages

Because the root `index.html` is a complete standalone page, GitHub Pages works out of the box:

1. Push the repository to GitHub.
2. **Settings → Pages**.
3. **Source:** *Deploy from a branch* → **Branch:** `main`, **Folder:** `/ (root)`.
4. Save. Your game is live at `https://OWNER.github.io/REPO/`.

*(If you'd rather serve the minified build as the site, rename `idle-city.min.html` to
`index.html` on a deploy branch, or point Pages at a `docs/` folder that contains it.)*

---

## 6. Badges

The README badges use [shields.io](https://shields.io). The static ones (licence, version, language,
dependencies, mobile) work immediately.

The **live** badges need your repository path. Replace `drsamonline/idle-city-ages-of-growth` with your GitHub
username and repository name wherever you see it — in this file, in [`README.md`](../README.md),
in [`CHANGELOG.md`](../CHANGELOG.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md),
[`SECURITY.md`](../SECURITY.md) and [`ATTRIBUTION.md`](../ATTRIBUTION.md) — and the dynamic badges
below will start resolving:

```markdown
<!-- Live GitHub badges — replace drsamonline/idle-city-ages-of-growth with your repository -->
```

A quick way to do the swap everywhere:

```bash
grep -rl "drsamonline/idle-city-ages-of-growth" . | xargs sed -i 's|drsamonline/idle-city-ages-of-growth|yourname/your-repo|g'
```

---

## 7. Repository conventions

- `src/` — hand-edited source. **This is where you work.**
- `build/` — the build script.
- root `index.html`, `idle-city.min.html` — generated; commit them so Pages and direct downloads work.
- `docs/`, `assets/` — documentation and screenshots.
- `.editorconfig` / `.gitattributes` — 2-space indent; text normalised to LF.

---

<div align="center"><sub>Edit <code>src/</code>, run one command, ship one file.</sub></div>
