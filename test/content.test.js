#!/usr/bin/env node
/* test/content.test.js — the content tables, checked as data.
 *
 * WHY THIS EXISTS. AGES, DEFS and QUESTS are the whole game's content, and they
 * are three parallel tables that have to agree with each other:
 *
 *   - a DEFS entry whose `age` is past the last age can never be built, and it
 *     does not fail loudly — it just sits in the palette, unreachable;
 *   - a service whose `svc` is not one of the four buckets computeCity() collects
 *     (`safety`, `health`, `edu`, `waste`) is placed, paid for, and then counted
 *     for nothing;
 *   - a service with no radius `r` covers nothing, so it looks built and does
 *     nothing;
 *   - QUESTS must have one group per age, or `checkQuests()` indexes `undefined`
 *     the moment a city reaches that age and the game stops on the tick it
 *     should have celebrated.
 *
 * None of that is a syntax error, so nothing else here would catch it. This file
 * loads the three tables out of src/game.js in a `vm` sandbox — no DOM, no canvas,
 * no browser — and checks them against each other. It is deliberately about
 * AGREEMENT between tables, not about taste: it will never object to a new
 * building, only to one that cannot work.
 *
 *   node test/content.test.js        (or: npm test)
 *
 * MIT. (c) 2026 Dr Sohil Momin.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const GAME = path.join(__dirname, "..", "src", "game.js");
const src = fs.readFileSync(GAME, "utf8");

/* The tables live above ageCost(); everything after it touches S, the map and
   the DOM. Cutting there is what makes this runnable in plain Node. */
const cut = src.indexOf("function ageCost");
if (cut < 0) {
  console.log("  FAIL could not find ageCost() in src/game.js — did the file move?");
  process.exit(1);
}
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  src.slice(0, cut) +
    "\nthis.AGES = AGES; this.DEFS = DEFS; this.CATS = CATS; this.QUESTS = QUESTS;",
  ctx,
  { filename: "src/game.js" }
);

const AGES = ctx.AGES, DEFS = ctx.DEFS, CATS = ctx.CATS, QUESTS = ctx.QUESTS;
const IDS = Object.keys(DEFS);
const SVC_BUCKETS = ["safety", "health", "edu", "waste"];
const CAT_IDS = CATS.map((c) => c.id);

let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? "  <- " + detail : "")); }
}
const isNum = (v) => typeof v === "number" && isFinite(v);

/* ---- 1. the ages --------------------------------------------------------- */
ok("AGES is a non-empty list", Array.isArray(AGES) && AGES.length > 0, String(AGES && AGES.length));
ok("every age has a name", AGES.every((a) => typeof a.n === "string" && a.n.length > 1));
ok("every age has a positive growth multiplier",
  AGES.every((a) => isNum(a.mult) && a.mult > 0));
ok("the multipliers rise with the ages",
  AGES.every((a, i) => i === 0 || a.mult > AGES[i - 1].mult),
  AGES.map((a) => a.mult).join(" < "));

/* ---- 2. the buildings ---------------------------------------------------- */
ok("DEFS is a non-empty table", IDS.length > 0, String(IDS.length));
ok("every definition's id matches its key",
  IDS.every((k) => DEFS[k].id === k),
  IDS.filter((k) => DEFS[k].id !== k).join(", "));
ok("every definition has a display name and an icon",
  IDS.every((k) => typeof DEFS[k].name === "string" && DEFS[k].name && DEFS[k].ic));
ok("every definition belongs to a declared category",
  IDS.every((k) => CAT_IDS.indexOf(DEFS[k].cat) >= 0),
  IDS.filter((k) => CAT_IDS.indexOf(DEFS[k].cat) < 0).map((k) => k + ":" + DEFS[k].cat).join(", "));

const reachable = IDS.filter((k) => Number.isInteger(DEFS[k].age) && DEFS[k].age >= 0 && DEFS[k].age < AGES.length);
ok("every definition is buildable in an age that exists",
  reachable.length === IDS.length,
  IDS.filter((k) => reachable.indexOf(k) < 0).map((k) => k + "@" + DEFS[k].age).join(", "));

const priced = IDS.filter((k) => DEFS[k].cost);
ok("every priced definition costs a finite, non-negative amount",
  priced.every((k) => isNum(DEFS[k].cost.m) && DEFS[k].cost.m >= 0 && isNum(DEFS[k].cost.t) && DEFS[k].cost.t >= 0),
  priced.filter((k) => !(isNum(DEFS[k].cost.m) && DEFS[k].cost.m >= 0 && isNum(DEFS[k].cost.t) && DEFS[k].cost.t >= 0)).join(", "));
ok("only the free tools are unpriced",
  IDS.filter((k) => !DEFS[k].cost).every((k) => k === "demol" || k === "hall"),
  IDS.filter((k) => !DEFS[k].cost).join(", "));

