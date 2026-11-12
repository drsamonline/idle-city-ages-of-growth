// IDLE CITY — Ages of Growth
// Author: Dr. Sohil Momin — Copyright (c) 2026 — PolyForm Noncommercial License 1.0.0 (see LICENSE)
// Please keep this notice in any copy or substantial reuse.
//
// src/save.js — the gate a saved city has to pass before the game will load it.
//
// WHY THIS EXISTS. `loadGame()` used to copy the parsed JSON straight onto the
// live state: `S.age = data.age || 0`, `S.money = data.money || 0`, and every
// building pushed in whatever shape it arrived. A save is the one file a player
// can edit, hand-copy between devices, or get truncated by a full disk — and a
// bad one used to take the game down rather than be refused:
//
//   age: 999            -> AGES[999] is undefined, the next render throws
//   money: "1e999"      -> Infinity, and every cost comparison is false forever
//   buildings: [[...]]  -> a coordinate outside the grid draws off-map, or
//                          hits map[z] when z is not a row
//   a truncated file    -> JSON.parse already threw, but a *valid* JSON with the
//                          wrong shape ({} or []) sailed through and produced a
//                          city with no Town Hall and no way to build one
//
// So the rule is: refuse what cannot be interpreted (not an object, a version
// this build does not know, buildings that are not a list), repair what can be
// (clamp a number, drop a building that is off-grid or of an unknown type) and
// say which of the two happened. A refused save starts a fresh city instead of
// throwing; a repaired save loads and keeps everything that was salvageable.
//
// Pure on purpose: no DOM, no localStorage, no globals beyond `SaveIO` — so
// test/save.test.js can exercise it in plain Node.
"use strict";

