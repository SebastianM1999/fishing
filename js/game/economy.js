// Inventory, collection, selling, shop and boat rules on plain state.
import { GEAR, TACKLE_BY_ID, BOAT_PRICE } from "./content.js";

/** Register a caught fish. First catch of a species goes to the wallboard and is not sellable. */
export function addCatch(state, encounter) {
  if (!state.discovered.includes(encounter.speciesId)) {
    state.discovered.push(encounter.speciesId);
    return { discovered: true, fish: null };
  }
  const fish = { uid: state.nextFishUid++, ...encounter };
  state.inventory.push(fish);
  return { discovered: false, fish };
}

export function sellOne(state, uid) {
  const i = state.inventory.findIndex(f => f.uid === uid);
  if (i < 0) return 0;
  const [fish] = state.inventory.splice(i, 1);
  state.coins += fish.value;
  return fish.value;
}

export function sellAll(state) {
  const total = state.inventory.reduce((sum, f) => sum + f.value, 0);
  state.inventory = [];
  state.coins += total;
  return total;
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
