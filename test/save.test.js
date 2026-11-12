#!/usr/bin/env node
/* test/save.test.js — the save-file gate, proved in plain Node.
 *
 * WHY THIS EXISTS. `loadGame()` used to trust whatever JSON it found: an age
 * past the last age, a money value of Infinity, a building off the grid, or a
 * `{}` written by a bad import all became live state, and the game then threw
 * somewhere far from the cause (or silently overwrote a good city). src/save.js
 * is the gate that now sits in front of it; this file is what keeps the gate
 * honest, and it needs no browser: the module is pure.
 *
 *   node test/save.test.js        (or: npm test)
 *
 * MIT. (c) 2026 Dr Sohil Momin.
 */
"use strict";

const path = require("path");
const SaveIO = require(path.join(__dirname, "..", "src", "save.js"));

const AGES = 12; // the game's AGES.length is 12; the exact value does not matter
const OPTS = {
  ages: AGES,
  gw: 44,
  gh: 28,
  ids: ["hall", "zoneR", "zoneC", "zoneI", "road", "park"],
  // the real DEFS gives the Town Hall a 2x2 footprint; everything else is 1x1
  sizes: { hall: 2 }
};

let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name + (detail ? "  <- " + detail : "")); }
}
function gate(raw, opt) { return SaveIO.sanitise(raw, opt || OPTS); }

/* ---- 1. what is refused ------------------------------------------------- */
ok("null is refused", gate(null).ok === false);
ok("an array is refused", gate([]).ok === false);
ok("a string is refused", gate("{}").ok === false);
ok("a number is refused", gate(42).ok === false);
ok("a null reason is named", gate(null).reason === "not-an-object", gate(null).reason);

const newer = gate({ v: 2, money: 1 });
ok("a save from a newer build is refused", newer.ok === false && newer.reason === "newer-version", newer.reason);

const badV = gate({ v: "1" });
ok("a non-integer version is refused", badV.ok === false && badV.reason === "bad-version", badV.reason);
ok("version 0 is refused", gate({ v: 0 }).reason === "bad-version");

const notList = gate({ v: 1, buildings: {} });
ok("buildings that are not a list are refused", notList.ok === false && notList.reason === "buildings-not-a-list", notList.reason);

// A city with buildings but no Town Hall cannot be played: nothing can be placed
// without one, so loading it is a dead end rather than a smaller city.
const noHall = gate({ v: 1, buildings: [["zoneR", 5, 5, 1, 0, 0]] });
ok("buildings without a Town Hall are refused", noHall.ok === false && noHall.reason === "no-town-hall", noHall.reason);

/* ---- 2. what is repaired ------------------------------------------------ */
// A legacy save carries no `v` at all (every save before 1.0 did not write one).
const legacy = gate({ age: 3, money: 900, buildings: [["hall", 20, 14, 1, 0, 0]] });
ok("a save with no version is accepted", legacy.ok === true, legacy.reason);
ok("a save with no version is stamped with the current one", legacy.ok && legacy.save.v === SaveIO.VERSION);

// age is an index into AGES: 999 would make AGES[999] undefined and the next
// render throw. It is clamped, not refused — the rest of the city is fine.
const oldAge = gate({ v: 1, age: 999 });
ok("an age past the last age is clamped", oldAge.ok && oldAge.save.age === AGES - 1, oldAge.save && oldAge.save.age);
ok("the clamped age is reported as a repair", oldAge.repairs.indexOf("age") >= 0, oldAge.repairs.join(","));

const negAge = gate({ v: 1, age: -5 });
ok("a negative age is clamped to 0", negAge.ok && negAge.save.age === 0);

// Infinity is what a hand-edited "1e999" becomes, and it makes every cost
// comparison false forever. Non-finite is not a big number, it is corruption:
// it takes the default. A merely absurd finite number is capped instead.
const infMoney = gate({ v: 1, money: Infinity });
ok("an infinite balance becomes the default", infMoney.ok && infMoney.save.money === 0, infMoney.save && infMoney.save.money);
ok("the repaired balance is reported", infMoney.repairs.indexOf("money") >= 0);

const hugeMoney = gate({ v: 1, money: 1e300 });
ok("an absurd finite balance is capped", hugeMoney.ok && hugeMoney.save.money === SaveIO.CAP, hugeMoney.save && hugeMoney.save.money);

