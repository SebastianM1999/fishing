// Inventory, collection, selling, shop and boat rules on plain state.
import { GEAR, BOAT_PRICE, REGIONS, RARITY_RANK, BAGS, FISH_BY_ID, STREAK } from "./content.js";
import { skillEffects, normalizedSize } from "./skills.js";
import { milestoneEffects } from "./collection.js";

export const bagCapacity = state => BAGS[state.bag].slots + skillEffects(state).bagBonus + milestoneEffects(state).bag;
export const bagFull = state => state.inventory.length >= bagCapacity(state);

export const streakBonus = streak => Math.min(streak, STREAK.maxFish) * STREAK.perFish;

/**
 * Catch streak bookkeeping for a finished session. A landed fish extends the streak and carries its bonus;
 * a snapped line, escape or missed hook resets it (reeling in early doesn't count). Returns the streak lost, if any.
 */
export function updateStreak(state, outcome, encounter) {
  if (outcome === "caught") {
    state.streak += 1;
    encounter.streakBonus = streakBonus(state.streak);
    return 0;
  }
  if (outcome === "broke" || outcome === "escaped" || outcome === "missed") {
    const lost = state.streak;
    state.streak = 0;
    return lost;
  }
  return 0;
}

/** True if catch a beats catch b as a species record: rarer first, then bigger. */
export function isBetterRecord(a, b) {
  if (!b) return true;
  if (RARITY_RANK[a.rarity] !== RARITY_RANK[b.rarity]) return RARITY_RANK[a.rarity] > RARITY_RANK[b.rarity];
  return a.sizeCm > b.sizeCm;
}

/** A species not yet on the wallboard: its catch waits for the player's choice (wallboard or bag). */
export const isNewSpecies = (state, encounter) => !state.discovered.includes(encounter.speciesId);
/** Never caught before (no record either): earns the first-catch XP bonus once, whatever the player chooses. */
export const isFirstCatch = (state, encounter) => isNewSpecies(state, encounter) && !state.records[encounter.speciesId];

function logRecord(state, encounter, fish, released, mounted) {
  const id = encounter.speciesId;
  const better = isBetterRecord(encounter, state.records[id]);
  if (better) state.records[id] = { rarity: encounter.rarity, sizeCm: encounter.sizeCm, value: encounter.value, uid: fish ? fish.uid : null, sold: false, released, mounted };
  return better;
}

/**
 * Register a caught fish of an already-mounted species: it goes to the bag, or is released when the bag
 * is full. New species go through placeNewSpecies() instead. Any catch can become the best-catch record.
 */
export function addCatch(state, encounter) {
  let fish = null, released = false;
  if (bagFull(state)) released = true;
  else {
    fish = { uid: state.nextFishUid++, ...encounter };
    state.inventory.push(fish);
  }
  const hadRecord = !!state.records[encounter.speciesId];
  const better = logRecord(state, encounter, fish, released, false);
  return { discovered: false, fish, released, newRecord: better && hadRecord };
}

/**
 * The player's choice for a first catch: "wall" mounts it on the wallboard (no coins, species discovered),
 * "bag" keeps it as a sellable fish (the wallboard slot stays empty until a later catch is mounted).
 */
export function placeNewSpecies(state, encounter, choice) {
  if (choice === "wall") {
    if (!state.discovered.includes(encounter.speciesId)) state.discovered.push(encounter.speciesId);
    logRecord(state, encounter, null, false, true);
    return { discovered: true, fish: null, released: false };
  }
  if (bagFull(state)) return null;
  const fish = { uid: state.nextFishUid++, ...encounter };
  state.inventory.push(fish);
  logRecord(state, encounter, fish, false, false);
  return { discovered: false, fish, released: false };
}

/** Sell price today: fish.value (base) plus Haggler, Tall Tales and Trophy Hunter bonuses. */
export function priceOf(state, fish) {
  const fx = skillEffects(state);
  const species = FISH_BY_ID[fish.speciesId];
  let mult = 1 + fx.sellBonus + fx.tallTales * normalizedSize(species, fish.sizeCm) + (fish.streakBonus ?? 0) + (milestoneEffects(state).sell[species.location] ?? 0);
  if (fx.trophyHunter) mult += state.discovered.length * 0.01 + (fish.rarity === "legendary" ? 0.5 : 0);
  return Math.max(1, Math.round(fish.value * mult));
}
export const inventoryWorth = state => state.inventory.reduce((sum, f) => sum + priceOf(state, f), 0);

function markSold(state, fish, price) {
  const rec = state.records[fish.speciesId];
  if (rec && rec.uid === fish.uid) { rec.sold = true; rec.soldFor = price; }
}

export function sellOne(state, uid) {
  const i = state.inventory.findIndex(f => f.uid === uid);
  if (i < 0) return 0;
  const price = priceOf(state, state.inventory[i]);
  const [fish] = state.inventory.splice(i, 1);
  markSold(state, fish, price);
  state.coins += price;
  return price;
}

export function sellAll(state) {
  let total = 0;
  for (const fish of state.inventory) {
    const price = priceOf(state, fish);
    markSold(state, fish, price);
    total += price;
  }
  state.inventory = [];
  state.coins += total;
  return total;
}

/** Put a bag fish on the trophy shelf; a trophy already in that spot goes back into the bag (needs no extra room). */
export function mountTrophy(state, uid, slot) {
  const i = state.inventory.findIndex(f => f.uid === uid);
  if (i < 0 || !(slot in state.trophies)) return false;
  const [fish] = state.inventory.splice(i, 1);
  if (state.trophies[slot]) state.inventory.push(state.trophies[slot]);
  state.trophies[slot] = fish;
  return true;
}

/** Take a trophy down into the bag. Never releases anything: fails when the bag is full. */
export function unmountTrophy(state, slot) {
  const fish = state.trophies[slot];
  if (!fish || bagFull(state)) return false;
  state.inventory.push(fish);
  state.trophies[slot] = null;
  return true;
}

export function buyBag(state) {
  const next = BAGS[state.bag + 1];
  if (!next || state.coins < next.price) return false;
  state.coins -= next.price;
  state.bag += 1;
  return true;
}

/** Regions open in order: a region's prerequisite must be cleared first. */
export const regionAvailable = (state, id) => !REGIONS[id].requires || state.unlocked.includes(REGIONS[id].requires);

export function unlockRegion(state, id) {
  const region = REGIONS[id];
  if (!region || state.unlocked.includes(id) || !regionAvailable(state, id) || state.coins < region.price) return false;
  state.coins -= region.price;
  state.unlocked.push(id);
  return true;
}

export function nextGear(state, slot) {
  return GEAR[slot][state.gear[slot] + 1] ?? null;
}

export function buyGear(state, slot) {
  const item = nextGear(state, slot);
  if (!item || state.coins < item.price) return false;
  state.coins -= item.price;
  state.gear[slot] += 1; // new tier is equipped automatically
  return true;
}

export function buyBoat(state) {
  if (state.boatOwned || state.coins < BOAT_PRICE) return false;
  state.coins -= BOAT_PRICE;
  state.boatOwned = true;
  return true;
}
