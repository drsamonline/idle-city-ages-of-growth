// IDLE CITY — Ages of Growth
// Author: Dr. Sohil Momin — Copyright (c) 2026 — PolyForm Noncommercial License 1.0.0 (see LICENSE)
// Please keep this notice in any copy or substantial reuse.
//
// src/legacy.js — what an ascension is WORTH, and what the worth unlocks.
//
// WHY THIS EXISTS. Ascension used to be a flat counter: reach the Orbital Age at
// 2,500 citizens, press Ascend, get `legacy + 1` and +25% income, forever. Two
// things followed from that:
//
//   - **The endgame was worth nothing.** The Dyson Ring is the last thing the
//     game asks you to build, and building it changed the ascension award by
//     exactly zero — a city that limped to 2,500 people and one that finished
//     the age, the whole research tree and nine wonders were scored identically.
//     The ring was a goal with nothing behind it.
//   - **Legacy had no ladder.** It was a number that went up. A player three
//     ascensions in had no name for where they were and no next thing to reach,
//     which is the one shape an idle game cannot afford.
//
// So the award is now a SCORE of the run (a ring, wonders, population past the
// gate, the research tree), and the score walks a ladder of named ranks. The
// +25% per point is untouched — a point is still a point — so no existing save
// changes value; what changed is how many points a good run earns.
//
// Pure on purpose: no DOM, no state, no globals beyond `Legacy` — so
// test/legacy.test.js can exercise it in plain Node, and the page only calls it.
"use strict";