const nanMoney = gate({ v: 1, money: NaN });
ok("a NaN balance becomes the default", nanMoney.ok && nanMoney.save.money === 0);

const strMoney = gate({ v: 1, money: "999999" });
ok("a string balance is not coerced", strMoney.ok && strMoney.save.money === 0, strMoney.save && strMoney.save.money);

const negPop = gate({ v: 1, pop: -40 });
ok("a negative population is clamped to 0", negPop.ok && negPop.save.pop === 0);

const missingFood = gate({ v: 1 });
ok("a missing field takes its default", missingFood.ok && missingFood.save.food === 60, missingFood.save && missingFood.save.food);

/* ---- 3. buildings and roads -------------------------------------------- */
const mixed = gate({
  v: 1,
  buildings: [
    ["hall", 20, 14, 1, 0, 0],
    ["zoneR", 5, 5, 2, 50, 120],      // valid
    ["nope", 6, 6, 1, 0, 0],          // unknown type
    ["zoneR", 99, 5, 1, 0, 0],        // off the grid (x)
    ["zoneR", 5, -1, 1, 0, 0],        // off the grid (z)
    ["zoneR", 5.5, 5, 1, 0, 0],       // not a tile
    "garbage",                         // not an entry at all
    ["zoneC", 7, 7, 99, 0, 0]         // level past any real one
  ]
});
ok("the valid buildings survive", mixed.ok && mixed.save.buildings.length === 3, mixed.save && mixed.save.buildings.length);
ok("an unknown building type is dropped", !mixed.save.buildings.some((b) => b[0] === "nope"));
ok("an off-grid building is dropped", mixed.save.buildings.every((b) => b[1] >= 0 && b[1] < 44 && b[2] >= 0 && b[2] < 28));
ok("the dropped count is reported", mixed.repairs.indexOf("buildings-dropped:5") >= 0, mixed.repairs.join(","));
const lvl = mixed.save.buildings.filter((b) => b[0] === "zoneC")[0];
ok("a level past any real one is clamped", lvl && lvl[3] === 9, lvl && lvl[3]);
ok("a valid level is kept as it was", mixed.save.buildings.filter((b) => b[0] === "zoneR")[0][3] === 2);

const roads = gate({
  v: 1,
  buildings: [["hall", 20, 14, 1, 0, 0]],
  roads: [[1, 2], [44, 2], [-1, 3], [3], "x"]
});
ok("valid roads survive", roads.ok && roads.save.roads.length === 1, roads.save && roads.save.roads.length);
ok("off-grid roads are dropped", roads.repairs.indexOf("roads-dropped:4") >= 0, roads.repairs.join(","));

/* ---- 3b. footprints and overlap (2026-11-12) ------------------------- */
// bAt() returns the FIRST match, so a building that overlaps one kept earlier can
// never be selected or demolished again, yet still counts toward population and
// quests — and a duplicated `unique` wonder locks the real one out. The gate now
// mirrors canPlace(): whole footprint on the grid, no shared ground.
const overlap = gate({
  v: 1,
  buildings: [
    ["hall", 20, 14, 1, 0, 0],   // 2x2 at 20,14 -> holds (20,14)(21,14)(20,15)(21,15)
    ["zoneR", 21, 15, 1, 0, 0],  // inside the hall's footprint
    ["zoneR", 5, 5, 1, 0, 0],    // clear
    ["zoneR", 5, 5, 1, 0, 0],    // the same tile again
    ["park", 6, 6, 1, 0, 0]      // clear
  ]
});
ok("a building inside another's footprint is dropped", !overlap.save.buildings.some((b) => b[0] === "zoneR" && b[1] === 21), JSON.stringify(overlap.save.buildings));
ok("a duplicated tile keeps one building", overlap.save.buildings.filter((b) => b[0] === "zoneR" && b[1] === 5 && b[2] === 5).length === 1, JSON.stringify(overlap.save.buildings));
ok("the two clear buildings still load", overlap.save.buildings.length === 3, overlap.save.buildings.length);
ok("the overlapped count is reported", overlap.repairs.indexOf("buildings-overlap:2") >= 0, overlap.repairs.join(","));
ok("an overlapped save is repaired, not refused", overlap.ok === true, overlap.reason);

