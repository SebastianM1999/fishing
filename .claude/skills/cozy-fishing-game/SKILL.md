---
name: cozy-fishing-game
description: "Source of truth for the first playable cozy fishing game: exact gameplay, fish catalog, time/location rules, catch minigame, shop progression, economy, collection wallboard, scope, and one-shot requirements."
---

# Cozy Fishing Game

A small, single-player, 2.5D fishing game. The complete v1 loop is **explore -> fish -> catch -> collect/sell -> upgrade -> unlock -> complete collection**.

This file is deterministic for the first playable build. Do not invent alternative mechanics, content structures, currencies, or progression unless the user explicitly changes the spec.

## First playable target

Browser/PWA first. Do **not** package for Google Play or Steam during the first build.

V1 includes:

- compact walkable world
- lake, river, sea shore, offshore boat
- 20 fish species
- Common / Rare / Legendary
- fish size + price
- Dawn / Day / Dusk / Night
- interactive catch minigame
- shop + gear progression
- one-time boat unlock
- 20-slot collection wallboard
- selling
- IndexedDB save/load
- offline PWA

Use simple reusable/procedural low-poly geometry when faster than generated GLB assets. Do not block gameplay on external asset generation.

## Desktop Chrome browser presentation

Desktop Chrome is the primary initial testing target. The game must look polished and remain fully playable at both **1440x900** and **1280x720** browser viewports.

- Keep the Three.js world, HUD, catch minigame, shop, inventory, and collection wallboard visible without incoherent overlap, clipping, horizontal scrolling, or page-level scrolling during normal play.
- Preserve legible text, stable controls, and comfortable pointer targets at both viewports.
- Test both viewports in Chrome and with Playwright before declaring the MVP complete. Capture screenshots to confirm that the world renders, the canvas is nonblank, and UI elements fit their intended layout.

## World

One small connected world with:

- home/hub
- shop
- collection wallboard
- lake
- river
- sea shore
- boat departure point
- small offshore area

The player walks between areas; do not use a location-selection screen as primary navigation.

### Movement

Desktop: WASD/arrow keys + pointer.

Mobile: virtual joystick + pointer/touch.

Normalize all input to the same game actions.

Keep travel between major areas to seconds, not minutes.

## Time

One continuous day = **12 real minutes**. Each bucket = 3 real minutes:

1. Dawn
2. Day
3. Dusk
4. Night

Loop Night -> Dawn. No sleep/bed/time-skip/calendar/seasons/weather/NPC schedules in v1.

HUD always shows the current bucket.

Lighting mapping from `DESIGN-SKILL.md`:

- Dawn: cool shadows, warm horizon
- Day: soft warm morning into clear daylight
- Dusk: warm light, orange/pink sunset, long shadows
- Night: deep blue ambient, moonlight, warm lamps/windows

## Fishing access

Exactly 5 species per access type, 20 total. Content is data-driven.

### Lake

| Species | Base | Size cm | Time | Behavior |
|---|---:|---:|---|---|
| Bluegill | 8 | 12-24 | Dawn, Day | calm |
| Largemouth Bass | 12 | 28-48 | Dawn, Day, Dusk | darting |
| Catfish | 16 | 35-70 | Dusk, Night | heavy |
| Northern Pike | 22 | 45-85 | Dawn, Day | zigzag |
| Golden Carp | 35 | 25-60 | Dawn, Dusk, Night | frenzy |

### River

| Species | Base | Size cm | Time | Behavior |
|---|---:|---:|---|---|
| Trout | 14 | 25-55 | Dawn, Day | darting |
| Salmon | 24 | 40-80 | Dawn, Dusk | zigzag |
| Perch | 10 | 18-35 | Day, Dusk | calm |
| Carp | 18 | 35-75 | Day, Night | heavy |
| Sturgeon | 42 | 60-120 | Dusk, Night | heavy |

### Sea shore

| Species | Base | Size cm | Time | Behavior |
|---|---:|---:|---|---|
| Sardine | 10 | 10-22 | Dawn, Day | darting |
| Mackerel | 18 | 25-45 | Dawn, Dusk | zigzag |
| Flounder | 22 | 25-55 | Day, Dusk | calm |
| Sea Bass | 30 | 35-70 | Dusk, Night | heavy |
| Red Mullet | 34 | 20-40 | Night, Dawn | darting |

