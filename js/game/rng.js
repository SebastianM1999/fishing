// Single seeded RNG (mulberry32). The state lives in game state so saves resume deterministically.

export function createRng(seed) {
  const rng = { seed: seed >>> 0 };
  rng.next = () => {
    rng.seed = (rng.seed + 0x6d2b79f5) >>> 0;
    let t = rng.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.range = (min, max) => min + (max - min) * rng.next();
  rng.pick = list => list[Math.floor(rng.next() * list.length)];
  return rng;
}
