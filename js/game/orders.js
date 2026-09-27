// Village orders on the notice board: 3 optional requests per in-game day, paying more than the market.
import { FISH, FISH_BY_ID, LOCATIONS, LOCATION_LABELS, RARITIES, RARITY_LABELS, RARITY_RANK, TIME_BUCKETS, TIME_LABELS, ORDERS } from "./content.js";
import { createRng } from "./rng.js";
import { priceOf } from "./economy.js";
import { addXp } from "./skills.js";

const avg = list => list.reduce((a, b) => a + b, 0) / list.length;

/** Locations the player can fish at right now. */
export function reachableLocations(state) {
  return LOCATIONS.filter(l => l === "lake" || (l === "river" && state.unlocked.includes("river"))
    || (l === "sea" && state.unlocked.includes("sea")) || (l === "offshore" && state.boatOwned));
}

const orderFish = loc => FISH.filter(f => f.location === loc && !f.legendary);

// Each template builds one order from a seeded rng. Rewards are ORDERS.rewardMult x the plain market price.
const TEMPLATES = {
  species(rng, locs) {
    const f = rng.pick(locs.flatMap(orderFish));
    const count = f.baseValue < 15 ? 2 : 1;
    return { kind: "deliver", need: { speciesId: f.id }, count, base: f.baseValue * count };
  },
  rare(rng, locs) {
    const loc = rng.pick(locs);
    return { kind: "deliver", need: { location: loc, rarity: "rare" }, count: 1, base: avg(orderFish(loc).map(f => f.baseValue)) * 2.5 };
  },
  haul(rng, locs) {
    const loc = rng.pick(locs), count = 2 + Math.floor(rng.next() * 2);
    return { kind: "deliver", need: { location: loc }, count, base: avg(orderFish(loc).map(f => f.baseValue)) * count };
  },
  big(rng, locs) {
    const f = rng.pick(locs.flatMap(orderFish));
    const minSize = Math.round(f.sizeCm[0] + (f.sizeCm[1] - f.sizeCm[0]) * 0.65);
    return { kind: "deliver", need: { speciesId: f.id, minSize }, count: 1, base: f.baseValue * 1.3 };
  },
  timed(rng, locs) {
    const bucket = rng.pick(TIME_BUCKETS), count = 2 + Math.floor(rng.next() * 2);
    return { kind: "catch", need: { bucket }, count, base: 14 * count };
  },
  spot(rng, locs) {
    const loc = rng.pick(locs), count = 3;
    return { kind: "catch", need: { location: loc }, count, base: avg(orderFish(loc).map(f => f.baseValue)) * 0.9 * count };
  },
};

/** The day's 3 orders, deterministic for (save seed, day, reachable places). */
export function generateOrders(state) {
  const rng = createRng((state.rngSeed ^ Math.imul(state.day + 1, 0x9e3779b1)) >>> 0);
  const locs = reachableLocations(state);
  const kinds = Object.keys(TEMPLATES);
  const picked = [];
  while (picked.length < ORDERS.perDay) {
    const k = rng.pick(kinds);
    const catchKind = x => x === "timed" || x === "spot";
    if (!picked.includes(k) && !(catchKind(k) && picked.some(catchKind))) picked.push(k); // at most one catch order a day
  }
  const list = picked.map((k, i) => {
    const o = TEMPLATES[k](rng, locs);
    const coins = Math.max(10, Math.round((o.base * ORDERS.rewardMult) / 5) * 5);
    return { id: `d${state.day}-${i}`, kind: o.kind, need: o.need, count: o.count, coins, xp: Math.round(ORDERS.xpBase + coins * ORDERS.xpPerCoin), progress: 0, done: false };
  });
  return { day: state.day, list };
}

/** Regenerate when a new day has dawned. Returns true if the orders changed. */
export function ensureOrders(state) {
  if (state.orders && state.orders.day === state.day) return false;
  state.orders = generateOrders(state);
  return true;
}

export function fishMatches(order, fish) {
  const n = order.need, f = FISH_BY_ID[fish.speciesId];
  if (n.speciesId && fish.speciesId !== n.speciesId) return false;
  if (n.location && f.location !== n.location) return false;
  if (n.rarity && RARITY_RANK[fish.rarity] < RARITY_RANK[n.rarity]) return false;
  if (n.minSize && fish.sizeCm < n.minSize) return false;
  return !f.legendary;
}

