// Plain-data game state, plus (de)serialization with defensive validation for saves.
import { STARTING_COINS, DAY_LENGTH_MS, FISH_BY_ID, GEAR, GEAR_SLOTS, RARITIES, FISH, REGIONS, BAGS, XP_FIRST_CATCH } from "./content.js";
import { WORLD, isWalkable } from "./world.js";
import { catchXp, sanitizeSkills } from "./skills.js";

// v2: construction-barrier unlocks + per-species best-catch records. v3: bag tier. v4: xp + skills; hook & tackle removed.
export const SAVE_VERSION = 4;
// Coins refunded for pre-v4 purchases that no longer exist (cumulative hook tier prices, tackle prices).
const LEGACY_HOOK_REFUND = [0, 120, 420];
const LEGACY_TACKLE_REFUND = { tackle_float: 150, tackle_heavy_sinker: 200, tackle_spinner: 350 };

export function createState(seed = (Date.now() ^ 0x5eed) >>> 0) {
  return {
    coins: STARTING_COINS,
    // Owned tier index per gear slot (tiers are sequential); equipped = highest owned.
    gear: { rod: 0, reel: 0, line: 0 },
    bag: 0, // tier index into BAGS (capacity of sellable fish)
    xp: 0, // total XP; level and skill points derive from it
    skills: {}, // { skillId: rank }
    boatOwned: false,
    unlocked: [], // region ids from REGIONS whose construction barrier was cleared
    discovered: [], // species ids
    // Best specimen per species (rarest, then biggest): { rarity, sizeCm, value, uid|null, sold }
    records: {},
    inventory: [], // [{ uid, speciesId, rarity, sizeCm, value }]
    nextFishUid: 1,
    player: { x: WORLD.spawn.x, z: WORLD.spawn.z, facing: Math.PI, area: "land" },
    timeMs: 20 * 1000, // start early in Dawn
    rngSeed: seed >>> 0,
  };
}

export function serialize(state, rng) {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    coins: state.coins,
    gear: { ...state.gear },
    bag: state.bag,
    xp: state.xp,
    skills: { ...state.skills },
    boatOwned: state.boatOwned,
    unlocked: [...state.unlocked],
    discovered: [...state.discovered],
    records: structuredClone(state.records),
    inventory: state.inventory.map(f => ({ ...f })),
    nextFishUid: state.nextFishUid,
    player: { ...state.player },
    timeMs: Math.floor(state.timeMs),
    rngSeed: rng ? rng.seed : state.rngSeed,
  };
}

const num = (v, fallback) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

/** Build a valid state from possibly missing/corrupt/older save data. Never throws. */
export function deserialize(data) {
  const s = createState();
  if (!data || typeof data !== "object") return s;
  s.coins = Math.max(0, Math.floor(num(data.coins, s.coins)));
  if (data.gear && typeof data.gear === "object") {
    for (const slot of GEAR_SLOTS) {
      const tier = num(data.gear[slot], 0);
      // Out-of-range tiers are treated as corrupt and reset, never promoted to better gear.
      s.gear[slot] = Number.isInteger(tier) && tier >= 0 && tier < GEAR[slot].length ? tier : 0;
    }
  }
  const bag = num(data.bag, 0);
  s.bag = Number.isInteger(bag) && bag >= 0 && bag < BAGS.length ? bag : 0;
  s.boatOwned = data.boatOwned === true;
  if (Array.isArray(data.discovered)) {
    const order = FISH.map(f => f.id);
    s.discovered = order.filter(id => data.discovered.includes(id));
  }
  if (data.version === 1) s.unlocked = Object.keys(REGIONS); // v1 had every area open
  else if (Array.isArray(data.unlocked)) s.unlocked = Object.keys(REGIONS).filter(id => data.unlocked.includes(id));
  if (data.records && typeof data.records === "object") {
    for (const id of Object.keys(data.records)) {
      const r = data.records[id];
      if (!FISH_BY_ID[id]) continue;
      if (!r || !RARITIES.includes(r.rarity)) continue;
      s.records[id] = {
        rarity: r.rarity,
        sizeCm: num(r.sizeCm, FISH_BY_ID[id].sizeCm[0]),
        value: Math.max(1, Math.round(num(r.value, 1))),
        uid: Number.isInteger(r.uid) ? r.uid : null,
        sold: r.sold === true,
        ...(Number.isFinite(r.soldFor) && r.sold === true ? { soldFor: Math.max(1, Math.round(r.soldFor)) } : {}),
        released: r.released === true,
        mounted: r.mounted === true || (r.uid === null && r.released !== true),
      };
    }
  }
  if (Array.isArray(data.inventory)) {
    s.inventory = data.inventory
      .filter(f => f && FISH_BY_ID[f.speciesId] && RARITIES.includes(f.rarity))
      .map((f, i) => ({
        uid: Math.floor(num(f.uid, i + 1)),
        speciesId: f.speciesId,
        rarity: f.rarity,
        sizeCm: num(f.sizeCm, FISH_BY_ID[f.speciesId].sizeCm[0]),
        value: Math.max(1, Math.round(num(f.value, 1))),
      }));
  }
  s.nextFishUid = Math.max(num(data.nextFishUid, 1), ...s.inventory.map(f => f.uid + 1), 1);
  const p = data.player;
  if (p && typeof p === "object") {
    const area = p.area === "offshore" && s.boatOwned ? "offshore" : "land";
    const x = num(p.x, s.player.x);
    const z = num(p.z, s.player.z);
    if (isWalkable(x, z, area, s.unlocked) && (area === "land" || s.unlocked.includes("sea"))) s.player = { x, z, facing: num(p.facing, Math.PI), area };
  }
  if ((num(data.version, 1)) < 4) migrateToV4(s, data);
  else {
    s.xp = Math.max(0, Math.floor(num(data.xp, 0)));
    s.skills = sanitizeSkills(data.skills, s.xp);
  }
  s.timeMs = ((num(data.timeMs, s.timeMs) % DAY_LENGTH_MS) + DAY_LENGTH_MS) % DAY_LENGTH_MS;
  s.rngSeed = Math.floor(num(data.rngSeed, s.rngSeed)) >>> 0;
  return s;
}

/** Pre-v4 saves: refund the removed hook tiers and tackle as coins, grant XP for the catches already logged. */
function migrateToV4(s, data) {
  const hook = data.gear?.hook;
  if (Number.isInteger(hook) && hook > 0 && hook < LEGACY_HOOK_REFUND.length) s.coins += LEGACY_HOOK_REFUND[hook];
  if (Array.isArray(data.ownedTackle)) for (const id of new Set(data.ownedTackle)) s.coins += LEGACY_TACKLE_REFUND[id] ?? 0;
  s.xp = Object.entries(s.records).reduce((xp, [id, r]) => xp + catchXp(FISH_BY_ID[id], r.rarity, r.sizeCm), 0)
    + s.discovered.length * XP_FIRST_CATCH;
  s.skills = {};
}
