// Balance check: a human-like bot plays the real catch minigame (js/game/fishing.js) and reports win rates
// per location, gear tier and rarity. Usage: node tools/balance-sim.mjs [fights per cell]
import { FISH, GEAR, LOCATIONS, RARITY_WEIGHTS } from "../js/game/content.js";
import { createState } from "../js/game/state.js";
import * as fishing from "../js/game/fishing.js";
import { createRng } from "../js/game/rng.js";

const N = Number(process.argv[2] ?? 300);
const DT = 1000 / 60;

/** One fight from the hook on. The bot sees the fish REACT ms late, aims with some noise and minds the tension. */
function playFight(state, location, speciesId, rarity, rng, skill = 1) {
  const stats = fishing.getStats(state, "day", "clear");
  const sp = FISH.find(f => f.id === speciesId);
  const session = { phase: "bite", t: 0, mode: "rod", location, bucket: "day", perfectMs: stats.perfectMs, hookQuality: null,
    encounter: { speciesId, rarity, sizeCm: sp.sizeCm[0], value: 1 } };
  session.t = rng.range(120, 450); // a human hooks in ~120-450 ms: sometimes perfect
  fishing.pressAction(session, rng, stats);
  const history = [];
  const REACT = 220 / skill, JITTER = 0.03 / skill;
  let held = false, t = 0;
  while (session.phase === "fight" && t < 180) {
    const f = session.fight;
    history.push({ fish: f.inkLeft > 0 ? null : f.fishPos });
    const seen = history[Math.max(0, history.length - 1 - Math.round(REACT / DT))].fish ?? f.zonePos;
    const aim = seen + (rng.next() - 0.5) * JITTER * 2;
    const tf = f.tension / f.tensionLimit;
    const danger = f.jolt === "charge" || f.jolt === "zap" || (f.pulseLeft > 0 && f.inside && rng.next() < 0.5);
    // Hold to rise toward the fish, release to fall; ease off near the tension limit.
    held = !danger && tf < 0.8 && (aim > f.zonePos + 0.01 || (held && aim > f.zonePos - 0.01));
    if (tf > 0.92) held = false;
    fishing.updateFishing(session, DT, { reelHeld: held }, rng, stats);
    if (session.fight && !Number.isFinite(session.fight.progress + session.fight.tension)) throw new Error(`NaN in the fight (${location}, ${speciesId})`);
    t += DT / 1000;
  }
  return { won: session.outcome === "caught", broke: session.outcome === "broke", time: t };
}

export function winRate(state, location, { rarity = null, n = N, skill = 1, special = false } = {}) {
  const rng = createRng(12345);
  const pool = FISH.filter(f => f.location === location && !f.legendary && !f.giant && !f.weather && !!f.special === special);
  let wins = 0, time = 0, broke = 0;
  for (let i = 0; i < n; i++) {
    const sp = pool[i % pool.length];
    const r = rarity ?? fishing.rollRarity(rng, location);
    const res = playFight(state, location, sp.id, special && r === "legendary" ? "rare" : r, rng, skill);
    wins += res.won; time += res.time; broke += res.broke;
  }
  return { win: wins / n, time: time / n, broke: broke / n };
}

const gearAt = t => ({ rod: Math.min(t, GEAR.rod.length - 1), reel: Math.min(t, GEAR.reel.length - 1), line: Math.min(t, GEAR.line.length - 1) });
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1].endsWith("balance-sim.mjs")) {
  const tiers = GEAR.rod.length;
  console.log(`win% (avg fight s) — rows: location, columns: gear tier 0..${tiers - 1} (all slots)`);
  for (const loc of LOCATIONS) {
    const row = [];
    for (let t = 0; t < tiers; t++) {
      const s = createState(1); s.gear = gearAt(t);
      const r = winRate(s, loc);
      row.push(`${(r.win * 100).toFixed(0).padStart(3)}% ${(r.broke * 100).toFixed(0).padStart(2)}b (${r.time.toFixed(0)}s)`);
    }
    console.log(loc.padEnd(9), row.join("  "));
  }
  console.log("\nodd catches (rare), per location at gear tier = location index + 1:");
  LOCATIONS.forEach((loc, i) => { const s = createState(1); s.gear = gearAt(i + 1); const r = winRate(s, loc, { special: true, rarity: "rare" }); console.log(loc.padEnd(9), `${(r.win * 100).toFixed(0)}% (${r.time.toFixed(1)}s)`); });
}

if (process.argv[1].endsWith("balance-sim.mjs")) {
  console.log("\nwith Angler skills (Steady Hands 2, Iron Grip 1, Strong Arm 2), gear tier = location index / +1:");
  LOCATIONS.forEach((loc, i) => {
    const out = [i, i + 1].filter(t => t < GEAR.rod.length).map(t => {
      const s = createState(1); s.gear = gearAt(t); s.skills = { steady_hands: 2, iron_grip: 1, strong_arm: 2 };
      const r = winRate(s, loc); return `T${t} ${(r.win * 100).toFixed(0)}% (${r.time.toFixed(0)}s)`;
    });
    console.log(loc.padEnd(9), out.join("  "));
  });
}
