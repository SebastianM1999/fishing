// Cast -> wait -> bite/hook -> catch minigame. Pure simulation on plain data; no DOM or Three.js.
import {
  FISH, FISH_BY_ID, RARITY_WEIGHTS, RARITY_MULTIPLIER, RARITY_FIGHT, BEHAVIORS, EXHAUSTED,
  HOOK, BITE_WAIT_MS, MINIGAME, GEAR, LEGENDARIES, BOSS_FIGHT, WEATHER, LOCATION_GATES, MECHANICS, SPECIAL_FIGHT, SPECIAL_MAX_RARITY, RARITY_RANK, MOON, LOCATION_LABELS, SKILLS_BY_ID, regularAt,
  LOCATION_FIGHT, HARPOON, HARPOON_GAME
} from "./content.js";
import { skillEffects, rankOf, levelOf } from "./skills.js";
import { currentWeather } from "./weather.js";

/** Moon phase index for a day (0 = new moon, MOON.full = full moon). */
export const moonPhase = day => ((day % MOON.cycle) + MOON.cycle) % MOON.cycle;

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
    gear: { ...state.gear },
  };
}

const meetsGear = (need, gear) => !need || Object.entries(need).every(([slot, tier]) => (gear?.[slot] ?? 0) >= tier);

/**
 * Species that can bite at a location now: weather-only species join while their weather lasts, and odd catches
 * with a minimum gear tier only join when gear is given and meets it. mode "harpoon" (the trawler's bow) has only
 * the giants; every other spot never has them.
 */
export function fishTable(location, bucket, weather = "clear", gear = null, mode = "rod") {
  return FISH.filter(f => f.location === location && f.times.includes(bucket) && !f.legendary && !!f.harpoon === (mode === "harpoon")
    && (!f.weather || f.weather.includes(weather)) && (!f.gear || meetsGear(f.gear, gear)));
}

/** Can the player fish this location at all with their gear? (The trench tears weak tackle apart.) */
export const locationOpen = (state, location) => meetsGear(LOCATION_GATES[location]?.gear, state.gear);

/** Tackle the gate still asks for: [{ slot, item }] of the missing tiers. */
export const missingGear = (state, location) => Object.entries(LOCATION_GATES[location]?.gear ?? {})
  .filter(([slot, tier]) => state.gear[slot] < tier).map(([slot, tier]) => ({ slot, item: GEAR[slot][tier] }));

/** Weighted pick: regular fish weigh 1, odd catches much less (species.weight). */
function pickSpecies(rng, table) {
  const total = table.reduce((a, f) => a + (f.weight ?? 1), 0);
  let r = rng.next() * total;
  for (const f of table) if ((r -= f.weight ?? 1) < 0) return f;
  return table[table.length - 1];
}

/** Does the player's gear meet a legendary's minimum tiers? Per slot: { slot: [need, has] }. */
export function huntGear(state, species) {
  return Object.fromEntries(Object.entries(species.hunt.gear).map(([slot, tier]) => [slot, [tier, state.gear[slot]]]));
}
export const gearReady = (state, species) => Object.values(huntGear(state, species)).every(([need, has]) => has >= need);
export const inHuntWindow = (species, bucket, progress) => species.hunt.bucket === bucket && progress >= species.hunt.window[0] && progress <= species.hunt.window[1];