/* ---- 3. services actually serve ------------------------------------------ */
const svcs = IDS.filter((k) => DEFS[k].cat === "svc" && DEFS[k].svc);
ok("every service names one of the four buckets computeCity() collects",
  svcs.every((k) => SVC_BUCKETS.indexOf(DEFS[k].svc) >= 0),
  svcs.filter((k) => SVC_BUCKETS.indexOf(DEFS[k].svc) < 0).map((k) => k + ":" + DEFS[k].svc).join(", "));
ok("every service has a radius, or it covers nothing",
  svcs.every((k) => isNum(DEFS[k].r) && DEFS[k].r > 0),
  svcs.filter((k) => !(isNum(DEFS[k].r) && DEFS[k].r > 0)).map((k) => k).join(", "));
ok("every service charges upkeep",
  svcs.every((k) => isNum(DEFS[k].upkeep) && DEFS[k].upkeep > 0),
  svcs.filter((k) => !(isNum(DEFS[k].upkeep) && DEFS[k].upkeep > 0)).map((k) => k).join(", "));

/* Every age should be able to serve its citizens — an age whose services all
   belong to earlier eras is playable, but the last one had none at all. */
const svcByAge = {};
svcs.forEach((k) => { svcByAge[DEFS[k].age] = (svcByAge[DEFS[k].age] || 0) + 1; });
const lastAge = AGES.length - 1;
ok("the final age has a service of its own",
  (svcByAge[lastAge] || 0) > 0,
  "age " + lastAge + " (" + AGES[lastAge].n + ") has " + (svcByAge[lastAge] || 0));

/* ---- 4. the wonders: one per age, one per city --------------------------- */
const wonders = IDS.filter((k) => DEFS[k].cat === "wonder");
ok("every wonder is unique per city", wonders.every((k) => DEFS[k].unique === 1),
  wonders.filter((k) => DEFS[k].unique !== 1).join(", "));
ok("every age has a wonder to work towards",
  AGES.every((a, i) => wonders.some((k) => DEFS[k].age === i)),
  AGES.map((a, i) => i).filter((i) => !wonders.some((k) => DEFS[k].age === i)).join(", "));

/* ---- 5. the quests ------------------------------------------------------- */
ok("QUESTS has one group per age",
  Array.isArray(QUESTS) && QUESTS.length === AGES.length,
  "QUESTS " + (QUESTS && QUESTS.length) + " vs AGES " + AGES.length);
const allQuests = [];
let shapeBad = [];
QUESTS.forEach((group, age) => {
  if (!Array.isArray(group) || group.length < 3) shapeBad.push("age " + age);
  (group || []).forEach((q) => {
    allQuests.push(q);
    if (!q.id || !q.t || typeof q.c !== "function" || !q.rw || !isNum(q.rw.m) || !isNum(q.rw.t)) shapeBad.push(String(q.id));
  });
});
ok("every age has at least three quests", shapeBad.length === 0, shapeBad.join(", "));
ok("every quest has an id, a title, a test and a reward",
  allQuests.every((q) => q.id && q.t && typeof q.c === "function" && q.rw && isNum(q.rw.m) && isNum(q.rw.t)),
  allQuests.filter((q) => !(q.id && q.t && typeof q.c === "function" && q.rw && isNum(q.rw.m) && isNum(q.rw.t))).map((q) => q.id).join(", "));
const qids = allQuests.map((q) => q.id);
ok("quest ids are unique across the whole game",
  qids.length === new Set(qids).size,
  qids.filter((id, i) => qids.indexOf(id) !== i).join(", "));

/* A quest that names a building must name one that exists: countDef("hosp") in a
   quest reads as a condition that can never be true, and the age never advances. */
const NAMED = /countDef\(\s*"([^"]+)"\s*\)/g;
const missing = [];
allQuests.forEach((q) => {
  const text = q.c.toString();
  let m;
  while ((m = NAMED.exec(text))) if (IDS.indexOf(m[1]) < 0) missing.push(q.id + "->" + m[1]);
});
ok("every building a quest counts exists", missing.length === 0, missing.join(", "));

/* ---- 6. the new last-age content ----------------------------------------- */
ok("the final age offers more than a reactor and a wonder",
  IDS.filter((k) => DEFS[k].age === lastAge).length >= 4,
  String(IDS.filter((k) => DEFS[k].age === lastAge).length));

