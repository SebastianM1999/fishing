// Structured world map data + pure collision/interaction queries. Rendering builds meshes from this.

export const PLAYER_RADIUS = 0.45;
export const PLAYER_SPEED = 6.5; // world units per second

export const WORLD = {
  land: { minX: -38, maxX: 13.5, minZ: -26, maxZ: 16.5 },
  sandFromZ: 10.5,
  lake: { x: -24, z: 0, r: 7 },
  river: { minX: 13.5, maxX: 19.5 },
  spawn: { x: 0, z: -4 },

  // Wooden walkways that extend over water (walkable even over water).
  walkways: [
    { id: "lake_pier", minX: -20, maxX: -15.5, minZ: -0.9, maxZ: 0.9 },
    { id: "river_platform", minX: 11.4, maxX: 14.6, minZ: -7.2, maxZ: -4.8 },
    { id: "sea_jetty", minX: -9.1, maxX: -6.9, minZ: 15, maxZ: 18.6 },
    { id: "boat_dock", minX: 2.9, maxX: 5.1, minZ: 15, maxZ: 24 },
    // The old storm pier on the far (west) side of the beach: crooked, patched and half broken; the wrecked trawler lies at its end.
    { id: "old_pier", minX: -28.1, maxX: -25.9, minZ: 15, maxZ: 25.4, broken: true },
  ],

  buildings: [
    { id: "home", x: -8, z: -10, w: 7, d: 5, h: 3, wall: "#e9dcc3", roof: "#b8664a" },
    { id: "shop", x: 8, z: -10, w: 7, d: 5, h: 3, wall: "#efe2c8", roof: "#5f7f5a" },
  ],
  noticeboard: { x: 0, z: -11.2, w: 4.6, d: 0.6 },

  // Inside the home: a room far from the map, reached through the front door (like the offshore deck).
  home: { minX: -156, maxX: -144, minZ: -154.5, maxZ: -145.5, cx: -150, cz: -150, door: { x: -8, z: -7.5 } },
  // Furniture collision circles inside the home, relative to its centre: [x, z, radius].
  homeFurniture: [[-5.2, -0.4, 1.0], [4.3, 2.2, 1.2], [4.3, 3.4, 1.0], [-3.2, 2.2, 0.9], [-5.2, 3.6, 0.5], [5.3, -3.6, 0.5]],

  // Offshore fishing area: a small anchored boat deck far from the shore.
  offshore: { minX: -1.5, maxX: 1.5, minZ: 76.6, maxZ: 83.4, cx: 0, cz: 80 },
  boatMooring: { x: 6.6, z: 21.5 },
  // Deep Trench: the Ironhull Trawler's deck, far out in rough water. The wheelhouse at the stern is solid.
  trench: { minX: -1.75, maxX: 1.75, minZ: 255.4, maxZ: 265.2, cx: 0, cz: 260, cabin: { minX: -1.1, maxX: 1.1, minZ: 255.4, maxZ: 257.4 } },
  trawlerMooring: { x: -27, z: 31.3 },
  harpoonRack: { x: -28.3, z: 20 },

  trees: [
    [-34, -22, 1.2], [-29, -23, 1], [-22, -22.5, 1.3], [-15, -23, 1], [-8, -23.5, 1.1], [2, -23, 1.2], [9, -22.5, 1],
    [-35, -14, 1.1], [-33, -7, 1.3], [-35, 7, 1.2], [-32, 12, 1], [-26, 12.5, 1.1],
    [-15, -16, 1], [-14, 8.5, 0.9], [11, -18, 1.1], [11.5, 4, 0.9], [-3, -18, 0.9], [4, -17.5, 0.8],
    [-18, -9.5, 1], [-29, -12, 0.9],
  ],
  rocks: [[-17, 6, 0.7], [-30, 8.5, 0.9], [10.5, 9, 0.6], [-12, 12, 0.5], [7, 12.5, 0.6], [-20, -15, 0.7]],
  lamps: [[-3, -6.5], [3, -6.5], [-6.5, 13.5], [3, 14.3], [-25.4, 13.2]],
  // Construction barriers (see REGIONS in content.js). A locked zone cannot be entered.
  barriers: {
    river: { gate: { x: 10.2, z: -5 }, line: [[10.2, -26], [10.2, 10.2]], zone: (x, z) => x > 10.2 && z <= 10.2 },
    sea: { gate: { x: 4, z: 10.2 }, line: [[-38, 10.2], [13.5, 10.2]], zone: (x, z) => z > 10.2 },
  },
  // Props: [type, x, z, rotationY, scale]. Solid types get a collision circle (PROP_RADIUS).
  props: [
    ["bench", -3.2, -8.6, 0, 1], ["barrel", 11.6, -8.6, 0, 1], ["barrel", 12.3, -9.4, 0.4, 0.9], ["crate", 11.8, -11.2, 0.3, 1],
    ["crate", 4.3, -7.9, 0.1, 0.8], ["mailbox", -4.2, -7.2, 0, 1], ["well", -13.5, -4.2, 0, 1], ["stump", -22, -12, 0, 1],
    ["log", -27, -16, 0.6, 1], ["bush", -12.5, -7.8, 0, 1], ["bush", -3.8, -12.8, 0, 0.9], ["bush", 3.6, -12.8, 0, 0.9],
    ["bush", 4.7, -8.3, 0, 0.7], ["bush", -30, 3, 0, 1.1], ["bush", -16, -12.5, 0, 0.9], ["bush", 7.8, 1.5, 0, 1],
    ["bush", -4, 3, 0, 0.8], ["bush", 12.2, -14, 0, 0.9], ["bush", -36, -3, 0, 1.2], ["signpost", 1.6, -1.5, 0.3, 1],
    ["flowerbed", -6, -7, 0, 1], ["flowerbed", -10, -7, 0, 1], ["flowerbed", 6.5, 3.5, 0, 1], ["flowerbed", -2.5, 6.5, 0, 1],
    ["reeds", -17.6, 4.2, 0, 1], ["reeds", -19.5, -5.8, 0, 1], ["reeds", -29.5, -5, 0, 1], ["reeds", -30.4, 3.8, 0, 1],
    ["reeds", -23, 7.1, 0, 1], ["reeds", 13.1, -12, 0, 1], ["reeds", 13.2, 2, 0, 1],
    ["lily", -26, -2, 0, 1], ["lily", -22.6, 3.5, 0, 1], ["lily", -27.8, 2.2, 0, 1], ["lily", -21, -4, 0, 1],
    ["umbrella", -2.5, 13.5, 0, 1], ["towel", -2.5, 14.4, 0.2, 1], ["shell", -11, 15.4, 0, 1], ["shell", 8.5, 14.8, 0, 1],
    ["buoy", -3, 22, 0, 1], ["buoy", 9, 25, 0, 1], ["buoy", -31, 27, 0, 1],
    // The old pier's corner of the beach: salvage, driftwood and shells.
    ["crate", -24.6, 14.6, 0.5, 0.9], ["crate", -24.1, 13.9, 0.1, 0.7], ["barrel", -29.2, 14.2, 0, 0.9], ["barrel", -29.9, 13.6, 0.6, 0.8],
    ["log", -32.5, 14.4, 0.4, 1], ["log", -21.5, 15.6, -0.3, 0.8], ["shell", -30.5, 15.6, 0, 1], ["shell", -23, 14.8, 0, 1], ["umbrella", -35, 13.2, 0, 1], ["crate", 5.6, 15.6, 0.2, 0.8], ["barrel", 1.9, 15.5, 0, 0.8],
    ["tacklebox", 12.5, -4.2, 0.5, 1], ["bucket", -16.3, 1.3, 0, 1],
  ],
  // Decorative path strips (rendering only).
  paths: [
    { x: 0, z: -4, w: 3, d: 13 },
    { x: -8, z: -4, w: 18, d: 2.4 },
    { x: 8, z: -4, w: 9, d: 2.4 },
    { x: 4, z: 6, w: 2.4, d: 18 },
    { x: 11.5, z: -6, w: 3, d: 2.2 },
  ],
};

