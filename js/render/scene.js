// Three.js view of the game state. Holds no gameplay rules; reads plain state each frame.
import * as THREE from "three";
import { WORLD, INTERACTIONS, CAST_DISTANCE } from "../game/world.js";
import { FISH } from "../game/content.js";
import { dayFraction } from "../game/time.js";

const CAMERA_OFFSET = new THREE.Vector3(9, 26, 22);
const SEA_Y = -0.35;
const RIVER_Y = -0.22;

// Day palette keyframes over the 0..1 day (Dawn .00-.25, Day .25-.50, Dusk .50-.75, Night .75-1).
const KEYS = [
  { f: 0.0, sky: "#6a6f9a", sun: "#ffb894", sunI: 0.9, hemiSky: "#8594c4", hemiGround: "#4a4656", hemiI: 0.85, lamps: 0.6 },
  { f: 0.08, sky: "#f1b69c", sun: "#ffc79a", sunI: 1.3, hemiSky: "#8fa6d4", hemiGround: "#6a5a64", hemiI: 0.85, lamps: 0.15 },
  { f: 0.2, sky: "#f6d8b4", sun: "#ffe0b8", sunI: 2.0, hemiSky: "#b8cfe6", hemiGround: "#7b7a5a", hemiI: 0.95, lamps: 0 },
  { f: 0.35, sky: "#aedcee", sun: "#fff6e6", sunI: 2.6, hemiSky: "#dcecf6", hemiGround: "#7e8c58", hemiI: 1.05, lamps: 0 },
  { f: 0.48, sky: "#b6dbe6", sun: "#ffe7bf", sunI: 2.4, hemiSky: "#d6e6ee", hemiGround: "#80845a", hemiI: 1.0, lamps: 0 },
  { f: 0.6, sky: "#f4a07a", sun: "#ff9a5a", sunI: 1.9, hemiSky: "#e0a8b6", hemiGround: "#5e4a52", hemiI: 0.8, lamps: 0.2 },
  { f: 0.71, sky: "#9a5f86", sun: "#ff7c6a", sunI: 1.0, hemiSky: "#8c6c9c", hemiGround: "#3e3448", hemiI: 0.65, lamps: 0.8 },
  { f: 0.8, sky: "#1d2850", sun: "#a8b8ff", sunI: 0.6, hemiSky: "#3a5088", hemiGround: "#1c2234", hemiI: 0.6, lamps: 1 },
  { f: 0.95, sky: "#1a2448", sun: "#a8b8ff", sunI: 0.6, hemiSky: "#3a5088", hemiGround: "#1c2234", hemiI: 0.6, lamps: 1 },
  { f: 1.0, sky: "#6a6f9a", sun: "#ffb894", sunI: 0.9, hemiSky: "#8594c4", hemiGround: "#4a4656", hemiI: 0.85, lamps: 0.6 },
];
const KEY_COLORS = KEYS.map(k => ({
  sky: new THREE.Color(k.sky), sun: new THREE.Color(k.sun),
  hemiSky: new THREE.Color(k.hemiSky), hemiGround: new THREE.Color(k.hemiGround),
}));

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...extra });
}