/** Every condition of a hunt besides the time window, each with { icon, label, ok } (shown as ✓ / ✗ in the Rumours). */
export function huntChecks(state, species, weather = currentWeather(state)) {
  const h = species.hunt, checks = [];
  for (const [slot, [need, has]] of Object.entries(huntGear(state, species))) checks.push({ icon: slot, label: GEAR[slot][need].name, ok: has >= need });
  if (species.harpoon) checks.push({ icon: "harpoon", label: HARPOON.name, ok: !!state.harpoonOwned });
  if (h.weather) checks.push({ icon: `wx_${h.weather}`, label: `${WEATHER[h.weather].label} weather`, ok: weather === h.weather });
  if (h.giants) checks.push({ icon: "harpoon", label: "Every giant found", ok: FISH.filter(f => f.giant).every(f => state.discovered.includes(f.id)) });
  if (h.moon) checks.push({ icon: "moon", label: MOON.names[MOON[h.moon]], ok: moonPhase(state.day) === MOON[h.moon] });
  if (h.complete) checks.push({ icon: "fish", label: `Every ${LOCATION_LABELS[h.complete]} fish found`, ok: regularAt(h.complete).every(f => state.discovered.includes(f.id)) });
  if (h.minSpecies) checks.push({ icon: "board", label: `${h.minSpecies} species found`, ok: state.discovered.length >= h.minSpecies });
  if (h.skill) checks.push({ icon: SKILLS_BY_ID[h.skill].icon, label: `${SKILLS_BY_ID[h.skill].name} skill`, ok: rankOf(state, h.skill) > 0 });
  if (h.level) checks.push({ icon: "star", label: `Level ${h.level}`, ok: levelOf(state.xp) >= h.level });
  return checks;
}
export const huntReady = (state, species, weather) => huntChecks(state, species, weather).every(c => c.ok);

/**
 * The legend or myth that can bite here right now (time window + every condition), or null. Harpoon hunts only bite
 * at the bow. When two are ready at once (the Kraken and Moby Dick), a not-yet-found one wins, then the harder one.
 */