// Interactions: player within radius r (and in the same area) gets a contextual action.
export const INTERACTIONS = [
  { id: "spot_lake", type: "fish", location: "lake", area: "land", x: -19.2, z: 0, r: 1.6, facing: -Math.PI / 2, label: "Fish in the lake" },
  { id: "spot_river", type: "fish", location: "river", area: "land", x: 14, z: -6, r: 1.6, facing: Math.PI / 2, label: "Fish in the river" },
  { id: "spot_sea", type: "fish", location: "sea", area: "land", x: -8, z: 18, r: 1.6, facing: 0, label: "Fish from the shore" },
  { id: "spot_offshore", type: "fish", location: "offshore", area: "offshore", x: 0, z: 82.8, r: 1.4, facing: 0, label: "Fish offshore" },
  { id: "spot_trench", type: "fish", location: "trench", area: "trench", x: 1.3, z: 259.4, r: 1.3, facing: Math.PI / 2, label: "Fish the Deep Trench" },
  { id: "spot_harpoon", type: "fish", location: "trench", mode: "harpoon", area: "trench", x: 0, z: 264.4, r: 1.3, facing: 0, label: "Harpoon at the bow" },
  { id: "shop", type: "shop", area: "land", x: 6, z: -5.1, r: 2.1, label: "Talk to Mira (shop)" },
  { id: "notices", type: "quests", area: "land", x: 0, z: -10.1, r: 1.9, label: "Talk to Nell (orders)" },
  { id: "enter_home", type: "enter", area: "land", x: -8, z: -6.7, r: 1.2, label: "Go inside" },
  { id: "exit_home", type: "exit", area: "home", x: -150, z: -146.1, r: 1.3, label: "Go outside" },
  { id: "board", type: "board", area: "home", x: -152.6, z: -153.2, r: 1.9, label: "View the collection" },
  { id: "trophies", type: "trophies", area: "home", x: -146.8, z: -153.2, r: 1.9, label: "Trophy shelf" },
  { id: "dock", type: "dock", area: "land", x: 3.8, z: 22.4, r: 1.7, label: "Sail offshore" },
  { id: "trawler", type: "trawler", area: "land", x: -27, z: 24.8, r: 1.1, label: "Sail to the Deep Trench" },
  { id: "harpoon_rack", type: "harpoon", area: "land", x: -27.45, z: 20, r: 1.05, label: "Harpoon rack" },
  { id: "return", type: "return", area: "offshore", x: 0, z: 77.2, r: 1.4, label: "Sail back to shore" },
  { id: "return_trench", type: "return", area: "trench", x: -1.2, z: 258.2, r: 1.1, label: "Sail back to shore" },
  { id: "gate_river", type: "barrier", region: "river", area: "land", x: 9.1, z: -5, r: 1.9, label: "Construction site" },
  { id: "gate_sea", type: "barrier", region: "sea", area: "land", x: 4, z: 9.1, r: 1.9, label: "Construction site" },
];

