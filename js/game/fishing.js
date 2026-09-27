// Cast -> wait -> bite/hook -> catch minigame. Pure simulation on plain data; no DOM or Three.js.
import {
  FISH, FISH_BY_ID, RARITY_WEIGHTS, RARITY_MULTIPLIER, RARITY_FIGHT, BEHAVIORS, EXHAUSTED,
  HOOK, BITE_WAIT_MS, MINIGAME, GEAR, TACKLE_BY_ID,
} from "./content.js";

const CAST_MS = 600;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Effective fishing stats from equipped gear + tackle. */
export function getStats(state) {
  const rod = GEAR.rod[state.gear.rod];
  const reel = GEAR.reel[state.gear.reel];
  const line = GEAR.line[state.gear.line];
  const hook = GEAR.hook[state.gear.hook];
  const tackle = state.equippedTackle ? TACKLE_BY_ID[state.equippedTackle] : null;
  return {
    zoneWidth: rod.zoneWidth,
    reelSpeed: reel.speed,
    reelRecovery: reel.recovery,
    tensionLimit: line.tensionLimit,
    hookWindowMs: hook.hookWindowMs,
    progressLossMult: hook.progressLossMult,
    zoneEaseMult: tackle?.zoneEaseMult ?? 1,
    burstMult: tackle?.burstMult ?? 1,
    zoneSpeedMult: tackle?.zoneSpeedMult ?? 1,
    rareWeightMult: tackle?.rareWeightMult ?? 1,
    biteWaitExtraMs: tackle?.biteWaitExtraMs ?? 0,
  };
}

export function fishTable(location, bucket) {
  return FISH.filter(f => f.location === location && f.times.includes(bucket));
}

export function rarityWeights(location, rareWeightMult = 1) {
  const w = RARITY_WEIGHTS[location];
  return { common: w.common, rare: w.rare * rareWeightMult, legendary: w.legendary * rareWeightMult };
}

export function rollRarity(rng, location, rareWeightMult = 1) {
  const w = rarityWeights(location, rareWeightMult);
  const total = w.common + w.rare + w.legendary;
  let r = rng.next() * total;
  if ((r -= w.legendary) < 0) return "legendary";
  if ((r -= w.rare) < 0) return "rare";
  return "common";
}

export function salePrice(species, rarity, sizeCm) {
  const [min, max] = species.sizeCm;
  const normalizedSize = (sizeCm - min) / (max - min);
  const sizeMultiplier = 0.75 + normalizedSize * 0.5;
  return Math.max(1, Math.round(species.baseValue * RARITY_MULTIPLIER[rarity] * sizeMultiplier));
}

export function rollEncounter(rng, location, bucket, stats) {
  const table = fishTable(location, bucket);
  const species = rng.pick(table);
  const rarity = rollRarity(rng, location, stats.rareWeightMult);
  const sizeCm = Math.round(rng.range(species.sizeCm[0], species.sizeCm[1]) * 10) / 10;
  return { speciesId: species.id, rarity, sizeCm, value: salePrice(species, rarity, sizeCm) };
}

/** Start a cast. The fish table is chosen from location + current time bucket at cast time. */
export function startCast(rng, location, bucket, stats) {
  const waitMs = rng.range(BITE_WAIT_MS[0], BITE_WAIT_MS[1] + stats.biteWaitExtraMs);
  return {
    phase: "cast",
    location,
    bucket,
    t: 0,
    castMs: CAST_MS,
    biteAtMs: CAST_MS + waitMs,
    hookWindowMs: stats.hookWindowMs,
    encounter: rollEncounter(rng, location, bucket, stats),
    hookQuality: null,
    fight: null,
    outcome: null, // "caught" | "missed" | "early" | "broke" | "escaped"
  };
}

/** Player pressed the action button during a session. Returns an event name or null. */
export function pressAction(session, rng, stats) {
  if (session.phase === "cast" || session.phase === "wait") {
    session.phase = "done";
    session.outcome = "early";
    return "early";
  }
  if (session.phase === "bite") {
    session.hookQuality = session.t <= HOOK.perfectMs ? "perfect" : "good";
    session.phase = "fight";
    session.fight = createFight(session, rng, stats);
    return "hooked";
  }
  return null;
}

function createFight(session, rng, stats) {
  const perfect = session.hookQuality === "perfect";
  const species = FISH_BY_ID[session.encounter.speciesId];
  const fight = {
    behavior: species.behavior,
    rarity: session.encounter.rarity,
    fishPos: 0.5,
    fishTarget: 0.5,
    fishDir: rng.next() < 0.5 ? -1 : 1,
    fishPhase: "normal",
    phaseLeft: 0,
    retargetIn: 0,
    zonePos: 0.35,
    zoneTarget: 0.35,
    zoneWidth: stats.zoneWidth,
    progress: MINIGAME.startProgress + (perfect ? HOOK.perfectProgressBonus : 0),
    tensionLimit: stats.tensionLimit,
    tension: stats.tensionLimit * (MINIGAME.startTensionFrac - (perfect ? HOOK.perfectTensionReduction : 0)),
    inside: false,
    elapsed: 0,
  };
  enterPhase(fight, "normal", rng);
  return fight;
}

