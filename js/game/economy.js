// Inventory, collection, selling, shop and boat rules on plain state.
import { GEAR, TACKLE_BY_ID, BOAT_PRICE, REGIONS, RARITY_RANK, DISCOVERY_BONUS, BAGS } from "./content.js";

export const bagCapacity = state => BAGS[state.bag].slots;
export const bagFull = state => state.inventory.length >= bagCapacity(state);

/** True if catch a beats catch b as a species record: rarer first, then bigger. */
export function isBetterRecord(a, b) {
  if (!b) return true;
  if (RARITY_RANK[a.rarity] !== RARITY_RANK[b.rarity]) return RARITY_RANK[a.rarity] > RARITY_RANK[b.rarity];
  return a.sizeCm > b.sizeCm;
}

/**
 * Register a caught fish. The first catch of a species goes to the wallboard (not sellable) and pays a
 * discovery bonus; later copies go to the bag, or are released when the bag is full.
 * Any catch can become the species' best-catch record.
 */
export function addCatch(state, encounter) {
  const id = encounter.speciesId;
  const discovered = !state.discovered.includes(id);
  let fish = null;
  let bonus = 0;
  let released = false;
  if (discovered) {
    state.discovered.push(id);
    bonus = Math.max(1, Math.round(encounter.value * DISCOVERY_BONUS));
    state.coins += bonus;
  } else if (bagFull(state)) {
    released = true;
  } else {
    fish = { uid: state.nextFishUid++, ...encounter };
    state.inventory.push(fish);
  }
  const newRecord = isBetterRecord(encounter, state.records[id]);
  if (newRecord) {
    state.records[id] = { rarity: encounter.rarity, sizeCm: encounter.sizeCm, value: encounter.value, uid: fish ? fish.uid : null, sold: false, released };
  }
  return { discovered, fish, bonus, released, newRecord: newRecord && !discovered };
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

export function unlockRegion(state, id) {
  const region = REGIONS[id];
  if (!region || state.unlocked.includes(id) || state.coins < region.price) return false;
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
