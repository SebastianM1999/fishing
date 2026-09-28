// Collection milestones: progress comes from state.discovered; rewards apply once claimed (state.milestonesClaimed). No DOM.
import { FISH, MILESTONES, regularAt, kindOf } from "./content.js";

/** The species a milestone asks for. */
function milestoneSpecies(m) {
  if (m.need.regular) return regularAt(m.need.regular);
  if (m.need.kinds) return FISH.filter(f => m.need.kinds.includes(kindOf(f)));
  return FISH;
}

/** { have, need } for one milestone. */
export function milestoneProgress(state, m) {
  if (m.need.count) return { have: Math.min(state.discovered.length, m.need.count), need: m.need.count };
  const list = milestoneSpecies(m);
  return { have: list.filter(f => state.discovered.includes(f.id)).length, need: list.length };
}
export const milestoneDone = (state, m) => { const p = milestoneProgress(state, m); return p.have >= p.need; };
export const doneMilestones = state => MILESTONES.filter(m => milestoneDone(state, m));

/** Reached but not yet claimed at the collection board. */
export const claimable = state => doneMilestones(state).filter(m => !state.milestonesClaimed.includes(m.id));

/** Claim a reached milestone's reward. */
export function claimMilestone(state, id) {
  const m = MILESTONES.find(x => x.id === id);
  if (!m || state.milestonesClaimed.includes(id) || !milestoneDone(state, m)) return false;
  state.milestonesClaimed.push(id);
  return true;
}

/** Cosmetics from the claimed milestones: golden bobber, hat band, weathervane, carved whale and the pennants at home. */
export function milestoneEffects(state) {
  const fx = { goldenBobber: false, goldenBand: false, weathervane: false, carvedWhale: false, pennants: [] };
  for (const m of MILESTONES.filter(x => state.milestonesClaimed.includes(x.id))) {
    fx.goldenBobber ||= !!m.goldenBobber;
    fx.goldenBand ||= !!m.goldenBand;
    fx.weathervane ||= !!m.weathervane;
    fx.carvedWhale ||= !!m.carvedWhale;
    if (m.pennant) fx.pennants.push(m.pennant);
  }
  return fx;
}