/* ---- 7. the research tree and the challenges ----------------------------
 *
 * THE GAP THIS CLOSES. Sections 1-6 see AGES, DEFS, CATS and QUESTS, because
 * all four are declared above `ageCost()` and that is where the sandbox cuts.
 * TECHS and CHALS are declared BELOW the cut, so for as long as this file has
 * existed the research tree and the three timed challenges were checked by
 * NOTHING — and a broken one does not throw:
 *
 *   - a tech whose `req` names a tech that does not exist can never be bought:
 *     `buyTech()` tests `hasTech(t.req)`, which stays false forever, so it sits
 *     in the Research tab behind a lock that never opens;
 *   - a research CYCLE (a requires b, b requires a) locks both, and looks
 *     perfectly healthy in the tab;
 *   - a definition whose `tech` names a tech that does not exist is placed in
 *     the palette and refused on every click with "Requires <id> research",
 *     where <id> is the raw key, because techName() falls back to it;
 *   - a tech or a challenge with an age past the last age is unreachable;
 *   - a challenge with a goal of 0 is won on the first tick.
 *
 * They are pulled out by BRACE MATCHING rather than by moving the cut, because
 * what lies between `ageCost()` and `TECHS` is S, the map and the DOM, and a
 * cut placed there would drag all of it into the sandbox.
 */
function grabTable(name) {
  const at = src.indexOf("var " + name + " = ");
  if (at < 0) return null;
  const open = src.indexOf("[", at);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") { depth--; if (depth === 0) return src.slice(at, i + 1) + ";"; }
  }
  return null;
}
const techSrc = grabTable("TECHS"), chalSrc = grabTable("CHALS");
ok("the research table can be read out of src/game.js", !!techSrc);
ok("the challenge table can be read out of src/game.js", !!chalSrc);
vm.runInContext((techSrc || "var TECHS = [];") + (chalSrc || "var CHALS = [];") +
  "\nthis.TECHS = TECHS; this.CHALS = CHALS;", ctx, { filename: "src/game.js" });
const TECHS = ctx.TECHS || [], CHALS = ctx.CHALS || [];
const TIDS = TECHS.map((t) => t.id);

ok("TECHS is a non-empty table", TECHS.length > 0, String(TECHS.length));
ok("tech ids are unique", TIDS.length === new Set(TIDS).size,
  TIDS.filter((id, i) => TIDS.indexOf(id) !== i).join(", "));
ok("every tech has a name, an icon, a description and a positive cost",
  TECHS.every((t) => t.id && t.n && t.ic && t.d && isNum(t.cost) && t.cost > 0),
  TECHS.filter((t) => !(t.id && t.n && t.ic && t.d && isNum(t.cost) && t.cost > 0)).map((t) => t.id).join(", "));
ok("every tech is buyable in an age that exists",
  TECHS.every((t) => Number.isInteger(t.age) && t.age >= 0 && t.age < AGES.length),
  TECHS.filter((t) => !(Number.isInteger(t.age) && t.age >= 0 && t.age < AGES.length)).map((t) => t.id + "@" + t.age).join(", "));

/* A prerequisite must exist, and must not reach back to the tech it unlocks. */
const badReq = TECHS.filter((t) => t.req && TIDS.indexOf(t.req) < 0).map((t) => t.id + "->" + t.req);
ok("every prerequisite names a tech that exists", badReq.length === 0, badReq.join(", "));
ok("no tech requires itself", TECHS.every((t) => t.req !== t.id),
  TECHS.filter((t) => t.req === t.id).map((t) => t.id).join(", "));
const cycles = [];
TECHS.forEach((t) => {
  const seen = [];
  let cur = t;
  while (cur && cur.req) {
    if (seen.indexOf(cur.id) >= 0) { cycles.push(t.id); break; }
    seen.push(cur.id);
    cur = TECHS.find((x) => x.id === cur.req);
  }
  if (cur && seen.indexOf(cur.id) >= 0 && cycles.indexOf(t.id) < 0) cycles.push(t.id);
});
ok("the research tree has no cycle, so nothing is locked for ever",
  cycles.length === 0, cycles.join(", "));

/* `tech` on a definition is what gates the High-rise Tower. techName() falls back
   to the raw id, so a typo there is invisible on screen and fatal to the build. */
const badTech = IDS.filter((k) => DEFS[k].tech && TIDS.indexOf(DEFS[k].tech) < 0)
  .map((k) => k + "->" + DEFS[k].tech);
ok("every building's research gate names a tech that exists", badTech.length === 0, badTech.join(", "));

/* A tech nobody reads is a purchase that does nothing. hasTech() is the only way
   an effect is applied, and S.tech.indexOf() is the way a gate is applied; a tech
   read by neither is advertised in the Research tab and changes no number. */
const unread = TECHS.filter((t) =>
  src.indexOf('hasTech("' + t.id + '")') < 0 && src.indexOf('tech: "' + t.id + '"') < 0);
ok("every tech is read by the simulation or gates a building",
  unread.length === 0, unread.map((t) => t.id).join(", "));

ok("CHALS is a non-empty table", CHALS.length > 0, String(CHALS.length));
ok("challenge ids are unique",
  CHALS.length === new Set(CHALS.map((c) => c.id)).size);
