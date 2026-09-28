# The Deep Trench (late game)

The trench used to be a second spot on the offshore boat. It is now its own late-game area: rough, dark and dangerous, with its own boat, the hardest fights in the game and a harpoon for the giants.

## Getting there
- **Ironhull Trawler, 6000 coins.** It lies run aground at the **old pier** on the far (west) side of the beach: a crooked, patched, half-broken pier with salvage crates, driftwood and a lamp, so that side of the beach isn't empty and the sea dock stays uncluttered. Once you own the small boat, pay for the repairs at the pier's end; the trawler then floats upright, and pressing `E` there sails to the trench. The deck is at `WORLD.trench` (far out, like the offshore deck and the house), and the wheelhouse at the stern is solid.
- **Tackle gate.** Fishing the trench needs at least a **Carbon Rod, a Quick Reel and a Heavy Line** (`LOCATION_GATES.trench`). The spot label lists what is still missing.
- **Whaler's Harpoon, 3500 coins.** It is sold from the harpoon rack on the old pier, to trawler owners only. It unlocks the **bow spot**.

The full late-game bill is 9500 coins for the trawler and harpoon, plus about 2000 coins of tackle from scratch for the minimum (gear tiers are bought in order), or about 3500 for the best tackle that Moby Dick and the Kraken ask for.

## The place
The water has its own swell: `TRENCH_WAVES` is about twice the height of the open sea and grows further in storms (`TRENCH_GAIN`). The trawler pitches and rolls on it, and the player rides the deck with it (see below).

The scenery is in `js/render/trench.js`:
- jagged sea stacks with foam collars
- a wrecked boat on the rocks
- a lighthouse sweeping its beam
- **the abyss**: a dark, slowly turning whirlpool beside the trawler with glowing plankton, where the stern spot casts
- bow spray and lightning bolts

The trench always looks stormy: it is overcast, with drizzle, haze and lightning whatever the forecast. A mast floodlight keeps the deck readable at night, and it swings forward onto the water while you harpoon.

## Harder fights
`LOCATION_FIGHT.trench` applies to every non-legendary fight there:
- progress ×0.78
- bursts ×1.25
- tension growth ×1.15
- catch zone ×0.88
- **big swells** every 3–5 s shove the zone aside for 0.9 s ("Big wave!")

Legends and myths keep their own boss tuning. Trench fish sell for about 1.5–1.8× their old prices to match.

## Harpoon round and giants
There are four **giants** (a new collection kind, "Giants"): Narwhal, Orca, Humpback Whale and Sperm Whale. They only bite at the bow spot (`mode: "harpoon"`), and their rarity tops out at Rare.

At the bow the flow is:
1. You watch the waves until there's a spout ("Thar she blows!").
2. You press Space, and the **harpoon round** starts (`HARPOON_GAME`):
   - The giant surfaces and swims along the lane, then dives and comes up somewhere else.
   - An aim swings from end to end on its own. Space throws the harpoon, which lands where the aim was 0.45 s later, so you lead the target.
   - Each species needs 2–4 hits and gives 2 spare harpoons, plus 1 more for a perfect sighting. It swims a little faster after each hit.
   - Running out of harpoons lets it escape.
3. After the last hit comes the normal reel fight. Spare harpoons give a small head start.

The 3D view shows the giant surfacing, its spouts, the harpoon in flight, the harpoons stuck in its back and the rope.

The **Kraken** now needs the harpoon too (3 hits). **Moby Dick** is a mythic: it needs 4 hits, a stormy night at the trench, the Master Rod, Pro Reel and Heavy Line, the harpoon, every giant found and level 15. If both are ready, a not-yet-found one bites first, then the harder hunt.

## Collection and milestones
The collection now has 76 species. The trench tab has Fish, Odd catches, Giants and Legends & myths.

A new cosmetic milestone, **Harpooneer** (all giants), hangs a carved wooden whale from the rafters over the rug at home.

## Riding the boat
The boats pitch and roll with the waves. The player used to only move up and down and copy the boat's tilt, so off-centre they floated or sank through the deck. Now `standOnDeck` in `scene.js` turns their deck position by the boat's pitch and roll before lifting it, so they stay on the deck. Their facing turns with the boat too. The markers of the spots on board now ride with the deck.

## Save
Save v8 adds `trawlerOwned` and `harpoonOwned`. The area `"trench"` is restored only with the trawler. Older saves load with neither.
