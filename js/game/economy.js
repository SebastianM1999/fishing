// Inventory, collection, selling, shop and boat rules on plain state.
import { GEAR, TACKLE_BY_ID, BOAT_PRICE, REGIONS, RARITY_RANK, BAGS } from "./content.js";

export const bagCapacity = state => BAGS[state.bag].slots;
export const bagFull = state => state.inventory.length >= bagCapacity(state);

/** True if catch a beats catch b as a species record: rarer first, then bigger. */
export function isBetterRecord(a, b) {
  if (!b) return true;
  if (RARITY_RANK[a.rarity] !== RARITY_RANK[b.rarity]) return RARITY_RANK[a.rarity] > RARITY_RANK[b.rarity];
  return a.sizeCm > b.sizeCm;
}

/** A species not yet on the wallboard: its catch waits for the player's choice (wallboard or bag). */
export const isNewSpecies = (state, encounter) => !state.discovered.includes(encounter.speciesId);

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

function markSold(state, fish) {
  const rec = state.records[fish.speciesId];
  if (rec && rec.uid === fish.uid) rec.sold = true;
}

export function sellOne(state, uid) {
  const i = state.inventory.findIndex(f => f.uid === uid);
  if (i < 0) return 0;
  const [fish] = state.inventory.splice(i, 1);
  markSold(state, fish);
  state.coins += fish.value;
  return fish.value;
}

export function sellAll(state) {
  const total = state.inventory.reduce((sum, f) => sum + f.value, 0);
  for (const fish of state.inventory) markSold(state, fish);
  state.inventory = [];
  state.coins += total;
  return total;
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

export function buyTackle(state, id) {
  const item = TACKLE_BY_ID[id];
  if (!item || state.ownedTackle.includes(id) || state.coins < item.price) return false;
  state.coins -= item.price;
  state.ownedTackle.push(id);
  state.equippedTackle = id;
  return true;
}

export function equipTackle(state, id) {
  if (!state.ownedTackle.includes(id)) return false;
  state.equippedTackle = id;
  return true;
}

export function buyBoat(state) {
  if (state.boatOwned || state.coins < BOAT_PRICE) return false;
  state.coins -= BOAT_PRICE;
  state.boatOwned = true;
  return true;
}
