import { TIME_BUCKETS, DAY_LENGTH_MS, BUCKET_LENGTH_MS } from "./content.js";

export function advanceTime(state, dtMs) {
  const t = state.timeMs + dtMs;
  if (t >= DAY_LENGTH_MS) state.day += Math.floor(t / DAY_LENGTH_MS); // a new day dawns
  state.timeMs = t % DAY_LENGTH_MS;
}

export function timeBucket(timeMs) {
  return TIME_BUCKETS[Math.floor(timeMs / BUCKET_LENGTH_MS) % TIME_BUCKETS.length];
}

/** Ms of sleep until the start of a time of day: later today, or tomorrow if it has already begun. */
export function sleepMs(timeMs, bucket) {
  const target = TIME_BUCKETS.indexOf(bucket) * BUCKET_LENGTH_MS;
  return target > timeMs ? target - timeMs : target + DAY_LENGTH_MS - timeMs;
}

/** Sleep until a time of day starts (the bed at home). Returns true if a new day dawned. */
export function sleepUntil(state, bucket) {
  const day = state.day;
  advanceTime(state, sleepMs(state.timeMs, bucket));
  return state.day > day;
}

/** 0..1 progress through the current bucket. */
export function bucketProgress(timeMs) {
  return (timeMs % BUCKET_LENGTH_MS) / BUCKET_LENGTH_MS;
}

/** 0..1 across the whole day (0 = start of Dawn). */
export function dayFraction(timeMs) {
  return timeMs / DAY_LENGTH_MS;
}
