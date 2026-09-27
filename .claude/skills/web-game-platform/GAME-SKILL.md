---
name: cozy-fishing-game
description: "Source of truth for the small cozy fishing game: fishing loop, locations, fish data, catch minigame, shop progression, economy, collection wallboard, scope, and one-shot implementation requirements."
argument-hint: "[fishing mechanic, fish, minigame, gear, shop, collection, location, economy, or progression task]"
---

# Cozy Fishing Game

This project is a **small single-player fishing game**. Do not turn it into a general farming/life simulator. Fishing, collection, progression and selling are the complete core loop.

The player fishes from four access types:

1. **Lake** — calm freshwater fishing.
2. **River** — flowing freshwater with more movement and different fish.
3. **Sea shore** — saltwater fishing from land.
4. **Boat at sea** — deeper saltwater fishing; unlocked as progression and requires buying/maintaining a boat.

The game should feel like a cozy top-down/2.5D fishing adventure with a compact world, not a large open world.

### Core loop

```text
Choose location
    -> choose time-appropriate spot
    -> cast
    -> wait for bite
    -> react to bite
    -> fight fish in catch minigame
    -> catch fish
    -> keep / register / sell
    -> buy better rod / reel / line / bait / tackle / boat
    -> unlock harder fish and locations
    -> fill collection board
```

A full fishing session should be understandable in seconds and repeatable for many minutes without requiring long travel or narrative interruptions.

### World and fishing access

Keep the first playable world very small:

- one compact lake area
- one compact river area
- one compact sea-shore area
- one small boat departure point
- one shop
- one collection wallboard

Use short paths and strong visual landmarks. Travel exists to establish place identity, not to consume playtime.

Each fishing location exposes a deterministic fish table based on **location + time of day + optional gear modifiers**.

Use four simple time buckets:

- **Dawn**
- **Day**
- **Dusk**
- **Night**

A fish can belong to one or more time buckets. The game must make the current bucket obvious in the world and UI.

Do not add weather, seasons, quests, farming or NPC schedules to the first playable version unless explicitly requested later.

### Fish collection

Start with a small, fixed catalog of roughly **16 species**. Prefer four distinct species families per major fishing area rather than dozens of unique assets.

Every fish species has:

- `id`
- display name
- location availability
- time-of-day availability
- four rarity tiers
- base price
- typical size range
- catch behavior
- color/visual variant information

The four rarity tiers are:

- Common
- Uncommon
- Rare
- Legendary

Rarity primarily changes price, catch difficulty and appearance/behavior. Do not make every rare fish merely a larger number; give harder fish distinct movement patterns.

### Fish size and value

Every caught fish gets an individual size within its species range.

Size affects sale value. Keep the rule easy to understand:

```text
salePrice = speciesBasePrice * rarityMultiplier * sizeMultiplier
```

Use a bounded size multiplier so extreme random rolls do not break the economy.

Do not add separate fish quality grades in v1. Rarity + size are sufficient.

The player inventory must show species, rarity, size and sale value before selling.

### Collection / achievement wallboard

The wallboard is the game's primary long-term achievement system.

Show one slot/card/silhouette for **each fish species**, initially greyed out.

When the player catches a species for the first time:

- automatically register the species on the wallboard
- reveal its name/art
- mark the collection slot complete
- do **not** add that discovery specimen to the sellable inventory

The player therefore cannot accidentally sell the first discovery.

Later copies of the same species are normal inventory items and can be sold.

The board tracks **species only**. It does not require collecting every rarity or size variant.

Provide simple progress such as:

```text
Fish discovered: 7 / 16
Locations completed: 2 / 4
```

Optional future platform integration: map major collection milestones to Steam achievements. The wallboard itself remains the authoritative in-game collection system.

### Casting and bite

Casting should be deliberately simple:

1. Aim/select a nearby valid fishing spot.
2. Cast.
3. Show a short readable waiting period.
4. Fish bite with a distinctive visual/audio cue.
5. Give the player a short reaction window to hook the fish.

Bait/tackle can modify bite chance and the species table, but should not create a complicated pre-cast loadout screen.

### Catch minigame

The catch minigame is the main skill mechanic and must be more interactive than a simple progress bar.

Use a compact **two-meter fish fight**:

```text
FISH POSITION / CATCH ZONE
[-------------🐟------]
        ▲
     player zone

LINE TENSION
[██████████------]
```

Recommended behavior:

