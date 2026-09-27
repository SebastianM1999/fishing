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
  ],

  buildings: [
    { id: "home", x: -8, z: -10, w: 7, d: 5, h: 3, wall: "#e9dcc3", roof: "#b8664a" },
    { id: "shop", x: 8, z: -10, w: 7, d: 5, h: 3, wall: "#efe2c8", roof: "#5f7f5a" },
  ],
  wallboard: { x: 0, z: -11.2, w: 4.6, d: 0.6 },

  // Offshore fishing area: a small anchored boat deck far from the shore.
  offshore: { minX: -1.5, maxX: 1.5, minZ: 76.6, maxZ: 83.4, cx: 0, cz: 80 },
  boatMooring: { x: 6.6, z: 21.5 },

  trees: [
    [-34, -22, 1.2], [-29, -23, 1], [-22, -22.5, 1.3], [-15, -23, 1], [-8, -23.5, 1.1], [2, -23, 1.2], [9, -22.5, 1],
    [-35, -14, 1.1], [-33, -7, 1.3], [-35, 7, 1.2], [-32, 12, 1], [-26, 12.5, 1.1],
    [-15, -16, 1], [-14, 8.5, 0.9], [11, -18, 1.1], [11.5, 4, 0.9], [-3, -18, 0.9], [4, -17.5, 0.8],
    [-18, -9.5, 1], [-29, -12, 0.9],
  ],
  rocks: [[-17, 6, 0.7], [-30, 8.5, 0.9], [10.5, 9, 0.6], [-12, 12, 0.5], [7, 12.5, 0.6], [-20, -15, 0.7]],
  lamps: [[-3, -6.5], [3, -6.5], [-6.5, 13.5], [3, 14.3]],
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
  { id: "shop", type: "shop", area: "land", x: 8, z: -7, r: 2.2, label: "Open shop" },
  { id: "board", type: "board", area: "land", x: 0, z: -10.2, r: 2, label: "View wallboard" },
  { id: "dock", type: "dock", area: "land", x: 4, z: 22.8, r: 1.6, label: "Sail offshore" },
  { id: "return", type: "return", area: "offshore", x: 0, z: 77.2, r: 1.4, label: "Sail back to shore" },
];

// Positions used when travelling by boat.
export const TRAVEL = {
  toOffshore: { x: 0, z: 78.5, area: "offshore" },
  toShore: { x: 4, z: 21.5, area: "land" },
};

// Where the cast bobber lands relative to a fishing spot (world units).
export const CAST_DISTANCE = 3.4;

function inRect(x, z, r, pad = 0) {
  return x >= r.minX + pad && x <= r.maxX - pad && z >= r.minZ + pad && z <= r.maxZ - pad;
}

function solidRects() {
  const rects = WORLD.buildings.map(b => ({ minX: b.x - b.w / 2, maxX: b.x + b.w / 2, minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2 }));
  const wb = WORLD.wallboard;
  rects.push({ minX: wb.x - wb.w / 2, maxX: wb.x + wb.w / 2, minZ: wb.z - wb.d / 2, maxZ: wb.z + wb.d / 2 });
  return rects;
}
const SOLIDS = solidRects();

export function isWalkable(x, z, area) {
  const pr = PLAYER_RADIUS;
  if (area === "offshore") return inRect(x, z, WORLD.offshore, pr * 0.8);
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
  return true;
}

export function nearestInteraction(player) {
  let best = null;
  let bestD = Infinity;
  for (const it of INTERACTIONS) {
    if (it.area !== player.area) continue;
    const d = Math.hypot(player.x - it.x, player.z - it.z);
    if (d <= it.r && d < bestD) { best = it; bestD = d; }
  }
  return best;
}

/** Area label for the HUD based on position. */
export function regionName(player) {
  if (player.area === "offshore") return "Offshore";
  const { x, z } = player;
  if (z > WORLD.sandFromZ) return "Sea Shore";
  if (x > 9.5 && z > -12) return "Riverside";
  if (Math.hypot(x - WORLD.lake.x, z - WORLD.lake.z) < WORLD.lake.r + 6) return "Lakeside";
  return "Village";
}
