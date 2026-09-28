# Balance

The game should take several hours: roughly 7–10 hours to open every place and buy all gear, more for the full collection. Every number lives in `js/game/content.js`.

## Tools

- `node tools/balance-sim.mjs [fights]` plays the real catch minigame with a human-like bot (220 ms reaction delay, slight aim noise, lets go near the tension limit). It prints win rates per place and gear tier, for odd catches, and with a few Angler skills. Before this pass, the bot won 99–100% everywhere except the trench, which matched the player's experience.
- `node tools/progression-sim.mjs` simulates a sensible player. It fishes the best place it can handle, sells when the bag is full, buys upgrades in order and spends skill points. It prints a timeline (hours, level, purchases).

  It is an idealized pace: no exploring, no lost time on the collection. Expect real players to need about 1.5 times as long. Current result: river at ~0.4 h, sea ~1.6 h, boat ~2.3 h, trawler ~4.9 h, everything at ~6.7 h (level 19).

Run both after changing fish values, prices, `LOCATION_FIGHT`, `MINIGAME`, gear stats or the skills.

## Difficulty per place (`LOCATION_FIGHT`)

Every place fights harder than the one before:

- faster fish (`fishSpeed`);
- slower progress;
- wilder bursts;
- faster tension;
- a narrower zone;
- a shorter hook window (`hookMult` × `HOOK.windowMs` 700 ms);
- more fake nibbles (striking within `NIBBLE.spookMs` of one spooks the fish and costs the streak);
- at sea, offshore and in the trench, swells that shove the zone.

Legends and myths keep their boss tuning but move at the place's `fishSpeed`.

Target win rates for the bot:

| Place | Gear tier | Bot win rate |
|---|---|---|
| Lake | Starter gear | ~95% |
| Any later place | Its matching tier (river 1, sea 2, offshore 3, trench 4) | ~85–90% |
| Any later place | One tier lower | ~20–45% |

A few Angler points (Steady Hands 2, Iron Grip 1, Strong Arm 2) bring the matching tier to ~100%. That is the intended "skill points matter" effect.

## Money

Fish pay far more the farther out you go. Average regular fish values:

| Place | Average value |
|---|---|
| Lake | ~9 |
| River | ~30 |
| Sea | ~45 |
| Offshore | ~190 |
| Trench | ~340 |

Odd catches are worth about 5 times their place's regular fish. Legends and myths have set prices from 700 (Old Whiskers) to 25,000 (Moby Dick).

The bot's income is roughly:

| Place | Coins per minute |
|---|---|
| Lake | 40 |
| River | 80 |
| Sea | 260 |
| Offshore | 470–540 |
| Trench | 1,000–1,300 |

Prices:

| Item | Price |
|---|---|
| River | 500 |
| Sea | 2,500 |
| Boat | 8,000 |
| Trawler | 50,000 (needs the boat) |
| Harpoon | 25,000 (needs the trawler) |
| Bags | 900 (14 slots), 8,000 (20 slots) |
| Rods, tier 1–4 | 300 · 2,000 · 12,000 · 42,000 |
| Reels, tier 1–4 | 250 · 1,800 · 11,000 · 38,000 |
| Lines, tier 1–4 | 280 · 1,900 · 10,000 · 35,000 |

The trench gate is tier 3 in every slot. The Kraken, Moby Dick, the Giant Squid and the Starfin Shark want tier 4.

Village orders are about the two best reachable places, so their rewards grow with the player.

## XP and levels

- **XP per catch:** `LOCATION_XP` (lake 6 … trench 25) × rarity × `KIND_XP` (odd ×3, giant ×5, legend ×12, myth ×20) × up to +50% for size.
- **Bonuses:** a first catch adds 40, a perfect hook 3.
- **Level curve:** `xpToNext(L) = 150 + 80(L−1) + 6(L−1)²`, cap 25. That gives about level 5 at 0.7 h, level 10 at 2.3 h, level 15 at 4.8 h, and level ~19 when everything is bought.

## Skills

There are 15 skills: 5 per branch, 1–3 ranks each, and 29 ranks in total for 24 points, so the player has to choose. Tiers open at 0 / 3 / 6 points in a branch.

Removed as too small or too fiddly: Float Touch, Perfect Strike (merged into Quick Reflexes), Fishing Journal, Tire Them Out, Fish Whisperer and Tall Tales.

New:

- **Strong Arm:** reeling progress.
- **Legend Seeker:** hunts bite twice as often.
- **Good Neighbour:** village orders pay more.

Saves from before v9 get every skill point refunded.