ok("every challenge has a goal above zero, a deadline and a medal",
  CHALS.every((c) => c.id && c.n && isNum(c.goal) && c.goal > 0 && isNum(c.deadline) && c.deadline > 0 && isNum(c.gold) && c.gold > 0),
  CHALS.filter((c) => !(c.id && c.n && isNum(c.goal) && c.goal > 0 && isNum(c.deadline) && c.deadline > 0 && isNum(c.gold) && c.gold > 0)).map((c) => c.id).join(", "));

/* ---- 8. the last age is the last age, not a magic number -----------------
 *
 * The ascension gate used to read `S.age >= 7` in two places while the rest of
 * the game said `AGES.length - 1`. That is invisible while there are eight ages
 * and wrong the moment a ninth is added: the new final age would have handed out
 * ascension a whole age early. This assertion is what makes the ninth age safe.
 */
const magic = src.match(new RegExp("S\\.age\\s*(?:>=|<)\\s*" + lastAge + "\\b", "g")) || [];
ok("no code compares S.age to the literal index of the final age",
  magic.length === 0, magic.join(", "));
const lenExprs = src.match(/AGES\.length - 1/g) || [];
ok("the final-age gates are written as AGES.length - 1, not a number",
  lenExprs.length >= 4, String(lenExprs.length));

/* ---- 9. the numbers the page and the README advertise -------------------
 *
 * "36 quests" is written in the README, in docs/index.html's description and on
 * its feature card; "10 research techs" and "3 timed challenges" likewise. Three
 * files, one set of numbers, and until now nothing compared them to the tables —
 * so the next content batch could leave the shop window describing the last one.
 */
const advertised = {
  "README.md": [
    [/\|\s*\W*\s*(\d+) Ages of progress/, AGES.length, "ages"],
    [/(\d+) quests gate the ages/, allQuests.length, "quests"],
    [/(\d+) research techs/, TECHS.length, "techs"],
    [/(\d+) timed challenges/, CHALS.length, "challenges"],
  ],
  "docs/index.html": [
    [/(\d+) ages, (\d+) quests, (\d+) techs, (\d+) challenges/, [AGES.length, allQuests.length, TECHS.length, CHALS.length], "the feature line"],
    [/<h3>(\d+) Ages of progress<\/h3>/, AGES.length, "ages"],
    [/(\d+) quests gate the ages, (\d+) research techs[^.]*?(\d+) timed challenges/, [allQuests.length, TECHS.length, CHALS.length], "the feature card"],
  ],
};
Object.keys(advertised).forEach((file) => {
  const text = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  advertised[file].forEach(([re, want, label]) => {
    const m = text.match(re);
    const got = m && m.slice(1).map(Number);
    const wantArr = Array.isArray(want) ? want : [want];
    ok(file + " advertises the real " + label,
      !!got && got.length === wantArr.length && got.every((n, i) => n === wantArr[i]),
      m ? "says " + got.join("/") + ", the tables say " + wantArr.join("/") : "the line was not found");
  });
});

/* ---- 10. the legacy ladder is wired, not just written -------------------
 *
 * src/legacy.js holds the ranks and the award. Two ways it can quietly stop
 * mattering: the page stops loading it (or loads it after game.js, which calls
 * it at load time), or game.js goes back to awarding a flat +1 so the Dyson Ring
 * is worth nothing again. Both are checked here because neither is a syntax
 * error anywhere.
 */
const Legacy = require(path.join(__dirname, "..", "src", "legacy.js"));
const page = fs.readFileSync(path.join(__dirname, "..", "src", "index.html"), "utf8");
const iLegacy = page.indexOf('src="legacy.js"');
const iGame = page.indexOf('src="game.js"');
ok("src/index.html loads legacy.js", iLegacy >= 0);
ok("legacy.js is loaded before game.js", iLegacy >= 0 && iGame > iLegacy);
ok("game.js awards what Legacy.award() scores", /Legacy\.award\(/.test(src));
ok("game.js no longer awards a flat +1 on ascension",
  !/S\.legacy\s*=\s*\(S\.legacy \|\| 0\) \+ 1\s*;/.test(src));
ok("the ladder starts at 0 so every player holds a rank", Legacy.RANKS[0].at === 0);
ok("the ring is worth more than a bare ascension",
  Legacy.award({ pop: 2500, dyson: 1 }) > Legacy.award({ pop: 2500 }));

ok("game.js charges the rank's wonder discount", /Legacy\.discount\(c, S\.legacy/.test(src));
ok("game.js prices every build through one function", /function baseCost\(/.test(src) &&
  /var c = baseCost\(id\);/.test(src));
ok("the palette shows the price it will charge", /baseCost\(d\.id\)/.test(src));
ok("wonders are what the discount is applied to", /d\.cat === "wonder"/.test(src));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
