// Canonical v1 content data. Simulation code reads from here; never hard-code content elsewhere.

export const TIME_BUCKETS = ["dawn", "day", "dusk", "night"];
export const TIME_LABELS = { dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night" };
export const DAY_LENGTH_MS = 12 * 60 * 1000;
export const BUCKET_LENGTH_MS = DAY_LENGTH_MS / TIME_BUCKETS.length;

export const LOCATIONS = ["lake", "river", "sea", "offshore", "trench"];
export const LOCATION_LABELS = { lake: "Lake", river: "River", sea: "Sea Shore", offshore: "Offshore", trench: "Deep Trench" };
// Spots that need more than getting there: the Deep Trench (reached on the Ironhull Trawler) tears weak tackle apart.
export const LOCATION_GATES = { trench: { gear: { rod: 2, reel: 2, line: 3 }, hint: "The trench tears weak tackle apart. You need at least a Carbon Rod, a Quick Reel and a Heavy Line." } };
// Trench fights are much harder: slower progress, wilder bursts, faster tension, a narrower zone, and big swells
// that shove the zone aside now and then. (Legends and myths keep their own boss tuning.)
export const LOCATION_FIGHT = { trench: { progressGain: 0.78, burstMult: 1.25, tensionGrowthMult: 1.15, zoneWidthMult: 0.88, swell: { every: [3, 5], time: 0.9, push: 0.3 } } };

export const STARTING_COINS = 0;
export const CHEAT_COINS = 10000; // press X three times quickly
// Catch streak: each fish landed in a row adds sell value to the fish caught during the streak.
export const STREAK = { perFish: 0.02, maxFish: 5 };
// Notice-board orders: new ones every in-game dawn; rewards beat the market price.
export const ORDERS = { perDay: 3, rewardMult: 1.6, xpBase: 10, xpPerCoin: 0.25 };
// Moon phase from the day counter: phase = day % cycle; full and new moons are what some mythics wait for.
export const MOON = { cycle: 6, full: 3, new: 0, names: ["New moon", "Waxing crescent", "First quarter", "Full moon", "Last quarter", "Waning crescent"] };
export const BOAT_PRICE = 1000;
// Late game: the storm-proof trawler sails to the Deep Trench; the harpoon (sold by Captain Olsen too) is needed for giants.
export const TRAWLER = { name: "Ironhull Trawler", price: 6000 };
export const HARPOON = { name: "Whaler's Harpoon", price: 3500 };
// Harpoon minigame: an aim swings along the lane, a thrown harpoon lands where the aim was after `flight` s and hits
// if the creature is surfaced there. Each species sets hits needed, how fast it swims and how big a target it is.
export const HARPOON_GAME = { spare: 2, flight: 0.45, aimSpeed: 0.85, surface: [2.4, 3.4], dive: [1.0, 1.6], hitDive: 1.5, retarget: [0.9, 1.8], speedUp: 0.12, spareBonus: 0.04 };

// Construction barriers: areas that must be cleared with coins before they can be entered.
export const REGIONS = {
  river: { id: "river", name: "River bank", price: 250, sign: "River bank closed for repairs" },
  sea: { id: "sea", name: "Beach & docks", price: 750, sign: "Beach & docks under construction", requires: "river" },
};

// Fish bag tiers: how many sellable fish you can carry.
export const BAGS = [
  { id: "bag_pouch", name: "Canvas Pouch", price: 0, slots: 8 },
  { id: "bag_basket", name: "Fishing Basket", price: 200, slots: 15 },
  { id: "bag_creel", name: "Big Creel", price: 600, slots: 30 },
];

// Weather: rolled per time-of-day slot (deterministic per save, see weather.js). It shifts the fishing odds
// and brings out weather-only species (FISH entries with a `weather` list).
export const WEATHER_TYPES = ["clear", "rain", "fog", "storm"];
export const WEATHER = {
  clear: { label: "Clear", rareWeightMult: 1, biteWaitMult: 1, burstMult: 1, hint: "" },
  rain: { label: "Rain", rareWeightMult: 1.1, biteWaitMult: 0.8, burstMult: 1, hint: "Fish bite faster in the rain" },
  fog: { label: "Fog", rareWeightMult: 1.25, biteWaitMult: 1, burstMult: 1, hint: "Rare fish rise in the fog" },
  storm: { label: "Storm", rareWeightMult: 1.4, biteWaitMult: 0.9, burstMult: 1.15, hint: "Wild fights, but rare fish are about" },
};
// Chance weights per time of day; `stay` = chance the previous slot's weather carries on. A new game's first dawn is clear.
export const WEATHER_WEIGHTS = {
  dawn: { clear: 66, rain: 6, fog: 28, storm: 0 },
  day: { clear: 82, rain: 10, fog: 4, storm: 4 },
  dusk: { clear: 75, rain: 12, fog: 7, storm: 6 },
  night: { clear: 72, rain: 12, fog: 10, storm: 6 },
};
export const WEATHER_STAY = 0.25;



/** @typedef {"calm"|"darting"|"zigzag"|"heavy"|"frenzy"} Behavior */

// art: illustration parameters for portraits (colors, body shape, markings, mouth/fin extras)
export const FISH = [
  { id: "lake_bluegill", name: "Bluegill", location: "lake", times: ["dawn", "day"], baseValue: 8, sizeCm: [12, 24], behavior: "calm", assetId: "fish_bluegill", flavor: "Blue cheeks, orange tummy, always first to the bait.", art: { color: "#4f7fa6", back: "#2f5878", belly: "#f0b04a", fin: "#3d6688", shape: "deep", pattern: "bars", patternColor: "#2b4f6e", ear: "#1f2f45", len: 0.62, h: 0.44 } },
  { id: "lake_largemouth_bass", name: "Largemouth Bass", location: "lake", times: ["dawn", "day", "dusk"], baseValue: 12, sizeCm: [28, 48], behavior: "darting", assetId: "fish_largemouth_bass", flavor: "Its mouth is bigger than its manners.", art: { color: "#7c9650", back: "#4e6630", belly: "#ece5bd", fin: "#6f8446", shape: "bass", pattern: "band", patternColor: "#3e4f26", mouth: "big", len: 0.82, h: 0.34 } },
  { id: "lake_catfish", name: "Catfish", location: "lake", times: ["dusk", "night"], baseValue: 16, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_catfish", flavor: "Whiskers for every occasion.", art: { color: "#6e655b", back: "#4a433c", belly: "#d8cbb3", fin: "#57504a", shape: "catfish", pattern: "mottle", patternColor: "#4f4740", mouth: "barbels", len: 0.92, h: 0.26 } },
  { id: "lake_northern_pike", name: "Northern Pike", location: "lake", times: ["dawn", "day"], baseValue: 22, sizeCm: [45, 85], behavior: "zigzag", assetId: "fish_northern_pike", flavor: "Lurks in the reeds, grinning.", art: { color: "#7f9656", back: "#4d6334", belly: "#efe8c4", fin: "#b56a3a", shape: "pike", pattern: "lightspots", patternColor: "#e7e2b0", mouth: "duck", len: 1, h: 0.2 } },
  { id: "lake_golden_carp", name: "Golden Carp", location: "lake", times: ["dawn", "dusk", "night"], baseValue: 35, sizeCm: [25, 60], behavior: "frenzy", assetId: "fish_golden_carp", flavor: "Shines like a coin someone wished upon.", art: { color: "#e6a92c", back: "#c9781c", belly: "#fbe29a", fin: "#e8893a", shape: "carp", pattern: "scales", patternColor: "#b8661a", mouth: "barbels", shine: true, len: 0.78, h: 0.38 } },

  { id: "lake_zander", name: "Zander", location: "lake", times: ["dusk", "night"], baseValue: 28, sizeCm: [40, 80], behavior: "darting", assetId: "fish_zander", flavor: "Glassy eyes made for moonlit hunting.", art: { color: "#9aa58a", back: "#56664f", belly: "#eeeadb", fin: "#7d8a70", shape: "bass", pattern: "bars", patternColor: "#4a5642", spiny: true, iris: "#eef0d4", len: 0.9, h: 0.26 } },
  { id: "lake_pumpkinseed", name: "Pumpkinseed", location: "lake", times: ["day"], baseValue: 10, sizeCm: [10, 20], behavior: "calm", assetId: "fish_pumpkinseed", flavor: "Painted like a sunset in a pond.", art: { color: "#c9a24a", back: "#6a8a5a", belly: "#f08a3a", fin: "#8a9a5a", shape: "deep", pattern: "waves", patternColor: "#3fa3b8", ear: "#d8403a", len: 0.58, h: 0.46 } },

  // Odd catches (special creatures): rarer in the fish table (weight), some need a minimum gear tier to show up at all.
  // Lake and river have only two each, so theirs weigh more to land at a similar share per cast.
  { id: "lake_crayfish", name: "Crayfish", location: "lake", times: ["dawn", "night"], baseValue: 100, sizeCm: [8, 15], behavior: "darting", special: true, weight: 0.16, assetId: "odd_crayfish", flavor: "Snips at the bait, then backs off politely.", art: { color: "#b8583e", back: "#7a3322", belly: "#eaa27a", fin: "#c86a48", limb: "#a84c34", shape: "lobster", pattern: "none", patternColor: "#7a3322" } },
  { id: "lake_snapping_turtle", name: "Snapping Turtle", location: "lake", times: ["dusk", "night"], baseValue: 140, sizeCm: [25, 45], behavior: "heavy", special: true, weight: 0.12, gear: { line: 1 }, assetId: "odd_snapping_turtle", flavor: "Grumpy looking, secretly a softie.", art: { color: "#6a7440", back: "#3e4626", belly: "#d8c890", fin: "#8a8a5a", shape: "turtle", pattern: "mottle", patternColor: "#3a4222", ridges: true, iris: "#e0b040" } },
  { id: "river_trout", name: "Trout", location: "river", times: ["dawn", "day"], baseValue: 14, sizeCm: [25, 55], behavior: "darting", assetId: "fish_trout", flavor: "Speckled like a freshly baked loaf.", art: { color: "#8d9d6b", back: "#5c6e46", belly: "#f2e0c8", fin: "#8c8a62", shape: "trout", pattern: "spots", patternColor: "#3a3a2a", stripe: "#e0848a", len: 0.84, h: 0.28 } },
  { id: "river_salmon", name: "Salmon", location: "river", times: ["dawn", "dusk"], baseValue: 24, sizeCm: [40, 80], behavior: "zigzag", assetId: "fish_salmon", flavor: "Swims home against every current.", art: { color: "#b8bfc4", back: "#5c7188", belly: "#f4eee6", fin: "#7a8898", shape: "salmon", pattern: "spots", patternColor: "#34404e", stripe: "#e9a78e", len: 0.9, h: 0.3 } },
  { id: "river_perch", name: "Perch", location: "river", times: ["day", "dusk"], baseValue: 10, sizeCm: [18, 35], behavior: "calm", assetId: "fish_perch", flavor: "Stripy, spiky and very sure of itself.", art: { color: "#b9ab4a", back: "#7b7a2e", belly: "#f2e8b0", fin: "#e0703e", shape: "deep", pattern: "bars", patternColor: "#4a4a1c", spiny: true, len: 0.66, h: 0.37 } },
  { id: "river_carp", name: "Carp", location: "river", times: ["day", "night"], baseValue: 18, sizeCm: [35, 75], behavior: "heavy", assetId: "fish_carp", flavor: "Grows old and wise in the slow bends.", art: { color: "#9a8250", back: "#6c5832", belly: "#e2cf9c", fin: "#8c6c40", shape: "carp", pattern: "scales", patternColor: "#6a522c", mouth: "barbels", len: 0.82, h: 0.38 } },
  { id: "river_sturgeon", name: "Sturgeon", location: "river", times: ["dusk", "night"], baseValue: 42, sizeCm: [60, 120], behavior: "heavy", assetId: "fish_sturgeon", flavor: "Wears armour older than the village.", art: { color: "#6a747c", back: "#434b52", belly: "#d6d3c8", fin: "#565f66", shape: "sturgeon", pattern: "scutes", patternColor: "#e8e4d6", mouth: "barbels", len: 1, h: 0.22 } },

  { id: "river_barbel", name: "Barbel", location: "river", times: ["day", "night"], baseValue: 20, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_barbel", flavor: "Snuffles the gravel for snacks with four whiskers.", art: { color: "#b0925e", back: "#6a5432", belly: "#efe0c0", fin: "#cc7a46", shape: "trout", pattern: "mottle", patternColor: "#7a6038", mouth: "barbels", len: 0.86, h: 0.26 } },
  { id: "river_char", name: "Arctic Char", location: "river", times: ["dawn", "dusk"], baseValue: 22, sizeCm: [25, 50], behavior: "zigzag", assetId: "fish_char", flavor: "Blushes bright red in cold water.", art: { color: "#86a088", back: "#46584a", belly: "#ec6038", fin: "#e0583a", shape: "salmon", pattern: "lightspots", patternColor: "#f6d2a8", len: 0.84, h: 0.28 } },

  { id: "river_eel", name: "River Eel", location: "river", times: ["dusk", "night"], baseValue: 110, sizeCm: [50, 110], behavior: "zigzag", special: true, weight: 0.16, assetId: "odd_river_eel", flavor: "Slides through your fingers like a wet ribbon.", art: { color: "#6e6a3c", back: "#3a3a22", belly: "#d8c890", fin: "#5a5a32", shape: "eel", pattern: "none", patternColor: "#3a3a22" } },
  { id: "river_electric_eel", name: "Electric Eel", location: "river", times: ["night"], baseValue: 180, sizeCm: [90, 200], behavior: "jolt", special: true, weight: 0.12, gear: { line: 1 }, assetId: "odd_electric_eel", flavor: "Hums like a kettle about to boil.", art: { color: "#4e5c5c", back: "#2a3438", belly: "#e8a040", fin: "#3e4c4c", shape: "eel", pattern: "zap", patternColor: "#ffe45a", thick: 11 } },
  { id: "sea_sardine", name: "Sardine", location: "sea", times: ["dawn", "day"], baseValue: 10, sizeCm: [10, 22], behavior: "darting", assetId: "fish_sardine", flavor: "Small, shiny and never alone.", art: { color: "#8fb2c8", back: "#3d6a8c", belly: "#f1f5f6", fin: "#9ab4c4", shape: "slim", pattern: "dots", patternColor: "#26435a", len: 0.72, h: 0.22 } },
  { id: "sea_mackerel", name: "Mackerel", location: "sea", times: ["dawn", "dusk"], baseValue: 18, sizeCm: [25, 45], behavior: "zigzag", assetId: "fish_mackerel", flavor: "Wears the waves on its back.", art: { color: "#8fc0bc", back: "#2f6f78", belly: "#eef4f1", fin: "#5c8e8a", shape: "tuna", pattern: "waves", patternColor: "#153f48", finlets: true, len: 0.84, h: 0.25 } },
  { id: "sea_flounder", name: "Flounder", location: "sea", times: ["day", "dusk"], baseValue: 22, sizeCm: [25, 55], behavior: "calm", assetId: "fish_flounder", flavor: "Both eyes on one side, all the better to see you.", art: { color: "#a18a68", back: "#7e6a4c", belly: "#d9c8a4", fin: "#8e7654", shape: "flat", pattern: "orangespots", patternColor: "#df7a3c", len: 0.72, h: 0.52 } },
  { id: "sea_sea_bass", name: "Sea Bass", location: "sea", times: ["dusk", "night"], baseValue: 30, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_sea_bass", flavor: "The silver knight of the jetty.", art: { color: "#9aa8b0", back: "#56656e", belly: "#eef0ec", fin: "#6c7a82", shape: "bass", pattern: "lateral", patternColor: "#3e4a52", spiny: true, len: 0.86, h: 0.32 } },
  { id: "sea_red_mullet", name: "Red Mullet", location: "sea", times: ["night", "dawn"], baseValue: 34, sizeCm: [20, 40], behavior: "darting", assetId: "fish_red_mullet", flavor: "Tastes the sand with its whiskers.", art: { color: "#e07a62", back: "#b8483c", belly: "#f7d6b8", fin: "#e59a6a", shape: "mullet", pattern: "stripe2", patternColor: "#f2c85a", mouth: "barbels", len: 0.74, h: 0.3 } },

  { id: "sea_herring", name: "Herring", location: "sea", times: ["dawn", "day"], baseValue: 9, sizeCm: [18, 30], behavior: "darting", assetId: "fish_herring", flavor: "Travels in gossiping crowds of thousands.", art: { color: "#b8c8d8", back: "#3a5a8a", belly: "#f4f6f8", fin: "#8aa0b8", shape: "slim", pattern: "none", patternColor: "#3a5a8a", len: 0.7, h: 0.22 } },
  { id: "sea_cod", name: "Cod", location: "sea", times: ["dusk", "night"], baseValue: 26, sizeCm: [40, 90], behavior: "heavy", assetId: "fish_cod", flavor: "A single chin whisker, worn with pride.", art: { color: "#b0a270", back: "#6a6040", belly: "#efe8d4", fin: "#8a7e56", shape: "carp", pattern: "mottle", patternColor: "#6a5a3a", mouth: "chin", len: 0.86, h: 0.32 } },
  { id: "sea_pufferfish", name: "Pufferfish", location: "sea", times: ["day"], baseValue: 40, sizeCm: [15, 30], behavior: "calm", assetId: "fish_pufferfish", flavor: "Puffs up when flattered.", art: { color: "#dcc474", back: "#8a7a3a", belly: "#f8f0d8", fin: "#c8a452", shape: "puffer", pattern: "spots", patternColor: "#5a4a22", spikes: true, len: 0.6, h: 0.5 } },

  { id: "sea_moon_jelly", name: "Moon Jelly", location: "sea", times: ["night", "dawn"], baseValue: 120, sizeCm: [15, 40], behavior: "sting", special: true, weight: 0.091, assetId: "odd_moon_jelly", flavor: "Floats past like a lost lampshade.", art: { color: "#d8e4f4", back: "#a8bce0", belly: "#f4f8ff", fin: "#cbbbe8", shape: "jelly", pattern: "rings", patternColor: "#e89ac0" } },
  { id: "sea_squid", name: "Common Squid", location: "sea", times: ["dusk", "night"], baseValue: 150, sizeCm: [30, 60], behavior: "ink", special: true, weight: 0.078, assetId: "odd_squid", flavor: "Leaves a polite puff of ink as a goodbye.", art: { color: "#ec9a8a", back: "#c0605a", belly: "#fbe0d8", fin: "#e0806a", shape: "squid", pattern: "spots", patternColor: "#b04a44" } },
  { id: "sea_shore_crab", name: "Shore Crab", location: "sea", times: ["day", "dusk"], baseValue: 100, sizeCm: [8, 18], behavior: "heavy", special: true, weight: 0.104, assetId: "odd_shore_crab", flavor: "Waves one claw hello, the other goodbye.", art: { color: "#d8743c", back: "#a04a24", belly: "#f0c890", fin: "#e0824a", limb: "#c86434", shape: "crab", pattern: "spots", patternColor: "#a04a24" } },
  { id: "sea_spotted_ray", name: "Spotted Ray", location: "sea", times: ["day", "dusk"], baseValue: 160, sizeCm: [40, 90], behavior: "calm", special: true, weight: 0.078, assetId: "odd_spotted_ray", flavor: "Glides like a kite that forgot the wind.", art: { color: "#c0a878", back: "#7a6a48", belly: "#f0e8d8", fin: "#9a8660", shape: "ray", pattern: "spots", patternColor: "#4a3e28" } },
  { id: "sea_moray", name: "Moray Eel", location: "sea", times: ["dusk", "night"], baseValue: 170, sizeCm: [60, 150], behavior: "darting", special: true, weight: 0.065, gear: { line: 1 }, assetId: "odd_moray", flavor: "Lives in a rock and always looks surprised.", art: { color: "#8c9c3e", back: "#5a6a2a", belly: "#d8d890", fin: "#7a8a36", shape: "eel", pattern: "mottle", patternColor: "#34401a", mouth: "moray", thick: 11.5, eyeR: 3.8 } },
  { id: "sea_mimic_octopus", name: "Mimic Octopus", location: "sea", times: ["day", "dusk"], baseValue: 230, sizeCm: [30, 60], behavior: "tentacle", special: true, weight: 0.052, gear: { rod: 1 }, assetId: "odd_mimic_octopus", flavor: "Pretends to be a rock, a fish and, once, a boot.", art: { color: "#d8a878", back: "#8a5a38", belly: "#f4dcc0", fin: "#c89060", limb: "#c89264", shape: "octopus", pattern: "bands", patternColor: "#5a3a24" } },
  { id: "offshore_tuna", name: "Tuna", location: "offshore", times: ["dawn", "day"], baseValue: 55, sizeCm: [70, 140], behavior: "heavy", assetId: "fish_tuna", flavor: "Built like a torpedo, sails like a dream.", art: { color: "#8ea4bc", back: "#1f3a62", belly: "#e8ecf0", fin: "#e8c23a", shape: "tuna", pattern: "none", patternColor: "#1f3a62", finlets: true, len: 0.9, h: 0.4 } },
  { id: "offshore_swordfish", name: "Swordfish", location: "offshore", times: ["night"], baseValue: 95, sizeCm: [100, 220], behavior: "frenzy", assetId: "fish_swordfish", flavor: "Brings its own sword to every fight.", art: { color: "#6f86a0", back: "#34465e", belly: "#d6dde4", fin: "#3e5068", shape: "billfish", pattern: "none", patternColor: "#34465e", mouth: "sword", len: 1, h: 0.26 } },
  { id: "offshore_marlin", name: "Marlin", location: "offshore", times: ["day", "dusk"], baseValue: 110, sizeCm: [120, 250], behavior: "zigzag", assetId: "fish_marlin", flavor: "Raises its sail and races the boat.", art: { color: "#5d8cbc", back: "#1d4a7e", belly: "#e2eaf2", fin: "#2d5f9a", shape: "billfish", pattern: "vbars", patternColor: "#a9d0f0", mouth: "spear", sail: true, len: 1, h: 0.3 } },
  { id: "offshore_mahi_mahi", name: "Mahi-Mahi", location: "offshore", times: ["day", "dusk"], baseValue: 70, sizeCm: [60, 120], behavior: "darting", assetId: "fish_mahi_mahi", flavor: "All the colours of a tropical sunset.", art: { color: "#5aa86a", back: "#2e7a8a", belly: "#f0d84a", fin: "#3a8a9a", shape: "mahi", pattern: "dots", patternColor: "#2e6a8a", len: 0.92, h: 0.34 } },
  { id: "offshore_blue_shark", name: "Blue Shark", location: "offshore", times: ["dusk", "night"], baseValue: 85, sizeCm: [90, 190], behavior: "frenzy", assetId: "fish_blue_shark", flavor: "Sleek, blue and a little shy.", art: { color: "#5f86ba", back: "#35599a", belly: "#eef2f6", fin: "#43669e", shape: "shark", pattern: "none", patternColor: "#35599a", mouth: "shark", len: 1, h: 0.26 } },

  { id: "offshore_barracuda", name: "Barracuda", location: "offshore", times: ["day", "dusk"], baseValue: 60, sizeCm: [60, 150], behavior: "darting", assetId: "fish_barracuda", flavor: "All teeth and good intentions.", art: { color: "#b8c4cc", back: "#4a5a6a", belly: "#f0f4f4", fin: "#6a7a8a", shape: "pike", pattern: "vbars", patternColor: "#3a4a5a", mouth: "fangs", len: 1, h: 0.2 } },
  { id: "offshore_flying_fish", name: "Flying Fish", location: "offshore", times: ["day"], baseValue: 45, sizeCm: [20, 40], behavior: "zigzag", assetId: "fish_flying_fish", flavor: "Has seen the boat from above.", art: { color: "#8ab4d8", back: "#2a5a8a", belly: "#f0f4f8", fin: "#a8c8e8", shape: "slim", pattern: "none", patternColor: "#2a5a8a", wings: true, len: 0.74, h: 0.22 } },

  { id: "offshore_sea_turtle", name: "Sea Turtle", location: "offshore", times: ["day", "dusk"], baseValue: 180, sizeCm: [60, 120], behavior: "calm", special: true, weight: 0.078, gear: { line: 1 }, assetId: "odd_sea_turtle", flavor: "Old, wise and in no rush to be caught.", art: { color: "#7a8a4a", back: "#4a5a2a", belly: "#e8e0b0", fin: "#9ab080", shape: "turtle", pattern: "plates", patternColor: "#e0d8a0" } },
  { id: "offshore_manta_ray", name: "Manta Ray", location: "offshore", times: ["dawn", "day"], baseValue: 220, sizeCm: [200, 450], behavior: "calm", special: true, weight: 0.065, gear: { rod: 2 }, assetId: "odd_manta_ray", flavor: "Somersaults for fun at sunrise.", art: { color: "#3e4e68", back: "#222c40", belly: "#f4f4f0", fin: "#3a4a64", shape: "ray", manta: true, pattern: "patches", patternColor: "#eef0f2" } },
  { id: "offshore_lions_mane", name: "Lion's Mane Jelly", location: "offshore", times: ["dusk", "night"], baseValue: 200, sizeCm: [50, 200], behavior: "sting", special: true, weight: 0.065, assetId: "odd_lions_mane", flavor: "Wears a magnificent mane of ribbons.", art: { color: "#eca446", back: "#c0602a", belly: "#fbd890", fin: "#f0b060", shape: "jelly", mane: true, pattern: "none", patternColor: "#c0602a" } },
  { id: "offshore_hammerhead", name: "Hammerhead Shark", location: "offshore", times: ["dusk", "night"], baseValue: 260, sizeCm: [150, 350], behavior: "frenzy", special: true, weight: 0.052, gear: { line: 2 }, assetId: "odd_hammerhead", flavor: "Sees both sides of every story.", art: { color: "#8c9caa", back: "#56687a", belly: "#f0f2f4", fin: "#66788a", shape: "shark", pattern: "none", patternColor: "#56687a", mouth: "shark", hammer: true, len: 1, h: 0.26 } },
  { id: "offshore_whale_shark", name: "Whale Shark", location: "offshore", times: ["day"], baseValue: 380, sizeCm: [400, 900], behavior: "heavy", special: true, weight: 0.039, gear: { rod: 2, reel: 2 }, assetId: "odd_whale_shark", flavor: "The gentlest giant, dotted like a starry night.", art: { color: "#4e6e8e", back: "#2a4a6a", belly: "#eef2f4", fin: "#3e5e7e", shape: "whaleshark", pattern: "lightspots", patternColor: "#eef4f8", mouth: "wide", len: 1, h: 0.3 } },
  { id: "trench_lanternfish", name: "Lanternfish", location: "trench", times: ["dawn", "day", "dusk", "night"], baseValue: 60, sizeCm: [5, 15], behavior: "darting", assetId: "fish_lanternfish", flavor: "Carries its own night-lights.", art: { color: "#5a6a8e", back: "#2a3450", belly: "#aab6d2", fin: "#4a5878", shape: "slim", pattern: "glow", patternColor: "#8ff0ff", iris: "#bfe8f0", len: 0.66, h: 0.24 } },
  { id: "trench_viperfish", name: "Viperfish", location: "trench", times: ["day", "night"], baseValue: 110, sizeCm: [20, 35], behavior: "frenzy", assetId: "fish_viperfish", flavor: "Its fangs are too big for its mouth, which it finds embarrassing.", art: { color: "#3e4e62", back: "#1a2430", belly: "#7a8aa0", fin: "#2e3c4e", shape: "slim", pattern: "glow", patternColor: "#7ad8ff", mouth: "fangs", len: 0.8, h: 0.2 } },
  { id: "trench_anglerfish", name: "Anglerfish", location: "trench", times: ["dawn", "dusk", "night"], baseValue: 170, sizeCm: [20, 60], behavior: "heavy", assetId: "fish_anglerfish", flavor: "Always brings a lamp to the party.", art: { color: "#7a6a58", back: "#3e3228", belly: "#b0a290", fin: "#54463a", shape: "angler", pattern: "mottle", patternColor: "#4a3c30", mouth: "angler", patternGlow: "#ffe38a", len: 0.7, h: 0.46 } },
  { id: "trench_coelacanth", name: "Coelacanth", location: "trench", times: ["day", "dusk"], baseValue: 220, sizeCm: [100, 200], behavior: "heavy", assetId: "fish_coelacanth", flavor: "Older than the dinosaurs and not in a hurry.", art: { color: "#40628f", back: "#1e3456", belly: "#7090b8", fin: "#2e5080", shape: "bass", pattern: "lightspots", patternColor: "#e8eef8", len: 0.92, h: 0.32 } },

  { id: "trench_firefly_squid", name: "Firefly Squid", location: "trench", times: ["dusk", "night"], baseValue: 210, sizeCm: [5, 10], behavior: "ink", special: true, weight: 0.104, assetId: "odd_firefly_squid", flavor: "Sparkles like a pocketful of stars.", art: { color: "#4262aa", back: "#2a3a78", belly: "#8aa0e0", fin: "#3a52a0", shape: "squid", pattern: "glow", patternColor: "#6ae4ff" } },
  { id: "trench_lantern_shark", name: "Lantern Shark", location: "trench", times: ["dawn", "night"], baseValue: 230, sizeCm: [20, 45], behavior: "darting", special: true, weight: 0.091, assetId: "odd_lantern_shark", flavor: "The smallest shark, glowing to fit in.", art: { color: "#40404e", back: "#22222e", belly: "#5a6a8a", fin: "#34343f", shape: "shark", pattern: "glow", patternColor: "#7ae0ff", mouth: "shark", iris: "#9ae8f0", len: 0.8, h: 0.24 } },
  { id: "trench_starlight_jelly", name: "Starlight Jelly", location: "trench", times: ["night"], baseValue: 280, sizeCm: [20, 50], behavior: "sting", special: true, weight: 0.078, assetId: "odd_starlight_jelly", flavor: "Blinks in slow constellations.", art: { color: "#6e5ebc", back: "#3a2e7a", belly: "#b8a8f0", fin: "#8a7ad8", shape: "jelly", pattern: "stars", patternColor: "#fff4a0" } },
  { id: "trench_lumen_eel", name: "Lumen Eel", location: "trench", times: ["night"], baseValue: 350, sizeCm: [60, 130], behavior: "jolt", special: true, weight: 0.065, assetId: "odd_lumen_eel", flavor: "Nobody knows where it plugs itself in.", art: { color: "#2e5060", back: "#14283a", belly: "#4a8aa0", fin: "#24485a", shape: "eel", pattern: "lateral", patternColor: "#9affe0", iris: "#bff8ea" } },
  { id: "trench_starfin_shark", name: "Starfin Shark", location: "trench", times: ["dusk", "night"], baseValue: 520, sizeCm: [180, 320], behavior: "frenzy", special: true, weight: 0.039, gear: { reel: 2 }, assetId: "odd_starfin_shark", flavor: "Its fins leave a trail of sparkles through the dark.", art: { color: "#2e3e70", back: "#182450", belly: "#c8d4f0", fin: "#5a6ac0", shape: "shark", pattern: "stars", patternColor: "#fff0a0", mouth: "shark", shine: true, len: 1, h: 0.27 } },
  { id: "trench_giant_squid", name: "Giant Squid", location: "trench", times: ["night"], baseValue: 580, sizeCm: [400, 1200], behavior: "tentacle", special: true, weight: 0.033, gear: { rod: 3, line: 3 }, assetId: "odd_giant_squid", flavor: "Has the biggest eyes in the ocean, all the better to see you.", art: { color: "#cc5e4c", back: "#8a3228", belly: "#f0b0a0", fin: "#b04a3c", shape: "squid", pattern: "spots", patternColor: "#8a3228", eyeR: 9 } },

  // Giants: only at the trawler's bow with the harpoon. A harpoon round (see HARPOON_GAME) comes before the reel fight.
  { id: "trench_narwhal", name: "Narwhal", location: "trench", times: ["dawn", "night"], baseValue: 520, sizeCm: [400, 550], behavior: "darting", giant: true, weight: 1, harpoon: { hits: 2, speed: 0.34, width: 0.13 }, assetId: "giant_narwhal", flavor: "The unicorn of the sea, and it knows it.", art: { color: "#a8b4bc", back: "#5e6c78", belly: "#eef0ee", fin: "#6e7c88", shape: "whale", pattern: "mottle", patternColor: "#4a5864", tusk: true, len: 0.8 } },
  { id: "trench_orca", name: "Orca", location: "trench", times: ["day", "dusk", "night"], baseValue: 650, sizeCm: [550, 900], behavior: "frenzy", giant: true, weight: 0.8, harpoon: { hits: 3, speed: 0.38, width: 0.13 }, assetId: "giant_orca", flavor: "Travels with family and always says hello.", art: { color: "#24262c", back: "#15161a", belly: "#f4f4f0", fin: "#1e2026", shape: "whale", pattern: "none", patternColor: "#f4f4f0", orca: true, dorsal: "tall", len: 0.82 } },
  { id: "trench_humpback", name: "Humpback Whale", location: "trench", times: ["dawn", "day", "dusk"], baseValue: 760, sizeCm: [1200, 1600], behavior: "heavy", giant: true, weight: 0.7, harpoon: { hits: 3, speed: 0.3, width: 0.16 }, assetId: "giant_humpback", flavor: "Sings long songs about the ones that got away.", art: { color: "#4e5a6e", back: "#2e3848", belly: "#e6e8ea", fin: "#3e4a5e", shape: "whale", pattern: "spots", patternColor: "#dfe4ea", grooves: true, flippers: true, len: 1 } },
  { id: "trench_sperm_whale", name: "Sperm Whale", location: "trench", times: ["dusk", "night"], baseValue: 900, sizeCm: [1100, 1800], behavior: "heavy", giant: true, weight: 0.5, harpoon: { hits: 3, speed: 0.36, width: 0.14 }, assetId: "giant_sperm_whale", flavor: "Dives deeper than anyone, just to think.", art: { color: "#5e5a5c", back: "#3a3638", belly: "#8a8486", fin: "#4a4648", shape: "whale", pattern: "mottle", patternColor: "#7a7476", boxHead: true, len: 1 } },

  // Weather-only species: they join their location's table only while the listed weather lasts.
  { id: "lake_tench", name: "Tench", location: "lake", times: ["dawn", "day", "dusk"], weather: ["rain"], baseValue: 30, sizeCm: [25, 55], behavior: "heavy", assetId: "fish_tench", flavor: "Wears velvet and never hurries — and loves a rainy day.", art: { color: "#71893c", back: "#3f5524", belly: "#dcc86c", fin: "#4b5f2b", shape: "carp", pattern: "scales", patternColor: "#3b4b21", mouth: "barbels", len: 0.8, h: 0.34 } },
  { id: "river_grayling", name: "Grayling", location: "river", times: ["dawn", "day", "dusk"], weather: ["fog"], baseValue: 38, sizeCm: [25, 50], behavior: "darting", assetId: "fish_grayling", flavor: "Carries a flag on its back like a tiny sailboat.", art: { color: "#a0a8b4", back: "#4e5a6c", belly: "#ecebe4", fin: "#8e5f94", shape: "trout", pattern: "spots", patternColor: "#2e3440", sail: true, len: 0.84, h: 0.28 } },
  { id: "sea_garfish", name: "Garfish", location: "sea", times: ["day", "dusk", "night"], weather: ["storm"], baseValue: 44, sizeCm: [50, 90], behavior: "zigzag", assetId: "fish_garfish", flavor: "A green-boned needle that rides the storm waves.", art: { color: "#74b2a0", back: "#2e6a78", belly: "#eef2e8", fin: "#4a8a8a", shape: "pike", pattern: "lateral", patternColor: "#1e4a58", mouth: "duck", len: 1, h: 0.16 } },
  { id: "offshore_moonfish", name: "Moonfish", location: "offshore", times: ["dawn", "day", "dusk"], weather: ["fog"], baseValue: 130, sizeCm: [80, 150], behavior: "heavy", assetId: "fish_moonfish", flavor: "Round as the moon, warm-blooded and proud of it.", art: { color: "#dc6470", back: "#8a3052", belly: "#f2b4a8", fin: "#e84a3a", shape: "deep", pattern: "lightspots", patternColor: "#f6ecdc", len: 0.8, h: 0.5 } },
  { id: "offshore_great_white", name: "Great White", location: "offshore", times: ["day", "dusk", "night"], weather: ["storm"], baseValue: 150, sizeCm: [250, 450], behavior: "frenzy", assetId: "fish_great_white", flavor: "A big softie with a big smile, out only when the storm rolls in.", art: { color: "#8c98a4", back: "#4e5a66", belly: "#f2f2ee", fin: "#5a6672", shape: "shark", pattern: "none", patternColor: "#4e5a66", mouth: "grin", len: 1, h: 0.3 } },
  // Legendary hunts: one named giant per location. They never appear in the normal fish tables; they can only bite
  // in their precise time window (bucket + share of that bucket) at their spot, with the listed minimum gear tiers.
  // Their baseValue is the final price basis (no rarity multiplier).
  { id: "legend_old_whiskers", name: "Old Whiskers", location: "lake", times: ["night"], baseValue: 320, sizeCm: [110, 160], behavior: "boss", legendary: true, assetId: "fish_old_whiskers", flavor: "The grandfather of every catfish in the lake.",
    hunt: { bucket: "night", window: [0.5, 1], gear: { rod: 2, line: 2 }, chance: 0.25, clue: "Late in the night, when the lamps burn low, something ancient stirs under the lake pier." },
    art: { color: "#4a5a3e", back: "#2a3522", belly: "#cdbb8e", fin: "#34422c", shape: "catfish", pattern: "mottle", patternColor: "#7a8a52", mouth: "barbels", shine: true, len: 1, h: 0.3 } },
  { id: "legend_silver_ghost", name: "Silver Ghost", location: "river", times: ["dawn"], baseValue: 380, sizeCm: [80, 120], behavior: "boss", legendary: true, assetId: "fish_silver_ghost", flavor: "Seen by many, landed by none.",
    hunt: { bucket: "dawn", window: [0, 0.5], gear: { reel: 2, line: 1 }, chance: 0.25, clue: "In the first mist of dawn, a pale shape races upstream. Only a quick reel keeps up with it." },
    art: { color: "#e2eaf0", back: "#9fb2c6", belly: "#ffffff", fin: "#c6d4e0", shape: "salmon", pattern: "spots", patternColor: "#8aa0b8", stripe: "#c8e4ff", shine: true, len: 0.95, h: 0.3 } },
  { id: "legend_coral_queen", name: "Coral Queen", location: "sea", times: ["dusk"], baseValue: 450, sizeCm: [55, 85], behavior: "boss", legendary: true, assetId: "fish_coral_queen", flavor: "The reef bows as she passes.",
    hunt: { bucket: "dusk", window: [0.25, 0.75], gear: { rod: 2, line: 2 }, chance: 0.25, clue: "When the sunset paints the jetty, the queen of the reef rises for a look." },
    art: { color: "#ff7d7a", back: "#d8405a", belly: "#ffdcc4", fin: "#ffb040", shape: "deep", pattern: "stripe2", patternColor: "#ffe08a", spiny: true, shine: true, len: 0.72, h: 0.46 } },
  { id: "legend_abyssal_king", name: "Abyssal King", location: "offshore", times: ["night"], baseValue: 900, sizeCm: [260, 420], behavior: "boss", legendary: true, assetId: "fish_abyssal_king", flavor: "The deep's own crown, sword and sail.",
    hunt: { bucket: "night", window: [0, 0.5], gear: { rod: 3, reel: 3, line: 3 }, chance: 0.25, clue: "Far offshore, early in the night, the deep answers only to the finest rod, reel and line." },
    art: { color: "#4a3d86", back: "#1e1848", belly: "#9a8ae0", fin: "#7a5cff", shape: "billfish", pattern: "vbars", patternColor: "#bba6ff", mouth: "sword", sail: true, shine: true, len: 1, h: 0.3 } },

  // Mythics: legendary hunts with extra conditions on top of the time window and gear — the moon (full / new, from the
  // day counter), a completed location, a number of species found, a learned skill or a player level.
  { id: "myth_crystal_koi", name: "Crystal Koi", location: "lake", times: ["dawn"], baseValue: 600, sizeCm: [40, 70], behavior: "boss", legendary: true, mythic: true, assetId: "myth_crystal_koi", flavor: "Some say it is made of frozen dawn light.",
    hunt: { bucket: "dawn", window: [0, 0.4], gear: {}, complete: "lake", chance: 0.2, clue: "Find every fish the lake has to offer, and at first light a koi of glass may come to see who you are." },
    art: { color: "#d8f0f4", back: "#9ad0e0", belly: "#ffffff", fin: "#f4c0dc", shape: "carp", pattern: "crystal", patternColor: "#ffffff", iris: "#f08ac0", shine: true, len: 0.8, h: 0.38 } },
  { id: "myth_two_headed_trout", name: "Two-Headed Trout", location: "river", times: ["day"], baseValue: 520, sizeCm: [35, 60], behavior: "boss", legendary: true, mythic: true, assetId: "myth_two_headed_trout", flavor: "Argues with itself about which way to swim.",
    hunt: { bucket: "day", window: [0.4, 0.6], gear: { rod: 1 }, complete: "river", chance: 0.2, clue: "At high noon, when every river fish knows your name, a trout turns up that can't make up its minds." },
    art: { color: "#9aae78", back: "#5c6e46", belly: "#f4e4cc", fin: "#9a9068", shape: "trout", pattern: "spots", patternColor: "#3a3a2a", stripe: "#f08a9a", twoHead: true, shine: true, len: 0.84, h: 0.3 } },
  { id: "myth_moonglow", name: "Moonglow Fish", location: "sea", times: ["night"], baseValue: 800, sizeCm: [30, 55], behavior: "boss", legendary: true, mythic: true, assetId: "myth_moonglow", flavor: "Only rises when the full moon lays a path on the water.",
    hunt: { bucket: "night", window: [0.2, 0.8], gear: { line: 2 }, moon: "full", chance: 0.25, clue: "Under a full moon, from the shore, something glows back at the sky." },
    art: { color: "#e8eef8", back: "#a8b8d8", belly: "#fffbe8", fin: "#d4dcf0", shape: "deep", pattern: "moon", patternColor: "#ffe48a", iris: "#8ab0ff", shine: true, len: 0.66, h: 0.44 } },
  { id: "myth_island_turtle", name: "Island Turtle", location: "sea", times: ["day"], baseValue: 1000, sizeCm: [150, 260], behavior: "boss", legendary: true, mythic: true, assetId: "myth_island_turtle", flavor: "A tiny island with a palm tree, and a turtle underneath.",
    hunt: { bucket: "day", window: [0.3, 0.7], gear: { rod: 2 }, minSpecies: 30, chance: 0.2, clue: "Old sailors say one of the little islands swims. It only visits anglers who have seen thirty kinds of creature." },
    art: { color: "#8a9a5a", back: "#566a3a", belly: "#efe2b0", fin: "#a8b880", shape: "turtle", pattern: "plates", patternColor: "#e8d8a0", island: true, shine: true } },
  { id: "myth_ghost_ship_fish", name: "Ghost-Ship Fish", location: "offshore", times: ["night"], baseValue: 900, sizeCm: [90, 160], behavior: "boss", legendary: true, mythic: true, assetId: "myth_ghost_ship_fish", flavor: "On moonless nights, you can hear it creak.",
    hunt: { bucket: "night", window: [0.5, 1], gear: { reel: 2 }, moon: "new", chance: 0.25, clue: "Late on a moonless night, far offshore, a sail that isn't a sail cuts through the dark." },
    art: { color: "#b0d4cc", back: "#5a8a84", belly: "#eaf4f0", fin: "#dce8e0", shape: "salmon", pattern: "planks", patternColor: "#4a6a64", sail: true, iris: "#bff0e0", shine: true, len: 0.9, h: 0.3 } },
  { id: "myth_sea_serpent", name: "Sea Serpent", location: "offshore", times: ["dusk"], baseValue: 1200, sizeCm: [400, 700], behavior: "boss", legendary: true, mythic: true, assetId: "myth_sea_serpent", flavor: "Friendly, enormous and extremely ticklish.",
    hunt: { bucket: "dusk", window: [0.5, 1], gear: { reel: 3 }, complete: "offshore", chance: 0.2, clue: "Once you know every fish of the open sea, watch the waves at late dusk: some of them have a face." },
    art: { color: "#3e9070", back: "#1e5a44", belly: "#ece4a4", fin: "#ec7c4a", shape: "serpent", pattern: "spots", patternColor: "#1e5a44", iris: "#ffd04a", shine: true } },
  { id: "myth_aurora_eel", name: "Aurora Eel", location: "trench", times: ["dawn"], baseValue: 750, sizeCm: [80, 140], behavior: "jolt", legendary: true, mythic: true, assetId: "myth_aurora_eel", flavor: "Brings the northern lights down to the deep.",
    hunt: { bucket: "dawn", window: [0, 0.35], gear: {}, skill: "twilight_angler", chance: 0.25, clue: "Twilight anglers tell of dawn in the trench, when the deep lights up green and violet." },
    art: { color: "#4ac8a0", back: "#1e6a7a", belly: "#b8f0e0", fin: "#8a6ae0", shape: "eel", pattern: "glow", patternColor: "#eaffff", aurora: ["#5ae0a0", "#2ab0c0", "#5a70e0", "#a060e0"], iris: "#eaffff", shine: true, thick: 12 } },
  { id: "myth_kraken", name: "Kraken", location: "trench", times: ["night"], baseValue: 2000, sizeCm: [800, 1500], behavior: "kraken", legendary: true, mythic: true, harpoon: { hits: 3, speed: 0.4, width: 0.15 }, assetId: "myth_kraken", flavor: "Old as the sea, curious as a kitten and very, very big.",
    hunt: { bucket: "night", window: [0.4, 1], gear: { rod: 3, reel: 3, line: 3 }, complete: "trench", level: 12, chance: 0.15, clue: "The trench keeps its oldest secret for a seasoned angler who knows all its fish and carries the finest rod, reel and line." },
    art: { color: "#9a4478", back: "#4a1a4a", belly: "#f0b0c8", fin: "#c05a8a", limb: "#8a3a6c", shape: "kraken", pattern: "spots", patternColor: "#5a1a50", crown: "#e8dcc0", eyeR: 7, iris: "#ffd04a", shine: true } },
  // The most legendary find: only on a stormy night at the trench, for a seasoned harpooneer who has met every giant.
  { id: "myth_moby_dick", name: "Moby Dick", location: "trench", times: ["night"], baseValue: 3000, sizeCm: [1800, 2600], behavior: "boss", legendary: true, mythic: true, harpoon: { hits: 4, speed: 0.4, width: 0.12 }, assetId: "myth_moby_dick", flavor: "The great white whale. Sailors tell tales of it; it tells tales of them.",
    hunt: { bucket: "night", window: [0, 1], gear: { rod: 3, reel: 3, line: 3 }, weather: "storm", giants: true, level: 15, chance: 0.2, clue: "On a stormy night at the trench, a white whale rises for the harpooneer who has met every giant of the deep." },
    art: { color: "#eeece4", back: "#c8c4b8", belly: "#fbfaf4", fin: "#d8d4c8", shape: "whale", pattern: "scars", patternColor: "#a8a296", boxHead: true, iris: "#6a8ab0", shine: true, len: 1 } },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map(f => [f.id, f]));
export const LEGENDARIES = FISH.filter(f => f.legendary);

// Collection kinds: regular fish, odd catches (special creatures), giants (harpoon), legendary hunts and mythics.
export const KINDS = ["fish", "odd", "giant", "legend", "mythic"];
export const KIND_LABELS = { fish: "Fish", odd: "Odd catches", giant: "Giants", legend: "Legends", mythic: "Myths" };
export const kindOf = f => (f.mythic ? "mythic" : f.legendary ? "legend" : f.giant ? "giant" : f.special ? "odd" : "fish");
/** Species in collection order: by location, then kind. */
/** Regular fish of a location (what the "Keeper" milestones and some mythics ask for). */
export const regularAt = loc => FISH.filter(f => f.location === loc && kindOf(f) === "fish");
// Collection milestones: purely cosmetic rewards (no gameplay bonus), claimed at the collection board once reached.
const KEEPER_NAMES = { lake: "Lake Keeper", river: "River Keeper", sea: "Shore Keeper", offshore: "Offshore Keeper", trench: "Trench Keeper" };
const PENNANT_COLORS = { lake: "#5f8f4e", river: "#4f86c6", sea: "#e0a13a", offshore: "#3f6e8c", trench: "#5a4a9a" };
export const MILESTONES = [
  ...LOCATIONS.map(loc => ({ id: `keeper_${loc}`, name: KEEPER_NAMES[loc], icon: "fish", need: { regular: loc }, reward: `${LOCATION_LABELS[loc]} pennant at home`, pennant: PENNANT_COLORS[loc] })),
  { id: "harpooneer", name: "Harpooneer", icon: "harpoon", need: { kinds: ["giant"] }, reward: "A carved whale over the fireplace", carvedWhale: true },
  { id: "curiosity", name: "Curiosity Cabinet", icon: "gem", need: { kinds: ["odd"] }, reward: "A golden bobber", goldenBobber: true },
  { id: "myth_hunter", name: "Myth Hunter", icon: "moon", need: { kinds: ["legend", "mythic"] }, reward: "A golden band on your hat", goldenBand: true },
  { id: "master", name: "Master of the Cove", icon: "trophy", need: { all: true }, reward: "A golden fish weathervane on your roof", weathervane: true },
];
export const COLLECTION = [...FISH].sort((a, b) => LOCATIONS.indexOf(a.location) - LOCATIONS.indexOf(b.location) || KINDS.indexOf(kindOf(a)) - KINDS.indexOf(kindOf(b)));

export const RARITIES = ["common", "rare", "legendary"];
export const RARITY_LABELS = { common: "Common", rare: "Rare", legendary: "Legendary" };
export const RARITY_MULTIPLIER = { common: 1.0, rare: 2.5, legendary: 6.0 };
export const RARITY_RANK = { common: 0, rare: 1, legendary: 2 };

// Percent weights per access type.
export const RARITY_WEIGHTS = {
  lake: { common: 88, rare: 11, legendary: 1 },
  river: { common: 86, rare: 12, legendary: 2 },
  sea: { common: 83, rare: 14, legendary: 3 },
  offshore: { common: 78, rare: 18, legendary: 4 },
  trench: { common: 74, rare: 21, legendary: 5 },
};

// Rarer fish fight longer and burst harder (not just faster everywhere).
export const RARITY_FIGHT = {
  common: { progressGain: 1.0, burstStrength: 1.0, burstEvery: 1.0 },
  rare: { progressGain: 0.82, burstStrength: 1.25, burstEvery: 0.8 },
  legendary: { progressGain: 0.66, burstStrength: 1.5, burstEvery: 0.65 },
};

// Behavior archetypes for the catch minigame fish lane (lane units are 0..1 per second).
export const BEHAVIORS = {
  calm: { speed: 0.22, retarget: [1.4, 2.4], jump: 0.25, burstSpeed: 0.45, burstTime: [0.8, 1.2], normalTime: [3.0, 4.5], tensionSpike: 1.0 },
  darting: { speed: 0.2, retarget: [0.9, 1.6], jump: 0.45, burstSpeed: 1.1, burstTime: [0.35, 0.6], normalTime: [1.6, 2.6], tensionSpike: 1.15 },
  zigzag: { speed: 0.4, retarget: [0.35, 0.6], jump: 0.3, burstSpeed: 0.7, burstTime: [0.8, 1.2], normalTime: [2.2, 3.2], tensionSpike: 1.1 },
  heavy: { speed: 0.16, retarget: [1.4, 2.2], jump: 0.25, burstSpeed: 0.4, burstTime: [1.0, 1.6], normalTime: [2.4, 3.4], tensionSpike: 2.1 },
  frenzy: { speed: 0.18, retarget: [1.2, 2.0], jump: 0.3, burstSpeed: 1.0, burstTime: [1.2, 1.8], normalTime: [2.2, 3.0], tensionSpike: 1.4 },
  boss: { speed: 0.26, retarget: [0.6, 1.2], jump: 0.4, burstSpeed: 0.95, burstTime: [1.0, 1.6], normalTime: [1.8, 2.6], tensionSpike: 1.5 },
  // Special creatures: movement like the others plus one extra rule (mech), tuned in MECHANICS.
  ink: { speed: 0.24, retarget: [0.8, 1.4], jump: 0.4, burstSpeed: 1.0, burstTime: [0.6, 1.0], normalTime: [2.0, 3.0], tensionSpike: 1.2, mech: "ink" },
  sting: { speed: 0.12, retarget: [1.6, 2.6], jump: 0.22, burstSpeed: 0.32, burstTime: [0.8, 1.2], normalTime: [3.0, 4.0], tensionSpike: 1.0, mech: "sting" },
  tentacle: { speed: 0.18, retarget: [1.0, 1.8], jump: 0.3, burstSpeed: 0.6, burstTime: [1.0, 1.4], normalTime: [2.2, 3.2], tensionSpike: 1.5, mech: "tentacle" },
  jolt: { speed: 0.22, retarget: [0.7, 1.3], jump: 0.35, burstSpeed: 0.8, burstTime: [0.6, 1.0], normalTime: [2.0, 3.0], tensionSpike: 1.2, mech: "jolt" },
  kraken: { speed: 0.24, retarget: [0.7, 1.3], jump: 0.4, burstSpeed: 0.9, burstTime: [1.0, 1.5], normalTime: [1.8, 2.6], tensionSpike: 1.6, mech: "kraken" },
};

// Extra minigame rules:
// ink — every burst starts with an ink cloud that hides the fish marker (the zone still glows when it's inside);
// sting — the jelly glows now and then; while it glows, having it inside the zone adds tension even when not reeling;
// tentacle — every burst starts with a tentacle dragging the zone away from the creature;
// jolt — the eel stops and charges (crackle), then zaps: reeling during the zap adds a chunk of tension;
// kraken — round 1 tentacles, round 2 ink, round 3 both (rounds split by the boss rage thresholds).
export const MECHANICS = {
  ink: { time: 1.2 },
  sting: { every: [2.4, 3.6], glow: 1.2, tension: 34 },
  tentacle: { time: 1.1, pull: 0.32 },
  jolt: { every: [3.0, 4.5], charge: 0.9, zap: 0.35, tension: 0.3 },
  kraken: [["tentacle"], ["ink"], ["tentacle", "ink"]],
};

// Legendary boss fights: slower progress (about twice as long) and an enraged burst at each third of the way.
// Odd catches fight a little longer than regular fish, and their rarity roll (and the giants') tops out at Rare.
export const SPECIAL_MAX_RARITY = "rare";
// XP for legends and myths uses their baseValue up to this cap (the four legendary hunts sit at or below it).
export const LEGEND_XP_VALUE_CAP = 900;
export const SPECIAL_FIGHT = { progressGain: 0.8 };
export const BOSS_FIGHT = { startProgress: 0.15, progressGain: 0.6, rageAt: [0.33, 0.66], rageTime: 2.6, rageSpeed: 1.35, rageTension: 1.3 };

export const EXHAUSTED = { speedMult: 0.55, progressGainMult: 1.2, tensionGrowthMult: 0.8, time: [1.6, 2.4] };

export const HOOK = { perfectMs: 250, perfectProgressBonus: 0.10, perfectTensionReduction: 0.10 };
export const BITE_WAIT_MS = [2000, 5000];

export const MINIGAME = {
  startProgress: 0.25,
  startTensionFrac: 0.2, // of tension limit
  progressGain: 0.23, // per second while fish inside zone
  progressLoss: 0.1, // per second while outside
  tensionGrowth: 38, // per second while holding
  tensionRecovery: 30, // per second while released
  zoneRise: 0.5, // target lane units/s while holding
  zoneFall: 0.4, // target lane units/s while released
  zoneEase: 14, // exponential easing rate toward target
};

// Gear tiers. Index 0 is free starting gear.
export const GEAR = {
  rod: [
    { id: "rod_starter", name: "Starter Rod", price: 0, zoneWidth: 0.14 },
    { id: "rod_fiberglass", name: "Fiberglass Rod", price: 120, zoneWidth: 0.17 },
    { id: "rod_carbon", name: "Carbon Rod", price: 350, zoneWidth: 0.20 },
    { id: "rod_master", name: "Master Rod", price: 800, zoneWidth: 0.23 },
  ],
  reel: [
    { id: "reel_starter", name: "Starter Reel", price: 0, speed: 1.0, recovery: 1.0 },
    { id: "reel_smooth", name: "Smooth Reel", price: 100, speed: 1.10, recovery: 1.10 },
    { id: "reel_quick", name: "Quick Reel", price: 300, speed: 1.20, recovery: 1.20 },
    { id: "reel_pro", name: "Pro Reel", price: 700, speed: 1.35, recovery: 1.35 },
  ],
  line: [
    { id: "line_starter", name: "Starter Line", price: 0, tensionLimit: 100 },
    { id: "line_strong", name: "Strong Line", price: 150, tensionLimit: 115 },
    { id: "line_braided", name: "Braided Line", price: 350, tensionLimit: 135 },
    { id: "line_heavy", name: "Heavy Line", price: 650, tensionLimit: 160 },
  ],
};

export const GEAR_SLOTS = ["rod", "reel", "line"];
export const GEAR_LABELS = { rod: "Rod", reel: "Reel", line: "Line" };

export function gearEffectText(slot, item) {
  switch (slot) {
    case "rod": return `Zone width ${Math.round(item.zoneWidth * 100)}%`;
    case "reel": return `Speed ${item.speed.toFixed(2)}x, recovery ${item.recovery.toFixed(2)}x`;
    case "line": return `Tension limit ${item.tensionLimit}`;
    default: return "";
  }
}

// Leveling: XP from catches; XP needed from level L to L+1 = 40 + 25 * (L - 1). One skill point per level gained.
export const LEVEL_CAP = 25;
export const RARITY_XP = { common: 1, rare: 2.5, legendary: 6 };
export const XP_FIRST_CATCH = 50;
export const XP_PERFECT_HOOK = 5;
export const RESPEC_FEE_PER_LEVEL = 25;

// Skill tree: 3 branches x 3 tiers. A tier opens once enough points are spent in its branch.
export const TIER_POINTS = [0, 3, 7];
export const SKILL_BRANCHES = [
  { id: "angler", name: "Angler", icon: "rod", color: "#b8683a", about: "The fight" },
  { id: "naturalist", name: "Naturalist", icon: "leaf", color: "#5f8f4e", about: "Finding fish" },
  { id: "merchant", name: "Merchant", icon: "coin", color: "#c9962a", about: "Money" },
];

const pctText = v => `${+(v * 100).toFixed(1)}%`;
// per: effect value per rank; text(rank) describes the total effect at that rank.
export const SKILLS = [
  { id: "steady_hands", branch: "angler", tier: 0, name: "Steady Hands", icon: "width", max: 3, per: 0.015, text: r => `+${pctText(r * 0.015)} catch zone width` },
  { id: "quick_reflexes", branch: "angler", tier: 0, name: "Quick Reflexes", icon: "timer", max: 3, per: 150, text: r => `+${r * 150} ms hook window` },
  { id: "iron_grip", branch: "angler", tier: 1, name: "Iron Grip", icon: "tension", max: 3, per: 0.08, text: r => `−${r * 8}% tension growth, +${r * 8}% tension recovery` },
  { id: "float_touch", branch: "angler", tier: 1, name: "Float Touch", icon: "smooth", max: 2, per: 0.12, text: r => `Zone movement ${r * 12}% smoother` },
  { id: "perfect_strike", branch: "angler", tier: 1, name: "Perfect Strike", icon: "star", max: 2, per: 75, text: r => `Perfect-hook window ${250 + r * 75} ms, +${10 + r * 5}% perfect head start` },
  { id: "second_wind", branch: "angler", tier: 2, name: "Second Wind", icon: "recovery", max: 1, per: 0.5, text: r => (r ? "Once per fight, a snapping line drops to 50% tension instead" : "No second chance when the line would snap") },

  { id: "fish_finder", branch: "naturalist", tier: 0, name: "Fish Finder", icon: "eye", max: 1, per: 1, text: r => (r ? "See which fish can bite at a spot right now" : "Fishing spots keep their secrets") },
  { id: "patience", branch: "naturalist", tier: 0, name: "Patience", icon: "wait", max: 3, per: 0.1, text: r => `−${r * 10}% bite wait` },
  { id: "fishing_journal", branch: "naturalist", tier: 0, name: "Fishing Journal", icon: "book", max: 3, per: 0.1, text: r => `+${r * 10}% XP` },
  { id: "keen_eye", branch: "naturalist", tier: 1, name: "Keen Eye", icon: "gem", max: 3, per: 0.1, text: r => `+${r * 10}% rare & legendary weighting` },
  { id: "tire_them_out", branch: "naturalist", tier: 1, name: "Tire Them Out", icon: "burst", max: 2, per: 0.08, text: r => `Fish bursts −${r * 8}%` },
  { id: "twilight_angler", branch: "naturalist", tier: 1, name: "Twilight Angler", icon: "moon", max: 1, per: 1, text: r => (r ? "At Dawn and Night: +15% rare weighting, +25% XP" : "Dawn and Night are like any other time") },
  { id: "fish_whisperer", branch: "naturalist", tier: 2, name: "Fish Whisperer", icon: "whisper", max: 1, per: 1, text: r => (r ? "See the biting fish's silhouette and rarity before you hook it" : "Bites are a surprise") },

  { id: "haggler", branch: "merchant", tier: 0, name: "Haggler", icon: "coin", max: 5, per: 0.05, text: r => `+${r * 5}% sell price` },
  { id: "extra_pockets", branch: "merchant", tier: 0, name: "Extra Pockets", icon: "bag", max: 3, per: 2, text: r => `+${r * 2} bag slots` },
  { id: "tall_tales", branch: "merchant", tier: 1, name: "Tall Tales", icon: "ruler", max: 2, per: 0.15, text: r => `Big fish worth up to +${r * 15}% (scales with size)` },
  { id: "fish_courier", branch: "merchant", tier: 1, name: "Fish Courier", icon: "crate", max: 1, per: 1, text: r => (r ? "Sell fish from your bag anywhere" : "Fish are sold at the shop only") },
  { id: "trophy_hunter", branch: "merchant", tier: 2, name: "Trophy Hunter", icon: "trophy", max: 1, per: 1, text: r => (r ? "Legendary fish +50%, +1% on all sales per mounted species" : "Trophies are just for show") },
];
export const SKILLS_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));