export function huntAt(state, location, bucket, progress, weather, mode = "rod") {
  const ready = LEGENDARIES.filter(f => f.location === location && !!f.harpoon === (mode === "harpoon") && inHuntWindow(f, bucket, progress) && huntReady(state, f, weather));
  const rank = f => (state.discovered.includes(f.id) ? 0 : 100) + huntChecks(state, f, weather).length;
  return ready.sort((a, b) => rank(b) - rank(a))[0] ?? null;
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

export function rollEncounter(rng, location, bucket, stats, hunt = null, mode = "rod") {
  const legend = hunt && rng.next() < hunt.hunt.chance;
  const species = legend ? hunt : pickSpecies(rng, fishTable(location, bucket, stats.weather, stats.gear, mode));
  let rarity = legend ? "legendary" : rollRarity(rng, location, stats.rareWeightMult);
  // Odd catches and giants cap at SPECIAL_MAX_RARITY (so the Fish Whisperer preview already shows the capped rarity).
  if ((species.special || species.giant) && RARITY_RANK[rarity] > RARITY_RANK[SPECIAL_MAX_RARITY]) rarity = SPECIAL_MAX_RARITY;
  const sizeCm = Math.round(rng.range(species.sizeCm[0], species.sizeCm[1]) * 10) / 10;
  return { speciesId: species.id, rarity, sizeCm, value: salePrice(species, rarity, sizeCm) };
}

/** Start a cast. The fish table is chosen from location + current time bucket at cast time; hunt = huntAt(...). */
export function startCast(rng, location, bucket, stats, hunt = null, mode = "rod") {
  const waitMs = rng.range(BITE_WAIT_MS[0] * stats.biteWaitMult, BITE_WAIT_MS[1] * stats.biteWaitMult) * (mode === "harpoon" ? 1.6 : 1);
  return {
    phase: "cast",
    mode, // "rod" | "harpoon" (the trawler's bow: giants only)
    location,
    bucket,
    t: 0,
    castMs: CAST_MS,
    biteAtMs: CAST_MS + waitMs,
    hookWindowMs: stats.hookWindowMs,
    perfectMs: stats.perfectMs,
    whisper: stats.fishWhisperer,
    encounter: rollEncounter(rng, location, bucket, stats, hunt, mode),
    hookQuality: null,
    harpoon: null, // harpoon round (giants): see createHarpoon
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
    if (FISH_BY_ID[session.encounter.speciesId].harpoon) {
      session.phase = "harpoon";
      session.harpoon = createHarpoon(session, rng);
      return "aim";
    }
    session.phase = "fight";
    session.fight = createFight(session, rng, stats);
    return "hooked";
  }
  if (session.phase === "harpoon") return throwHarpoon(session.harpoon);
  return null;
}

// --- Harpoon round ------------------------------------------------------------------------------------------
// The giant surfaces and swims along the lane, then dives and comes up somewhere else. The aim swings on its own;
// a throw lands where the aim was HARPOON_GAME.flight s later. Enough hits and the reel fight starts; out of
// harpoons and it swims off.
function createHarpoon(session, rng) {
  const h = FISH_BY_ID[session.encounter.speciesId].harpoon;
  const perfect = session.hookQuality === "perfect";
  return {
    need: h.hits,
    hits: 0,
    left: h.hits + HARPOON_GAME.spare + (perfect ? 1 : 0), // a perfect sighting earns one spare harpoon
    width: h.width,
    speed: h.speed,
    pos: rng.range(0.25, 0.75),
    target: 0.5,
    retargetIn: 0,
    surfaced: true,
    phaseLeft: rng.range(...HARPOON_GAME.surface),
    aim: 0.08,
    aimDir: 1,
    flight: null, // { left, at } while a harpoon is in the air
    result: null, // "hit" | "miss" (last throw), for the UI
    resultAt: -1,
    resultPos: 0.5, // where the last harpoon landed
    t: 0,
  };
}

function throwHarpoon(h) {
  if (h.flight || h.left <= 0) return null;
  h.left -= 1;
  h.flight = { left: HARPOON_GAME.flight, at: h.aim };
  return "throw";
}

function updateHarpoon(session, dt, rng, stats) {
  const h = session.harpoon, G = HARPOON_GAME;
  h.t += dt;
  // Aim swings end to end.
  h.aim += h.aimDir * G.aimSpeed * dt;
  if (h.aim > 0.96 || h.aim < 0.04) { h.aimDir *= -1; h.aim = clamp(h.aim, 0.04, 0.96); }
  // Surfaced: swim toward shifting targets. Dived: resurface somewhere new.
  h.phaseLeft -= dt;
  if (h.phaseLeft <= 0) {
    h.surfaced = !h.surfaced;
    h.phaseLeft = h.surfaced ? rng.range(...G.surface) : rng.range(...G.dive);
    if (h.surfaced) { h.pos = rng.range(0.12, 0.88); h.retargetIn = 0; }
  }
  if (h.surfaced) {
    h.retargetIn -= dt;
    if (h.retargetIn <= 0 || Math.abs(h.target - h.pos) < 0.01) { h.target = rng.range(0.08, 0.92); h.retargetIn = rng.range(...G.retarget); }
    const speed = h.speed * (1 + G.speedUp * h.hits);
    const d = h.target - h.pos;
    h.pos += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
  }
  let event = null;
  if (h.flight && (h.flight.left -= dt) <= 0) {
    const at = h.flight.at, hit = h.surfaced && Math.abs(at - h.pos) <= h.width / 2;
    h.flight = null;
    h.result = hit ? "hit" : "miss";
    h.resultAt = h.t;
    h.resultPos = at;
    if (hit) {
      h.hits += 1;
      event = "hit";
      if (h.hits >= h.need) {
        session.phase = "fight";
        session.fight = createFight(session, rng, stats, h.left);
        return "harpooned";
      }
      h.surfaced = false; // it dives with the harpoon line
      h.phaseLeft = G.hitDive;
    } else event = "miss";
  }
  if (!h.flight && h.left <= 0 && h.hits < h.need) { session.phase = "done"; session.outcome = "escaped"; return "escaped"; }
  return event;
}

function createFight(session, rng, stats, spareHarpoons = 0) {
  const perfect = session.hookQuality === "perfect" && !session.harpoon; // a harpoon round already used the good sighting
  const species = FISH_BY_ID[session.encounter.speciesId];
  const loc = species.legendary ? null : LOCATION_FIGHT[session.location] ?? null;
  const bonus = (perfect ? stats.perfectProgressBonus : 0) + spareHarpoons * HARPOON_GAME.spareBonus;
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
    zoneWidth: stats.zoneWidth * (loc?.zoneWidthMult ?? 1),
    loc, // location difficulty (the trench): LOCATION_FIGHT
    swellIn: loc?.swell ? rng.range(...loc.swell.every) : 0, swellLeft: 0, swellDir: 0, // big swells shoving the zone
    // Boss fights start lower, so even a perfect hook begins in round 1 (below the first rage threshold).
    progress: species.legendary
      ? Math.min(BOSS_FIGHT.rageAt[0] - 0.03, BOSS_FIGHT.startProgress + bonus)
      : MINIGAME.startProgress + bonus,
    tensionLimit: stats.tensionLimit,
    tension: stats.tensionLimit * (MINIGAME.startTensionFrac - (perfect ? HOOK.perfectTensionReduction : 0)),
    inside: false,
    elapsed: 0,
    secondWind: stats.secondWind, // unused Second Wind charge for this fight
    boss: !!species.legendary,
    special: !!species.special || !!species.giant, // odd catches and giants fight a little longer
    rage: 0, // enraged bursts triggered so far (boss fights)
    mech: BEHAVIORS[species.behavior].mech ?? null, // extra rule (ink / sting / tentacle / jolt / kraken)
    inkLeft: 0, // s the fish marker stays hidden
    grabLeft: 0, grabDir: 0, // tentacle dragging the zone
    pulseIn: rng.range(...MECHANICS.sting.every), pulseLeft: 0, // jelly glow
    joltIn: rng.range(...MECHANICS.jolt.every), jolt: null, joltLeft: 0, zapped: false, // "charge" -> "zap"
    event: null, // mechanic event raised inside enterPhase, returned by updateFight
  };
  enterPhase(fight, "normal", rng);
  return fight;
}