function mesh(geo, material, { x = 0, y = 0, z = 0, ry = 0, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#aedcee");
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);

  // Lights
  const hemi = new THREE.HemisphereLight("#dcecf6", "#7e8c58", 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff6e6", 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const M = {
    grass: mat("#8fb56a"), grassDark: mat("#7aa35c"), sand: mat("#e8d3a2"), path: mat("#d8bf8e"),
    dirt: mat("#9c7a55"), wood: mat("#a8784e"), woodDark: mat("#7a5638"), plank: mat("#c49a68"),
    stone: mat("#a9a59b"), trunk: mat("#8a6242"), cream: mat("#f2e6cc"), terracotta: mat("#c8704f"),
    leaf: [mat("#6f9d58"), mat("#88ad5c"), mat("#5f8c55")],
    lake: mat("#5aa7b3", { roughness: 0.35, flatShading: false }),
    lakeDeep: mat("#3f8c9f", { roughness: 0.35, flatShading: false }),
    river: mat("#62afbc", { roughness: 0.35, flatShading: false }),
    sea: mat("#4d9db5", { roughness: 0.4, flatShading: false }),
    window: new THREE.MeshStandardMaterial({ color: "#3d4a5a", emissive: "#ffc46b", emissiveIntensity: 0, roughness: 0.6 }),
    bulb: new THREE.MeshStandardMaterial({ color: "#fff1c9", emissive: "#ffcf7a", emissiveIntensity: 0.2 }),
    glint: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }),
    spot: new THREE.MeshBasicMaterial({ color: "#fff4d6", transparent: true, opacity: 0.45, depthWrite: false }),
    plaqueEmpty: mat("#8d8a84"),
    boatHull: mat("#e9e1cf"), boatTrim: mat("#3f6e8c"), sail: mat("#f5ecd8"),
    player: mat("#d9774f"), skin: mat("#f0c9a0"), hat: mat("#e4c46c"), pants: mat("#4e6a88"),
    rod: mat("#6b4a2e"), bobber: mat("#e2493c"), bobberTop: mat("#ffffff"),
  };

  const world = new THREE.Group();
  scene.add(world);

  // --- Terrain -----------------------------------------------------------
  const L = WORLD.land;
  const landW = L.maxX + 44, landD = L.maxZ + 34;
  world.add(mesh(new THREE.BoxGeometry(landW, 2, landD), M.grass, { x: (L.maxX - 44) / 2, y: -1, z: (L.maxZ - 34) / 2, cast: false }));
  const sandD = L.maxZ - WORLD.sandFromZ;
  world.add(mesh(new THREE.BoxGeometry(landW, 2, sandD), M.sand, { x: (L.maxX - 44) / 2, y: -0.98, z: WORLD.sandFromZ + sandD / 2, cast: false }));
  // East bank beyond the river (scenery, not walkable)
  world.add(mesh(new THREE.BoxGeometry(30, 2, landD), M.grassDark, { x: WORLD.river.maxX + 15, y: -0.9, z: (L.maxZ - 34) / 2, cast: false }));
  // River + sea water
  const river = mesh(new THREE.PlaneGeometry(WORLD.river.maxX - WORLD.river.minX + 0.2, landD + 4), M.river, { x: (WORLD.river.minX + WORLD.river.maxX) / 2, y: RIVER_Y, z: (L.maxZ - 34) / 2 - 1, cast: false });
  river.rotation.x = -Math.PI / 2;
  world.add(river);
  const sea = mesh(new THREE.PlaneGeometry(600, 600), M.sea, { y: SEA_Y, z: 250, cast: false });
  sea.rotation.x = -Math.PI / 2;
  world.add(sea);
  // Lake
  const lk = WORLD.lake;
  const ring = mesh(new THREE.CircleGeometry(lk.r + 0.9, 28), M.sand, { x: lk.x, y: 0.01, z: lk.z, cast: false });
  const lake = mesh(new THREE.CircleGeometry(lk.r, 28), M.lake, { x: lk.x, y: 0.03, z: lk.z, cast: false });
  const deep = mesh(new THREE.CircleGeometry(lk.r * 0.55, 20), M.lakeDeep, { x: lk.x - 0.6, y: 0.04, z: lk.z + 0.3, cast: false });
  for (const m of [ring, lake, deep]) { m.rotation.x = -Math.PI / 2; world.add(m); }
  // Paths
  for (const p of WORLD.paths) {
    const m = mesh(new THREE.BoxGeometry(p.w, 0.04, p.d), M.path, { x: p.x, y: 0.0, z: p.z, cast: false });
    world.add(m);
  }

  // --- Walkways (piers, jetty, dock) -------------------------------------
  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.4, 6);
  for (const w of WORLD.walkways) {
    const width = w.maxX - w.minX, depth = w.maxZ - w.minZ;
    const deck = mesh(new THREE.BoxGeometry(width, 0.16, depth), M.plank, { x: (w.minX + w.maxX) / 2, y: 0.1, z: (w.minZ + w.maxZ) / 2 });
    world.add(deck);
    for (const [px, pz] of [[w.minX + 0.15, w.minZ + 0.15], [w.maxX - 0.15, w.minZ + 0.15], [w.minX + 0.15, w.maxZ - 0.15], [w.maxX - 0.15, w.maxZ - 0.15]]) {
      world.add(mesh(postGeo, M.woodDark, { x: px, y: -0.4, z: pz }));
    }
  }

  // --- Buildings ---------------------------------------------------------
  const windowGeo = new THREE.PlaneGeometry(0.9, 0.8);
  for (const b of WORLD.buildings) {
    const g = new THREE.Group();
    g.position.set(b.x, 0, b.z);
    g.add(mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat(b.wall), { y: b.h / 2 }));
    g.add(mesh(new THREE.BoxGeometry(b.w + 0.3, 0.35, b.d + 0.3), M.stone, { y: 0.17 }));
    // Gable roof: triangular prism extruded along the building's width (ridge runs east-west).
    const half = b.d / 2 + 0.5;
    const roofShape = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, b.d * 0.42)]);
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: b.w + 0.6, bevelEnabled: false });
    roofGeo.translate(0, 0, -(b.w + 0.6) / 2);
    const roof = mesh(roofGeo, mat(b.roof), { y: b.h, ry: Math.PI / 2 });
    g.add(roof);
    // Door + windows on the south face
    g.add(mesh(new THREE.BoxGeometry(1.1, 1.8, 0.1), M.woodDark, { y: 0.9, z: b.d / 2 + 0.03 }));
    for (const wx of [-b.w / 3.2, b.w / 3.2]) {
      const win = mesh(windowGeo, M.window, { x: wx, y: 1.7, z: b.d / 2 + 0.02, cast: false });
      g.add(win);
      g.add(mesh(new THREE.BoxGeometry(1.1, 0.12, 0.2), M.wood, { x: wx, y: 1.25, z: b.d / 2 + 0.08 }));
    }
    if (b.id === "home") {
      g.add(mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), M.terracotta, { x: -b.w / 4, y: b.h + 1.3, z: -0.6 }));
    } else {
      // Striped awning + fish sign for the shop
      for (let i = 0; i < 7; i++) {
        const stripe = mesh(new THREE.BoxGeometry(b.w / 7, 0.08, 1.2), i % 2 ? M.cream : mat("#6f9a6a"), { x: -b.w / 2 + b.w / 14 + (i * b.w) / 7, y: 2.45, z: b.d / 2 + 0.55 });
        stripe.rotation.x = 0.35;
        g.add(stripe);
      }
      const sign = mesh(new THREE.BoxGeometry(2.2, 0.8, 0.12), M.wood, { y: b.h + 0.1, z: b.d / 2 + 0.2 });
      g.add(sign);
      const fishSign = mesh(new THREE.SphereGeometry(0.3, 8, 6), mat("#e0a832"), { y: b.h + 0.1, z: b.d / 2 + 0.3 });
      fishSign.scale.set(2, 0.9, 0.4);
      g.add(fishSign);
    }
    world.add(g);
  }

  // --- Wallboard ---------------------------------------------------------
  const wb = WORLD.wallboard;
  const board = new THREE.Group();
  board.position.set(wb.x, 0, wb.z);
  board.add(mesh(new THREE.BoxGeometry(wb.w, 2.4, 0.2), M.wood, { y: 1.8 }));
  board.add(mesh(new THREE.BoxGeometry(wb.w + 0.4, 0.22, 0.5), M.woodDark, { y: 3.1 }));
  for (const px of [-wb.w / 2 + 0.2, wb.w / 2 - 0.2]) board.add(mesh(new THREE.BoxGeometry(0.2, 3, 0.2), M.woodDark, { x: px, y: 1.5 }));
  const plaqueGeo = new THREE.BoxGeometry(0.62, 0.36, 0.06);
  const plaques = FISH.map((f, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const p = mesh(plaqueGeo, M.plaqueEmpty, { x: -1.6 + col * 0.8, y: 2.65 - row * 0.5, z: 0.12, cast: false });
    board.add(p);
    return p;
  });
  const plaqueMats = Object.fromEntries(FISH.map(f => [f.id, mat(f.art.color)]));
  world.add(board);

  // --- Vegetation / props -------------------------------------------------
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 1.2, 6);
  const canopyGeo = new THREE.IcosahedronGeometry(1, 0);
  const coneGeo = new THREE.ConeGeometry(1, 1.8, 6);
  WORLD.trees.forEach(([x, z, s], i) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = i * 1.7;
    g.add(mesh(trunkGeo, M.trunk, { y: 0.6 * s }));
    if (i % 3 === 0) {
      const c = mesh(coneGeo, M.leaf[2], { y: 2.0 * s });
      c.scale.setScalar(s);
      g.add(c);
      const c2 = mesh(coneGeo, M.leaf[2], { y: 2.9 * s });
      c2.scale.setScalar(s * 0.7);
      g.add(c2);
    } else {
      const c = mesh(canopyGeo, M.leaf[i % 2], { y: 1.9 * s });
      c.scale.set(1.25 * s, 1.1 * s, 1.25 * s);
      g.add(c);
    }
    world.add(g);
  });
  // Scenery trees outside the walkable area (east bank, north & west edge).
  const scenery = [];
  for (let i = 0; i < 14; i++) scenery.push([22 + (i % 4) * 4.5 + (i % 3), -24 + i * 3.4, 0.9 + (i % 3) * 0.2]);
  for (let i = 0; i < 12; i++) scenery.push([-40 + i * 5, -29 - (i % 2) * 2, 1.1 + (i % 2) * 0.3]);
  for (let i = 0; i < 8; i++) scenery.push([-41 - (i % 2) * 1.5, -22 + i * 4.5, 1.0 + (i % 3) * 0.2]);
  scenery.forEach(([x, z, s], i) => {
    const c = mesh(canopyGeo, M.leaf[i % 3], { x, y: 1.8 * s, z });
    c.scale.set(1.3 * s, 1.2 * s, 1.3 * s);
    world.add(c, mesh(trunkGeo, M.trunk, { x, y: 0.5, z }));
  });
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (const [x, z, s] of WORLD.rocks) {
    const r = mesh(rockGeo, M.stone, { x, y: 0.3 * s, z, ry: x });
    r.scale.set(s, 0.7 * s, s * 0.9);
    world.add(r);
  }
  // Flowers / grass tufts for texture
  const tuftGeo = new THREE.ConeGeometry(0.12, 0.45, 4);
  const flowerMats = [mat("#f2d06b"), mat("#e8a0b4"), mat("#f5f0e6"), M.grassDark];
  for (let i = 0; i < 70; i++) {
    const x = -34 + ((i * 37.3) % 46), z = -22 + ((i * 23.7) % 32);
    if (Math.hypot(x - lk.x, z - lk.z) < lk.r + 1.5) continue;
    world.add(mesh(tuftGeo, flowerMats[i % 4], { x, y: 0.2, z, cast: false }));
  }

  // Lamps (warm local lights at night)
  const lampLights = [];
  const lampPostGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6);
  const bulbGeo = new THREE.SphereGeometry(0.22, 8, 6);
  for (const [x, z] of WORLD.lamps) {
    world.add(mesh(lampPostGeo, M.woodDark, { x, y: 1.2, z }));
    world.add(mesh(bulbGeo, M.bulb, { x, y: 2.5, z, cast: false }));
    const light = new THREE.PointLight("#ffc46b", 0, 9, 1.6);
    light.position.set(x, 2.4, z);
    world.add(light);
    lampLights.push(light);
  }

  // Fishing-spot markers
  const spotGeo = new THREE.RingGeometry(0.55, 0.75, 24);
  const spotMarkers = INTERACTIONS.filter(i => i.type !== "shop" && i.type !== "board").map(it => {
    const m = mesh(spotGeo, M.spot, { x: it.x, y: 0.2, z: it.z, cast: false, receive: false });
    m.rotation.x = -Math.PI / 2;
    world.add(m);
    return m;
  });

  // Boats
  // Boat: pointed hull outline extruded upward, painted stripe, plank deck, mast + sail.
  const hullOutline = [[-1.1, -2.3], [1.1, -2.3], [1.15, 1.2], [0, 3.0], [-1.15, 1.2]];
  function hullGeo(scale, height) {
    const shape = new THREE.Shape(hullOutline.map(([x, z]) => new THREE.Vector2(x * scale, -z * scale)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }
  const boatGeos = { hull: hullGeo(1, 0.8), stripe: hullGeo(1.03, 0.14), deck: hullGeo(0.86, 0.06) };
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 1.2, -0.5, 0, 3.8, -0.5, 0, 1.2, 1.5], 3));
  sailGeo.computeVertexNormals();
  const sailMat = M.sail.clone();
  sailMat.side = THREE.DoubleSide;
  function makeBoat(scale = 1) {
    const g = new THREE.Group();
    g.add(mesh(boatGeos.hull, M.boatHull, { y: -0.3 }));
    g.add(mesh(boatGeos.stripe, M.boatTrim, { y: 0.2, cast: false }));
    g.add(mesh(boatGeos.deck, M.plank, { y: 0.47, cast: false }));
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 6), M.woodDark, { y: 2.2, z: -0.5 }));
    g.add(mesh(sailGeo, sailMat, { x: 0.05 }));
    g.scale.setScalar(scale);
    return g;
  }
  const mooredBoat = makeBoat(0.9);
  mooredBoat.position.set(WORLD.boatMooring.x, SEA_Y + 0.05, WORLD.boatMooring.z);
  mooredBoat.visible = false;
  world.add(mooredBoat);
  // Offshore anchored boat (the walkable deck area)
  const off = WORLD.offshore;
  const bigBoat = makeBoat(1.55);
  bigBoat.position.set(off.cx, SEA_Y - 0.12, off.cz - 0.3);
  world.add(bigBoat);
  // Distant islets offshore
  for (const [x, z, s] of [[-14, 70, 2.5], [16, 92, 3], [-20, 96, 2]]) {
    const isle = mesh(new THREE.CylinderGeometry(s, s * 1.3, 0.8, 7), M.sand, { x, y: SEA_Y, z, cast: false });
    world.add(isle, mesh(canopyGeo, M.leaf[0], { x, y: 1.4, z }));
  }

  // Water glints (gentle shimmer)
  const glintGeo = new THREE.PlaneGeometry(0.5, 0.08);
  const glintSpots = [];
  for (let i = 0; i < 70; i++) {
    const kind = i % 3;
    let x, y, z;
    if (kind === 0) { const a = i * 2.39, rr = (i % 7) / 7 * (lk.r - 1); x = lk.x + Math.cos(a) * rr; z = lk.z + Math.sin(a) * rr; y = 0.06; }
    else if (kind === 1) { x = WORLD.river.minX + 0.6 + (i * 1.37) % 5; z = -26 + (i * 3.1) % 42; y = RIVER_Y + 0.02; }
    else { x = -40 + (i * 7.3) % 70; z = 18 + (i * 5.9) % 70; y = SEA_Y + 0.02; }
    glintSpots.push({ x, y, z, phase: i * 0.77, flow: kind === 1 });
  }
  const glints = new THREE.InstancedMesh(glintGeo, M.glint, glintSpots.length);
  glints.frustumCulled = false;
  world.add(glints);

  // Fireflies at night
  const flyCount = 40;
  const flyGeo = new THREE.BufferGeometry();
  const flyPos = new Float32Array(flyCount * 3);
  const flySeeds = [];
  for (let i = 0; i < flyCount; i++) flySeeds.push([-30 + (i * 13.7) % 40, -20 + (i * 7.9) % 28, i * 0.61]);
  flyGeo.setAttribute("position", new THREE.BufferAttribute(flyPos, 3));
  const flyMat = new THREE.PointsMaterial({ color: "#ffe79a", size: 0.22, transparent: true, opacity: 0, depthWrite: false });
  const flies = new THREE.Points(flyGeo, flyMat);
  flies.frustumCulled = false;
  world.add(flies);

  // --- Player --------------------------------------------------------------
  const player = new THREE.Group();
  const body = new THREE.Group();
  player.add(body);
  body.add(mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.6, 8), M.pants, { y: 0.35 }));
  body.add(mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.65, 8), M.player, { y: 0.95 }));
  body.add(mesh(new THREE.SphereGeometry(0.32, 10, 8), M.skin, { y: 1.55 }));
  body.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 12), M.hat, { y: 1.78 }));
  body.add(mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.26, 10), M.hat, { y: 1.9 }));
  body.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), mat("#3a2c22"), { x: 0.11, y: 1.6, z: 0.29, cast: false }));
  body.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), mat("#3a2c22"), { x: -0.11, y: 1.6, z: 0.29, cast: false }));
  const rod = new THREE.Group();
  rod.position.set(0.35, 1.0, 0.2);
  const rodStick = mesh(new THREE.CylinderGeometry(0.03, 0.045, 2.6, 5), M.rod, { y: 1.3 });
  rod.add(rodStick);
  rod.rotation.x = 0.9;
  body.add(rod);
  const tip = new THREE.Object3D();
  tip.position.set(0, 2.6, 0);
  rod.add(tip);
  world.add(player);

  const bobber = new THREE.Group();
  bobber.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), M.bobber, { y: 0 }));
  bobber.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M.bobberTop, { y: 0.12 }));
  bobber.visible = false;
  world.add(bobber);
  const lineGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  const fishingLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: "#f5f0e6" }));
  fishingLine.frustumCulled = false;
  fishingLine.visible = false;
  world.add(fishingLine);
  const splashGeo = new THREE.RingGeometry(0.2, 0.3, 20);
  const splash = mesh(splashGeo, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false }), { cast: false, receive: false });
  splash.rotation.x = -Math.PI / 2;
  world.add(splash);

  // --- Frame state -------------------------------------------------------
  const camLook = new THREE.Vector3();
  const glintQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const tmpMatrix = new THREE.Matrix4();
  const tmpScale = new THREE.Vector3();
  const tmpPos = new THREE.Vector3();
  const tipWorld = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  let camInit = false;
  let viewHeight = 24;
  let shownFacing = Math.PI;
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    viewHeight = Math.max(22, 17 / aspect);
    camera.left = (-viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
  }

  function applyLighting(f) {
    let i = 0;
    while (i < KEYS.length - 2 && f >= KEYS[i + 1].f) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f)));
    const ca = KEY_COLORS[i], cb = KEY_COLORS[i + 1];
    scene.background.copy(ca.sky).lerp(cb.sky, t);
    sun.color.copy(ca.sun).lerp(cb.sun, t);
    sun.intensity = a.sunI + (b.sunI - a.sunI) * t;
    hemi.color.copy(ca.hemiSky).lerp(cb.hemiSky, t);
    hemi.groundColor.copy(ca.hemiGround).lerp(cb.hemiGround, t);
    hemi.intensity = a.hemiI + (b.hemiI - a.hemiI) * t;
    const lamps = a.lamps + (b.lamps - a.lamps) * t;
    for (const l of lampLights) l.intensity = lamps * 14;
    M.window.emissiveIntensity = lamps * 1.6;
    M.bulb.emissiveIntensity = 0.2 + lamps * 2.2;
    flyMat.opacity = Math.max(0, lamps - 0.3) * 1.2;
    // Sun arc: rises east at dawn, high by day, low west at dusk (long shadows), moon at night.
    const dayArc = f < 0.75 ? f / 0.75 : (f - 0.75) / 0.25;
    const ang = dayArc * Math.PI;
    const elev = f < 0.75 ? 0.25 + Math.sin(ang) * 0.9 : 0.6 + Math.sin(ang) * 0.5;
    tmpPos.set(Math.cos(ang) * 30, elev * 30, 12);
    return tmpPos;
  }

  function setWallboard(discovered) {
    FISH.forEach((f, i) => { plaques[i].material = discovered.includes(f.id) ? plaqueMats[f.id] : M.plaqueEmpty; });
  }

  function pickGround(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, hit) ? { x: hit.x, z: hit.z } : null;
  }

  /** Screen-space movement basis: returns world XZ for "up" and "right" on screen. */
  function screenAxes() {
    const fwd = new THREE.Vector3(-CAMERA_OFFSET.x, 0, -CAMERA_OFFSET.z).normalize();
    return { up: { x: fwd.x, z: fwd.z }, right: { x: -fwd.z, z: fwd.x } };
  }

  function render({ state, session, walking, dt, elapsed }) {
    const p = state.player;
    // Player
    player.position.set(p.x, p.area === "offshore" ? 0.35 : 0.18, p.z);
    let dFacing = p.facing - shownFacing;
    dFacing = Math.atan2(Math.sin(dFacing), Math.cos(dFacing));
    shownFacing += dFacing * Math.min(1, dt * 12);
    player.rotation.y = shownFacing;
    body.position.y = walking ? Math.abs(Math.sin(elapsed * 11)) * 0.12 : Math.sin(elapsed * 2) * 0.02;
    body.rotation.z = walking ? Math.sin(elapsed * 11) * 0.05 : 0;

    // Fishing line + bobber
    if (session && session.phase !== "done") {
      const spot = session.spot;
      const bx = spot.x + Math.sin(spot.facing) * CAST_DISTANCE;
      const bz = spot.z + Math.cos(spot.facing) * CAST_DISTANCE;
      const waterY = spot.location === "lake" ? 0.06 : spot.location === "river" ? RIVER_Y + 0.04 : SEA_Y + 0.04;
      const castT = session.phase === "cast" ? Math.min(1, session.t / session.castMs) : 1;
      let by = waterY + Math.sin(elapsed * 2.5) * 0.04;
      let ox = 0, oz = 0;
      if (session.phase === "cast") by = waterY + Math.sin(castT * Math.PI) * 2.5;
      if (session.phase === "bite") by = waterY - 0.14 + Math.sin(elapsed * 30) * 0.06;
      if (session.phase === "fight") {
        const lane = session.fight.fishPos - 0.5;
        ox = Math.cos(spot.facing) * lane * 2.4;
        oz = -Math.sin(spot.facing) * lane * 2.4;
        by = waterY - 0.05 + Math.sin(elapsed * 18) * 0.05;
      }
      bobber.visible = true;
      bobber.position.set(p.x + (bx + ox - p.x) * castT, by, p.z + (bz + oz - p.z) * castT);
      rod.rotation.x = session.phase === "fight" ? 0.35 + (session.fight && session.reelHeld ? -0.25 : 0) : session.phase === "cast" ? 0.9 - castT * 0.6 : 0.5;
      tip.getWorldPosition(tipWorld);
      const arr = lineGeo.attributes.position.array;
      arr[0] = tipWorld.x; arr[1] = tipWorld.y; arr[2] = tipWorld.z;
      arr[3] = bobber.position.x; arr[4] = bobber.position.y + 0.1; arr[5] = bobber.position.z;
      lineGeo.attributes.position.needsUpdate = true;
      fishingLine.visible = true;
      if (session.phase === "bite") {
        const k = (session.t % 450) / 450;
        splash.position.set(bobber.position.x, waterY + 0.01, bobber.position.z);
        splash.scale.setScalar(1 + k * 3);
        splash.material.opacity = 0.8 * (1 - k);
      } else splash.material.opacity = 0;
    } else {
      bobber.visible = false;
      fishingLine.visible = false;
      splash.material.opacity = 0;
      rod.rotation.x = 0.9;
    }

    mooredBoat.visible = state.boatOwned && p.area === "land";
    mooredBoat.position.y = SEA_Y + 0.05 + Math.sin(elapsed * 1.3) * 0.05;
    bigBoat.position.y = SEA_Y - 0.12 + Math.sin(elapsed * 1.1) * 0.04;
    bigBoat.rotation.z = Math.sin(elapsed * 0.9) * 0.015;
    for (const m of spotMarkers) m.material.opacity = 0.3 + Math.sin(elapsed * 2) * 0.15;

    // Water shimmer
    glintSpots.forEach((g, i) => {
      const s = Math.max(0, Math.sin(elapsed * 1.3 + g.phase));
      const z = g.flow ? -26 + ((g.z + 26 + elapsed * 1.2) % 42) : g.z;
      tmpPos.set(g.x, g.y, z);
      tmpScale.set(0.2 + s, 1, 1);
      tmpMatrix.compose(tmpPos, glintQuat, tmpScale);
      glints.setMatrixAt(i, tmpMatrix);
    });
    glints.instanceMatrix.needsUpdate = true;

    // Fireflies
    if (flyMat.opacity > 0) {
      for (let i = 0; i < flyCount; i++) {
        const [fx, fz, ph] = flySeeds[i];
        flyPos[i * 3] = fx + Math.sin(elapsed * 0.4 + ph) * 1.5;
        flyPos[i * 3 + 1] = 0.8 + Math.sin(elapsed * 1.1 + ph * 3) * 0.4;
        flyPos[i * 3 + 2] = fz + Math.cos(elapsed * 0.35 + ph) * 1.5;
      }
      flyGeo.attributes.position.needsUpdate = true;
    }

    // Lighting from time of day
    const sunDir = applyLighting(dayFraction(state.timeMs));

    // Camera follows the player with gentle easing (snaps when changing areas).
    camTarget.set(p.x, 0, p.z).add(CAMERA_OFFSET);
    if (!camInit || camera.position.distanceTo(camTarget) > 30) {
      camera.position.copy(camTarget);
      camInit = true;
    } else {
      camera.position.lerp(camTarget, 1 - Math.exp(-dt * 6));
    }
    camLook.copy(camera.position).sub(CAMERA_OFFSET);
    camera.lookAt(camLook);
    sun.target.position.copy(camLook);
    sun.position.copy(camLook).add(sunDir);

    renderer.render(scene, camera);
  }

  resize();
  return { render, resize, pickGround, screenAxes, setWallboard, renderer };
}