- The fish moves through a bounded vertical or horizontal lane.
- The player controls a movable catch zone with hold/release or drag input.
- While fish and player zone overlap, catch progress rises.
- When they separate, progress falls slowly.
- Fish movement changes direction and speed according to its behavior archetype.
- Holding the control too aggressively increases **line tension**.
- Releasing or repositioning allows tension to recover.
- Maximum tension causes the fish to escape.
- Maximum catch progress lands the fish.

This creates two simultaneous decisions: **follow the fish** and **manage the line**.

#### Fish behavior archetypes

Use a small reusable set:

- **Calm** — slow movement and gentle direction changes.
- **Darting** — short sudden bursts.
- **Zigzag** — frequent direction changes.
- **Heavy** — slow movement but large tension spikes.
- **Frenzy** — alternating calm and burst phases.

Rarer fish use harder combinations and longer fight durations rather than simply making every value faster.

#### Gear effects on the minigame

Equipment changes the feel of the minigame, not just the shop numbers.

- **Rod** — increases catch-zone control and/or maximum fight tolerance.
- **Reel** — improves control responsiveness and tension recovery.
- **Line** — increases maximum line tension before snapping.
- **Hook** — increases hook reaction window or reduces escape chance after a mistake.
- **Bait** — changes bite rate and fish-table weighting.
- **Tackle** — one or two special modifiers that change the minigame rules.

Avoid a large equipment tree. Start with a few clearly distinct upgrades and let each one be noticeable.

### Tackle: small strategic modifiers

Tackle is the main source of build experimentation. Keep it to a few strong effects, for example:

- **Float** — catch zone moves more smoothly.
- **Heavy sinker** — fish movement becomes more predictable but the catch zone is slower.
- **Barbless hook** — harder hook window but lower tension growth.
- **Spinner** — higher chance of active/burst fish appearing.
- **Soft line** — faster tension recovery but lower maximum tension.

Only add effects that are visually and mechanically understandable.

### Shop and progression

The shop sells functional upgrades and should be the only economy hub.

Keep the first version to:

- 3–4 rod tiers
- 3 reel tiers
- 3 line tiers
- a small selection of bait
- a small selection of tackle
- one boat purchase/unlock

Money comes primarily from selling fish.

The progression loop is:

```text
catch fish -> sell fish -> buy gear -> reach harder fish -> complete board
```

Do not add multiple currencies.

### Boat progression

The boat is a clear mid-game milestone.

Before owning the boat, the sea is shore-only.

After buying the boat:

- unlock a small offshore fishing area
- introduce deeper-water fish
- slightly change the time/location fish tables
- give the boat a simple visible upgrade state if useful

Do not implement sailing simulation. Boat travel is a short transition/animation to the fishing spot.

### Economy rules

Money must remain readable and predictable.

The player should understand after one or two catches:

- which fish are worth more
- that rarity matters
- that large specimens are worth more
- what upgrade they are saving toward

Avoid inflation mechanics, crafting currencies, loot boxes and vendor reputation in v1.

### Content data

Fish, time windows, location pools, rarity values, prices, gear effects and catch behavior must live in data files/modules, not hard-coded across rendering code.

Example conceptual data:

```js
{
  id: "silver_trout",
  locations: ["lake", "river"],
  times: ["dawn", "day"],
  rarity: {
    common: { weight: 70, price: 8 },
    uncommon: { weight: 22, price: 14 },
    rare: { weight: 7, price: 28 },
    legendary: { weight: 1, price: 80 }
  },
  size: { min: 18, max: 42 },
  behavior: "darting"
}
```

Use seeded randomness for simulation and fishing rolls so bugs can be reproduced.

### UX and pacing

The player must always know:

- where they are fishing
- current time of day
- whether a bite is imminent
- current fish position during the fight
- line tension
- catch progress
- fish species/rarity/size/value after a successful catch
- current money and next meaningful upgrade

Keep transitions short. The player should spend most of the session fishing, catching and making upgrade decisions rather than navigating menus.

### Minimum one-shot scope

A first complete version must contain only:

- four fishing access types
- four time buckets
- roughly 16 fish species
- four rarity tiers
- size-based prices
- the catch minigame
- rod/reel/line/hook/bait/tackle progression
- one shop
- one boat unlock
- one 16-slot collection wallboard
- save/load
- a compact cozy world
- no combat
- no farming
- no quests
- no multiplayer
- no procedural infinite world

The game is complete when the player can start with basic equipment, catch fish, sell them, buy upgrades, unlock the boat, discover all species and fill the collection wallboard.