/** The extra rules active right now (the Kraken changes its tricks each round). */
export function activeMechs(fight) {
  if (fight.mech === "kraken") return MECHANICS.kraken[Math.min(fight.rage, 2)];
  return fight.mech ? [fight.mech] : [];
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
  if (phase === "burst") {
    const mechs = activeMechs(fight);
    if (mechs.includes("ink")) { fight.inkLeft = MECHANICS.ink.time; fight.event = "ink"; }
    if (mechs.includes("tentacle")) {
      fight.grabLeft = MECHANICS.tentacle.time;
      fight.grabDir = fight.zonePos >= fight.fishPos ? 1 : -1; // drag the zone away from the creature
      fight.event = "grab";
    }
  }
}

/** Sting and jolt run on their own timers. Returns an event name or null. */
function updateMechs(f, dt, held, rng) {
  const mechs = activeMechs(f);
  let event = null;
  f.inkLeft = Math.max(0, f.inkLeft - dt);
  f.grabLeft = Math.max(0, f.grabLeft - dt);
  if (mechs.includes("sting")) {
    const M = MECHANICS.sting;
    if (f.pulseLeft > 0) {
      f.pulseLeft -= dt;
      if (f.inside) f.tension += M.tension * dt;
      if (f.pulseLeft <= 0) f.pulseIn = rng.range(...M.every);
    } else if ((f.pulseIn -= dt) <= 0) { f.pulseLeft = M.glow; event = "glow"; }
  }
  if (mechs.includes("jolt")) {
    const M = MECHANICS.jolt;
    if (!f.jolt && (f.joltIn -= dt) <= 0) { f.jolt = "charge"; f.joltLeft = M.charge; event = "charge"; }
    else if (f.jolt && (f.joltLeft -= dt) <= 0) {
      if (f.jolt === "charge") { f.jolt = "zap"; f.joltLeft = M.zap; f.zapped = false; }
      else { f.jolt = null; f.joltIn = rng.range(...M.every); }
    }
    if (f.jolt === "zap" && held && !f.zapped) { f.zapped = true; f.tension += f.tensionLimit * M.tension; event = "jolt"; }
  }
  return event;
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
    case "harpoon":
      return updateHarpoon(session, dtMs / 1000, rng, stats);
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
  const loc = f.loc ?? { progressGain: 1, burstMult: 1, tensionGrowthMult: 1 };
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
  let speed = (burst || f.enraged ? b.burstSpeed * r.burstStrength * stats.burstMult * loc.burstMult : b.speed) * rageK;
  if (exhausted) speed *= EXHAUSTED.speedMult;
  if (f.jolt === "charge") speed = 0; // the eel holds still while it charges
  const delta = f.fishTarget - f.fishPos;
  f.fishPos += Math.sign(delta) * Math.min(Math.abs(delta), speed * dt);

  // Player zone: control moves an eased target; the zone never snaps.
  const half = f.zoneWidth / 2;
  const zoneSpeed = (held ? MINIGAME.zoneRise : -MINIGAME.zoneFall) * stats.zoneSpeedMult;
  if (loc.swell) {
    if (f.swellLeft > 0) f.swellLeft -= dt;
    else if ((f.swellIn -= dt) <= 0) {
      f.swellLeft = loc.swell.time;
      f.swellDir = rng.next() < 0.5 ? -1 : 1;
      f.swellIn = rng.range(...loc.swell.every);
      event = event ?? "swell";
    }
  }
  const swellPush = f.swellLeft > 0 ? f.swellDir * loc.swell.push : 0;
  f.zoneTarget = clamp(f.zoneTarget + (zoneSpeed + swellPush + (f.grabLeft > 0 ? f.grabDir * MECHANICS.tentacle.pull : 0)) * dt, half, 1 - half);
  const ease = 1 - Math.exp(-MINIGAME.zoneEase * stats.zoneEaseMult * dt);
  f.zonePos += (f.zoneTarget - f.zonePos) * ease;

  // Catch progress.
  f.inside = Math.abs(f.fishPos - f.zonePos) <= half;
  if (f.inside) {
    f.progress += MINIGAME.progressGain * stats.reelSpeed * r.progressGain * (f.boss ? BOSS_FIGHT.progressGain : f.special ? SPECIAL_FIGHT.progressGain : 1) * (exhausted ? EXHAUSTED.progressGainMult : 1) * loc.progressGain * dt;
  } else {
    f.progress -= MINIGAME.progressLoss * stats.progressLossMult * dt;
  }

  // Line tension.
  if (held) {
    const spike = (burst || f.enraged ? b.tensionSpike * r.burstStrength * stats.burstMult * loc.burstMult : 1) * (f.enraged ? BOSS_FIGHT.rageTension : 1);
    f.tension += MINIGAME.tensionGrowth * stats.tensionGrowthMult * loc.tensionGrowthMult * spike * (exhausted ? EXHAUSTED.tensionGrowthMult : 1) * dt;
  } else {
    f.tension = Math.max(0, f.tension - MINIGAME.tensionRecovery * stats.reelRecovery * dt);
  }

  const mechEvent = updateMechs(f, dt, held, rng);
  if (f.event) { event = event ?? f.event; f.event = null; }
  event = event ?? mechEvent;

  if (f.tension >= f.tensionLimit && f.secondWind) { f.secondWind = false; f.tension = f.tensionLimit * 0.5; f.secondWindAt = f.elapsed; return "secondwind"; }
  if (f.tension >= f.tensionLimit) { session.phase = "done"; session.outcome = "broke"; return "broke"; }
  if (f.progress >= 1) { f.progress = 1; session.phase = "done"; session.outcome = "caught"; return "caught"; }
  if (f.progress <= 0) { f.progress = 0; session.phase = "done"; session.outcome = "escaped"; return "escaped"; }
  return event;
}
