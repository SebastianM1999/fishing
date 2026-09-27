// Cast -> wait -> bite/hook -> catch minigame. Pure simulation on plain data; no DOM or Three.js.
import {
  FISH, FISH_BY_ID, RARITY_WEIGHTS, RARITY_MULTIPLIER, RARITY_FIGHT, BEHAVIORS, EXHAUSTED,
  HOOK, BITE_WAIT_MS, MINIGAME, GEAR, LEGENDARIES, BOSS_FIGHT, WEATHER,
} from "./content.js";
import { skillEffects } from "./skills.js";

const CAST_MS = 600;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Effective fishing stats from gear, learned skills and weather. bucket = time of day (Twilight Angler). */
export function getStats(state, bucket, weather = "clear") {
  const wx = WEATHER[weather] ?? WEATHER.clear;
  const rod = GEAR.rod[state.gear.rod];
  const reel = GEAR.reel[state.gear.reel];
  const line = GEAR.line[state.gear.line];
  const fx = skillEffects(state, bucket);
  return {
    zoneWidth: rod.zoneWidth + fx.zoneWidthBonus,
    reelSpeed: reel.speed,
    reelRecovery: reel.recovery * fx.tensionRecoveryMult,
    tensionLimit: line.tensionLimit,
    tensionGrowthMult: fx.tensionGrowthMult,
    hookWindowMs: 900 + fx.hookWindowBonusMs,
    perfectMs: HOOK.perfectMs + fx.perfectBonusMs,
    perfectProgressBonus: HOOK.perfectProgressBonus + fx.perfectProgressBonus,
    progressLossMult: 1,
    zoneEaseMult: fx.zoneEaseMult,
    burstMult: fx.burstMult * wx.burstMult,
    zoneSpeedMult: 1,
    rareWeightMult: fx.rareWeightMult * wx.rareWeightMult,
    biteWaitMult: fx.biteWaitMult * wx.biteWaitMult,
    weather,
    secondWind: fx.secondWind,
    fishWhisperer: fx.fishWhisperer,
    xpMult: fx.xpMult,
  };
}

/** Species that can bite at a location now; weather-only species join while their weather lasts. */
export function fishTable(location, bucket, weather = "clear") {
  return FISH.filter(f => f.location === location && f.times.includes(bucket) && !f.legendary && (!f.weather || f.weather.includes(weather)));
}

/** Does the player's gear meet a legendary's minimum tiers? Per slot: { slot: [need, has] }. */
export function huntGear(state, species) {
  return Object.fromEntries(Object.entries(species.hunt.gear).map(([slot, tier]) => [slot, [tier, state.gear[slot]]]));
}
export const gearReady = (state, species) => Object.values(huntGear(state, species)).every(([need, has]) => has >= need);
export const inHuntWindow = (species, bucket, progress) => species.hunt.bucket === bucket && progress >= species.hunt.window[0] && progress <= species.hunt.window[1];

/** The legendary that can bite here right now (time window + gear), or null. */
export function huntAt(state, location, bucket, progress) {
  return LEGENDARIES.find(f => f.location === location && inHuntWindow(f, bucket, progress) && gearReady(state, f)) ?? null;
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
  return Math.max(1, Math.round(species.baseValue * (species.legendary ? 1 : RARITY_MULTIPLIER[rarity]) * sizeMultiplier));
}

export function rollEncounter(rng, location, bucket, stats, hunt = null) {
  const legend = hunt && rng.next() < hunt.hunt.chance;
  const species = legend ? hunt : rng.pick(fishTable(location, bucket, stats.weather));
  const rarity = legend ? "legendary" : rollRarity(rng, location, stats.rareWeightMult);
  const sizeCm = Math.round(rng.range(species.sizeCm[0], species.sizeCm[1]) * 10) / 10;
  return { speciesId: species.id, rarity, sizeCm, value: salePrice(species, rarity, sizeCm) };
}

/** Start a cast. The fish table is chosen from location + current time bucket at cast time; hunt = huntAt(...). */
export function startCast(rng, location, bucket, stats, hunt = null) {
  const waitMs = rng.range(BITE_WAIT_MS[0] * stats.biteWaitMult, BITE_WAIT_MS[1] * stats.biteWaitMult);
  return {
    phase: "cast",
    location,
    bucket,
    t: 0,
    castMs: CAST_MS,
    biteAtMs: CAST_MS + waitMs,
    hookWindowMs: stats.hookWindowMs,
    perfectMs: stats.perfectMs,
    whisper: stats.fishWhisperer,
    encounter: rollEncounter(rng, location, bucket, stats, hunt),
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
    session.hookQuality = session.t <= session.perfectMs ? "perfect" : "good";
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
    progress: MINIGAME.startProgress + (perfect ? stats.perfectProgressBonus : 0),
    tensionLimit: stats.tensionLimit,
    tension: stats.tensionLimit * (MINIGAME.startTensionFrac - (perfect ? HOOK.perfectTensionReduction : 0)),
    inside: false,
    elapsed: 0,
    secondWind: stats.secondWind, // unused Second Wind charge for this fight
    boss: !!species.legendary,
    rage: 0, // enraged bursts triggered so far (boss fights)
  };
  enterPhase(fight, "normal", rng);
  return fight;
}

function enterPhase(fight, phase, rng) {
  const b = BEHAVIORS[fight.behavior];
  const r = RARITY_FIGHT[fight.rarity];
  fight.fishPhase = phase;
  fight.enraged = false;
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
 * Returns an event name ("bite", "missed", "caught", "broke", "escaped", "secondwind") or null.
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
  // Boss fights: each third of the way the legendary goes into an enraged burst.
  let event = null;
  if (f.boss && f.rage < BOSS_FIGHT.rageAt.length && f.progress >= BOSS_FIGHT.rageAt[f.rage]) {
    f.rage += 1;
    enterPhase(f, "burst", rng);
    f.enraged = true;
    f.phaseLeft = BOSS_FIGHT.rageTime;
    event = "rage";
  }
  const rageK = f.enraged ? BOSS_FIGHT.rageSpeed : 1;
  let speed = (burst || f.enraged ? b.burstSpeed * r.burstStrength * stats.burstMult : b.speed) * rageK;
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
    f.progress += MINIGAME.progressGain * stats.reelSpeed * r.progressGain * (f.boss ? BOSS_FIGHT.progressGain : 1) * (exhausted ? EXHAUSTED.progressGainMult : 1) * dt;
  } else {
    f.progress -= MINIGAME.progressLoss * stats.progressLossMult * dt;
  }

  // Line tension.
  if (held) {
    const spike = (burst || f.enraged ? b.tensionSpike * r.burstStrength * stats.burstMult : 1) * (f.enraged ? BOSS_FIGHT.rageTension : 1);
    f.tension += MINIGAME.tensionGrowth * stats.tensionGrowthMult * spike * (exhausted ? EXHAUSTED.tensionGrowthMult : 1) * dt;
  } else {
    f.tension = Math.max(0, f.tension - MINIGAME.tensionRecovery * stats.reelRecovery * dt);
  }

  if (f.tension >= f.tensionLimit && f.secondWind) { f.secondWind = false; f.tension = f.tensionLimit * 0.5; f.secondWindAt = f.elapsed; return "secondwind"; }
  if (f.tension >= f.tensionLimit) { session.phase = "done"; session.outcome = "broke"; return "broke"; }
  if (f.progress >= 1) { f.progress = 1; session.phase = "done"; session.outcome = "caught"; return "caught"; }
  if (f.progress <= 0) { f.progress = 0; session.phase = "done"; session.outcome = "escaped"; return "escaped"; }
  return event;
}
