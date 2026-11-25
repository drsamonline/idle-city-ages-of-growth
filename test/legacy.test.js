#!/usr/bin/env node
/* test/legacy.test.js — what an ascension is worth, proved in plain Node.
 *
 * WHY THIS EXISTS. Ascension used to award a flat `+1` no matter what the run
 * did, so the Dyson Ring — the last thing the game asks for — was worth exactly
 * as much as limping to the population gate. That is not a scoring bug you can
 * see in the UI; it just makes the endgame pointless. The first assertion below
 * is the property that was false: a run that built the ring must score STRICTLY
 * more than one that did not.
 *
 * The rest is the ladder: the table must be sorted and gap-free from 0, every
 * input must be refused rather than trusted (a save can carry anything), and the
 * two things players already had — +25% income per point, and the starting
 * money/mats — must not move.
 *
 *   node test/legacy.test.js        (or: npm test)
 *
 * MIT. (c) 2026 Dr Sohil Momin.
 */
"use strict";

const path = require("path");
const Legacy = require(path.join(__dirname, "..", "src", "legacy.js"));

let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? "  <- " + detail : "")); }
}

/* ---- 1. the endgame is worth something ---------------------------------- */
const bare = Legacy.award({ pop: 2500, wonders: 0, techs: 0, dyson: 0 });
const ring = Legacy.award({ pop: 2500, wonders: 0, techs: 0, dyson: 1 });
ok("a bare ascension is worth 1", bare === 1, String(bare));
ok("the Dyson Ring scores strictly more than a bare ascension", ring > bare, ring + " vs " + bare);
ok("the Dyson Ring is worth exactly one more point", ring - bare === 1, ring + " vs " + bare);

const full = Legacy.award({ pop: 5500, wonders: 9, techs: 10, dyson: 1 });
ok("a finished Orbital run is worth far more than a bare one", full >= bare + 6, String(full));
ok("a finished Orbital run is 9", full === 9, String(full));
ok("no award ever exceeds MAX_AWARD",
  Legacy.award({ pop: 1e9, wonders: 1e9, techs: 1e9, dyson: 1e9 }) <= Legacy.MAX_AWARD);

/* ---- 2. each term of the score, one at a time --------------------------- */
ok("wonders pay at 3", Legacy.award({ pop: 2500, wonders: 3 }) === bare + 1);
ok("wonders pay nothing at 2", Legacy.award({ pop: 2500, wonders: 2 }) === bare);
ok("wonders stop paying past 9", Legacy.award({ pop: 2500, wonders: 40 }) === bare + 3,
  String(Legacy.award({ pop: 2500, wonders: 40 })));
ok("population past the gate pays per 1,000",
  Legacy.award({ pop: 3500 }) === bare + 1 && Legacy.award({ pop: 4500 }) === bare + 2);
ok("population below the gate pays nothing extra", Legacy.award({ pop: 2000 }) === bare);
ok("population past the gate stops paying past +3,000",
  Legacy.award({ pop: 9000 }) === bare + 3, String(Legacy.award({ pop: 9000 })));
ok("the whole research tree pays one", Legacy.award({ pop: 2500, techs: 10 }) === bare + 1);
ok("nine techs pay nothing", Legacy.award({ pop: 2500, techs: 9 }) === bare);

/* ---- 3. the award is monotonic in every term ---------------------------- */
let mono = true;
for (let pop = 0; pop <= 8000; pop += 250) {
  if (Legacy.award({ pop: pop + 250, wonders: 4, techs: 10, dyson: 1 }) <
      Legacy.award({ pop: pop, wonders: 4, techs: 10, dyson: 1 })) mono = false;
}
ok("more population never scores less", mono);

/* ---- 4. hostile input is refused, never trusted ------------------------- */
const junk = [undefined, null, 0, "", "nine", [], {}, NaN, Infinity, -Infinity, -5];
let junkOk = true;
for (const v of junk) {
  const a = Legacy.award(v);
  if (!(typeof a === "number" && isFinite(a) && a >= 1 && Math.floor(a) === a)) junkOk = false;
}
ok("every junk run is refused to a whole point >= 1", junkOk);
ok("a run with NaN fields is a bare ascension",
  Legacy.award({ pop: NaN, wonders: NaN, techs: NaN, dyson: NaN }) === 1);
ok("negative counts are not credits", Legacy.award({ pop: -5000, wonders: -9 }) === 1);
ok("a fractional count is floored, not rounded up",
  Legacy.award({ pop: 3499.9 }) === bare, String(Legacy.award({ pop: 3499.9 })));

/* ---- 5. the ladder ------------------------------------------------------ */
const R = Legacy.RANKS;
ok("the ladder is not empty", Array.isArray(R) && R.length >= 5);
ok("the first rank starts at 0", R[0].at === 0, String(R[0].at));
let sorted = true, named = true, uniq = new Set();
for (let i = 0; i < R.length; i++) {
  if (i && R[i].at <= R[i - 1].at) sorted = false;
  if (!R[i].n || !R[i].ic) named = false;
  uniq.add(R[i].n);
}
ok("the ladder is strictly ascending", sorted);
ok("every rank has a name and an icon", named);
ok("no two ranks share a name", uniq.size === R.length);