// Villagers. Positions are also collision circles (NPC_RADIUS).
export const NPCS = [
  { id: "shopkeeper", name: "Mira", outfit: "shopkeeper", x: 6, z: -7.05, facing: 0 },
  { id: "boatseller", name: "Captain Olsen", outfit: "sailor", x: 4.72, z: 21.1, facing: Math.PI },
  { id: "courier", name: "Nell", outfit: "courier", x: -2.9, z: -10.3, facing: 0.4 },
];
const NPC_RADIUS = 0.4;
// Shop counter in front of the shopkeeper.
const COUNTER = { minX: 4.9, maxX: 7.1, minZ: -6.55, maxZ: -5.85 };

export const PROP_RADIUS = { bench: 0.7, barrel: 0.45, crate: 0.5, mailbox: 0.2, well: 1.1, stump: 0.5, log: 0.8, bush: 0.7, signpost: 0.2, umbrella: 0.15, buoy: 0, tacklebox: 0.35, bucket: 0.25 };

// Positions used when travelling by boat.
export const TRAVEL = {
  toOffshore: { x: 0, z: 78.5, area: "offshore" },
  toTrench: { x: 0, z: 260.5, area: "trench", facing: 0 },
  fromTrench: { x: -27, z: 23.6, area: "land" }, // back to the old pier
  toShore: { x: 4, z: 21.5, area: "land" },
  toHome: { x: -150, z: -146.8, area: "home", facing: Math.PI },
  fromHome: { x: -8, z: -6.3, area: "land", facing: 0 },
};

// Where the cast bobber lands relative to a fishing spot (world units).
export const CAST_DISTANCE = 3.4;

function inRect(x, z, r, pad = 0) {
  return x >= r.minX + pad && x <= r.maxX - pad && z >= r.minZ + pad && z <= r.maxZ - pad;
}