### Offshore boat

| Species | Base | Size cm | Time | Behavior |
|---|---:|---:|---|---|
| Tuna | 55 | 70-140 | Dawn, Day | heavy |
| Swordfish | 95 | 100-220 | Night | frenzy |
| Marlin | 110 | 120-250 | Day, Dusk | zigzag |
| Mahi-Mahi | 70 | 60-120 | Day, Dusk | darting |
| Blue Shark | 85 | 90-190 | Dusk, Night | frenzy |

## Fish generation

Each species has:

- `id`
- `name`
- `location`
- `times`
- `baseValue`
- `sizeCm: [min,max]`
- `behavior`
- `assetId`

Each catch has:

- species id
- rarity
- size
- sale value

### Rarity

Exactly three tiers: **Common, Rare, Legendary**. No Uncommon.

Default catch weights:

| Access | Common | Rare | Legendary |
|---|---:|---:|---:|
| Lake | 88% | 11% | 1% |
| River | 86% | 12% | 2% |
| Sea shore | 83% | 14% | 3% |
| Offshore | 78% | 18% | 4% |

Gear may modify the relative weighting later.

Rarity multipliers:

```text
Common    1.0x
Rare      2.5x
Legendary 6.0x
```

### Size and price

Roll an individual size uniformly within the species range.

```text
normalizedSize = (size - minSize) / (maxSize - minSize)
sizeMultiplier = 0.75 + normalizedSize * 0.50
salePrice = max(1, round(baseValue * rarityMultiplier * sizeMultiplier))
```

UI shows species, rarity, size, and value.

## Inventory and selling

- Unlimited fish inventory in v1.
- Sell one fish.
- Sell all sellable fish.
- One currency: `coins`.
- Starting coins: **30**.

First-discovery fish is automatically registered and removed from sellable inventory. Later copies are sellable.

No inventory capacity or bag upgrades.

## Cast and bite

At a fishing spot:

1. cast
2. choose fish table from location + current time
3. wait 2-5 seconds
4. show a clear bite cue
5. give a **900 ms** hook window
6. start minigame on success

Hook timing:

- Perfect: first 250 ms -> +10% starting catch progress and -10% starting tension
- Good: remaining 650 ms
- Miss: encounter lost

Do not make waiting longer than 5 seconds in v1.

## Catch minigame

The minigame is the primary skill mechanic.

```text
FISH LANE
[-----------------fish----------------]
         [ PLAYER ZONE ]

CATCH PROGRESS
[██████████--------]

LINE TENSION
[███████-----------]
```

Controls:

- desktop: hold/release pointer
- mobile: press/hold/release touch

Rules:

- fish inside player zone -> catch progress rises
- fish outside zone -> catch progress falls slowly
- active control -> tension rises
- release -> tension recovers
- max tension -> line breaks, fish escapes
- full catch progress -> catch succeeds

The player zone follows an eased target position; it must not snap instantly.

### Fish fight pacing

All fish cycle through:

`normal -> burst -> exhausted -> normal ...`

Exhausted phase:

- movement speed -45%
- catch-progress gain +20%
- tension growth -20%

Behavior archetypes:

- `calm`: slow movement, gentle direction changes
- `darting`: short sudden bursts
- `zigzag`: frequent direction changes
- `heavy`: slow movement, large tension spikes
- `frenzy`: alternating calm and burst phases

Rare/Legendary fish should generally fight longer and burst more strongly, not merely multiply all speeds.

Do not implement physical rope simulation.

## Gear

All bought gear is permanent and reusable. No consumable bait stock in v1.

### Rod

| Item | Price | Effect |
|---|---:|---|
| Starter Rod | free | zone width 14% |
| Fiberglass Rod | 120 | zone width 17% |
| Carbon Rod | 350 | zone width 20% |
| Master Rod | 800 | zone width 23% |

### Reel

| Item | Price | Effect |
|---|---:|---|
| Starter Reel | free | speed 1.0x, recovery 1.0x |
| Smooth Reel | 100 | speed 1.10x, recovery 1.10x |
| Quick Reel | 300 | speed 1.20x, recovery 1.20x |
| Pro Reel | 700 | speed 1.35x, recovery 1.35x |

### Line

| Item | Price | Effect |
|---|---:|---|
| Starter Line | free | tension limit 100 |
| Strong Line | 150 | limit 115 |
| Braided Line | 350 | limit 135 |
| Heavy Line | 650 | limit 160 |