ok("0 points holds the first rank", Legacy.rank(0).n === R[0].n);
ok("the rank is held AT its threshold", Legacy.rank(R[2].at).n === R[2].n);
ok("one point short is the rank below", Legacy.rank(R[2].at - 1).n === R[1].n);
ok("a huge score holds the top rank",
  Legacy.rank(1e6).n === R[R.length - 1].n);
ok("rankIndex agrees with rank",
  R.every((r, i) => Legacy.rankIndex(r.at) === i));
ok("nextRank at 0 is the second rank", Legacy.nextRank(0).n === R[1].n);
ok("nextRank at the top is null", Legacy.nextRank(R[R.length - 1].at) === null);
ok("toNext counts the points still needed", Legacy.toNext(R[1].at - 1) === 1);
ok("toNext at the top is 0", Legacy.toNext(1e6) === 0);
ok("a junk score holds the first rank", Legacy.rank(NaN).n === R[0].n);

/* ---- 6. what the player already had must not move ---------------------- */
ok("income is still +25% per point", Legacy.incomePct(4) === 100);
ok("income of a junk score is 0", Legacy.incomePct("x") === 0);
ok("the starting seed is still 1500 money per point", Legacy.startBonus(3).money === 4500);
ok("the starting seed is still 600 mats per point", Legacy.startBonus(3).mats === 1800);
ok("a junk score starts with nothing", Legacy.startBonus(null).money === 0);

/* ---- 7. the label the HUD shows ---------------------------------------- */
ok("no label at zero", Legacy.label(0) === "");
ok("the label carries the rank name", Legacy.label(10).indexOf(Legacy.rank(10).n) >= 0);
ok("the label carries the points", Legacy.label(10).indexOf("10") >= 0);

/* ---- 8. the second ascension tier -------------------------------------- */
const TOP = R[R.length - 1].at;
ok("the top of the ladder is where Transcendence unlocks", Legacy.isTop(TOP) === true);
ok("one point short of the top does not unlock it", Legacy.isTop(TOP - 1) === false);
ok("a junk score is not at the top", Legacy.isTop(NaN) === false);
ok("the tier constant is exposed", Legacy.TIER_BONUS === 10 && Legacy.TOP === TOP);

const t0 = Legacy.transcend({ points: TOP, tier: 0 });
ok("transcending from the top is allowed", t0.ok === true);
ok("it spends the legacy back to zero", t0.points === 0);
ok("it raises the tier by exactly one", t0.tier === 1);
ok("it says what happened", /Ascension I/.test(t0.says));

const t1 = Legacy.transcend({ points: TOP, tier: 2 });
ok("a second transcendence goes to the next tier", t1.tier === 3);
ok("a tier carried as junk cannot corrupt the count", Legacy.transcend({ points: TOP, tier: NaN }).tier === 1);
ok("a negative tier counts as none", Legacy.transcend({ points: TOP, tier: -5 }).tier === 1);

const refused = Legacy.transcend({ points: TOP - 1, tier: 1 });
ok("transcending below the top is refused", refused.ok === false);
ok("the refusal names the rank that unlocks it", refused.reason.indexOf(R[R.length - 1].n) >= 0);
ok("the refusal names the points needed", refused.reason.indexOf(String(TOP)) >= 0);
ok("a refused transcendence moves nothing", refused.tier === undefined && refused.points === undefined);
ok("no state at all is refused, not assumed", Legacy.transcend().ok === false);
ok("transcend is pure: the input is not mutated", (function () {
  const st = { points: TOP, tier: 0 };
  Legacy.transcend(st);
  return st.points === TOP && st.tier === 0;
})());

ok("a tier is worth 10 percentage points with no points banked", Legacy.incomePct(0, 1) === 10);
ok("tiers add to the per-point bonus", Legacy.incomePct(5, 2) === 125 + 20);
ok("no tier leaves the old number exactly as it was", Legacy.incomePct(5) === 125);
ok("a junk tier adds nothing", Legacy.incomePct(5, "x") === 125);
ok("a transcended start is richer per point", Legacy.startBonus(2, 1).money === 6000);
ok("and its materials double too", Legacy.startBonus(2, 1).mats === 2400);
ok("no tier leaves the old seed exactly as it was", Legacy.startBonus(3).money === 4500);
ok("a tier with no points still starts with nothing", Legacy.startBonus(0, 3).money === 0);

ok("the label names the tier once one is held", Legacy.label(0, 1).indexOf("Ascension I") >= 0);
ok("the label names the second tier", Legacy.label(0, 2).indexOf("Ascension II") >= 0);
ok("the label keeps the rank inside a tier", Legacy.label(TOP, 1).indexOf(R[R.length - 1].n) >= 0);
ok("no tier means the old label is untouched", Legacy.label(10) === Legacy.label(10, 0));
ok("no points and no tier is still no label", Legacy.label(0, 0) === "");
ok("a tier the table has not named is still printed", Legacy.label(0, 12).indexOf("12") >= 0);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