function solidRects() {
  const rects = WORLD.buildings.map(b => ({ minX: b.x - b.w / 2, maxX: b.x + b.w / 2, minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2 }));
  const wb = WORLD.noticeboard;
  rects.push({ minX: wb.x - wb.w / 2, maxX: wb.x + wb.w / 2, minZ: wb.z - wb.d / 2, maxZ: wb.z + wb.d / 2 });
  rects.push(COUNTER);
  return rects;
}
const SOLIDS = solidRects();

/** Is a region's construction barrier still blocking the way? */
export function isLockedAt(x, z, unlocked) {
  for (const [id, b] of Object.entries(WORLD.barriers)) {
    if (!unlocked.includes(id) && b.zone(x, z)) return true;
  }
  return false;
}

export function isWalkable(x, z, area, unlocked = []) {
  const pr = PLAYER_RADIUS;
  if (area === "offshore") return inRect(x, z, WORLD.offshore, pr * 0.8);
  if (area === "trench") {
    const c = WORLD.trench.cabin;
    return inRect(x, z, WORLD.trench, pr * 0.8) && !(x > c.minX - pr && x < c.maxX + pr && z < c.maxZ + pr);
  }
  if (area === "home") {
    const h = WORLD.home;
    return inRect(x, z, h, pr * 0.8) && !WORLD.homeFurniture.some(([fx, fz, r]) => Math.hypot(x - h.cx - fx, z - h.cz - fz) < r + pr * 0.6);
  }
  if (isLockedAt(x, z, unlocked) || isLockedAt(x + pr, z + pr, unlocked)) return false;
  for (const n of NPCS) if (Math.hypot(x - n.x, z - n.z) < NPC_RADIUS + pr) return false;
  if (WORLD.walkways.some(w => inRect(x, z, w, 0.1))) return true;
  if (!inRect(x, z, WORLD.land, pr)) return false;
  const l = WORLD.lake;
  if (Math.hypot(x - l.x, z - l.z) < l.r + pr * 0.4) return false;
  for (const s of SOLIDS) {
    if (x > s.minX - pr && x < s.maxX + pr && z > s.minZ - pr && z < s.maxZ + pr) return false;
  }
  for (const [tx, tz, s] of WORLD.trees) if (Math.hypot(x - tx, z - tz) < 0.5 * s + pr) return false;
  for (const [rx, rz, s] of WORLD.rocks) if (Math.hypot(x - rx, z - rz) < 0.8 * s + pr) return false;
  for (const [lx, lz] of WORLD.lamps) if (Math.hypot(x - lx, z - lz) < 0.2 + pr) return false;
  for (const [type, px, pz, , ps] of WORLD.props) {
    const r = PROP_RADIUS[type];
    if (r && Math.hypot(x - px, z - pz) < r * ps + pr) return false;
  }
  return true;
}

export function nearestInteraction(player, unlocked = []) {
  let best = null;
  let bestD = Infinity;
  for (const it of INTERACTIONS) {
    if (it.area !== player.area) continue;
    if (it.type === "barrier" && unlocked.includes(it.region)) continue;
    const d = Math.hypot(player.x - it.x, player.z - it.z);
    if (d <= it.r && d < bestD) { best = it; bestD = d; }
  }
  return best;
}

/** Area label for the HUD based on position. */
export function regionName(player) {
  if (player.area === "offshore") return "Offshore";
  if (player.area === "trench") return "Deep Trench";
  if (player.area === "home") return "Home";
  const { x, z } = player;
  if (z > WORLD.sandFromZ) return "Sea Shore";
  if (x > 9.5 && z > -12) return "Riverside";
  if (Math.hypot(x - WORLD.lake.x, z - WORLD.lake.z) < WORLD.lake.r + 6) return "Lakeside";
  return "Village";
}

/** Ground surface under a point (drives footstep sounds). */
export function surfaceAt(x, z, area) {
  if (area === "offshore" || area === "trench" || area === "home" || WORLD.walkways.some(w => inRect(x, z, w, 0))) return "wood";
  if (z > WORLD.sandFromZ) return "sand";
  if (WORLD.paths.some(p => Math.abs(x - p.x) <= p.w / 2 && Math.abs(z - p.z) <= p.d / 2)) return "path";
  return "grass";
}
