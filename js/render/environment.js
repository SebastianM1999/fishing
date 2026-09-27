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
  const farSea = waterMesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: "#4a9ab4", roughness: 0.4 }), 0, SEA_Y - 0.12, 200);
  root.add(farSea);
  const seaFoam = waterMesh(new THREE.PlaneGeometry(landW + 6, 0.5), M.foam, landX, SEA_Y + 0.12, L.maxZ + 2.0);
  const lakeFoam = waterMesh(new THREE.RingGeometry(lk.r - 0.25, lk.r + 0.05, 48), M.foam, lk.x, LAKE_Y + 0.03, lk.z);
  root.add(seaFoam, lakeFoam);

  // --- Structures -----------------------------------------------------------------------------
  for (const w of WORLD.walkways) models.walkway(k, M, w, w.id === "boat_dock");
  // Mooring bollards at the dock end
  for (const x of [2.8, 5.2]) { k.part(G.cyl(0.14, 0.16, 0.5, 8), M.metal, [x, 0.4, 23.7]); k.part(G.cyl(0.2, 0.2, 0.08, 8), M.metal, [x, 0.66, 23.7]); }
  for (const b of WORLD.buildings) models.building(k, M, b);
  models.wallboardFrame(k, M, WORLD.wallboard);
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

  // Fishing-spot / dock markers
  const markers = INTERACTIONS.filter(i => ["fish", "dock", "return"].includes(i.type)).map(it => {
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