// The whole footprint must fit on the grid, not just its origin: 44 wide means a
// 2x2 at x=43 would draw off the map.
const edge = gate({ v: 1, buildings: [["hall", 20, 14, 1, 0, 0], ["hall", 43, 27, 1, 0, 0]] });
ok("a footprint running off the grid is dropped", edge.save.buildings.length === 1, edge.save.buildings.length);
ok("an off-grid footprint is counted as dropped", edge.repairs.indexOf("buildings-dropped:1") >= 0, edge.repairs.join(","));
const edgeZ = gate({ v: 1, buildings: [["hall", 20, 14, 1, 0, 0], ["hall", 10, 27, 1, 0, 0]] });
ok("the same rule applies on the z axis", edgeZ.save.buildings.length === 1, edgeZ.save.buildings.length);

// Dropping the duplicate must not quietly cost the city its Town Hall.
const twinHall = gate({ v: 1, buildings: [["zoneR", 4, 4, 1, 0, 0], ["hall", 20, 14, 1, 0, 0], ["hall", 20, 14, 1, 0, 0]] });
ok("a duplicated Town Hall keeps exactly one", twinHall.save.buildings.filter((b) => b[0] === "hall").length === 1);
ok("and the city is still playable", twinHall.ok === true && SaveIO.hasHall(twinHall.save.buildings));

// 1x1 callers (no sizes supplied) keep the old rule, so an older embed still works.
const noSizes = gate({ v: 1, buildings: [["hall", 20, 14, 1, 0, 0], ["zoneR", 21, 15, 1, 0, 0]] }, { ages: AGES, gw: 44, gh: 28, ids: OPTS.ids });
ok("without sizes a 1x1 neighbour is not treated as overlap", noSizes.save.buildings.length === 2, noSizes.save.buildings.length);
ok("sizeOf defaults to 1 for an unknown id", SaveIO.sizeOf("nope", { hall: 2 }) === 1);
ok("sizeOf reads the map", SaveIO.sizeOf("hall", { hall: 2 }) === 2);

// Roads: a doubled tile is one road, not two.
const dupRoads = gate({
  v: 1,
  buildings: [["hall", 20, 14, 1, 0, 0]],
  roads: [[1, 2], [1, 2], [2, 2], [2, 2], [2, 2]]
});
ok("a duplicated road tile is kept once", dupRoads.save.roads.length === 2, dupRoads.save.roads.length);
ok("the duplicated road count is reported", dupRoads.repairs.indexOf("roads-duplicate:3") >= 0, dupRoads.repairs.join(","));

/* ---- 4. the shapes the loader indexes -------------------------------- */
const shapes = gate({ v: 1, questsDone: "x", ach: null, tech: 7, cleared: {}, medals: "gold", chal: 5 });
ok("a non-list quest log becomes a list", Array.isArray(shapes.save.questsDone) && shapes.save.questsDone.length === 0);
ok("a non-list achievement log becomes a list", Array.isArray(shapes.save.ach));
ok("a non-list tech list becomes a list", Array.isArray(shapes.save.tech));
ok("a non-list cleared list becomes a list", Array.isArray(shapes.save.cleared));
ok("a non-object medal set becomes an object", shapes.save.medals !== null && typeof shapes.save.medals === "object" && !Array.isArray(shapes.save.medals));
ok("a non-object challenge is dropped", shapes.save.chal === null);

/* ---- 5. a clean save is left alone ------------------------------------ */
const clean = {
  v: 1, age: 2, money: 1234, mats: 55, fuel: 3, food: 60, waste: 0, legacy: 1,
  pop: 30, time: 900, seed: 7, questsDone: ["q1"], buildings: [["hall", 20, 14, 1, 0, 0]],
  roads: [[1, 2]], cleared: [], lastSave: 1700000000000, tut: 99, dead: false,
  warned: false, ach: ["a"], tech: ["t"], rp: 4, petT: 150, disT: 300, chal: null, medals: {}
};
const same = gate(clean);
ok("a clean save passes", same.ok === true, same.reason);
ok("a clean save needs no repair", same.repairs.length === 0, same.repairs.join(","));
ok("a clean save keeps its numbers", same.save.money === 1234 && same.save.pop === 30 && same.save.age === 2);
ok("a clean save keeps its buildings", same.save.buildings.length === 1 && same.save.buildings[0][0] === "hall");
ok("the gate reports its own version", SaveIO.VERSION === 1);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
