// Builds the static world from structured map data (js/game/world.js) into merged meshes.
import * as THREE from "three";
import { WORLD, INTERACTIONS } from "../game/world.js";
import { REGIONS } from "../game/content.js";
import { G, Kit, Batch, GroupSink } from "./kit.js";
import * as models from "./models.js";
import { createSignTexture } from "./textures.js";

export const SEA_Y = -0.35;
export const RIVER_Y = -0.22;
export const LAKE_Y = 0.12; // above the shore rings even in wave troughs

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function waterMesh(geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}

export function buildEnvironment(M) {
  const root = new THREE.Group();
  const batch = new Batch();
  const k = new Kit(batch);
  const L = WORLD.land, lk = WORLD.lake;
  const landX = (L.maxX - 44) / 2, landW = L.maxX + 44, landZ = (L.maxZ - 34) / 2, landD = L.maxZ + 34;

  // --- Terrain ----------------------------------------------------------------------------
  k.part(G.box(landW, 2, landD), M.grass, [landX, -1, landZ]);
  const sandD = L.maxZ - WORLD.sandFromZ;
  k.part(G.box(landW, 2, sandD), M.sand, [landX, -0.99, WORLD.sandFromZ + sandD / 2]);
  k.part(G.box(landW, 0.3, 2.6), M.sandWet, [landX, -0.3, L.maxZ + 1.1], [0.26, 0, 0]);
  k.part(G.box(30, 2, landD), M.grassDark, [WORLD.river.maxX + 15, -0.92, landZ]);
  k.part(G.box(1.4, 0.3, landD), M.sandWet, [WORLD.river.minX + 0.35, -0.2, landZ], [0, 0, -0.35]);
  k.part(G.box(1.4, 0.3, landD), M.sandWet, [WORLD.river.maxX - 0.35, -0.12, landZ], [0, 0, 0.35]);
  const rnd = lcg(7);
  // Grass colour patches for variety
  for (let i = 0; i < 26; i++) {
    const x = -36 + rnd() * 47, z = -24 + rnd() * 32;
    if (Math.hypot(x - lk.x, z - lk.z) < lk.r + 2) continue;
    k.part(G.circle(1, 9), i % 2 ? M.grassDark : M.grassLight, [x, 0.004 + i * 0.0002, z], [0, rnd() * 3, 0], [1.5 + rnd() * 2.5, 1, 1 + rnd() * 2]);
  }
  // Lake shore rings
  k.part(G.circle(lk.r + 1.2, 32), M.sand, [lk.x, 0.01, lk.z]);
  k.part(G.circle(lk.r + 0.45, 32), M.sandWet, [lk.x, 0.015, lk.z]);
  // Paths with stone edging
  for (const p of WORLD.paths) {
    k.part(G.box(p.w, 0.05, p.d), M.path, [p.x, 0.0, p.z]);
    const long = p.w > p.d ? "x" : "z", len = Math.max(p.w, p.d), n = Math.floor(len / 0.9);
    for (let j = 0; j < n; j++) for (const s of [-1, 1]) {
      const t = -len / 2 + 0.45 + j * 0.9;
      const [x, z] = long === "x" ? [p.x + t, p.z + s * (p.d / 2 + 0.05)] : [p.x + s * (p.w / 2 + 0.05), p.z + t];
      if (rnd() < 0.7) k.part(G.dodeca(0.16), rnd() < 0.5 ? M.stone : M.stoneLight, [x, 0.03, z], [0, rnd() * 3, 0], [1.2, 0.4, 1]);
    }
    for (let j = 0; j < n / 2; j++) k.part(G.dodeca(0.08), M.pathEdge, [p.x + (rnd() - 0.5) * p.w * 0.8, 0.03, p.z + (rnd() - 0.5) * p.d * 0.8], [0, 0, 0], [1, 0.4, 1]);
  }
  // Beach pebbles and driftwood
  for (let i = 0; i < 40; i++) k.part(G.dodeca(0.1 + rnd() * 0.08), rnd() < 0.5 ? M.stoneLight : M.stone, [-36 + rnd() * 49, 0.02, 11 + rnd() * 5], [rnd(), rnd(), 0], [1, 0.5, 1]);
  k.part(G.cyl(0.14, 0.12, 2.2, 6), M.birch, [-14, 0.1, 15.8], [0, 0.6, Math.PI / 2]);

  // --- Water --------------------------------------------------------------------------------
  root.add(waterMesh(new THREE.RingGeometry(0.01, lk.r, 48, 10), M.lake, lk.x, LAKE_Y, lk.z));
  root.add(waterMesh(new THREE.RingGeometry(0.01, lk.r * 0.55, 32, 6), M.lakeDeep, lk.x - 0.6, LAKE_Y + 0.01, lk.z + 0.3));
  root.add(waterMesh(new THREE.PlaneGeometry(WORLD.river.maxX - WORLD.river.minX + 1.2, landD + 6, 12, 90), M.river, (WORLD.river.minX + WORLD.river.maxX) / 2, RIVER_Y, landZ));
  root.add(waterMesh(new THREE.PlaneGeometry(220, 160, 110, 80), M.sea, 0, SEA_Y, 90));
  const farSea = waterMesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: "#4a9ab4", roughness: 0.4 }), 0, SEA_Y - 0.9, 200);
  root.add(farSea);
  const seaFoam = waterMesh(new THREE.PlaneGeometry(landW + 6, 0.5), M.foam, landX, SEA_Y + 0.12, L.maxZ + 2.0);
  const lakeFoam = waterMesh(new THREE.RingGeometry(lk.r - 0.25, lk.r + 0.05, 48), M.foam, lk.x, LAKE_Y + 0.03, lk.z);
  root.add(seaFoam, lakeFoam);

  // --- Structures -----------------------------------------------------------------------------
  for (const w of WORLD.walkways) models.walkway(k, M, w, w.id === "boat_dock");
  // Mooring bollards at the dock end
  for (const x of [2.8, 5.2]) { k.part(G.cyl(0.14, 0.16, 0.5, 8), M.metal, [x, 0.4, 23.7]); k.part(G.cyl(0.2, 0.2, 0.08, 8), M.metal, [x, 0.66, 23.7]); }
  for (const b of WORLD.buildings) models.building(k, M, b);
  models.wallboardFrame(k, M, WORLD.noticeboard);
  for (const [x, z] of WORLD.lamps) { k.push(x, 0, z); models.lampPost(k, M); k.pop(); }

  // --- Vegetation & props -----------------------------------------------------------------------
  WORLD.trees.forEach(([x, z, s], i) => { k.push(x, 0, z, i * 1.7); models.tree(k, M, i % 5 === 2 ? "birch" : i % 3 === 0 ? "pine" : "oak", s); k.pop(); });
  const scenery = [];
  for (let i = 0; i < 16; i++) scenery.push([21 + (i % 4) * 4.2 + (i % 3), -26 + i * 3.4, 0.9 + (i % 3) * 0.2]);
  for (let i = 0; i < 13; i++) scenery.push([-41 + i * 4.6, -29 - (i % 2) * 2.2, 1.1 + (i % 2) * 0.3]);
  for (let i = 0; i < 9; i++) scenery.push([-41.5 - (i % 2) * 1.8, -22 + i * 4.2, 1.0 + (i % 3) * 0.2]);
  scenery.forEach(([x, z, s], i) => { k.push(x, 0, z, i); models.tree(k, M, i % 2 ? "pine" : "oak", s); k.pop(); });
  WORLD.rocks.forEach(([x, z, s], i) => { k.push(x, 0, z); models.rock(k, M, s, i); k.pop(); });
  WORLD.props.forEach(([type, x, z, ry, s], i) => {
    k.push(x, type === "lily" ? LAKE_Y : 0, z, ry, s);
    if (type === "bush") models.bush(k, M, 1, i);
    else if (type === "reeds") models.reeds(k, M, i);
    else if (type === "lily") models.lilyPad(k, M, i);
    else if (type !== "buoy") models.prop(k, M, type, i);
    k.pop();
  });
  // Grass tufts and wild flowers on open grass
  const blocked = (x, z) => Math.hypot(x - lk.x, z - lk.z) < lk.r + 1.5 || z > WORLD.sandFromZ - 0.3 || x > L.maxX - 0.5
    || WORLD.paths.some(p => Math.abs(x - p.x) < p.w / 2 + 0.3 && Math.abs(z - p.z) < p.d / 2 + 0.3)
    || WORLD.buildings.some(b => Math.abs(x - b.x) < b.w / 2 + 1 && Math.abs(z - b.z) < b.d / 2 + 1.5);
  for (let i = 0, n = 0; i < 2000 && n < 420; i++) {
    const x = -38 + rnd() * 51, z = -26 + rnd() * 36;
    if (blocked(x, z)) continue;
    n++;
    if (n % 4 === 0) models.flower(k, M, x, z, [M.pink, M.petalWhite, M.petalYellow, M.lilac][n % 4], 0.25 + rnd() * 0.15);
    else models.grassTuft(k, M, x, z, i);
  }
  // Boundary fences
  models.fenceLine(k, M, [-37.6, -25.7], [9.8, -25.7]);
  models.fenceLine(k, M, [-38.3, -25.7], [-38.3, 10]);

  root.add(batch.build({ noShadow: [M.grassLight, M.path, M.sand, M.sandWet, M.grass, M.grassDark, M.pathEdge] }));

  // --- Construction barriers (hidden once a region is unlocked) -----------------------------------
  const barriers = {};
  for (const [id, b] of Object.entries(WORLD.barriers)) {
    const bb = new Batch();
    const bk = new Kit(bb);
    models.barrierLine(bk, M, b.line[0], b.line[1], { x: b.gate.x + (id === "river" ? -1.6 : 0), z: b.gate.z + (id === "sea" ? -1.6 : 0) });
    const group = bb.build();
    // Painted closure sign on two posts at the gate
    const sign = new THREE.Group();
    const sk = new Kit(new GroupSink(sign));
    for (const x of [-1.05, 1.05]) sk.part(G.box(0.14, 2.3, 0.14), M.woodDark, [x, 1.15, 0]);
    const region = REGIONS[id];
    const tex = createSignTexture([["CLOSED", 70], [region.sign, 26], [`Clear it for ${region.price} coins`, 30]]);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.08), [M.woodDark, M.woodDark, M.woodDark, M.woodDark, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), M.woodDark]);
    board.position.set(0, 1.7, 0.08);
    board.castShadow = true;
    sign.add(board);
    // Blinking warning lamp
    const warn = new THREE.Mesh(G.sphere(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: "#ffb347", emissive: "#ff8a1a", emissiveIntensity: 1 }));
    warn.position.set(1.05, 2.4, 0);
    sign.add(warn);
    // Stand on the village side, angled toward the (south-east) camera so it stays readable.
    sign.position.set(b.gate.x + (id === "river" ? -1.0 : 1.8), 0, b.gate.z + (id === "river" ? -2.3 : -0.9));
    sign.rotation.y = id === "river" ? 0.2 : 0.35;
    group.add(sign);
    root.add(group);
    barriers[id] = { group, warn };
  }

  // Shop sign by the entrance: painted board on two posts with a fish on top.
  {
    const sign = new THREE.Group();
    const sk = new Kit(new GroupSink(sign));
    for (const x of [-0.8, 0.8]) sk.part(G.box(0.12, 2.1, 0.12), M.woodDark, [x, 1.05, 0]);
    sk.part(G.sphere(0.3, 10, 8), M.yellow, [0.05, 2.45, 0], [0, 0, 0], [1.9, 0.9, 0.35]);
    sk.part(G.cone(0.26, 0.45, 4), M.yellow, [-0.7, 2.45, 0], [0, 0, Math.PI / 2], [1, 1, 0.35]);
    sk.part(G.sphere(0.05, 6, 4), M.black, [0.45, 2.52, 0.1]);
    const tex = createSignTexture([["TACKLE", 74], ["SHOP", 74]], { bg: "#f7efdf", border: "#5f7f5a", fg: "#4c6a48" });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 0.08), [M.woodDark, M.woodDark, M.woodDark, M.woodDark, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), M.woodDark]);
    board.position.set(0, 1.55, 0.07);
    board.castShadow = true;
    sign.add(board);
    sign.position.set(9.5, 0, -6.85);
    sign.rotation.y = 0.25;
    root.add(sign);
  }

  // Fishing-spot / dock markers
  const markers = INTERACTIONS.filter(i => ["fish", "dock", "return", "exit"].includes(i.type)).map(it => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 24).rotateX(-Math.PI / 2), M.spot);
    m.position.set(it.x, 0.22, it.z);
    root.add(m);
    return m;
  });

  // Buoys bob individually
  const buoys = WORLD.props.filter(p => p[0] === "buoy").map(([, x, z]) => {
    const g = new THREE.Group();
    const bk = new Kit(new GroupSink(g));
    bk.part(G.sphere(0.35, 10, 8), M.red, [0, 0.1, 0], [0, 0, 0], [1, 0.8, 1]);
    bk.part(G.cyl(0.36, 0.36, 0.12, 10), M.white, [0, 0.15, 0]);
    bk.part(G.cyl(0.05, 0.05, 0.6, 5), M.metal, [0, 0.55, 0]);
    bk.part(G.sphere(0.08, 6, 4), M.yellow, [0, 0.85, 0]);
    g.position.set(x, SEA_Y, z);
    root.add(g);
    return g;
  });

  return { root, barriers, markers, buoys, seaFoam, lakeFoam, chimney: new THREE.Vector3(-8 - 7 / 4, 0.4 + 3 + 2.3, -10 - 0.7) };
}