### Hook

| Item | Price | Effect |
|---|---:|---|
| Standard Hook | free | hook window 900 ms |
| Wide Hook | 120 | hook window 1050 ms |
| Barbed Hook | 300 | hook window 1200 ms, 5% slower progress loss |

### Tackle

Equip one permanent tackle item:

| Item | Price | Effect |
|---|---:|---|
| Float | 150 | zone movement 12% smoother |
| Heavy Sinker | 200 | burst intensity -10%, zone speed -8% |
| Spinner | 350 | Rare/Legendary encounter weighting +25% relative; bite wait +1s max |

When a new tier is purchased, equip it automatically. Keep the shop UI compact.

## Boat

**Small Fishing Boat: 1000 coins.** One-time purchase; unlocks offshore fishing.

No maintenance, fuel, damage, sailing physics, or boat upgrades in v1.

Boat travel is a short transition to the offshore area.

## Shop

One compact screen showing:

- coins
- equipped gear
- next upgrade
- price
- clear effect comparison

Money loop:

`catch -> sell -> buy gear -> reach harder fish -> collect more species`

## Collection wallboard

Exactly **20 species slots**.

Initial state: grey silhouette + hidden name.

First catch of a species:

- reveal art/name
- mark discovered
- increment `X / 20`
- protect that discovery from selling

Later copies are normal sellable fish.

The board tracks **species only**. Do not track rarity, size, count, or best specimen in v1.

## Save/load

Persist:

- coins
- owned/equipped gear
- boat unlock
- discovered species
- sellable fish inventory
- player position where practical
- current day/time bucket where practical

Use IndexedDB. Save after meaningful state changes, not every frame. Handle missing/corrupt/older saves safely.

## Offline PWA

After first successful load, the core game must work offline. Cache the application shell and local game assets using the platform skill's PWA rules. No server/remote API is required for gameplay.

## Scope exclusions

Do not add v1:

- multiplayer
- combat
- quests
- farming
- crafting
- seasons
- weather
- stamina
- multiple currencies
- inventory capacity
- inventory upgrades
- NPC relationships
- housing customization
- character customization
- sailing simulation
- boat maintenance
- consumable bait inventory
- extra fish quality systems
- fish record/best-size systems
- infinite/procedural world
- online accounts/cloud saves

## Technical content shape

```js
{
  id: "lake_bluegill",
  name: "Bluegill",
  location: "lake",
  times: ["dawn", "day"],
  baseValue: 8,
  sizeCm: [12, 24],
  behavior: "calm",
  assetId: "fish_bluegill"
}
```

```js
{
  speciesId: "lake_bluegill",
  rarity: "common",
  sizeCm: 18,
  value: 7
}
```

Keep fish/gear definitions in content data, not inside simulation functions.

## Definition of done

A clean new player can:

1. start with 30 coins
2. walk the world with keyboard and touch controls
3. fish at lake, river, sea shore, and offshore
4. experience all four time buckets
5. catch Common, Rare, and Legendary fish
6. catch varying fish sizes with different values
7. complete hook timing + catch minigame
8. observe different fish behaviors
9. buy/equip rod, reel, line, hook, tackle
10. buy the boat and unlock offshore
11. sell one fish or all sellable fish
12. discover species on the wallboard
13. be unable to sell first-discovery specimens
14. progress to 20/20 species
15. reload with progress intact
16. reload offline after the first successful visit

## One-shot verification loop

```text
read goal
 -> read platform/design/game skills
 -> inspect implementation
 -> implement
 -> clean build
 -> launch
 -> verify loop
 -> verify all locations/time buckets
 -> verify rarity/size/value
 -> verify minigame
 -> verify shop/gear
 -> verify boat
 -> verify collection
 -> verify save/load
 -> verify offline
 -> fix
 -> repeat
```

At minimum check:

- no uncaught console errors
- no required asset 404s/missing-model errors
- keyboard movement works
- touch/virtual joystick path works when available
- all four access types are reachable
- all four time buckets alter fish tables
- all three rarity outcomes are possible
- size changes price
- first discovery is protected
- later duplicates sell
- gear changes are observable
- boat unlock works
- wallboard reaches 20/20
- save/load restores progress
- production build launches
- offline reload works
