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
ok("the Fusion Age offers more than a reactor and a wonder",
  IDS.filter((k) => DEFS[k].age === lastAge).length >= 4,
  String(IDS.filter((k) => DEFS[k].age === lastAge).length));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
