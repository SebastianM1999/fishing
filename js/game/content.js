// Canonical v1 content data. Simulation code reads from here; never hard-code content elsewhere.

export const TIME_BUCKETS = ["dawn", "day", "dusk", "night"];
export const TIME_LABELS = { dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night" };
export const DAY_LENGTH_MS = 12 * 60 * 1000;
export const BUCKET_LENGTH_MS = DAY_LENGTH_MS / TIME_BUCKETS.length;

export const LOCATIONS = ["lake", "river", "sea", "offshore"];
export const LOCATION_LABELS = { lake: "Lake", river: "River", sea: "Sea Shore", offshore: "Offshore" };

export const STARTING_COINS = 30;
export const BOAT_PRICE = 1000;

/** @typedef {"calm"|"darting"|"zigzag"|"heavy"|"frenzy"} Behavior */

// art: procedural silhouette parameters for the wallboard / catch card (hue, body length/height, fin style)
export const FISH = [
  { id: "lake_bluegill", name: "Bluegill", location: "lake", times: ["dawn", "day"], baseValue: 8, sizeCm: [12, 24], behavior: "calm", assetId: "fish_bluegill", art: { color: "#5f8fb0", belly: "#e9b35a", len: 0.62, h: 0.42, fin: "round" } },
  { id: "lake_largemouth_bass", name: "Largemouth Bass", location: "lake", times: ["dawn", "day", "dusk"], baseValue: 12, sizeCm: [28, 48], behavior: "darting", assetId: "fish_largemouth_bass", art: { color: "#6f8a4a", belly: "#e3dcb0", len: 0.8, h: 0.34, fin: "spiky" } },
  { id: "lake_catfish", name: "Catfish", location: "lake", times: ["dusk", "night"], baseValue: 16, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_catfish", art: { color: "#6b6258", belly: "#cdbfa8", len: 0.9, h: 0.26, fin: "whisker" } },
  { id: "lake_northern_pike", name: "Northern Pike", location: "lake", times: ["dawn", "day"], baseValue: 22, sizeCm: [45, 85], behavior: "zigzag", assetId: "fish_northern_pike", art: { color: "#7d9255", belly: "#eee6bf", len: 1, h: 0.2, fin: "long" } },
  { id: "lake_golden_carp", name: "Golden Carp", location: "lake", times: ["dawn", "dusk", "night"], baseValue: 35, sizeCm: [25, 60], behavior: "frenzy", assetId: "fish_golden_carp", art: { color: "#e0a832", belly: "#f7dc8c", len: 0.78, h: 0.36, fin: "round" } },

  { id: "river_trout", name: "Trout", location: "river", times: ["dawn", "day"], baseValue: 14, sizeCm: [25, 55], behavior: "darting", assetId: "fish_trout", art: { color: "#8a9a6a", belly: "#e7a3a0", len: 0.84, h: 0.28, fin: "round" } },
  { id: "river_salmon", name: "Salmon", location: "river", times: ["dawn", "dusk"], baseValue: 24, sizeCm: [40, 80], behavior: "zigzag", assetId: "fish_salmon", art: { color: "#c97a5a", belly: "#f1c2a4", len: 0.9, h: 0.3, fin: "fork" } },
  { id: "river_perch", name: "Perch", location: "river", times: ["day", "dusk"], baseValue: 10, sizeCm: [18, 35], behavior: "calm", assetId: "fish_perch", art: { color: "#b3a24a", belly: "#efe2a5", len: 0.66, h: 0.36, fin: "spiky" } },
  { id: "river_carp", name: "Carp", location: "river", times: ["day", "night"], baseValue: 18, sizeCm: [35, 75], behavior: "heavy", assetId: "fish_carp", art: { color: "#8f7a4c", belly: "#dcc996", len: 0.82, h: 0.38, fin: "round" } },
  { id: "river_sturgeon", name: "Sturgeon", location: "river", times: ["dusk", "night"], baseValue: 42, sizeCm: [60, 120], behavior: "heavy", assetId: "fish_sturgeon", art: { color: "#5d6770", belly: "#c9c7bd", len: 1, h: 0.22, fin: "shark" } },

  { id: "sea_sardine", name: "Sardine", location: "sea", times: ["dawn", "day"], baseValue: 10, sizeCm: [10, 22], behavior: "darting", assetId: "fish_sardine", art: { color: "#6e8fa8", belly: "#e8eef0", len: 0.7, h: 0.22, fin: "fork" } },
  { id: "sea_mackerel", name: "Mackerel", location: "sea", times: ["dawn", "dusk"], baseValue: 18, sizeCm: [25, 45], behavior: "zigzag", assetId: "fish_mackerel", art: { color: "#3f7f8a", belly: "#e3ecea", len: 0.84, h: 0.24, fin: "fork" } },
  { id: "sea_flounder", name: "Flounder", location: "sea", times: ["day", "dusk"], baseValue: 22, sizeCm: [25, 55], behavior: "calm", assetId: "fish_flounder", art: { color: "#9a8466", belly: "#d9c9a8", len: 0.7, h: 0.5, fin: "flat" } },
  { id: "sea_sea_bass", name: "Sea Bass", location: "sea", times: ["dusk", "night"], baseValue: 30, sizeCm: [35, 70], behavior: "heavy", assetId: "fish_sea_bass", art: { color: "#7b8c96", belly: "#e4e6e2", len: 0.86, h: 0.32, fin: "spiky" } },
  { id: "sea_red_mullet", name: "Red Mullet", location: "sea", times: ["night", "dawn"], baseValue: 34, sizeCm: [20, 40], behavior: "darting", assetId: "fish_red_mullet", art: { color: "#d0645a", belly: "#f3c9a8", len: 0.74, h: 0.3, fin: "whisker" } },

  { id: "offshore_tuna", name: "Tuna", location: "offshore", times: ["dawn", "day"], baseValue: 55, sizeCm: [70, 140], behavior: "heavy", assetId: "fish_tuna", art: { color: "#3c5c86", belly: "#d8dde2", len: 0.9, h: 0.4, fin: "fork" } },
  { id: "offshore_swordfish", name: "Swordfish", location: "offshore", times: ["night"], baseValue: 95, sizeCm: [100, 220], behavior: "frenzy", assetId: "fish_swordfish", art: { color: "#4b5d78", belly: "#c7cfd6", len: 1, h: 0.26, fin: "sword" } },
  { id: "offshore_marlin", name: "Marlin", location: "offshore", times: ["day", "dusk"], baseValue: 110, sizeCm: [120, 250], behavior: "zigzag", assetId: "fish_marlin", art: { color: "#2f5f93", belly: "#d4e0ea", len: 1, h: 0.3, fin: "sail" } },
  { id: "offshore_mahi_mahi", name: "Mahi-Mahi", location: "offshore", times: ["day", "dusk"], baseValue: 70, sizeCm: [60, 120], behavior: "darting", assetId: "fish_mahi_mahi", art: { color: "#4f9a62", belly: "#e7cf4c", len: 0.92, h: 0.34, fin: "long" } },
  { id: "offshore_blue_shark", name: "Blue Shark", location: "offshore", times: ["dusk", "night"], baseValue: 85, sizeCm: [90, 190], behavior: "frenzy", assetId: "fish_blue_shark", art: { color: "#4a6fa0", belly: "#e2e8ee", len: 1, h: 0.26, fin: "shark" } },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map(f => [f.id, f]));

export const RARITIES = ["common", "rare", "legendary"];
export const RARITY_LABELS = { common: "Common", rare: "Rare", legendary: "Legendary" };
export const RARITY_MULTIPLIER = { common: 1.0, rare: 2.5, legendary: 6.0 };

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