/**
 * The home interior: a cosy room far from the map. The camera looks in from the south-east, so the
 * north (back) and west walls are full height and the east/front walls are low sills.
 */
export function buildHome(M) {
  const root = new THREE.Group();
  const batch = new Batch();
  const k = new Kit(batch);
  const h = WORLD.home, W = h.maxX - h.minX, D = h.maxZ - h.minZ, WH = 3.2;
  const std = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true });
  const wallpaper = std("#e9d4b0"), wainscot = std("#b98a58"), rugA = std("#b8564a"), rugB = std("#e8c070"), quilt = std("#6f9fc4"), quiltB = std("#f2e6cc");
  const fire = new THREE.MeshStandardMaterial({ color: "#ffb347", emissive: "#ff7a1a", emissiveIntensity: 1.6, roughness: 1 });
  k.push(h.cx, 0, h.cz);
  // Dark void around the room so the outside world never shows.
  k.part(G.box(90, 0.2, 90), std("#2a1d14"), [0, -0.2, 0]);
  // Plank floor
  for (let i = 0; i < 12; i++) k.part(G.box(W, 0.12, D / 12 - 0.03), i % 2 ? M.plank : M.plankDark, [0, 0.0, -D / 2 + (i + 0.5) * (D / 12)]);
  // Back (north) and west walls: wallpaper over wood panelling, beams on top
  k.part(G.box(W + 0.4, WH, 0.3), wallpaper, [0, WH / 2, -D / 2 - 0.15]);
  k.part(G.box(0.3, WH, D + 0.3), wallpaper, [-W / 2 - 0.15, WH / 2, 0]);
  k.part(G.box(W + 0.4, 0.9, 0.34), wainscot, [0, 0.45, -D / 2 - 0.13]);
  k.part(G.box(0.34, 0.9, D + 0.3), wainscot, [-W / 2 - 0.13, 0.45, 0]);
  k.part(G.box(W + 0.5, 0.22, 0.4), M.woodDark, [0, WH, -D / 2 - 0.1]);
  k.part(G.box(0.4, 0.22, D + 0.4), M.woodDark, [-W / 2 - 0.1, WH, 0]);
  for (const x of [-W / 2 + 0.1, 0.45, W / 2]) k.part(G.box(0.22, WH, 0.22), M.woodDark, [x, WH / 2, -D / 2 + 0.02]);
  // Low east and front walls (sills), with the door gap in front
  k.part(G.box(0.3, 0.55, D + 0.3), wainscot, [W / 2 + 0.15, 0.27, 0]);
  for (const s of [-1, 1]) k.part(G.box(W / 2 - 0.9, 0.55, 0.3), wainscot, [s * (W / 4 + 0.45), 0.27, D / 2 + 0.15]);
  for (const s of [-1, 1]) k.part(G.box(0.2, 2.3, 0.3), M.woodDark, [s * 0.9, 1.15, D / 2 + 0.15]);
  k.part(G.box(1.6, 0.05, 0.9), M.stoneLight, [0, 0.07, D / 2 - 0.35]); // door mat stone
  k.part(G.box(1.2, 0.03, 0.7), std("#8c6c40"), [0, 0.1, D / 2 - 0.4]);
  // West wall window (warm daylight) and a cushioned bench under it
  k.push(-W / 2 + 0.02, 1.8, 2.6, Math.PI / 2);
  k.part(G.box(1.5, 1.2, 0.1), M.white, [0, 0, 0]);
  k.part(G.box(1.3, 1.0, 0.06), M.window, [0, 0, 0.05]);
  k.part(G.box(0.06, 1.0, 0.08), M.white, [0, 0, 0.08]);
  k.pop();
  // Fireplace on the west wall
  k.push(-W / 2 + 0.55, 0, -0.4);
  k.part(G.box(1.0, 1.5, 2.2), M.stone, [0, 0.75, 0]);
  k.part(G.box(0.7, 3.0, 1.2), M.stoneDark, [-0.2, 1.5, 0]);
  k.part(G.box(1.2, 0.16, 2.4), M.woodDark, [0.05, 1.55, 0]);
  k.part(G.box(0.2, 0.8, 1.3), std("#2a1f18"), [0.42, 0.55, 0]);
  for (let i = 0; i < 3; i++) k.part(G.cyl(0.09, 0.09, 0.9, 6), M.trunk, [0.45, 0.25 + i * 0.08, -0.25 + i * 0.25], [Math.PI / 2, 0.5 * i, 0]);
  k.part(G.cone(0.28, 0.55, 5), fire, [0.48, 0.55, 0]);
  k.part(G.cone(0.18, 0.4, 5), fire, [0.5, 0.5, 0.25]);
  k.part(G.box(0.2, 0.25, 0.2), M.red, [0.1, 1.76, -0.7]); // mantel jar
  k.part(G.box(0.14, 0.4, 0.14), M.lampGlass, [0.1, 1.83, 0.7]); // candle
  k.pop();
  // Round rug, table with stools, bed, plants, lamp
  k.part(G.cyl(2.3, 2.3, 0.04, 20), rugA, [0.2, 0.08, 0.3]);
  k.part(G.cyl(1.7, 1.7, 0.05, 20), rugB, [0.2, 0.09, 0.3]);
  k.part(G.cyl(1.1, 1.1, 0.06, 20), rugA, [0.2, 0.1, 0.3]);
  k.push(-3.2, 0, 2.2);
  k.part(G.cyl(0.75, 0.75, 0.1, 12), M.woodLight, [0, 0.85, 0]);
  k.part(G.cyl(0.1, 0.16, 0.8, 8), M.woodDark, [0, 0.42, 0]);
  k.part(G.cyl(0.14, 0.18, 0.2, 8), M.terracotta, [0.15, 1.0, 0]);
  k.part(G.ico(0.18, 0), M.leafStill, [0.15, 1.2, 0]);
  for (const [x, z] of [[1.0, 0.1], [-0.9, 0.3]]) { k.part(G.cyl(0.28, 0.24, 0.08, 10), M.wood, [x, 0.5, z]); k.part(G.cyl(0.05, 0.05, 0.46, 5), M.woodDark, [x, 0.23, z]); }
  k.pop();
  k.push(4.3, 0, 2.8);
  k.part(G.box(1.9, 0.5, 2.8), M.wood, [0, 0.3, 0]);
  k.part(G.box(1.8, 0.2, 2.7), quiltB, [0, 0.62, 0]);
  k.part(G.box(1.85, 0.12, 1.8), quilt, [0, 0.74, 0.45]);
  k.part(G.box(1.1, 0.2, 0.55), M.white, [0, 0.78, -1.0]);
  k.part(G.box(2.0, 1.1, 0.14), M.woodDark, [0, 0.6, -1.45]);
  k.pop();
  for (const [x, z] of [[-5.2, 3.6], [5.3, -3.6]]) {
    k.part(G.cyl(0.3, 0.24, 0.5, 8), M.terracotta, [x, 0.3, z]);
    for (let i = 0; i < 5; i++) k.part(G.ico(0.28, 0), M.leafStill, [x + Math.cos(i * 1.3) * 0.18, 0.75 + i * 0.1, z + Math.sin(i * 1.3) * 0.18]);
  }
  // Collection board frame and trophy shelf on the back wall
  k.part(G.box(4.8, 2.7, 0.14), M.woodDark, [-2.6, 1.95, -D / 2 + 0.06]);
  k.part(G.box(4.2, 0.12, 0.5), M.woodDark, [3.2, 1.2, -D / 2 + 0.25]);
  for (const x of [1.4, 5.0]) k.part(G.box(0.1, 0.4, 0.4), M.woodDark, [x, 1.0, -D / 2 + 0.2]);
  for (let i = 0; i < 3; i++) k.part(G.cyl(0.62, 0.62, 0.08, 12), M.wood, [1.8 + i * 1.4, 2.1, -D / 2 + 0.06], [Math.PI / 2, 0, 0], [1.1, 1, 0.85]);
  k.part(G.box(4.3, 0.34, 0.06), std("#e2b34a"), [3.2, 2.95, -D / 2 + 0.05]); // brass plate
  k.pop();
  root.add(batch.build({ noShadow: [M.plank, M.plankDark] }));

  const fireLight = new THREE.PointLight("#ffa050", 8, 9, 1.4);
  fireLight.position.set(h.cx - W / 2 + 1.3, 1.1, h.cz - 0.4);
  root.add(fireLight);
  return {
    root, fireLight, fire,
    boardPos: new THREE.Vector3(h.cx - 2.6, 1.95, h.minZ + 0.15),
    trophySlots: [0, 1, 2].map(i => new THREE.Vector3(h.cx + 1.8 + i * 1.4, 2.1, h.minZ + 0.3)),
  };
}
