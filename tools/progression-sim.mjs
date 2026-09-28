// Rough playtime check: a simulated player fishes the best place it can handle, sells when the bag is full and buys
// upgrades in a sensible order. Win rates come from the minigame bot (balance-sim.mjs); times are estimates of a
// human's pace (walking, catch cards, selling). Usage: node tools/progression-sim.mjs
import * as C from "../js/game/content.js";
import { createState } from "../js/game/state.js";
import * as fishing from "../js/game/fishing.js";
import * as skills from "../js/game/skills.js";
import { bagCapacity, priceOf } from "../js/game/economy.js";
import { winRate } from "./balance-sim.mjs";

const HOOK_RATE = { lake: 0.95, river: 0.9, sea: 0.86, offshore: 0.82, trench: 0.78 }; // bites hooked (nibbles, reaction)
const CARD_S = 3, SELL_TRIP_S = { lake: 40, river: 45, sea: 45, offshore: 70, trench: 90 };
const state = createState(7);
state.unlocked = [];
const cache = new Map();
const tierKey = s => `${s.gear.rod}${s.gear.reel}${s.gear.line}|${JSON.stringify(s.skills)}`;
function fight(loc) {
  const k = `${loc}|${tierKey(state)}`;
  if (!cache.has(k)) cache.set(k, winRate(state, loc, { n: 150 }));
  return cache.get(k);
}
const reachable = loc => loc === "lake" || (loc === "river" && state.unlocked.includes("river")) || (loc === "sea" && state.unlocked.includes("sea"))
  || (loc === "offshore" && state.boatOwned) || (loc === "trench" && state.trawlerOwned && fishing.locationOpen(state, "trench"));

/** Expected coins, XP and seconds per cast at a place (averaged over times of day, clear weather). */
function perCast(loc) {
  const stats = fishing.getStats(state, "day", "clear");
  let value = 0, xp = 0, n = 0;
  for (const bucket of C.TIME_BUCKETS) {
    const table = fishing.fishTable(loc, bucket, "clear", state.gear);
    const total = table.reduce((a, f) => a + (f.weight ?? 1), 0);
    const w = fishing.rarityWeights(loc, stats.rareWeightMult), wt = w.common + w.rare + w.legendary;
    for (const f of table) for (const r of C.RARITIES) {
      const rr = (f.special || f.giant) && r === "legendary" ? "rare" : r;
      const p = ((f.weight ?? 1) / total) * (w[r] / wt);
      const mid = (f.sizeCm[0] + f.sizeCm[1]) / 2;
      value += p * priceOf(state, { speciesId: f.id, rarity: rr, sizeCm: mid, value: fishing.salePrice(f, rr, mid) });
      xp += p * skills.catchXp(f, rr, mid);
    }
    n++;
  }
  const fr = fight(loc), land = HOOK_RATE[loc] * fr.win;
  const secs = 0.6 + 3.5 * stats.biteWaitMult + 0.4 + HOOK_RATE[loc] * fr.time + CARD_S;
  return { value: (value / n) * land, xp: (xp / n) * land, secs, land };
}

// Purchases in the order a sensible player makes them (skipping what's already owned).
const PLAN = [
  ["region", "river"], ["gear", "rod"], ["gear", "reel"], ["gear", "line"], ["region", "sea"],
  ["gear", "rod"], ["gear", "reel"], ["gear", "line"], ["bag"], ["boat"],
  ["gear", "rod"], ["gear", "reel"], ["gear", "line"], ["bag"], ["trawler"],
  ["gear", "rod"], ["gear", "reel"], ["gear", "line"], ["harpoon"],
];
const SKILL_ORDER = ["steady_hands", "strong_arm", "haggler", "iron_grip", "extra_pockets", "steady_hands", "strong_arm", "fish_courier", "haggler",
  "quick_reflexes", "steady_hands", "strong_arm", "keen_eye", "second_wind", "haggler", "iron_grip", "extra_pockets", "good_neighbour", "fish_finder",
  "patience", "patience", "keen_eye", "trophy_hunter", "iron_grip", "keen_eye"];
function priceOfStep([kind, what]) {
  if (kind === "gear") return C.GEAR[what][state.gear[what] + 1]?.price;
  if (kind === "region") return state.unlocked.includes(what) ? undefined : C.REGIONS[what].price;
  if (kind === "bag") return C.BAGS[state.bag + 1]?.price;
  if (kind === "boat") return state.boatOwned ? undefined : C.BOAT_PRICE;
  if (kind === "trawler") return state.trawlerOwned ? undefined : C.TRAWLER.price;
  if (kind === "harpoon") return state.harpoonOwned ? undefined : C.HARPOON.price;
}
function buy([kind, what]) {
  if (kind === "gear") state.gear[what]++;
  if (kind === "region") state.unlocked.push(what);
  if (kind === "bag") state.bag++;
  if (kind === "boat") state.boatOwned = true;
  if (kind === "trawler") state.trawlerOwned = true;
  if (kind === "harpoon") state.harpoonOwned = true;
}

let t = 0, step = 0, levelSeen = 1, skillIdx = 0, fishInBag = 0;
const log = (msg) => console.log(`${(t / 3600).toFixed(2).padStart(5)} h  lvl ${String(skills.levelOf(state.xp)).padStart(2)}  ${msg}`);
while (step < PLAN.length && t < 40 * 3600) {
  while (step < PLAN.length && priceOfStep(PLAN[step]) === undefined) step++;
  if (step >= PLAN.length) break;
  const price = priceOfStep(PLAN[step]);
  if (state.coins >= price) {
    state.coins -= price; buy(PLAN[step]);
    const label = PLAN[step][0] === "gear" ? C.GEAR[PLAN[step][1]][state.gear[PLAN[step][1]]].name : PLAN[step].join(" ");
    log(`bought ${label} (${price})`);
    step++; continue;
  }
  // Fish at the place with the best coins per second (among places the player wins at least half its fights).
  const opts = C.LOCATIONS.filter(reachable).map(loc => ({ loc, ...perCast(loc) })).filter(o => o.land / HOOK_RATE[o.loc] >= 0.5 || o.loc === "lake");
  const best = opts.sort((a, b) => b.value / b.secs - a.value / a.secs)[0];
  if (best.loc !== state.where) { state.where = best.loc; log(`fishing at ${best.loc} (${(best.value / best.secs * 60).toFixed(0)} coins/min, ${(best.land * 100).toFixed(0)}% landed)`); }
  // One minute of fishing.
  const casts = 60 / best.secs;
  state.coins += Math.round(best.value * casts);
  state.xp += Math.round(best.xp * casts);
  fishInBag += best.land * casts;
  t += 60;
  const cap = bagCapacity(state);
  if (fishInBag >= cap) { fishInBag -= cap; t += SELL_TRIP_S[best.loc]; }
  while (skills.levelOf(state.xp) > levelSeen) {
    levelSeen++;
    for (let tries = 0; tries < SKILL_ORDER.length && skillIdx < SKILL_ORDER.length; tries++) {
      const id = SKILL_ORDER[skillIdx++];
      if (skills.learn(state, id)) break;
    }
    if (levelSeen % 5 === 0) log(`level ${levelSeen}`);
  }
}
log(`done: every place and all gear (level ${skills.levelOf(state.xp)}, ${state.xp} XP)`);
