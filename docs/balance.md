# Balance

**Pacing goal:** each place takes a little longer than the one before.

| Place | Fishing time for the next place | Upgrades bought here (fishing time) |
|---|---|---|
| Lake | ~5 min → river gate | — |
| River | ~15 min → sea gate | tier-1 set (~3 min) |
| Sea | ~30 min → boat | tier-2 set + basket (~10 min) |
| Offshore | ~60 min → trawler | tier-3 set + Big Creel (~20 min) |
| Trench | — | tier-4 set (~1 h) and harpoon (~45 min) |

The gear bought at a place makes that place comfortable and gets the player through the next one. That comes to about 4 hours of fishing to open everything, and 5–6 hours of real play with walking, selling and exploring. The full collection takes longer.

Every number lives in `js/game/content.js`.

## Tools

- `node tools/balance-sim.mjs [fights]` plays the real catch minigame with a human-like bot (220 ms reaction delay, slight aim noise, lets go near the tension limit). It prints win rates per place and gear tier, for odd catches, and with a few Angler skills. Before the balance pass, the bot won 99–100% everywhere except the trench, which matched the player's experience.
- `node tools/progression-sim.mjs` simulates a sensible player. It fishes the best place it can handle, sells when the bag is full, buys upgrades in order and spends skill points. It prints a timeline.

  Current result: river at 0.12 h, sea 0.42 h, boat 0.93 h, trawler 2.3 h, everything at 3.6 h (level 19). It runs faster than the table above because it spends skill points. Expect real players to need about 1.5 times as long.

Run both after changing fish values, prices, `LOCATION_FIGHT`, `MINIGAME`, gear stats or the skills. Prices were derived as *target minutes × coins per minute* at the gear the player has then.

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

Bot win rates:

| Place | Gear the player arrives with | Win rate | After the place's upgrade | Win rate |
|---|---|---|---|---|
| Lake | tier 0 | ~96% | — | — |
| River | tier 0 | ~70% | tier 1 | ~96% |
| Sea | tier 1 | ~70% | tier 2 | ~97% |
| Offshore | tier 2 | ~72% | tier 3 | ~94% |
| Trench | tier 3 | ~65% | tier 4 | ~93% |

Two tiers too low is close to hopeless. Angler skills (Steady Hands, Iron Grip, Strong Arm) raise every row noticeably.

## Money

Average coins per landed fish, including rarity and odd catches, and the bot's income:

| Place | Coins per fish | Coins/min with arriving gear | Coins/min after the upgrade |
|---|---|---|---|
| Lake | ~13 | ~38 | — |
| River | ~45 | ~69 | ~142 |
| Sea | ~105 | ~150 | ~294 |
| Offshore | ~307 | ~369 | ~732 |
| Trench | ~550 | ~818 | ~1,494 |

Odd catches are worth about 5 times their place's regular fish. Legends and myths have set prices from 700 (Old Whiskers) to 25,000 (Moby Dick).

Prices:

| Item | Price |
|---|---|
| River gate | 200 |
| Sea gate | 2,000 |
| Boat | 9,000 |
| Trawler | 45,000 (needs the boat) |
| Harpoon | 65,000 (needs the trawler) |
| Bags | 400 (14 slots), 2,000 (20 slots) |
| Rods, tier 1–4 | 80 · 400 · 2,000 · 17,000 |
| Reels, tier 1–4 | 70 · 350 · 1,700 · 16,000 |
| Lines, tier 1–4 | 70 · 350 · 1,700 · 16,000 |

The trench gate is tier 3 in every slot. The Kraken, Moby Dick, the Giant Squid and the Starfin Shark want tier 4.

Village orders are about the two best reachable places, so their rewards grow with the player.

## XP and levels

- **XP per catch:** `LOCATION_XP` (lake 8, river 14, sea 22, offshore 32, trench 45) × rarity × `KIND_XP` (odd ×3, giant ×5, legend ×12, myth ×20) × up to +50% for size.
- **Bonuses:** a first catch adds 40, a perfect hook 3.
- **Level curve:** `xpToNext(L) = 150 + 80(L−1) + 6(L−1)²`, cap 25. In the simulation that gives level 5 at the sea gate, level 10 at about an hour, and level ~19 when everything is bought; levels 20–25 come from the collection.

## Skills

There are 15 skills: 5 per branch, 1–3 ranks each, and 29 ranks in total for 24 points, so the player has to choose. Tiers open at 0 / 3 / 6 points in a branch.

The money skills are strong on purpose:

- **Haggler:** +12% sell price per rank.
- **Trophy Hunter:** Rare +35%, Legendary +75%.
- **Good Neighbour:** village orders +25% per rank.

Removed as too small or too fiddly: Float Touch, Perfect Strike (merged into Quick Reflexes), Fishing Journal, Tire Them Out, Fish Whisperer and Tall Tales.

New:

- **Strong Arm:** reeling progress.
- **Legend Seeker:** hunts bite twice as often.
- **Good Neighbour:** village orders pay more.

Saves from before v9 get every skill point refunded.
