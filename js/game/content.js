// Canonical v1 content data. Simulation code reads from here; never hard-code content elsewhere.

export const TIME_BUCKETS = ["dawn", "day", "dusk", "night"];
export const TIME_LABELS = { dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night" };
export const DAY_LENGTH_MS = 12 * 60 * 1000;
export const BUCKET_LENGTH_MS = DAY_LENGTH_MS / TIME_BUCKETS.length;

export const LOCATIONS = ["lake", "river", "sea", "offshore"];
export const LOCATION_LABELS = { lake: "Lake", river: "River", sea: "Sea Shore", offshore: "Offshore" };

export const STARTING_COINS = 30;
export const BOAT_PRICE = 1000;

// Construction barriers: areas that must be cleared with coins before they can be entered.
export const REGIONS = {
  river: { id: "river", name: "River bank", price: 250, sign: "River bank closed for repairs" },
  sea: { id: "sea", name: "Beach & docks", price: 750, sign: "Beach & docks under construction" },
};

// Fish bag tiers: sellable fish you can carry. First catches go to the wallboard and take no space.
export const BAGS = [
  { id: "bag_pouch", name: "Canvas Pouch", price: 0, slots: 8 },
  { id: "bag_basket", name: "Fishing Basket", price: 200, slots: 15 },
  { id: "bag_creel", name: "Big Creel", price: 600, slots: 30 },
];

// First catch of a species pays a wallboard bonus equal to this fraction of the specimen's value.
export const DISCOVERY_BONUS = 1.0;

/** @typedef {"calm"|"darting"|"zigzag"|"heavy"|"frenzy"} Behavior */

// art: illustration parameters for portraits (colors, body shape, markings, mouth/fin extras)
export const FISH = [
  { id: "lake_bluegill", name: "Bluegill", location: "lake", times: ["dawn", "day"], baseValue: 8, sizeCm: [12, 24], behavior: "calm", assetId: "fish_bluegill", art: { color: "#4f7fa6", back: "#2f5878", belly: "#f0b04a", fin: "#3d6688", shape: "deep", pattern: "bars", patternColor: "#2b4f6e", ear: "#1f2f45", len: 0.62, h: 0.44 } },
  { id: "lake_largemouth_bass", name: "Largemouth Bass", location: "lake", times: ["dawn", "day", "dusk"], baseValue: 12, sizeCm: [28, 48], behavior: "darting", assetId: "fish_largemouth_bass", art: { color: "#7c9650", back: "#4e6630", belly: "#ece5bd", fin: "#6f8446", shape: "bass", pattern: "band", patternColor: "#3e4f26", mouth: "big", len: 0.82, h: 0.34 } },
  { id: "lake_catfish", name: "Catfish", location: "lake", times: ["dusk", "night"], baseValue: 16, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_catfish", art: { color: "#6e655b", back: "#4a433c", belly: "#d8cbb3", fin: "#57504a", shape: "catfish", pattern: "mottle", patternColor: "#4f4740", mouth: "barbels", len: 0.92, h: 0.26 } },
  { id: "lake_northern_pike", name: "Northern Pike", location: "lake", times: ["dawn", "day"], baseValue: 22, sizeCm: [45, 85], behavior: "zigzag", assetId: "fish_northern_pike", art: { color: "#7f9656", back: "#4d6334", belly: "#efe8c4", fin: "#b56a3a", shape: "pike", pattern: "lightspots", patternColor: "#e7e2b0", mouth: "duck", len: 1, h: 0.2 } },
  { id: "lake_golden_carp", name: "Golden Carp", location: "lake", times: ["dawn", "dusk", "night"], baseValue: 35, sizeCm: [25, 60], behavior: "frenzy", assetId: "fish_golden_carp", art: { color: "#e6a92c", back: "#c9781c", belly: "#fbe29a", fin: "#e8893a", shape: "carp", pattern: "scales", patternColor: "#b8661a", mouth: "barbels", shine: true, len: 0.78, h: 0.38 } },

  { id: "river_trout", name: "Trout", location: "river", times: ["dawn", "day"], baseValue: 14, sizeCm: [25, 55], behavior: "darting", assetId: "fish_trout", art: { color: "#8d9d6b", back: "#5c6e46", belly: "#f2e0c8", fin: "#8c8a62", shape: "trout", pattern: "spots", patternColor: "#3a3a2a", stripe: "#e0848a", len: 0.84, h: 0.28 } },
  { id: "river_salmon", name: "Salmon", location: "river", times: ["dawn", "dusk"], baseValue: 24, sizeCm: [40, 80], behavior: "zigzag", assetId: "fish_salmon", art: { color: "#b8bfc4", back: "#5c7188", belly: "#f4eee6", fin: "#7a8898", shape: "salmon", pattern: "spots", patternColor: "#34404e", stripe: "#e9a78e", len: 0.9, h: 0.3 } },
  { id: "river_perch", name: "Perch", location: "river", times: ["day", "dusk"], baseValue: 10, sizeCm: [18, 35], behavior: "calm", assetId: "fish_perch", art: { color: "#b9ab4a", back: "#7b7a2e", belly: "#f2e8b0", fin: "#e0703e", shape: "deep", pattern: "bars", patternColor: "#4a4a1c", spiny: true, len: 0.66, h: 0.37 } },
  { id: "river_carp", name: "Carp", location: "river", times: ["day", "night"], baseValue: 18, sizeCm: [35, 75], behavior: "heavy", assetId: "fish_carp", art: { color: "#9a8250", back: "#6c5832", belly: "#e2cf9c", fin: "#8c6c40", shape: "carp", pattern: "scales", patternColor: "#6a522c", mouth: "barbels", len: 0.82, h: 0.38 } },
  { id: "river_sturgeon", name: "Sturgeon", location: "river", times: ["dusk", "night"], baseValue: 42, sizeCm: [60, 120], behavior: "heavy", assetId: "fish_sturgeon", art: { color: "#6a747c", back: "#434b52", belly: "#d6d3c8", fin: "#565f66", shape: "sturgeon", pattern: "scutes", patternColor: "#e8e4d6", mouth: "barbels", len: 1, h: 0.22 } },

  { id: "sea_sardine", name: "Sardine", location: "sea", times: ["dawn", "day"], baseValue: 10, sizeCm: [10, 22], behavior: "darting", assetId: "fish_sardine", art: { color: "#8fb2c8", back: "#3d6a8c", belly: "#f1f5f6", fin: "#9ab4c4", shape: "slim", pattern: "dots", patternColor: "#26435a", len: 0.72, h: 0.22 } },
  { id: "sea_mackerel", name: "Mackerel", location: "sea", times: ["dawn", "dusk"], baseValue: 18, sizeCm: [25, 45], behavior: "zigzag", assetId: "fish_mackerel", art: { color: "#8fc0bc", back: "#2f6f78", belly: "#eef4f1", fin: "#5c8e8a", shape: "tuna", pattern: "waves", patternColor: "#153f48", finlets: true, len: 0.84, h: 0.25 } },
  { id: "sea_flounder", name: "Flounder", location: "sea", times: ["day", "dusk"], baseValue: 22, sizeCm: [25, 55], behavior: "calm", assetId: "fish_flounder", art: { color: "#a18a68", back: "#7e6a4c", belly: "#d9c8a4", fin: "#8e7654", shape: "flat", pattern: "orangespots", patternColor: "#df7a3c", len: 0.72, h: 0.52 } },
  { id: "sea_sea_bass", name: "Sea Bass", location: "sea", times: ["dusk", "night"], baseValue: 30, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_sea_bass", art: { color: "#9aa8b0", back: "#56656e", belly: "#eef0ec", fin: "#6c7a82", shape: "bass", pattern: "lateral", patternColor: "#3e4a52", spiny: true, len: 0.86, h: 0.32 } },
  { id: "sea_red_mullet", name: "Red Mullet", location: "sea", times: ["night", "dawn"], baseValue: 34, sizeCm: [20, 40], behavior: "darting", assetId: "fish_red_mullet", art: { color: "#e07a62", back: "#b8483c", belly: "#f7d6b8", fin: "#e59a6a", shape: "mullet", pattern: "stripe2", patternColor: "#f2c85a", mouth: "barbels", len: 0.74, h: 0.3 } },

  { id: "offshore_tuna", name: "Tuna", location: "offshore", times: ["dawn", "day"], baseValue: 55, sizeCm: [70, 140], behavior: "heavy", assetId: "fish_tuna", art: { color: "#8ea4bc", back: "#1f3a62", belly: "#e8ecf0", fin: "#e8c23a", shape: "tuna", pattern: "none", patternColor: "#1f3a62", finlets: true, len: 0.9, h: 0.4 } },
  { id: "offshore_swordfish", name: "Swordfish", location: "offshore", times: ["night"], baseValue: 95, sizeCm: [100, 220], behavior: "frenzy", assetId: "fish_swordfish", art: { color: "#6f86a0", back: "#34465e", belly: "#d6dde4", fin: "#3e5068", shape: "billfish", pattern: "none", patternColor: "#34465e", mouth: "sword", len: 1, h: 0.26 } },
  { id: "offshore_marlin", name: "Marlin", location: "offshore", times: ["day", "dusk"], baseValue: 110, sizeCm: [120, 250], behavior: "zigzag", assetId: "fish_marlin", art: { color: "#5d8cbc", back: "#1d4a7e", belly: "#e2eaf2", fin: "#2d5f9a", shape: "billfish", pattern: "vbars", patternColor: "#a9d0f0", mouth: "spear", sail: true, len: 1, h: 0.3 } },
  { id: "offshore_mahi_mahi", name: "Mahi-Mahi", location: "offshore", times: ["day", "dusk"], baseValue: 70, sizeCm: [60, 120], behavior: "darting", assetId: "fish_mahi_mahi", art: { color: "#5aa86a", back: "#2e7a8a", belly: "#f0d84a", fin: "#3a8a9a", shape: "mahi", pattern: "dots", patternColor: "#2e6a8a", len: 0.92, h: 0.34 } },
  { id: "offshore_blue_shark", name: "Blue Shark", location: "offshore", times: ["dusk", "night"], baseValue: 85, sizeCm: [90, 190], behavior: "frenzy", assetId: "fish_blue_shark", art: { color: "#5f86ba", back: "#35599a", belly: "#eef2f6", fin: "#43669e", shape: "shark", pattern: "none", patternColor: "#35599a", mouth: "shark", len: 1, h: 0.26 } },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map(f => [f.id, f]));

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
};

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
  hook: [
    { id: "hook_standard", name: "Standard Hook", price: 0, hookWindowMs: 900, progressLossMult: 1.0 },
    { id: "hook_wide", name: "Wide Hook", price: 120, hookWindowMs: 1050, progressLossMult: 1.0 },
    { id: "hook_barbed", name: "Barbed Hook", price: 300, hookWindowMs: 1200, progressLossMult: 0.95 },
  ],
};

export const GEAR_SLOTS = ["rod", "reel", "line", "hook"];
export const GEAR_LABELS = { rod: "Rod", reel: "Reel", line: "Line", hook: "Hook", tackle: "Tackle" };

// Tackle: buy any, equip one.
export const TACKLE = [
  { id: "tackle_float", name: "Float", price: 150, effect: "Zone movement 12% smoother", zoneEaseMult: 1.12 },
  { id: "tackle_heavy_sinker", name: "Heavy Sinker", price: 200, effect: "Burst intensity -10%, zone speed -8%", burstMult: 0.9, zoneSpeedMult: 0.92 },
  { id: "tackle_spinner", name: "Spinner", price: 350, effect: "Rare/Legendary +25% weighting; bite wait +1s max", rareWeightMult: 1.25, biteWaitExtraMs: 1000 },
];
export const TACKLE_BY_ID = Object.fromEntries(TACKLE.map(t => [t.id, t]));

export function gearEffectText(slot, item) {
  switch (slot) {
    case "rod": return `Zone width ${Math.round(item.zoneWidth * 100)}%`;
    case "reel": return `Speed ${item.speed.toFixed(2)}x, recovery ${item.recovery.toFixed(2)}x`;
    case "line": return `Tension limit ${item.tensionLimit}`;
    case "hook": return `Hook window ${item.hookWindowMs} ms${item.progressLossMult < 1 ? ", 5% slower progress loss" : ""}`;
    default: return "";
  }
}
