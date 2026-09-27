# Fish expansion: design

Goal: many more catchable creatures, so that 100% collection becomes a long-term goal. The tone stays cozy and whimsical: sharks and the Kraken feel epic but friendly, and nothing is ever gory.

The collection grows from **24 to 70 species**, with 46 new creatures:

- 16 regular fish
- 22 odd catches: eels, squids, octopus, jellyfish, sharks, rays, turtles, crabs and crayfish
- 8 mythic creatures

It also adds one new location (the Deep Trench), five new minigame behaviours, a moon phase, and collection milestones.

Everything is data in `js/game/content.js` and stays compatible with existing saves (see [Saves](#saves)).

## Categories

| Kind | Where it bites | Value | Rarity roll | Notes |
|---|---|---|---|---|
| **Regular fish** | Normal fish table (weight 1) | 8–120 | Common / Rare / Legendary as today | Needed for the "Keeper" milestones and some mythic conditions. |
| **Odd catch** (`special: true`) | Normal fish table with a low `weight` (0.10–0.2) | 100–400 | Rolled as today | Some need a minimum gear tier (`gear`) to appear at all. Never used by order templates. |
| **Legendary hunt** (existing 4) | Hunt window only | 320–900 | Always Legendary | Unchanged. |
| **Mythic** (`legendary: true, mythic: true`) | Hunt window only, plus extra conditions | 500–2000 | Always Legendary | Reuses the hunt system and boss fight. The Kraken has its own multi-stage fight. |

With the weights, about 1 cast in 8–12 at a spot turns up an odd catch. Adding one is a jackpot, not the new normal income.

## New location: Deep Trench

- **Where:** a second fishing spot on the offshore boat, on the starboard side (`spot_trench`), facing a dark patch of water marked by a glowing lantern buoy.
- **Unlock:** uses the existing gear system. It needs the boat and a **Braided Line** (line tier 2). With a weaker line, the spot says: "Your line can't reach the trench floor — a Braided Line can." No new save state is needed.
- **Rarity weights:** common 74 / rare 21 / legendary 5.
- **Orders:** the trench counts as a reachable place for orders once it is unlocked.

## Moon phase (new, tiny system)

- **Phase:** `moonPhase(day) = day % 6`, derived from the day counter already in the save (`state.day`), so nothing new is saved.
  - Phase 0 = new moon.
  - Phase 3 = full moon.
  - Phases 1, 2, 4, 5 are crescent, half, half and crescent.
- **HUD:** the time chip shows a small moon icon with the phase name as a tooltip, so players can plan for it.
- **Rumours:** the entries say which moon a creature needs.

## New minigame behaviours

Each behaviour is one rule on top of the existing normal → burst → tired cycle. Tuning is in `MECHANICS` in `content.js`.

| Behaviour | Used by | Rule | Tell / counter |
|---|---|---|---|
| **ink** | squids, octopus | At the start of every burst, an ink cloud hides the fish marker for 1.2 s. The fish keeps moving. | The catch zone still glows when the fish is inside it, so you can "feel" it on the line. |
| **sting** | jellyfish | The jelly drifts slowly. Every 2.4–3.6 s it glows for 1.2 s. While it glows, having it inside your zone adds tension (+34/s), even if you are not reeling. | Move the zone off the jelly while it glows. You lose a little progress, but the line stays safe. |
| **tentacle** | Mimic Octopus, Giant Squid | At the start of every burst, a tentacle grabs the zone for 1.1 s and drags it away from the fish (0.32 lane/s). | Push against the drag by reeling or releasing. A tentacle overlay shows on the zone. |
| **jolt** | electric eels (Electric Eel, Lumen Eel, Aurora Eel) | Every 3–4.5 s the eel stops and charges for 0.9 s (crackle, sparks), then zaps for 0.35 s. Holding reel during the zap adds 30% of the tension limit. | Let go when it crackles. |
| **kraken** | Kraken | Multi-stage boss with 3 rounds, split by the existing rage thresholds (33% / 66%). Round 1: tentacle grabs on bursts. Round 2: ink clouds on bursts. Round 3: both, plus the enraged burst. | Each round is labelled "Round n / 3 · Tentacles / Ink / Everything!". |

Mythics other than the Kraken use the existing `boss` fight, which gives them a longer fight and rage bursts. The Aurora Eel is a boss fight that also uses **jolt**.

## Creature tables

Columns are Times, Base value, Size (cm), Behaviour, Special condition, Flavour, and Art (colours, body, one distinctive detail).

### Lake (existing 5 + 1 legend, new 3 regular + 2 odd + 1 mythic)

| Name | Times | Base | Size | Behaviour | Special condition | Flavour | Art |
|---|---|---:|---|---|---|---|---|
| Zander | Dusk, Night | 28 | 40–80 | darting | – | Glassy eyes made for moonlit hunting. | Slim bass body, grey-green with dark bars, spiny dorsal; **pale glassy eyes**. |
| Tench | Day, Dusk | 14 | 25–50 | calm | – | Wears velvet and never hurries. | Olive-gold carp body with soft scales and barbels; **little red eyes**. |
| Pumpkinseed | Day | 10 | 10–20 | calm | – | Painted like a sunset in a pond. | Round sunfish, orange belly, turquoise squiggles; **red ear spot**. |
| Crayfish | Dawn, Night | 100 | 8–15 | darting | Odd catch | Snips at the bait, then backs off politely. | Lobster body, red-brown; **tiny claws raised like a wave**. |
| Snapping Turtle | Dusk, Night | 140 | 25–45 | heavy | Odd catch · Strong Line+ | Grumpy looking, secretly a softie. | Turtle body, mossy olive shell; **ridged shell and beaky smile**. |
| **Crystal Koi** | Dawn (first 40%) | 600 | 40–70 | boss | Mythic · all Lake regular fish discovered · 20% per cast in window | Some say it is made of frozen dawn light. | Pale ice-blue carp with pink fins; **faceted crystal pattern**, shine. |

### River (existing 5 + 1 legend, new 3 regular + 2 odd + 1 mythic)

| Name | Times | Base | Size | Behaviour | Special condition | Flavour | Art |
|---|---|---:|---|---|---|---|---|
| Grayling | Dawn, Day | 16 | 25–45 | darting | – | Carries a flag on its back like a tiny sailboat. | Silver-lilac trout body with dark spots; **big purple sail dorsal**. |
| Barbel | Day, Night | 20 | 35–70 | heavy | – | Snuffles the gravel for snacks with four whiskers. | Bronze trout body, mottled; **orange fins and barbels**. |
| Arctic Char | Dawn, Dusk | 22 | 25–50 | zigzag | – | Blushes bright red in cold water. | Olive salmon body with pale spots; **fiery red belly**. |
| River Eel | Dusk, Night | 110 | 50–110 | zigzag | Odd catch | Slides through your fingers like a wet ribbon. | Eel body, olive-brown with a cream belly; **frilly ribbon fin round the tail**. |
| Electric Eel | Night | 180 | 90–200 | **jolt** | Odd catch · Strong Line+ | Hums like a kettle about to boil. | Slate eel body with an orange belly; **tiny glowing yellow sparks**. |
| **Two-Headed Trout** | Day (40–60%, noon) | 520 | 35–60 | boss | Mythic · all River regular fish discovered · Fiberglass Rod+ | Argues with itself about which way to swim. | Rainbow trout; **a second little head**, shine. |

### Sea Shore (existing 5 + 1 legend, new 3 regular + 6 odd + 2 mythic)

| Name | Times | Base | Size | Behaviour | Special condition | Flavour | Art |
|---|---|---:|---|---|---|---|---|
| Herring | Dawn, Day | 9 | 18–30 | darting | – | Travels in gossiping crowds of thousands. | Slim, blue back, bright silver sides. |
| Cod | Dusk, Night | 26 | 40–90 | heavy | – | A single chin whisker, worn with pride. | Sandy-olive bass body, mottled, pale lateral line; **chin barbel**. |
| Pufferfish | Day | 40 | 15–30 | calm | – | Puffs up when flattered. | New round **puffer** body, sandy yellow with dark spots; **little spikes all over**. |
| Moon Jelly | Night, Dawn | 120 | 15–40 | **sting** | Odd catch | Floats past like a lost lampshade. | Jelly bell, milky blue-lilac; **four pink rings** on the bell. |
| Common Squid | Dusk, Night | 150 | 30–60 | **ink** | Odd catch | Leaves a polite puff of ink as a goodbye. | Squid mantle, coral pink with freckles, arrow fins. |
| Shore Crab | Day, Dusk | 100 | 8–18 | heavy | Odd catch | Waves one claw hello, the other goodbye. | Crab body, orange shell; **one claw up**. |
| Spotted Ray | Day, Dusk | 160 | 40–90 | calm | Odd catch | Glides like a kite that forgot the wind. | Ray body, sandy with dark spots, whip tail. |
| Moray Eel | Dusk, Night | 170 | 60–150 | darting | Odd catch · Strong Line+ | Lives in a rock and always looks surprised. | Eel body, lime-olive mottle; **open "oh!" mouth**. |
| Mimic Octopus | Day, Dusk | 230 | 30–60 | **tentacle** | Odd catch · Fiberglass Rod+ | Pretends to be a rock, a fish and, once, a boot. | Octopus, caramel with dark bands on the arms. |
| **Moonglow Fish** | Night (20–80%) | 800 | 30–55 | boss | Mythic · **full moon** · Braided Line+ | Only rises when the full moon lays a path on the water. | Moon-white deep body with glowing specks; **golden crescent marking**, shine. |
| **Island Turtle** | Day (30–70%) | 1000 | 150–260 | boss | Mythic · 30 species discovered · Carbon Rod+ | A tiny island with a palm tree, and a turtle underneath. | Turtle with a sandy, grassy shell; **a tiny palm tree on top**. |

### Offshore (existing 5 + 1 legend, new 3 regular + 6 odd + 2 mythic)

| Name | Times | Base | Size | Behaviour | Special condition | Flavour | Art |
|---|---|---:|---|---|---|---|---|
| Barracuda | Day, Dusk | 60 | 60–150 | darting | – | All teeth and good intentions. | Silver pike body with dark bars; **snaggle-tooth grin**. |
| Opah | Dawn, Dusk | 90 | 80–150 | calm | – | Round as the moon, warm-blooded and proud of it. | Very deep rose-silver body with white spots; **crimson fins**. |
| Flying Fish | Day | 45 | 20–40 | zigzag | – | Has seen the boat from above. | Slim, blue and silver; **huge wing-like pectoral fins**. |
| Sea Turtle | Day, Dusk | 180 | 60–120 | calm | Odd catch · Strong Line+ | Old, wise and in no rush to be caught. | Turtle body, green-olive shell with plate pattern. |
| Manta Ray | Dawn, Day | 220 | 200–450 | calm | Odd catch · Carbon Rod+ | Somersaults for fun at sunrise. | Ray body, ink-navy back, white belly; **curled head fins**. |
| Lion's Mane Jelly | Dusk, Night | 200 | 50–200 | **sting** | Odd catch | Wears a magnificent mane of ribbons. | Jelly bell, amber-orange; **a big mane of ribbons**. |
| Hammerhead Shark | Dusk, Night | 260 | 150–350 | frenzy | Odd catch · Braided Line+ | Sees both sides of every story. | Shark body, blue-grey; **hammer head**. |
| Great White Shark | Night | 340 | 250–500 | frenzy | Odd catch · Carbon Rod + Braided Line | A big softie with a big smile. | Shark body, grey back, snow-white belly; **friendly grin**. |
| Whale Shark | Day | 380 | 400–900 | heavy | Odd catch · Carbon Rod + Quick Reel | The gentlest giant, dotted like a starry night. | Broad-headed shark, navy with white spots. |
| **Sea Serpent** | Dusk (second half) | 1200 | 400–700 | boss | Mythic · all Offshore regular fish discovered · Pro Reel | Friendly, enormous and extremely ticklish. | Serpent body in humps, jade green with a cream belly; **orange frill and little horns**. |
| **Ghost-Ship Fish** | Night (second half) | 900 | 90–160 | boss | Mythic · **new moon** · Quick Reel+ | On moonless nights, you can hear it creak. | Pale sea-glass salmon body with plank lines; **tattered sail dorsal**, shine. |

### Deep Trench (new: boat + Braided Line; 4 regular + 6 odd + 2 mythic)

| Name | Times | Base | Size | Behaviour | Special condition | Flavour | Art |
|---|---|---:|---|---|---|---|---|
| Lanternfish | All | 30 | 5–15 | darting | – | Carries its own night-lights. | Slim, deep blue; **rows of glowing cyan dots**. |
| Viperfish | Day, Night | 60 | 20–35 | frenzy | – | Its fangs are too big for its mouth, which it finds embarrassing. | Slim, inky blue-black, glowing belly dots; **oversized fangs**. |
| Anglerfish | Dawn, Dusk, Night | 95 | 20–60 | heavy | – | Always brings a lamp to the party. | New **angler** body (big round head, wide grin), brown; **glowing lure**. |
| Coelacanth | Day, Dusk | 120 | 100–200 | heavy | – | Older than the dinosaurs and not in a hurry. | Steel-blue bass body with white flecks. |
| Firefly Squid | Dusk, Night | 140 | 5–10 | **ink** | Odd catch | Sparkles like a pocketful of stars. | Squid, royal blue; **glowing cyan dots**. |
| Lantern Shark | Dawn, Night | 150 | 20–45 | darting | Odd catch | The smallest shark, glowing to fit in. | Small charcoal shark with a glowing belly. |
| Starlight Jelly | Night | 190 | 20–50 | **sting** | Odd catch | Blinks in slow constellations. | Jelly bell, violet; **pale-yellow star specks**. |
| Lumen Eel | Night | 240 | 60–130 | **jolt** | Odd catch (made up) | Nobody knows where it plugs itself in. | Deep-teal eel; **glowing mint lateral line**. |
| Starfin Shark | Dusk, Night | 360 | 180–320 | frenzy | Odd catch (made up) · Quick Reel+ | Its fins leave a trail of sparkles through the dark. | Navy shark with star specks, periwinkle fins, shine. |
| Giant Squid | Night | 400 | 400–1200 | **tentacle** | Odd catch · Master Rod + Heavy Line | Has the biggest eyes in the ocean, all the better to see you. | Squid, brick red; **enormous eye**. |
| **Aurora Eel** | Dawn (first 35%) | 750 | 80–140 | boss + **jolt** | Mythic · Twilight Angler skill learned | Brings the northern lights down to the deep. | Eel with a **green → teal → violet aurora** gradient, shine. |
| **Kraken** | Night (40–100%) | 2000 | 800–1500 | **kraken** | Mythic · Master Rod + Pro Reel + Heavy Line · all Trench regular fish discovered · level 12+ · 15% | Old as the sea, curious as a kitten and very, very big. | Huge plum octopus with curling arms and big friendly eyes; **barnacle crown**. |

## Mythic conditions (summary)

All conditions build on existing systems: hunt windows, gear tiers, skills, level, discovered species and `state.day`.

| Mythic | Place | Window | Needs |
|---|---|---|---|
| Crystal Koi | Lake | Dawn 0–40% | Lake regulars complete |
| Two-Headed Trout | River | Day 40–60% | River regulars complete, rod 1 |
| Moonglow Fish | Sea | Night 20–80% | Full moon, line 2 |
| Island Turtle | Sea | Day 30–70% | 30 species discovered, rod 2 |
| Ghost-Ship Fish | Offshore | Night 50–100% | New moon, reel 2 |
| Sea Serpent | Offshore | Dusk 50–100% | Offshore regulars complete, reel 3 |
| Aurora Eel | Trench | Dawn 0–35% | Twilight Angler skill |
| Kraken | Trench | Night 40–100% | Rod 3, reel 3, line 3, Trench regulars complete, level 12 |

The Rumours list on Nell's board shows every legend and myth: its clue, place, and each condition with ✓ / ✗. Windows at the same place never overlap.

## Collection milestones

Milestones are derived from `state.discovered`, so nothing new is saved. A toast plays when one is reached, and the collection dialog lists them all.

| Milestone | Requirement | Reward |
|---|---|---|
| Lake Keeper | All Lake regular fish | +5% sell value for Lake catches · a Lake pennant in your house |
| River Keeper | All River regular fish | +5% for River catches · River pennant |
| Shore Keeper | All Sea Shore regular fish | +5% for Sea Shore catches · Shore pennant |
| Offshore Keeper | All Offshore regular fish | +5% for Offshore catches · Offshore pennant |
| Trench Keeper | All Trench regular fish | +5% for Trench catches · Trench pennant |
| Halfway There | 35 species | +2 bag slots |
| Curiosity Cabinet | All 22 odd catches | Golden bobber |
| Myth Hunter | All 12 legends & myths | Golden band on your hat |
| Master of the Cove | All 70 | Golden fish weathervane on your house roof |

## Collection UI

- **Dialog:** location tabs (Lake · River · Sea Shore · Offshore · Trench), each with its own count. Each tab has three sections: Fish, Odd catches, and Legends & myths.
  - A milestone strip sits at the bottom.
  - Hover tooltips and the golden first-catch card are unchanged.
  - The last opened tab is remembered for the session.
- **In-world board:**
  - The canvas grows to 2048×1120.
  - The grid adapts to the species count (12 columns × 6 rows for 70), in location order.
  - Silhouettes show for undiscovered species.
- **Counters:** these already use `FISH.length`.

## Art

- **Fish-shaped species** reuse `SHAPES` and patterns. New pieces:
  - shape families: `puffer`, `angler`, `whaleshark`
  - patterns: `glow`, `crystal`, `planks`, `stars`, `moon`
  - flags: `wings`, `hammer`, `twoHead`, `sail` (reused)
  - mouths: `fangs`, `grin`, `angler`, `chin`
- **New body renderers** in `fishArt.js` for creatures that aren't fish-shaped: `eel`, `serpent`, `squid`, `octopus`, `kraken`, `jelly`, `ray`, `crab`, `lobster` and `turtle`. They share the same visual language as the fish:
  - viewBox 224×120, facing right
  - back → colour → belly gradient, fin gradient from `fin`
  - outline `shade(back, -0.35)` at the same stroke weights
  - the same eye, markings clipped to the body, and soft rounded shapes
- **Silhouette mode:** flat grey fill for every body type.
- **3D held catch (`makeHeldFish`):** equally simple low-poly variants per body type:
  - eel/serpent: a segmented tube
  - squid: a mantle cone plus tentacle strips
  - octopus/kraken: a head plus curled arms
  - jelly: a bell plus ribbons
  - ray: a flat diamond plus tail
  - crab/lobster: a shell plus claws
  - turtle: a shell dome plus flippers
  - Shark extras such as the hammer.
- **Minigame lane:** the marker icon changes with the body type (fish, eel, squid, jelly, crab, ray, turtle).

## Saves

- New species are only new entries in `FISH`. Saved `discovered`, `records`, inventory and trophies are validated against `FISH`, so old saves stay valid.
- The moon phase and milestones are derived from saved data (`day`, `discovered`), so the state shape doesn't change and **`SAVE_VERSION` stays 5**.
- Pre-expansion saves (v1–v5) load unchanged.

## Open questions

- **Economy:** odd catches add roughly 10–20% more income per hour at unlocked spots. Tune the `weight` values after play-testing.
- **Moon length:** a 6-day moon cycle (72 real minutes between full moons) may feel long. Four days is the alternative.
- **Milestone style:** milestone rewards apply automatically, with no claim button. A "claim" moment with a jingle at the notice board could feel more rewarding.