var Legacy = (function () {
  // The ladder. `at` is the total points needed to hold the rank; the first rank
  // starts at 0 so every player holds one. Kept here and nowhere else: the HUD,
  // the toast and the tests all read this table.
  var RANKS = [
    { at: 0, n: "Settler", ic: "🏕️" },
    { at: 3, n: "Founder", ic: "🏛️" },
    { at: 6, n: "Steward", ic: "⚖️" },
    { at: 10, n: "Architect", ic: "📐" },
    { at: 15, n: "Worldsmith", ic: "🌍" },
    { at: 21, n: "Ringbearer", ic: "⭕" },
    { at: 28, n: "Star-founder", ic: "✨" }
  ];

  // The gate: the population at which Ascend unlocks (game.js holds the same
  // number; it is repeated here so the score can be explained on its own).
  var GATE_POP = 2500;
  // No run is worth more than this, whatever it reports. A bound, not a target.
  var MAX_AWARD = 12;

  // THE SECOND ASCENSION TIER. The ladder above has a top, and reaching it used
  // to be the end of the road: every later ascension paid points into a counter
  // that could only ever hold the same rank, so a player at Star-founder had
  // nothing left to earn. A TRANSCENDENCE is the ascension you can only take
  // FROM the top: legacy is spent back to 0 and the tier goes up by one. What
  // survives is the tier, and it is worth a flat +10 percentage points of income
  // forever — a floor under the next city, not a multiplier on the old one.
  //
  // It is deliberately NOT a bigger number on the same button. Reaching the top
  // is a decision: spend 28 points to be permanently richer at the start, or
  // keep them and stay where you are. A player who never transcends loses
  // nothing they had.
  var TIER_BONUS = 10;
  var TOP = RANKS[RANKS.length - 1].at;

  // A count: a positive finite number floored, anything else 0. A save, a bug or
  // a caller passing nothing must not be able to make an award NaN or negative.
  function count(v) {
    return typeof v === "number" && isFinite(v) && v > 0 ? Math.floor(v) : 0;
  }

  // award(run) -> the whole points an ascension of THIS run is worth.
  //
  //   run = { pop, wonders, techs, dyson }
  //
  // One point for ascending at all (the old behaviour, so a bare run is never
  // worse off), then one for each thing the run actually finished:
  //   +1  the Dyson Ring          — the endgame's own goal
  //   +1..+3  one per 3 wonders   — up to 9 wonders
  //   +1..+3  one per 1,000 citizens past the gate
  //   +1  the whole research tree (10 techs)
  function award(run) {
    var r = run && typeof run === "object" ? run : {};
    var pop = count(r.pop),
      wonders = count(r.wonders),
      techs = count(r.techs),
      dyson = count(r.dyson);
    var p = 1;
    if (dyson >= 1) p += 1;
    p += Math.min(3, Math.floor(wonders / 3));
    p += Math.min(3, Math.floor(Math.max(0, pop - GATE_POP) / 1000));
    if (techs >= 10) p += 1;
    return Math.min(MAX_AWARD, p);
  }

  // The rank held at `points` (total legacy, not this run's award).
  function rank(points) {
    var p = count(points),
      held = RANKS[0],
      i;
    for (i = 0; i < RANKS.length; i++) if (p >= RANKS[i].at) held = RANKS[i];
    return held;
  }

  function rankIndex(points) {
    var p = count(points),
      idx = 0,
      i;
    for (i = 0; i < RANKS.length; i++) if (p >= RANKS[i].at) idx = i;
    return idx;
  }

  // The next rank, or null at the top of the ladder.
  function nextRank(points) {
    var p = count(points),
      i;
    for (i = 0; i < RANKS.length; i++) if (RANKS[i].at > p) return RANKS[i];
    return null;
  }

  // How many more points the next rank needs; 0 at the top.
  function toNext(points) {
    var n = nextRank(points);
    return n ? n.at - count(points) : 0;
  }

  // Is the ladder finished? Transcendence unlocks here and nowhere else.
  function isTop(points) {
    return count(points) >= TOP;
  }

  // Transcend: the second-tier ascension. Pure — it returns the state the game
  // should write, and refuses rather than assuming a player is allowed.
  //
  //   transcend({ points, tier }) -> { ok, tier, points, says } | { ok:false, reason }
  function transcend(state) {
    var points = count(state && state.points),
      tier = count(state && state.tier);
    if (!isTop(points)) {
      return {
        ok: false,
        reason: "Transcendence unlocks at " + RANKS[RANKS.length - 1].n + " (" + TOP + " legacy points)"
      };
    }
    return {
      ok: true,
      tier: tier + 1,
      points: 0,
      says: "Transcended \u2014 Ascension " + roman(tier + 1) + ", legacy spent"
    };
  }

  // "II" for 2, and the number itself past the table: a tier the game has not
  // named is still a tier, and a save may carry any number of them.
  var NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  function roman(n) {
    return NUMERALS[n - 1] || String(n);
  }

  // The income bonus: +25% per legacy point, plus a flat +10 points per tier.
  // The second argument is optional, so every existing caller and save is worth
  // exactly what it was worth before.
  function incomePct(points, tier) {
    return count(points) * 25 + count(tier) * TIER_BONUS;
  }

  // What a new city starts with: the per-point seed, doubled per tier. A
  // transcended player starts a city with more, and the tier is why.
  function startBonus(points, tier) {
    var p = count(points),
      t = count(tier);
    return { money: p * 1500 * (1 + t), mats: p * 600 * (1 + t) };
  }

  // "🌟 Architect · 12", or "⭐ Ascension II · 0" once a tier is held — the one
  // line the HUD and the toasts share.
  function label(points, tier) {
    var p = count(points),
      t = count(tier);
    if (t > 0) return "\u2b50 Ascension " + roman(t) + (p > 0 ? " \u00b7 " + rank(p).n + " " + p : " \u00b7 " + p);
    if (p <= 0) return "";
    return rank(p).ic + " " + rank(p).n + " \u00b7 " + p;
  }

  return {
    RANKS: RANKS,
    GATE_POP: GATE_POP,
    MAX_AWARD: MAX_AWARD,
    TIER_BONUS: TIER_BONUS,
    TOP: TOP,
    isTop: isTop,
    transcend: transcend,
    roman: roman,
    award: award,
    rank: rank,
    rankIndex: rankIndex,
    nextRank: nextRank,
    toNext: toNext,
    incomePct: incomePct,
    startBonus: startBonus,
    label: label
  };
})();

// Node (the tests) gets the module; the browser gets the global, which is what
// src/index.html loads it for.
if (typeof module !== "undefined" && module.exports) module.exports = Legacy;
