// Canonical v1 content data. Simulation code reads from here; never hard-code content elsewhere.

export const TIME_BUCKETS = ["dawn", "day", "dusk", "night"];
export const TIME_LABELS = { dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night" };
export const DAY_LENGTH_MS = 12 * 60 * 1000;
export const BUCKET_LENGTH_MS = DAY_LENGTH_MS / TIME_BUCKETS.length;

export const LOCATIONS = ["lake", "river", "sea", "offshore", "trench"];
export const LOCATION_LABELS = { lake: "Lake", river: "River", sea: "Sea Shore", offshore: "Offshore", trench: "Deep Trench" };
// Spots that need more than getting there: the trench (a spot on the boat) needs a line long and strong enough.
export const LOCATION_GATES = { trench: { gear: { line: 2 }, hint: "Your line can't reach the trench floor. A Braided Line can." } };

export const STARTING_COINS = 10000; // TESTING: revert to 30 before release
// Catch streak: each fish landed in a row adds sell value to the fish caught during the streak.
export const STREAK = { perFish: 0.02, maxFish: 5 };
// Notice-board orders: new ones every in-game dawn; rewards beat the market price.
export const ORDERS = { perDay: 3, rewardMult: 1.6, xpBase: 10, xpPerCoin: 0.25 };
export const BOAT_PRICE = 1000;

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
  dawn: { clear: 50, rain: 15, fog: 35, storm: 0 },
  day: { clear: 60, rain: 25, fog: 5, storm: 10 },
  dusk: { clear: 50, rain: 25, fog: 10, storm: 15 },
  night: { clear: 45, rain: 25, fog: 15, storm: 15 },
};
export const WEATHER_STAY = 0.35;



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

  { id: "river_trout", name: "Trout", location: "river", times: ["dawn", "day"], baseValue: 14, sizeCm: [25, 55], behavior: "darting", assetId: "fish_trout", flavor: "Speckled like a freshly baked loaf.", art: { color: "#8d9d6b", back: "#5c6e46", belly: "#f2e0c8", fin: "#8c8a62", shape: "trout", pattern: "spots", patternColor: "#3a3a2a", stripe: "#e0848a", len: 0.84, h: 0.28 } },
  { id: "river_salmon", name: "Salmon", location: "river", times: ["dawn", "dusk"], baseValue: 24, sizeCm: [40, 80], behavior: "zigzag", assetId: "fish_salmon", flavor: "Swims home against every current.", art: { color: "#b8bfc4", back: "#5c7188", belly: "#f4eee6", fin: "#7a8898", shape: "salmon", pattern: "spots", patternColor: "#34404e", stripe: "#e9a78e", len: 0.9, h: 0.3 } },
  { id: "river_perch", name: "Perch", location: "river", times: ["day", "dusk"], baseValue: 10, sizeCm: [18, 35], behavior: "calm", assetId: "fish_perch", flavor: "Stripy, spiky and very sure of itself.", art: { color: "#b9ab4a", back: "#7b7a2e", belly: "#f2e8b0", fin: "#e0703e", shape: "deep", pattern: "bars", patternColor: "#4a4a1c", spiny: true, len: 0.66, h: 0.37 } },
  { id: "river_carp", name: "Carp", location: "river", times: ["day", "night"], baseValue: 18, sizeCm: [35, 75], behavior: "heavy", assetId: "fish_carp", flavor: "Grows old and wise in the slow bends.", art: { color: "#9a8250", back: "#6c5832", belly: "#e2cf9c", fin: "#8c6c40", shape: "carp", pattern: "scales", patternColor: "#6a522c", mouth: "barbels", len: 0.82, h: 0.38 } },
  { id: "river_sturgeon", name: "Sturgeon", location: "river", times: ["dusk", "night"], baseValue: 42, sizeCm: [60, 120], behavior: "heavy", assetId: "fish_sturgeon", flavor: "Wears armour older than the village.", art: { color: "#6a747c", back: "#434b52", belly: "#d6d3c8", fin: "#565f66", shape: "sturgeon", pattern: "scutes", patternColor: "#e8e4d6", mouth: "barbels", len: 1, h: 0.22 } },

  { id: "river_barbel", name: "Barbel", location: "river", times: ["day", "night"], baseValue: 20, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_barbel", flavor: "Snuffles the gravel for snacks with four whiskers.", art: { color: "#b0925e", back: "#6a5432", belly: "#efe0c0", fin: "#cc7a46", shape: "trout", pattern: "mottle", patternColor: "#7a6038", mouth: "barbels", len: 0.86, h: 0.26 } },
  { id: "river_char", name: "Arctic Char", location: "river", times: ["dawn", "dusk"], baseValue: 22, sizeCm: [25, 50], behavior: "zigzag", assetId: "fish_char", flavor: "Blushes bright red in cold water.", art: { color: "#86a088", back: "#46584a", belly: "#ec6038", fin: "#e0583a", shape: "salmon", pattern: "lightspots", patternColor: "#f6d2a8", len: 0.84, h: 0.28 } },

  { id: "sea_sardine", name: "Sardine", location: "sea", times: ["dawn", "day"], baseValue: 10, sizeCm: [10, 22], behavior: "darting", assetId: "fish_sardine", flavor: "Small, shiny and never alone.", art: { color: "#8fb2c8", back: "#3d6a8c", belly: "#f1f5f6", fin: "#9ab4c4", shape: "slim", pattern: "dots", patternColor: "#26435a", len: 0.72, h: 0.22 } },
  { id: "sea_mackerel", name: "Mackerel", location: "sea", times: ["dawn", "dusk"], baseValue: 18, sizeCm: [25, 45], behavior: "zigzag", assetId: "fish_mackerel", flavor: "Wears the waves on its back.", art: { color: "#8fc0bc", back: "#2f6f78", belly: "#eef4f1", fin: "#5c8e8a", shape: "tuna", pattern: "waves", patternColor: "#153f48", finlets: true, len: 0.84, h: 0.25 } },
  { id: "sea_flounder", name: "Flounder", location: "sea", times: ["day", "dusk"], baseValue: 22, sizeCm: [25, 55], behavior: "calm", assetId: "fish_flounder", flavor: "Both eyes on one side, all the better to see you.", art: { color: "#a18a68", back: "#7e6a4c", belly: "#d9c8a4", fin: "#8e7654", shape: "flat", pattern: "orangespots", patternColor: "#df7a3c", len: 0.72, h: 0.52 } },
  { id: "sea_sea_bass", name: "Sea Bass", location: "sea", times: ["dusk", "night"], baseValue: 30, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_sea_bass", flavor: "The silver knight of the jetty.", art: { color: "#9aa8b0", back: "#56656e", belly: "#eef0ec", fin: "#6c7a82", shape: "bass", pattern: "lateral", patternColor: "#3e4a52", spiny: true, len: 0.86, h: 0.32 } },
  { id: "sea_red_mullet", name: "Red Mullet", location: "sea", times: ["night", "dawn"], baseValue: 34, sizeCm: [20, 40], behavior: "darting", assetId: "fish_red_mullet", flavor: "Tastes the sand with its whiskers.", art: { color: "#e07a62", back: "#b8483c", belly: "#f7d6b8", fin: "#e59a6a", shape: "mullet", pattern: "stripe2", patternColor: "#f2c85a", mouth: "barbels", len: 0.74, h: 0.3 } },

  { id: "sea_herring", name: "Herring", location: "sea", times: ["dawn", "day"], baseValue: 9, sizeCm: [18, 30], behavior: "darting", assetId: "fish_herring", flavor: "Travels in gossiping crowds of thousands.", art: { color: "#b8c8d8", back: "#3a5a8a", belly: "#f4f6f8", fin: "#8aa0b8", shape: "slim", pattern: "none", patternColor: "#3a5a8a", len: 0.7, h: 0.22 } },
  { id: "sea_cod", name: "Cod", location: "sea", times: ["dusk", "night"], baseValue: 26, sizeCm: [40, 90], behavior: "heavy", assetId: "fish_cod", flavor: "A single chin whisker, worn with pride.", art: { color: "#b0a270", back: "#6a6040", belly: "#efe8d4", fin: "#8a7e56", shape: "carp", pattern: "mottle", patternColor: "#6a5a3a", mouth: "chin", len: 0.86, h: 0.32 } },
  { id: "sea_pufferfish", name: "Pufferfish", location: "sea", times: ["day"], baseValue: 40, sizeCm: [15, 30], behavior: "calm", assetId: "fish_pufferfish", flavor: "Puffs up when flattered.", art: { color: "#dcc474", back: "#8a7a3a", belly: "#f8f0d8", fin: "#c8a452", shape: "puffer", pattern: "spots", patternColor: "#5a4a22", spikes: true, len: 0.6, h: 0.5 } },

  { id: "offshore_tuna", name: "Tuna", location: "offshore", times: ["dawn", "day"], baseValue: 55, sizeCm: [70, 140], behavior: "heavy", assetId: "fish_tuna", flavor: "Built like a torpedo, sails like a dream.", art: { color: "#8ea4bc", back: "#1f3a62", belly: "#e8ecf0", fin: "#e8c23a", shape: "tuna", pattern: "none", patternColor: "#1f3a62", finlets: true, len: 0.9, h: 0.4 } },
  { id: "offshore_swordfish", name: "Swordfish", location: "offshore", times: ["night"], baseValue: 95, sizeCm: [100, 220], behavior: "frenzy", assetId: "fish_swordfish", flavor: "Brings its own sword to every fight.", art: { color: "#6f86a0", back: "#34465e", belly: "#d6dde4", fin: "#3e5068", shape: "billfish", pattern: "none", patternColor: "#34465e", mouth: "sword", len: 1, h: 0.26 } },
  { id: "offshore_marlin", name: "Marlin", location: "offshore", times: ["day", "dusk"], baseValue: 110, sizeCm: [120, 250], behavior: "zigzag", assetId: "fish_marlin", flavor: "Raises its sail and races the boat.", art: { color: "#5d8cbc", back: "#1d4a7e", belly: "#e2eaf2", fin: "#2d5f9a", shape: "billfish", pattern: "vbars", patternColor: "#a9d0f0", mouth: "spear", sail: true, len: 1, h: 0.3 } },
  { id: "offshore_mahi_mahi", name: "Mahi-Mahi", location: "offshore", times: ["day", "dusk"], baseValue: 70, sizeCm: [60, 120], behavior: "darting", assetId: "fish_mahi_mahi", flavor: "All the colours of a tropical sunset.", art: { color: "#5aa86a", back: "#2e7a8a", belly: "#f0d84a", fin: "#3a8a9a", shape: "mahi", pattern: "dots", patternColor: "#2e6a8a", len: 0.92, h: 0.34 } },
  { id: "offshore_blue_shark", name: "Blue Shark", location: "offshore", times: ["dusk", "night"], baseValue: 85, sizeCm: [90, 190], behavior: "frenzy", assetId: "fish_blue_shark", flavor: "Sleek, blue and a little shy.", art: { color: "#5f86ba", back: "#35599a", belly: "#eef2f6", fin: "#43669e", shape: "shark", pattern: "none", patternColor: "#35599a", mouth: "shark", len: 1, h: 0.26 } },

  { id: "offshore_barracuda", name: "Barracuda", location: "offshore", times: ["day", "dusk"], baseValue: 60, sizeCm: [60, 150], behavior: "darting", assetId: "fish_barracuda", flavor: "All teeth and good intentions.", art: { color: "#b8c4cc", back: "#4a5a6a", belly: "#f0f4f4", fin: "#6a7a8a", shape: "pike", pattern: "vbars", patternColor: "#3a4a5a", mouth: "fangs", len: 1, h: 0.2 } },
  { id: "offshore_flying_fish", name: "Flying Fish", location: "offshore", times: ["day"], baseValue: 45, sizeCm: [20, 40], behavior: "zigzag", assetId: "fish_flying_fish", flavor: "Has seen the boat from above.", art: { color: "#8ab4d8", back: "#2a5a8a", belly: "#f0f4f8", fin: "#a8c8e8", shape: "slim", pattern: "none", patternColor: "#2a5a8a", wings: true, len: 0.74, h: 0.22 } },

  { id: "trench_lanternfish", name: "Lanternfish", location: "trench", times: ["dawn", "day", "dusk", "night"], baseValue: 30, sizeCm: [5, 15], behavior: "darting", assetId: "fish_lanternfish", flavor: "Carries its own night-lights.", art: { color: "#5a6a8e", back: "#2a3450", belly: "#aab6d2", fin: "#4a5878", shape: "slim", pattern: "glow", patternColor: "#8ff0ff", iris: "#bfe8f0", len: 0.66, h: 0.24 } },
  { id: "trench_viperfish", name: "Viperfish", location: "trench", times: ["day", "night"], baseValue: 60, sizeCm: [20, 35], behavior: "frenzy", assetId: "fish_viperfish", flavor: "Its fangs are too big for its mouth, which it finds embarrassing.", art: { color: "#3e4e62", back: "#1a2430", belly: "#7a8aa0", fin: "#2e3c4e", shape: "slim", pattern: "glow", patternColor: "#7ad8ff", mouth: "fangs", len: 0.8, h: 0.2 } },
  { id: "trench_anglerfish", name: "Anglerfish", location: "trench", times: ["dawn", "dusk", "night"], baseValue: 95, sizeCm: [20, 60], behavior: "heavy", assetId: "fish_anglerfish", flavor: "Always brings a lamp to the party.", art: { color: "#7a6a58", back: "#3e3228", belly: "#b0a290", fin: "#54463a", shape: "angler", pattern: "mottle", patternColor: "#4a3c30", mouth: "angler", patternGlow: "#ffe38a", len: 0.7, h: 0.46 } },
  { id: "trench_coelacanth", name: "Coelacanth", location: "trench", times: ["day", "dusk"], baseValue: 120, sizeCm: [100, 200], behavior: "heavy", assetId: "fish_coelacanth", flavor: "Older than the dinosaurs and not in a hurry.", art: { color: "#40628f", back: "#1e3456", belly: "#7090b8", fin: "#2e5080", shape: "bass", pattern: "lightspots", patternColor: "#e8eef8", len: 0.92, h: 0.32 } },

  // Weather-only species: they join their location's table only while the listed weather lasts.
  { id: "lake_tench", name: "Tench", location: "lake", times: ["dawn", "day", "dusk"], weather: ["rain"], baseValue: 30, sizeCm: [25, 55], behavior: "heavy", assetId: "fish_tench", flavor: "Wears velvet and never hurries — and loves a rainy day.", art: { color: "#71893c", back: "#3f5524", belly: "#dcc86c", fin: "#4b5f2b", shape: "carp", pattern: "scales", patternColor: "#3b4b21", mouth: "barbels", len: 0.8, h: 0.34 } },
  { id: "river_grayling", name: "Grayling", location: "river", times: ["dawn", "day", "dusk"], weather: ["fog"], baseValue: 38, sizeCm: [25, 50], behavior: "darting", assetId: "fish_grayling", flavor: "Carries a flag on its back like a tiny sailboat.", art: { color: "#a0a8b4", back: "#4e5a6c", belly: "#ecebe4", fin: "#8e5f94", shape: "trout", pattern: "spots", patternColor: "#2e3440", sail: true, len: 0.84, h: 0.28 } },
  { id: "sea_garfish", name: "Garfish", location: "sea", times: ["day", "dusk", "night"], weather: ["storm"], baseValue: 44, sizeCm: [50, 90], behavior: "zigzag", assetId: "fish_garfish", flavor: "A green-boned needle that rides the storm waves.", art: { color: "#74b2a0", back: "#2e6a78", belly: "#eef2e8", fin: "#4a8a8a", shape: "pike", pattern: "lateral", patternColor: "#1e4a58", mouth: "duck", len: 1, h: 0.16 } },
  { id: "offshore_moonfish", name: "Moonfish", location: "offshore", times: ["dawn", "day", "dusk"], weather: ["fog"], baseValue: 130, sizeCm: [80, 150], behavior: "heavy", assetId: "fish_moonfish", flavor: "Round as the moon, warm-blooded and proud of it.", art: { color: "#dc6470", back: "#8a3052", belly: "#f2b4a8", fin: "#e84a3a", shape: "deep", pattern: "lightspots", patternColor: "#f6ecdc", len: 0.8, h: 0.5 } },
  { id: "offshore_great_white", name: "Great White", location: "offshore", times: ["day", "dusk", "night"], weather: ["storm"], baseValue: 150, sizeCm: [250, 450], behavior: "frenzy", assetId: "fish_great_white", flavor: "A big softie with a big smile, out only when the storm rolls in.", art: { color: "#8c98a4", back: "#4e5a66", belly: "#f2f2ee", fin: "#5a6672", shape: "shark", pattern: "none", patternColor: "#4e5a66", mouth: "shark", len: 1, h: 0.3 } },

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
];

export const FISH_BY_ID = Object.fromEntries(FISH.map(f => [f.id, f]));
export const LEGENDARIES = FISH.filter(f => f.legendary);

// Collection kinds: regular fish, odd catches (special creatures), legendary hunts and mythics.
export const KINDS = ["fish", "odd", "legend", "mythic"];
export const KIND_LABELS = { fish: "Fish", odd: "Odd catches", legend: "Legends", mythic: "Myths" };
export const kindOf = f => (f.mythic ? "mythic" : f.legendary ? "legend" : f.special ? "odd" : "fish");
/** Species in collection order: by location, then kind. */
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
};

// Legendary boss fights: slower progress (about twice as long) and an enraged burst at each third of the way.
export const BOSS_FIGHT = { progressGain: 0.6, rageAt: [0.33, 0.66], rageTime: 2.6, rageSpeed: 1.35, rageTension: 1.3 };

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
