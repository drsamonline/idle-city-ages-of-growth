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

  // The income bonus, unchanged: +25% per legacy point.
  function incomePct(points) {
    return count(points) * 25;
  }

  // The wonder discount — what the RANK is for.
  //
  // The income bonus is per POINT, so the ladder changed nothing a player could
  // feel: two cities on the same score earned the same money under different
  // names, and a Settler was an Architect with a different word on the HUD. The
  // rank now buys something points alone do not: every wonder in the next city
  // costs less. 5% per rank above Settler, so the ladder is worth climbing past
  // the point where income already carries you.
  var WONDER_DISCOUNT_PER_RANK = 5;

  // The percentage off every wonder's money AND materials cost at `points`.
  //
  // There is deliberately no separate cap: `rankIndex` is already bounded by the
  // ladder, so the discount tops out at the top rank (6 * 5% = 30% today) and a
  // cap written beside it would be a number no input could reach — code no test
  // can tell from its own removal. If the ladder ever grows, the discount grows
  // with it, which is the behaviour a player would expect anyway.
  function wonderDiscountPct(points) {
    return rankIndex(points) * WONDER_DISCOUNT_PER_RANK;
  }

  // What a wonder costs at `points`, given its list price. The arithmetic lives
  // HERE, not in game.js, so the test can prove the price a player is charged
  // and not merely that the page mentions the function. Rounded once, at the
  // end, so a cost is always a whole number and never negative.
  function discount(cost, points) {
    var m = count(cost && cost.m),
      t = count(cost && cost.t),
      pct = wonderDiscountPct(points);
    if (!pct) return { m: m, t: t };
    var f = (100 - pct) / 100;
    return { m: Math.round(m * f), t: Math.round(t * f) };
  }

  // What a new city starts with, unchanged: the same per-point seed the game
  // has always given, now read from one place instead of two literals.
  function startBonus(points) {
    var p = count(points);
    return { money: p * 1500, mats: p * 600 };
  }

  // "🌟 Architect · 12" — the one-line label the HUD and the toasts share.
  function label(points) {
    var p = count(points);
    if (p <= 0) return "";
    return rank(p).ic + " " + rank(p).n + " · " + p;
  }

  return {
    RANKS: RANKS,
    GATE_POP: GATE_POP,
    MAX_AWARD: MAX_AWARD,
    award: award,
    rank: rank,
    rankIndex: rankIndex,
    nextRank: nextRank,
    toNext: toNext,
    incomePct: incomePct,
    WONDER_DISCOUNT_PER_RANK: WONDER_DISCOUNT_PER_RANK,
    wonderDiscountPct: wonderDiscountPct,
    discount: discount,
    startBonus: startBonus,
    label: label
  };
})();

// Node (the tests) gets the module; the browser gets the global, which is what
// src/index.html loads it for.
if (typeof module !== "undefined" && module.exports) module.exports = Legacy;