var SaveIO = (function () {
  var VERSION = 1;
  // Every resource is a float in a simulation; anything past this is corruption,
  // not wealth. It is far above any reachable total and far below Infinity.
  var CAP = 1e15;

  function isObj(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function isInt(v) {
    return typeof v === "number" && isFinite(v) && Math.floor(v) === v;
  }

  // A number, or `def` when it is missing/not finite; then clamped to [min, max].
  function num(v, def, min, max) {
    if (typeof v !== "number" || !isFinite(v)) return def;
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  function list(v) {
    return Array.isArray(v) ? v : [];
  }

  // The footprint side of a building, in tiles. Unknown or absent -> 1x1, which
  // is what the game's own `d.size || 1` falls back to.
  function sizeOf(id, sizes) {
    var s = sizes && typeof sizes === "object" ? sizes[id] : 1;
    return isInt(s) && s > 0 ? s : 1;
  }

  // The scalar fields, with the default and the range each one may hold.
  var FIELDS = [
    ["money", 0, 0, CAP],
    ["mats", 0, 0, CAP],
    ["fuel", 0, 0, CAP],
    ["food", 60, 0, CAP],
    ["waste", 0, 0, CAP],
    ["legacy", 0, 0, CAP],
    ["pop", 5, 0, CAP],
    ["time", 0, 0, CAP],
    ["rp", 0, 0, CAP],
    ["petT", 150, 0, CAP],
    ["disT", 300, 0, CAP],
    ["seed", 7, 0, 2147483647],
    ["tut", 0, 0, 99]
  ];

  function sanitise(raw, opt) {
    opt = opt || {};
    var ages = isInt(opt.ages) && opt.ages > 0 ? opt.ages : 1;
    var gw = isInt(opt.gw) && opt.gw > 0 ? opt.gw : 1;
    var gh = isInt(opt.gh) && opt.gh > 0 ? opt.gh : 1;
    var ids = Array.isArray(opt.ids) ? opt.ids : null;
    var sizes = isObj(opt.sizes) ? opt.sizes : null;
    var repairs = [];
    // Ground already claimed by a building kept earlier in this save, as "x,z".
    var taken = {};

    if (!isObj(raw)) return { ok: false, reason: "not-an-object", repairs: repairs };
    if (raw.v !== undefined && raw.v !== null) {
      if (!isInt(raw.v) || raw.v < 1) return { ok: false, reason: "bad-version", repairs: repairs };
      if (raw.v > VERSION) return { ok: false, reason: "newer-version", repairs: repairs };
    }
    if (raw.buildings !== undefined && !Array.isArray(raw.buildings)) {
      return { ok: false, reason: "buildings-not-a-list", repairs: repairs };
    }

    var s = {},
      i;

    s.v = VERSION;

    // The age is an index into AGES, so it is clamped to the ages this build has.
    var age = Math.round(num(raw.age, 0, 0, ages - 1));
    if (age !== raw.age) repairs.push("age");
    s.age = age;

    for (i = 0; i < FIELDS.length; i++) {
      var f = FIELDS[i][0];
      var v = num(raw[f], FIELDS[i][1], FIELDS[i][2], FIELDS[i][3]);
      if (v !== raw[f]) repairs.push(f);
      s[f] = v;
    }

    s.questsDone = list(raw.questsDone);
    s.ach = list(raw.ach);
    s.tech = list(raw.tech);
    s.cleared = list(raw.cleared);
    if (!Array.isArray(raw.medals)) {
      if (raw.medals !== undefined && !isObj(raw.medals)) repairs.push("medals");
      s.medals = isObj(raw.medals) ? raw.medals : {};
    } else {
      s.medals = {};
    }
    s.chal = isObj(raw.chal) ? raw.chal : null;
    if (raw.chal && !isObj(raw.chal)) repairs.push("chal");
    s.dead = !!raw.dead;
    s.warned = !!raw.warned;
    s.lastSave = num(raw.lastSave, 0, 0, Number.MAX_SAFE_INTEGER);

    // Buildings: [id, x, z, level, dev*100, xp]. An entry that is not a known
    // type or not on the grid is dropped rather than placed somewhere arbitrary.
    var buildings = [],
      droppedB = 0,
      overlappedB = 0,
      k,
      sz,
      dx,
      dz,
      hit;
    var rawB = list(raw.buildings);
    for (i = 0; i < rawB.length; i++) {
      k = rawB[i];
      if (!Array.isArray(k) || k.length < 3) { droppedB++; continue; }
      if (typeof k[0] !== "string" || (ids && ids.indexOf(k[0]) < 0)) { droppedB++; continue; }
      if (!isInt(k[1]) || !isInt(k[2]) || k[1] < 0 || k[1] >= gw || k[2] < 0 || k[2] >= gh) { droppedB++; continue; }
      // The whole footprint has to fit: canPlace() rejects a 2x2 whose far corner
      // is off the grid, so a save that carries one is damage, not a city.
      sz = sizeOf(k[0], sizes);
      if (k[1] + sz > gw || k[2] + sz > gh) { droppedB++; continue; }
      // And it cannot stand on ground a kept building already holds. bAt()
      // returns the first match, so an overlapped building is unreachable and
      // permanent; dropping it is the only repair that leaves a playable city.
      hit = false;
      for (dz = 0; dz < sz && !hit; dz++) {
        for (dx = 0; dx < sz; dx++) {
          if (taken[k[1] + dx + "," + (k[2] + dz)]) { hit = true; break; }
        }
      }
      if (hit) { overlappedB++; continue; }
      for (dz = 0; dz < sz; dz++) {
        for (dx = 0; dx < sz; dx++) taken[k[1] + dx + "," + (k[2] + dz)] = true;
      }
      buildings.push([
        k[0],
        k[1],
        k[2],
        Math.round(num(k[3], 1, 1, 9)),
        num(k[4], 0, 0, 100),
        num(k[5], 0, 0, CAP)
      ]);
    }
    if (droppedB) repairs.push("buildings-dropped:" + droppedB);
    if (overlappedB) repairs.push("buildings-overlap:" + overlappedB);
    s.buildings = buildings;

    // Roads: [x, z], same rule.
    var roads = [],
      droppedR = 0,
      dupR = 0,
      seen = {};
    var rawR = list(raw.roads);
    for (i = 0; i < rawR.length; i++) {
      k = rawR[i];
      if (!Array.isArray(k) || k.length < 2) { droppedR++; continue; }
      if (!isInt(k[0]) || !isInt(k[1]) || k[0] < 0 || k[0] >= gw || k[1] < 0 || k[1] >= gh) { droppedR++; continue; }
      // One road per tile: a doubled tile is the same road counted twice.
      if (seen[k[0] + "," + k[1]]) { dupR++; continue; }
      seen[k[0] + "," + k[1]] = true;
      roads.push([k[0], k[1]]);
    }
    if (droppedR) repairs.push("roads-dropped:" + droppedR);
    if (dupR) repairs.push("roads-duplicate:" + dupR);
    s.roads = roads;

    // A city with no Town Hall cannot be played (nothing can be placed without
    // one), so a save that lost it is refused rather than loaded into a dead end.
    if (buildings.length && !hasHall(buildings)) {
      return { ok: false, reason: "no-town-hall", repairs: repairs };
    }

    return { ok: true, reason: "ok", save: s, repairs: repairs };
  }

  function hasHall(buildings) {
    for (var i = 0; i < buildings.length; i++) if (buildings[i][0] === "hall") return true;
    return false;
  }

  var api = {
    VERSION: VERSION,
    CAP: CAP,
    sanitise: sanitise,
    hasHall: hasHall,
    sizeOf: sizeOf
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})();
