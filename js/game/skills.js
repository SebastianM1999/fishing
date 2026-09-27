// Leveling (XP -> level -> skill points) and the skill tree, on plain state. No DOM.
import {
  LEVEL_CAP, RARITY_XP, XP_FIRST_CATCH, XP_PERFECT_HOOK, RESPEC_FEE_PER_LEVEL, TIER_POINTS,
  SKILLS, SKILLS_BY_ID, SKILL_BRANCHES,
} from "./content.js";

export const xpToNext = level => 40 + 25 * (level - 1);

/** Level progress for a total XP amount: { level, into, needed, maxed }. */
export function levelInfo(xp) {
  let level = 1, rest = Math.max(0, Math.floor(xp));
  while (level < LEVEL_CAP && rest >= xpToNext(level)) { rest -= xpToNext(level); level++; }
  const maxed = level >= LEVEL_CAP;
  return { level, into: maxed ? 0 : rest, needed: maxed ? 0 : xpToNext(level), maxed };
}
export const levelOf = xp => levelInfo(xp).level;

export const rankOf = (state, id) => state.skills[id] ?? 0;
export const pointsTotal = xp => levelOf(xp) - 1;
const spentIn = (skills, branch) => SKILLS.reduce((n, s) => n + (!branch || s.branch === branch ? skills[s.id] ?? 0 : 0), 0);
export const pointsSpent = (state, branch) => spentIn(state.skills, branch);
export const pointsFree = state => pointsTotal(state.xp) - pointsSpent(state);
export const tierOpen = (state, branch, tier) => pointsSpent(state, branch) >= TIER_POINTS[tier];

export function canLearn(state, id) {
  const s = SKILLS_BY_ID[id];
  return !!s && pointsFree(state) > 0 && rankOf(state, id) < s.max && tierOpen(state, s.branch, s.tier);
}

export function learn(state, id) {
  if (!canLearn(state, id)) return false;
  state.skills[id] = rankOf(state, id) + 1;
  return true;
}

export const respecCost = state => RESPEC_FEE_PER_LEVEL * levelOf(state.xp);

/** Refund every skill point for a coin fee. */
export function respec(state) {
  const cost = respecCost(state);
  if (pointsSpent(state) === 0 || state.coins < cost) return false;
  state.coins -= cost;
  state.skills = {};
  return true;
}

/** Add XP; returns how many levels were gained. */
export function addXp(state, amount) {
  const before = levelOf(state.xp);
  state.xp = Math.max(0, Math.floor(state.xp + amount));
  return levelOf(state.xp) - before;
}

export const normalizedSize = (species, sizeCm) => Math.min(1, Math.max(0, (sizeCm - species.sizeCm[0]) / (species.sizeCm[1] - species.sizeCm[0])));
const twilight = bucket => bucket === "dawn" || bucket === "night";

/** Aggregated skill effects. bucket (time of day) matters for Twilight Angler. */
export function skillEffects(state, bucket) {
  const r = id => rankOf(state, id);
  const tw = r("twilight_angler") > 0 && twilight(bucket);
  return {
    zoneWidthBonus: r("steady_hands") * 0.015,
    hookWindowBonusMs: r("quick_reflexes") * 150,
    tensionGrowthMult: 1 - r("iron_grip") * 0.08,
    tensionRecoveryMult: 1 + r("iron_grip") * 0.08,
    zoneEaseMult: 1 + r("float_touch") * 0.12,
    perfectBonusMs: r("perfect_strike") * 75,
    perfectProgressBonus: r("perfect_strike") * 0.05,
    secondWind: r("second_wind") > 0,
    fishFinder: r("fish_finder") > 0,
    biteWaitMult: 1 - r("patience") * 0.1,
    xpMult: 1 + r("fishing_journal") * 0.1 + (tw ? 0.25 : 0),
    rareWeightMult: 1 + r("keen_eye") * 0.1 + (tw ? 0.15 : 0),
    burstMult: 1 - r("tire_them_out") * 0.08,
    fishWhisperer: r("fish_whisperer") > 0,
    sellBonus: r("haggler") * 0.05,
    bagBonus: r("extra_pockets") * 2,
    tallTales: r("tall_tales") * 0.15,
    fishCourier: r("fish_courier") > 0,
    trophyHunter: r("trophy_hunter") > 0,
  };
}

/** XP for one catch (before skill multipliers when mult is omitted). */
export function catchXp(species, rarity, sizeCm, { first = false, perfect = false, mult = 1 } = {}) {
  // Named legendaries already have a huge baseValue, so they use the rare multiplier.
  const base = Math.round((6 + species.baseValue * 0.25) * (species.legendary ? RARITY_XP.rare : RARITY_XP[rarity]) * (1 + normalizedSize(species, sizeCm) * 0.5));
  return Math.round((base + (first ? XP_FIRST_CATCH : 0) + (perfect ? XP_PERFECT_HOOK : 0)) * mult);
}

/** Clean saved skills: known ids, integer ranks clamped to max; reset all if points or tier rules are broken. */
export function sanitizeSkills(raw, xp) {
  const skills = {};
  if (!raw || typeof raw !== "object") return skills;
  for (const s of SKILLS) {
    const v = raw[s.id];
    if (typeof v === "number" && Number.isFinite(v) && v >= 1) skills[s.id] = Math.min(s.max, Math.floor(v));
  }
  if (spentIn(skills) > pointsTotal(xp)) return {};
  // A skill's tier must be open from the points spent in lower tiers of its branch.
  for (const s of SKILLS) {
    if (!skills[s.id] || s.tier === 0) continue;
    const below = SKILLS.reduce((n, o) => n + (o.branch === s.branch && o.tier < s.tier ? skills[o.id] ?? 0 : 0), 0);
    if (below < TIER_POINTS[s.tier]) return {};
  }
  return skills;
}

export const branchOf = id => SKILL_BRANCHES.find(b => b.id === id);