function enterPhase(fight, phase, rng) {
  const b = BEHAVIORS[fight.behavior];
  const r = RARITY_FIGHT[fight.rarity];
  fight.fishPhase = phase;
  if (phase === "normal") fight.phaseLeft = rng.range(...b.normalTime) * r.burstEvery;
  else if (phase === "burst") fight.phaseLeft = rng.range(...b.burstTime);
  else fight.phaseLeft = rng.range(...EXHAUSTED.time);
  fight.retargetIn = 0;
}

function retarget(fight, rng) {
  const b = BEHAVIORS[fight.behavior];
  const burst = fight.fishPhase === "burst";
  if (fight.behavior === "zigzag") fight.fishDir *= -1;
  else if (rng.next() < 0.5) fight.fishDir *= -1;
  let jump = rng.range(0.08, b.jump) * (burst ? 1.7 : 1);
  if (fight.behavior === "calm") jump *= 0.8;
  let target = fight.fishPos + fight.fishDir * jump;
  if (target < 0.04 || target > 0.96) { fight.fishDir *= -1; target = fight.fishPos + fight.fishDir * jump; }
  fight.fishTarget = clamp(target, 0.04, 0.96);
  fight.retargetIn = rng.range(...b.retarget) * (burst ? 0.5 : 1);
}

/**
 * Advance a session by dtMs. input.reelHeld = the player's active control.
 * Returns an event name ("bite", "missed", "caught", "broke", "escaped") or null.
 */
export function updateFishing(session, dtMs, input, rng, stats) {
  session.t += dtMs;
  switch (session.phase) {
    case "cast":
      if (session.t >= session.castMs) session.phase = "wait";
      return null;
    case "wait":
      if (session.t >= session.biteAtMs) { session.phase = "bite"; session.t = 0; return "bite"; }
      return null;
    case "bite":
      if (session.t > session.hookWindowMs) { session.phase = "done"; session.outcome = "missed"; return "missed"; }
      return null;
    case "fight":
      return updateFight(session, dtMs / 1000, input.reelHeld, rng, stats);
    default:
      return null;
  }
}

function updateFight(session, dt, held, rng, stats) {
  const f = session.fight;
  const b = BEHAVIORS[f.behavior];
  const r = RARITY_FIGHT[f.rarity];
  f.elapsed += dt;

  // normal -> burst -> exhausted -> normal ...
  f.phaseLeft -= dt;
  if (f.phaseLeft <= 0) {
    enterPhase(f, f.fishPhase === "normal" ? "burst" : f.fishPhase === "burst" ? "exhausted" : "normal", rng);
  }
  const burst = f.fishPhase === "burst";
  const exhausted = f.fishPhase === "exhausted";

  // Fish movement.
  f.retargetIn -= dt;
  if (f.retargetIn <= 0 || Math.abs(f.fishTarget - f.fishPos) < 0.005) retarget(f, rng);
  let speed = burst ? b.burstSpeed * r.burstStrength * stats.burstMult : b.speed;
  if (exhausted) speed *= EXHAUSTED.speedMult;
  const delta = f.fishTarget - f.fishPos;
  f.fishPos += Math.sign(delta) * Math.min(Math.abs(delta), speed * dt);

  // Player zone: control moves an eased target; the zone never snaps.
  const half = f.zoneWidth / 2;
  const zoneSpeed = (held ? MINIGAME.zoneRise : -MINIGAME.zoneFall) * stats.zoneSpeedMult;
  f.zoneTarget = clamp(f.zoneTarget + zoneSpeed * dt, half, 1 - half);
  const ease = 1 - Math.exp(-MINIGAME.zoneEase * stats.zoneEaseMult * dt);
  f.zonePos += (f.zoneTarget - f.zonePos) * ease;

  // Catch progress.
  f.inside = Math.abs(f.fishPos - f.zonePos) <= half;
  if (f.inside) {
    f.progress += MINIGAME.progressGain * stats.reelSpeed * r.progressGain * (exhausted ? EXHAUSTED.progressGainMult : 1) * dt;
  } else {
    f.progress -= MINIGAME.progressLoss * stats.progressLossMult * dt;
  }

  // Line tension.
  if (held) {
    const spike = burst ? b.tensionSpike * r.burstStrength * stats.burstMult : 1;
    f.tension += MINIGAME.tensionGrowth * spike * (exhausted ? EXHAUSTED.tensionGrowthMult : 1) * dt;
  } else {
    f.tension = Math.max(0, f.tension - MINIGAME.tensionRecovery * stats.reelRecovery * dt);
  }

  if (f.tension >= f.tensionLimit) { session.phase = "done"; session.outcome = "broke"; return "broke"; }
  if (f.progress >= 1) { f.progress = 1; session.phase = "done"; session.outcome = "caught"; return "caught"; }
  if (f.progress <= 0) { f.progress = 0; session.phase = "done"; session.outcome = "escaped"; return "escaped"; }
  return null;
}