/** The cheapest bag fish that fill a delivery order, or null if the bag can't fill it. */
export function matchingFish(state, order) {
  if (order.kind !== "deliver") return null;
  const found = state.inventory.filter(f => fishMatches(order, f)).sort((a, b) => priceOf(state, a) - priceOf(state, b));
  return found.length >= order.count ? found.slice(0, order.count) : null;
}

export const canHandIn = (state, order) => !order.done && (order.kind === "catch" ? order.progress >= order.count : !!matchingFish(state, order));

/** Count a landed fish toward the day's catch orders. */
export function recordCatch(state, encounter, location, bucket) {
  for (const o of state.orders?.list ?? []) {
    if (o.done || o.kind !== "catch" || o.progress >= o.count) continue;
    if ((o.need.bucket && o.need.bucket !== bucket) || (o.need.location && o.need.location !== location)) continue;
    o.progress += 1;
  }
}

/**
 * Hand in an order: delivered fish leave the bag. Pays the order's coins (never less than 1.5x what the fish
 * would sell for) plus XP. Returns { coins, xp, levels } or null.
 */
export function handIn(state, id) {
  const o = state.orders?.list.find(x => x.id === id);
  if (!o || !canHandIn(state, o)) return null;
  let coins = o.coins;
  if (o.kind === "deliver") {
    const fish = matchingFish(state, o);
    coins = Math.max(coins, Math.round(fish.reduce((a, f) => a + priceOf(state, f), 0) * 1.5));
    const uids = new Set(fish.map(f => f.uid));
    state.inventory = state.inventory.filter(f => !uids.has(f.uid));
    for (const f of fish) {
      const rec = state.records[f.speciesId];
      if (rec && rec.uid === f.uid) { rec.sold = true; rec.soldFor = Math.round(coins / fish.length); }
    }
  }
  o.done = true;
  state.coins += coins;
  const levels = addXp(state, o.xp);
  return { coins, xp: o.xp, levels };
}

/** Short request text, e.g. "Bring 2 Bluegill" or "Catch 3 fish at Dawn". */
export function orderText(order) {
  const n = order.need;
  if (order.kind === "catch") return `Catch ${order.count} fish ${n.bucket ? (n.bucket === "day" ? "during the Day" : `at ${TIME_LABELS[n.bucket]}`) : `at the ${LOCATION_LABELS[n.location]}`}`;
  const what = n.speciesId ? FISH_BY_ID[n.speciesId].name : `${n.rarity ? `${RARITY_LABELS[n.rarity]} ` : ""}${LOCATION_LABELS[n.location]} fish`;
  return `Bring ${order.count > 1 ? `${order.count} ` : n.rarity || n.speciesId ? "a " : ""}${what}${n.minSize ? ` over ${n.minSize} cm` : ""}`;
}

/** Defensive restore of saved orders; anything odd is dropped (a fresh set is generated at dawn or on load). */
export function sanitizeOrders(raw, day) {
  if (!raw || typeof raw !== "object" || raw.day !== day || !Array.isArray(raw.list)) return null;
  const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  const list = raw.list.filter(o => o && typeof o === "object" && typeof o.id === "string" && (o.kind === "deliver" || o.kind === "catch")
    && o.need && typeof o.need === "object" && int(o.count, 1, 9) && int(o.coins, 1, 100000) && int(o.xp, 0, 100000) && int(o.progress, 0, 9)
    && (!o.need.speciesId || (FISH_BY_ID[o.need.speciesId] && !FISH_BY_ID[o.need.speciesId].legendary))
    && (!o.need.location || LOCATIONS.includes(o.need.location)) && (!o.need.rarity || RARITIES.includes(o.need.rarity))
    && (!o.need.bucket || TIME_BUCKETS.includes(o.need.bucket)) && (o.need.minSize === undefined || int(o.need.minSize, 1, 1000))
    && (o.need.speciesId || o.need.location || o.need.bucket))
    .map(o => ({ id: o.id, kind: o.kind, need: { ...o.need }, count: o.count, coins: o.coins, xp: o.xp, progress: o.progress, done: o.done === true }));
  return list.length === ORDERS.perDay ? { day, list } : null;
}
