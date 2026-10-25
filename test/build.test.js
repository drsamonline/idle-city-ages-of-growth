#!/usr/bin/env node
/* test/build.test.js — the repo's first test, and the one that matters most.
 *
 * THE BUG THIS EXISTS FOR. Three script blocks (a smoke test, an export-all
 * backup button and an import-all restore button) had been appended to the
 * BUILT `index.html` by hand, and not to `src/`. The next `npm run build`
 * therefore deleted them from the readable build — and the minified build, which
 * is generated from the same inlined source, had never carried them at all. So
 * the feature existed in exactly one of the two shipped files and would vanish
 * from that one on the next build.
 *
 * The fix moved them into `src/index.html`. This test is what keeps them there:
 * it rebuilds from `src/` into a throwaway directory and requires the result to
 * be BYTE-IDENTICAL to the committed artefacts. A change to `src/` that was
 * never rebuilt fails here, and a block added to a built file instead of the
 * source fails here too.
 *
 *   npm test
 *
 * MIT. (c) 2026 Dr Sohil Momin.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const repo = path.join(__dirname, "..");
let passed = 0, failed = 0;

function ok(name, cond, detail) {
  if (cond) { passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? "  <- " + detail : "")); }
}

/* ---- 1. the sources are there ------------------------------------------- */
["src/index.html", "src/style.css", "src/game.js", "build/build.js"].forEach((f) => {
  ok(f + " exists", fs.existsSync(path.join(repo, f)));
});

/* ---- 2. build from src/ in a throwaway directory ------------------------ */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "idle-city-build-"));
for (const d of ["src", "build"]) {
  fs.cpSync(path.join(repo, d), path.join(tmp, d), { recursive: true });
}

let buildOutput = "";
try {
  buildOutput = cp.execFileSync(process.execPath, [path.join(tmp, "build", "build.js")], {
    cwd: tmp,
    encoding: "utf8",
    // the build's two dev dependencies live in the repo's node_modules, which is
    // not on the temp directory's resolution path
    env: Object.assign({}, process.env, { NODE_PATH: path.join(repo, "node_modules") })
  });
  ok("the build runs from src/ alone", true);
} catch (e) {
  ok("the build runs from src/ alone", false, (e.stderr || e.message || "").split("\n")[0]);
}

const builtHtml = path.join(tmp, "index.html");
const builtMin = path.join(tmp, "idle-city.min.html");
ok("the build writes index.html", fs.existsSync(builtHtml));
ok("the build writes idle-city.min.html", fs.existsSync(builtMin));

/* ---- 3. the committed artefacts ARE the build --------------------------- */
// This is the assertion that bites: edit src/ and forget to rebuild, and it fails.
for (const [name, built] of [["index.html", builtHtml], ["idle-city.min.html", builtMin]]) {
  if (!fs.existsSync(built) || !fs.existsSync(path.join(repo, name))) {
    ok(name + " is the build of src/", false, "missing file");
    continue;
  }
  const a = fs.readFileSync(built);
  const b = fs.readFileSync(path.join(repo, name));
  ok(name + " is the build of src/ (byte-identical)", a.equals(b),
    "run `npm run build` and commit the result");
}

/* ---- 4. the demo is the same file the repo ships ------------------------ */
for (const [pub, root] of [["docs/play/index.html", "index.html"],
                           ["docs/play/idle-city.min.html", "idle-city.min.html"]]) {
  const p = path.join(repo, pub), r = path.join(repo, root);
  const same = fs.existsSync(p) && fs.existsSync(r) && fs.readFileSync(p).equals(fs.readFileSync(r));
  ok(pub + " is identical to " + root, same, "the public demo has drifted from the app");
}

/* ---- 5. nothing is lost by the build ----------------------------------- */
// The three blocks that were being destroyed. Both artefacts must carry them.
for (const name of ["index.html", "idle-city.min.html"]) {
  const html = fs.readFileSync(path.join(repo, name), "utf8");
  ok(name + " carries the smoke test", html.indexOf("__smokeTest") >= 0);
  ok(name + " carries the backup export", html.indexOf("__exportAll") >= 0);
  ok(name + " carries the restore import", html.indexOf("__importAll") >= 0);
}

/* ---- 6. the build is a real build -------------------------------------- */
const html = fs.readFileSync(path.join(repo, "index.html"), "utf8");
const min = fs.readFileSync(path.join(repo, "idle-city.min.html"), "utf8");
ok("index.html inlines the stylesheet", html.indexOf("--") > 0 && /<style>/.test(html));
ok("index.html has no external script", !/<script[^>]+src=/.test(html));
ok("the minified build is smaller", Buffer.byteLength(min) < Buffer.byteLength(html),
  Buffer.byteLength(min) + " vs " + Buffer.byteLength(html));
ok("the minified build is a whole page", /<html/i.test(min) && /<\/html>/i.test(min));

/* ---- 7. the game source is the source, not a copy ---------------------- */
const game = fs.readFileSync(path.join(repo, "src", "game.js"), "utf8");
ok("src/game.js is a substantial game, not a stub", game.length > 50000, game.length + " bytes");
ok("the inlined build contains the game source",
  html.indexOf(game.trim().slice(0, 200)) >= 0);

fs.rmSync(tmp, { recursive: true, force: true });

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
