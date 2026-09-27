// Collection milestones: progress and rewards, all derived from state.discovered (nothing extra is saved). No DOM.
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

/** Combined rewards: per-location sell bonus, extra bag slots, cosmetics and the pennants to hang at home. */
export function milestoneEffects(state) {
  const fx = { sell: {}, bag: 0, goldenBobber: false, goldenBand: false, weathervane: false, pennants: [] };
  for (const m of doneMilestones(state)) {
    for (const [loc, v] of Object.entries(m.sell ?? {})) fx.sell[loc] = (fx.sell[loc] ?? 0) + v;
    fx.bag += m.bag ?? 0;
    fx.goldenBobber ||= !!m.goldenBobber;
    fx.goldenBand ||= !!m.goldenBand;
    fx.weathervane ||= !!m.weathervane;
    if (m.pennant) fx.pennants.push(m.pennant);
  }
  return fx;
}
