// Weather per time-of-day slot (day * 4 + bucket), derived from the save's weather seed: deterministic, so it
// never needs saving and a forecast is just the next slot. Pure rules; the renderer and audio only read the id.
import { TIME_BUCKETS, BUCKET_LENGTH_MS, WEATHER_TYPES, WEATHER_WEIGHTS, WEATHER_STAY } from "./content.js";

function hash01(seed, slot, salt) {
  let h = (seed ^ Math.imul(slot + 1, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function roll(seed, slot) {
  const w = WEATHER_WEIGHTS[TIME_BUCKETS[slot % 4]];
  let r = hash01(seed, slot, 1) * WEATHER_TYPES.reduce((sum, id) => sum + w[id], 0);
  for (const id of WEATHER_TYPES) if ((r -= w[id]) < 0) return id;
  return "clear";
}

/** Weather of a slot; the first dawn of a game is always clear. Fronts linger: a slot may keep the last one's. */
export function weatherAt(seed, slot) {
  if (slot <= 0) return "clear";
  const prev = slot === 1 ? "clear" : roll(seed, slot - 1);
  const keep = hash01(seed, slot, 2) < WEATHER_STAY && WEATHER_WEIGHTS[TIME_BUCKETS[slot % 4]][prev] > 0;
  return keep ? prev : roll(seed, slot);
}

export const slotOf = state => state.day * TIME_BUCKETS.length + Math.floor(state.timeMs / BUCKET_LENGTH_MS);
export const currentWeather = state => weatherAt(state.weatherSeed, slotOf(state));
export const nextWeather = state => weatherAt(state.weatherSeed, slotOf(state) + 1);
