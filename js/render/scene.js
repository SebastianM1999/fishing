// Three.js view of the game state. Holds no gameplay rules; reads plain state each frame.
import * as THREE from "three";
import { WORLD, CAST_DISTANCE, NPCS, INTERACTIONS } from "../game/world.js";
import { FISH_BY_ID, BOAT_PRICE, TRAWLER } from "../game/content.js";
import { dayFraction, bucketProgress } from "../game/time.js";
import { createMaterials, TIME, WAVE_GAIN, TRENCH_GAIN, TRENCH_WAVES, G, Kit, Batch, GroupSink, waveHeight } from "./kit.js";
import { buildTrench } from "./trench.js";
import { buildEnvironment, buildHome, SEA_Y, RIVER_Y, LAKE_Y } from "./environment.js";
import * as models from "./models.js";
import { createBoardTexture, createSignTexture } from "./textures.js";

const CAMERA_OFFSET = new THREE.Vector3(9, 26, 22);
const LINE_POINTS = 14;

// Day palette keyframes over the 0..1 day (Dawn .00-.25, Day .25-.50, Dusk .50-.75, Night .75-1).
const KEYS = [
  { f: 0.0, sky: "#6a6f9a", sun: "#ffb894", sunI: 0.9, hemiSky: "#8594c4", hemiGround: "#4a4656", hemiI: 0.85, lamps: 0.6 },
  { f: 0.08, sky: "#f1b69c", sun: "#ffc79a", sunI: 1.3, hemiSky: "#8fa6d4", hemiGround: "#6a5a64", hemiI: 0.85, lamps: 0.15 },
  { f: 0.2, sky: "#f6d8b4", sun: "#ffe0b8", sunI: 2.0, hemiSky: "#b8cfe6", hemiGround: "#7b7a5a", hemiI: 0.95, lamps: 0 },
  { f: 0.35, sky: "#aedcee", sun: "#fff6e6", sunI: 2.6, hemiSky: "#dcecf6", hemiGround: "#7e8c58", hemiI: 1.05, lamps: 0 },
  { f: 0.48, sky: "#b6dbe6", sun: "#ffe7bf", sunI: 2.4, hemiSky: "#d6e6ee", hemiGround: "#80845a", hemiI: 1.0, lamps: 0 },
  { f: 0.6, sky: "#f4a07a", sun: "#ff9a5a", sunI: 1.9, hemiSky: "#e0a8b6", hemiGround: "#5e4a52", hemiI: 0.8, lamps: 0.2 },
  { f: 0.71, sky: "#9a5f86", sun: "#ff7c6a", sunI: 1.0, hemiSky: "#8c6c9c", hemiGround: "#3e3448", hemiI: 0.65, lamps: 0.8 },
  { f: 0.8, sky: "#1d2850", sun: "#a8b8ff", sunI: 0.65, hemiSky: "#3a5088", hemiGround: "#1c2234", hemiI: 0.65, lamps: 1 },
  { f: 0.95, sky: "#1a2448", sun: "#a8b8ff", sunI: 0.65, hemiSky: "#3a5088", hemiGround: "#1c2234", hemiI: 0.65, lamps: 1 },
  { f: 1.0, sky: "#6a6f9a", sun: "#ffb894", sunI: 0.9, hemiSky: "#8594c4", hemiGround: "#4a4656", hemiI: 0.85, lamps: 0.6 },
];
// Sun/moon direction per bucket: dawn low east, day high, dusk low west (long shadows), night moon.
const SUN_DIRS = [[26, 12, 10], [9, 30, 14], [-26, 12, 10], [-10, 26, 14]].map(v => new THREE.Vector3(...v));
const SUN_BLEND = 0.08; // fraction of a bucket (~15 s) spent blending into the next direction

const KEY_COLORS = KEYS.map(k => ({
  sky: new THREE.Color(k.sky), sun: new THREE.Color(k.sun),
  hemiSky: new THREE.Color(k.hemiSky), hemiGround: new THREE.Color(k.hemiGround),
}));

const damp = (cur, target, k) => cur + (target - cur) * k;

// Weather look targets (eased in over a few seconds): overcast dimming, rain amount, fog haze, storm extras.
const WEATHER_LOOK = {
  clear: { cloud: 0, rain: 0, fog: 0, storm: 0 },
  rain: { cloud: 0.4, rain: 0.45, fog: 0.1, storm: 0 },
  fog: { cloud: 0.3, rain: 0, fog: 1, storm: 0 },
  storm: { cloud: 0.9, rain: 1, fog: 0.3, storm: 1 },
};
const RAIN_DROPS = 700, RAIN_BOX = 26, RAIN_TOP = 20;
// The Deep Trench always looks stormy: overcast, drizzle, haze and lightning, whatever the forecast.
const TRENCH_LOOK = { cloud: 0.8, rain: 0.45, fog: 0.35, storm: 0.8 };
const TRENCH_TINT = new THREE.Color("#1c2a34");

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#aedcee");
  scene.fog = new THREE.Fog("#aedcee", 1000, 2000); // weather haze; always present so shaders never recompile

  // Rain: short streaks in a box that follows the camera focus.
  const wx = { cloud: 0, rain: 0, fog: 0, storm: 0, flash: 0, nextBolt: 0 };
  const rainPos = new Float32Array(RAIN_DROPS * 6), rainDrop = new Float32Array(RAIN_DROPS * 3);
  for (let i = 0; i < RAIN_DROPS; i++) rainDrop.set([(Math.random() * 2 - 1) * RAIN_BOX, Math.random() * RAIN_TOP, (Math.random() * 2 - 1) * RAIN_BOX], i * 3);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: "#dbe6f0", transparent: true, opacity: 0, depthWrite: false, fog: false }));
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);
  const greyTmp = new THREE.Color(), WHITE = new THREE.Color("#ffffff");
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);

  const hemi = new THREE.HemisphereLight("#dcecf6", "#7e8c58", 1);
  const sun = new THREE.DirectionalLight("#fff6e6", 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 120 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  const M = createMaterials();
  const env = buildEnvironment(M);
  scene.add(env.root);

  // Home interior: collection board with real portraits and the trophy shelf.
  const home = buildHome(M);
  scene.add(home.root);
  const board = createBoardTexture();
  const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.46), new THREE.MeshStandardMaterial({ map: board.texture, roughness: 0.9 }));
  boardMesh.position.copy(home.boardPos);
  scene.add(boardMesh);
  const trophyGroups = home.trophySlots.map(pos => { const g = new THREE.Group(); g.position.copy(pos); scene.add(g); return g; });
  const HOME_LIGHT = { sky: new THREE.Color("#ffe6c4"), ground: new THREE.Color("#6a4a30"), sun: new THREE.Color("#ffd9a8"), bg: new THREE.Color("#2a1d14"), dir: new THREE.Vector3(9, 30, 14) };

  // Village notice board (where the collection used to hang)
  {
    const nb = WORLD.noticeboard;
    const tex = createSignTexture([["VILLAGE", 56], ["NOTICES", 56], ["Orders & rumours", 30]], { width: 640, height: 320, bg: "#f7efdf", border: "#7a5638", fg: "#5a3e24" });
    const notice = new THREE.Mesh(new THREE.PlaneGeometry(nb.w - 0.15, 2.3), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    notice.position.set(nb.x, 1.95, nb.z + 0.09);
    notice.receiveShadow = true;
    scene.add(notice);
  }

  // Night lamps
  const lampLights = WORLD.lamps.map(([x, z]) => {
    const l = new THREE.PointLight("#ffc46b", 0, 10, 1.6);
    l.position.set(x + 0.58, 2.1, z);
    scene.add(l);
    return l;
  });

  // Boats + offshore islets
  const mooredBoat = models.makeBoat(M, 0.9);
  mooredBoat.position.set(WORLD.boatMooring.x, SEA_Y + 0.05, WORLD.boatMooring.z);
  scene.add(mooredBoat);
  const forSale = new THREE.Group();
  {
    const fk = new Kit(new GroupSink(forSale));
    fk.part(G.box(0.12, 1.9, 0.12), M.woodDark, [0, 0.95, 0]);
    const tex = createSignTexture([["FOR SALE", 64], ["Small fishing boat", 30], [`${BOAT_PRICE} coins`, 38]], { bg: "#f7efdf", border: "#3f6e8c" });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 0.06), [M.woodDark, M.woodDark, M.woodDark, M.woodDark, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), M.woodDark]);
    board.position.set(0, 1.75, 0.07);
    board.castShadow = true;
    forSale.add(board);
    forSale.position.set(5.25, 0.1, 19.6);
    forSale.rotation.y = 0.5;
  }
  scene.add(forSale);

  // Surf: foam strips that roll up the beach slope and fade, staggered in time.
  const beachSlopeY = z => Math.max(SEA_Y + 0.02, -0.15 - 0.266 * (z - (WORLD.land.maxZ + 1.1)));
  const surf = [0, 1, 2].map(i => {
    const geo = new THREE.PlaneGeometry(WORLD.land.maxX + 44, 1, 90, 1); // beach width only
    const pos = geo.attributes.position; // wavy, uneven wash front
    for (let v = 0; v < pos.count; v++) pos.setY(v, pos.getY(v) + Math.sin(pos.getX(v) * 0.45 + i * 2.1) * 0.3 + Math.sin(pos.getX(v) * 1.3 + i) * 0.12);
    const m = new THREE.Mesh(geo, M.foam.clone());
    m.rotation.x = -Math.PI / 2 + 0.26;
    m.position.x = (WORLD.land.maxX - 44) / 2;
    scene.add(m);
    return m;
  });

  const off = WORLD.offshore;
  const bigBoat = models.makeBoat(M, 1.55);
  bigBoat.position.set(off.cx, SEA_Y - 0.12, off.cz - 0.3);
  scene.add(bigBoat);

  // Deep Trench: its seascape, the Ironhull Trawler out there, and the same trawler moored at the end of the dock.
  const trench = buildTrench(M);
  scene.add(trench.root);
  const tc = WORLD.trench;
  const trawler = models.makeTrawler(M, 1);
  trawler.position.set(tc.cx, SEA_Y - 0.3, tc.cz);
  scene.add(trawler);
  trench.floodlight.position.set(0, 4.3, -2.6);
  trawler.add(trench.floodlight);
  const mooredTrawler = models.makeTrawler(M, 0.8);
  mooredTrawler.position.set(WORLD.trawlerMooring.x, SEA_Y - 0.25, WORLD.trawlerMooring.z);
  scene.add(mooredTrawler);
  // Until it's repaired, the trawler lies run aground at the old pier: listing, low in the water, with a sign.
  const repairSign = new THREE.Group();
  {
    const rk = new Kit(new GroupSink(repairSign));
    rk.part(G.box(0.12, 1.7, 0.12), M.woodDark, [0, 0.85, 0]);
    const tex = createSignTexture([["WRECKED", 58], [TRAWLER.name, 26], [`Repair: ${TRAWLER.price} coins`, 30]], { bg: "#f2e6cc", border: "#8a3a30" });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 0.06), [M.woodDark, M.woodDark, M.woodDark, M.woodDark, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), M.woodDark]);
    board.position.set(0, 1.6, 0.07);
    board.rotation.z = 0.08;
    board.castShadow = true;
    repairSign.add(board);
    repairSign.position.set(-25.2, 0.12, 23.6);
    repairSign.rotation.y = -0.5;
  }
  scene.add(repairSign);
  const owned = { trawler: false };
  // Harpoon rack on the old pier: a little stand with harpoons.
  const rack = new THREE.Group();
  {
    const rk = new Kit(new GroupSink(rack));
    rk.part(G.box(0.12, 1.4, 0.9), M.woodDark, [0, 0.7, 0]);
    rk.part(G.box(0.5, 0.1, 1.0), M.woodDark, [0.15, 0.05, 0]);
    rk.part(G.box(0.3, 0.08, 0.9), M.woodLight, [0.1, 1.1, 0]);
    for (const z of [-0.3, 0, 0.3]) {
      rk.part(G.cyl(0.03, 0.03, 1.9, 5), M.woodLight, [0.12, 0.95, z], [0, 0, -0.08]);
      rk.part(G.cone(0.06, 0.26, 4), M.metal, [0.04, 2.0, z], [0, 0, -0.08]);
    }
    rack.position.set(WORLD.harpoonRack.x, 0.18, WORLD.harpoonRack.z);
  }
  scene.add(rack);
  // Markers for the spots on the boats ride with the deck (children of the boat, undoing its scale).
  const boatMarkers = [];
  for (const [boat, area, deckY] of [[bigBoat, "offshore", 0.84], [trawler, "trench", models.TRAWLER_DECK]]) {
    const s = boat.scale.x;
    for (const it of INTERACTIONS.filter(i => i.area === area)) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 24).rotateX(-Math.PI / 2), M.spot);
      m.position.set((it.x - boat.position.x) / s, (deckY + 0.04) / s, (it.z - boat.position.z) / s);
      m.scale.setScalar(1 / s);
      boat.add(m);
      boatMarkers.push(m);
    }
  }
  const DECK_Y = { offshore: 0.24 - SEA_Y, trench: models.TRAWLER_DECK };

  // Harpoon round visuals: the giant, its spout, a thrown harpoon and the harpoon in the player's hands.
  const giants = new Map();
  let giantShown = null;
  const giantOf = id => {
    if (!giants.has(id)) { const g = models.makeGiant(FISH_BY_ID[id].art); g.visible = false; scene.add(g); giants.set(id, g); }
    return giants.get(id);
  };
  const SPOUT = 48;
  const spoutPos = new Float32Array(SPOUT * 3), spoutVel = new Float32Array(SPOUT * 3), spoutLife = new Float32Array(SPOUT);
  const spoutGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(spoutPos, 3));
  const spout = new THREE.Points(spoutGeo, new THREE.PointsMaterial({ color: "#f4faff", size: 8, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false }));
  spout.frustumCulled = false;
  scene.add(spout);
  let spoutCursor = 0;
  function blow(x, y, z) {
    for (let i = 0; i < 16; i++) {
      const j = spoutCursor++ % SPOUT;
      spoutPos.set([x, y, z], j * 3);
      spoutVel.set([(Math.random() - 0.5) * 1.4, 5 + Math.random() * 2.5, (Math.random() - 0.5) * 1.4], j * 3);
      spoutLife[j] = 1 + Math.random() * 0.4;
    }
  }
  const flyingHarpoon = models.makeHarpoon(M);
  flyingHarpoon.visible = false;
  scene.add(flyingHarpoon);
  const stuckHarpoons = Array.from({ length: 5 }, () => { const h = models.makeHarpoon(M); h.scale.setScalar(0.8); h.visible = false; scene.add(h); return h; });
  const isleBatch = new Batch();
  const ik = new Kit(isleBatch);
  [[-14, 70, 2.5], [16, 92, 3], [-20, 96, 2], [22, 66, 1.6]].forEach(([x, z, s], i) => {
    ik.part(G.cyl(s, s * 1.35, 1, 9), M.sand, [x, SEA_Y, z]);
    ik.part(G.cyl(s * 0.7, s, 0.4, 9), M.grass, [x, SEA_Y + 0.6, z]);
    ik.push(x, SEA_Y + 0.7, z, i); models.tree(ik, M, i % 2 ? "pine" : "oak", 0.8); ik.pop();
    ik.push(x + s * 0.6, SEA_Y + 0.5, z + s * 0.4); models.rock(ik, M, 0.5, i); ik.pop();
  });
  scene.add(isleBatch.build());

  // Player, rod line, bobber, splash
  const P = models.makePlayer();
  scene.add(P.root);
  const heldHarpoon = models.makeHarpoon(M);
  heldHarpoon.visible = false;

  // Villagers: turn their heads toward the player and wave hello when they come close.
  const npcs = NPCS.map(n => {
    const rig = models.makeCharacter(models.OUTFITS[n.outfit]);
    rig.root.position.set(n.x, n.x > 2.9 && n.z > 15 ? 0.2 : 0.02, n.z);
    rig.root.rotation.y = n.facing;
    scene.add(rig.root);
    return { n, rig, near: false, waveUntil: 0, look: 0, phase: Math.random() * 6 };
  });
  // "!" over Nell when an order can be handed in.
  const questMark = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#f7c748"; g.strokeStyle = "#7a4d06"; g.lineWidth = 8;
    g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#5a3a06"; g.font = "900 84px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("!", 64, 70);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    s.scale.setScalar(0.9);
    s.renderOrder = 5;
    s.visible = false;
    scene.add(s);
    return s;
  })();
  const courier = npcs.find(c => c.n.id === "courier");

  function animateNpcs(p, dt, t, busy) {
    const k = 1 - Math.exp(-dt * 6);
    for (const npc of npcs) {
      const { n, rig } = npc;
      const dx = p.x - n.x, dz = p.z - n.z, dist = p.area === "land" ? Math.hypot(dx, dz) : Infinity;
      const near = dist < 4.5;
      if (near && !npc.near && !busy) npc.waveUntil = t + 2.4;
      npc.near = near;
      let yaw = 0;
      if (dist < 8) { yaw = Math.atan2(dx, dz) - n.facing; yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw)); yaw = Math.max(-1.1, Math.min(1.1, yaw)); }
      npc.look += (yaw - npc.look) * k;
      rig.head.rotation.y = npc.look;
      rig.torso.rotation.y = npc.look * 0.25;
      rig.torso.scale.y = 1 + Math.sin(t * 2 + npc.phase) * 0.012;
      const waving = t < npc.waveUntil;
      const [armL, armR] = rig.arms;
      armR.arm.rotation.x += ((waving ? -2.8 : n.outfit === "shopkeeper" ? -0.55 : 0.05) - armR.arm.rotation.x) * k;
      armR.arm.rotation.z = waving ? 0.35 + Math.sin(t * 9) * 0.3 : armR.arm.rotation.z * (1 - k) + 0.08 * k;
      armR.fore.rotation.x = waving ? -0.3 : n.outfit === "shopkeeper" ? -0.9 : -0.15;
      armL.arm.rotation.x += ((n.outfit === "shopkeeper" ? -0.55 : 0.05) - armL.arm.rotation.x) * k;
      armL.arm.rotation.z = n.outfit === "sailor" ? 0.9 : -0.08; // captain: hand on hip
      armL.fore.rotation.x = n.outfit === "shopkeeper" ? -0.9 : n.outfit === "sailor" ? -1.5 : -0.15;
    }
  }
  const bobber = new THREE.Group();
  const bk = new Kit({ add: (geo, mat, m) => { const x = new THREE.Mesh(geo, mat); m.decompose(x.position, x.quaternion, x.scale); bobber.add(x); } });
  bk.part(G.sphere(0.16, 10, 8), M.red, [0, 0, 0]);
  bk.part(G.sphere(0.12, 10, 8), M.white, [0, 0.1, 0]);
  bk.part(G.cyl(0.02, 0.02, 0.25, 4), M.black, [0, 0.25, 0]);
  bobber.visible = false;
  scene.add(bobber);
  const lineGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(LINE_POINTS * 3), 3));
  const fishingLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: "#f5f0e6", transparent: true, opacity: 0.9 }));
  fishingLine.frustumCulled = false;
  scene.add(fishingLine);
  const splash = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false }));
  const splash2 = splash.clone();
  splash2.material = splash.material.clone();
  scene.add(splash, splash2);

  // Ambient life
  const ducks = [0, 1].map(() => { const d = models.makeDuck(); scene.add(d); return d; });
  const gulls = [[-4, 26, 9, 6.5], [6, 30, 6, 7.5], [0, 80, 7, 6], [3, 76, 10, 7]].map(([cx, cz, r, h], i) => {
    const g = models.makeGull(); g.userData.orbit = { cx, cz, r, h, phase: i * 1.7 }; scene.add(g); return g;
  });
  const butterflies = ["#f2cf5b", "#e8a0b4", "#ffffff", "#9fc3ea", "#f29b5b"].map((c, i) => {
    const b = models.makeButterfly(c);
    const home = WORLD.props.filter(p => p[0] === "flowerbed")[i % 4];
    b.userData.home = { x: home[1], z: home[2], phase: i * 1.3 };
    scene.add(b);
    return b;
  });
  const smoke = Array.from({ length: 8 }, (_, i) => { const s = new THREE.Mesh(G.ico(0.35, 0), M.smoke.clone()); s.userData.phase = i / 8; scene.add(s); return s; });
  const flyCount = 46;
  const flyPos = new Float32Array(flyCount * 3);
  const flySeeds = Array.from({ length: flyCount }, (_, i) => [-32 + ((i * 13.7) % 42), -20 + ((i * 7.9) % 28), i * 0.61]);
  const flyGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(flyPos, 3));
  const flyMat = new THREE.PointsMaterial({ color: "#ffe79a", size: 0.24, transparent: true, opacity: 0, depthWrite: false });
  const flies = new THREE.Points(flyGeo, flyMat);
  flies.frustumCulled = false;
  scene.add(flies);

  // Water glints
  const lk = WORLD.lake;
  const glintSpots = Array.from({ length: 80 }, (_, i) => {
    const kind = i % 3;
    if (kind === 0) { const a = i * 2.39, rr = ((i % 7) / 7) * (lk.r - 1); return { x: lk.x + Math.cos(a) * rr, y: LAKE_Y + 0.08, z: lk.z + Math.sin(a) * rr, phase: i * 0.77 }; }
    if (kind === 1) return { x: WORLD.river.minX + 0.6 + ((i * 1.37) % 5), y: RIVER_Y + 0.08, z: -26 + ((i * 3.1) % 42), phase: i * 0.77, flow: true };
    return { x: -40 + ((i * 7.3) % 70), y: SEA_Y + 0.14, z: 18 + ((i * 5.9) % 70), phase: i * 0.77 };
  });
  const glints = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.08), M.glint, glintSpots.length);
  glints.frustumCulled = false;
  scene.add(glints);

  // --- Frame state ----------------------------------------------------------------
  const tmp = { m: new THREE.Matrix4(), p: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2) };
  const tipWorld = new THREE.Vector3();
  const camTarget = new THREE.Vector3(), camLook = new THREE.Vector3(), sunDir = SUN_DIRS[1].clone();
  const lightBasis = { dir: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() }, shadowFocus = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let camInit = false, shownFacing = Math.PI, walkPhase = 0, heldSpecies = null, footstep = false;
  const pose = { legL: 0, legR: 0, armLx: 0, armLz: 0, armRx: 0, armRz: 0, foreL: 0, foreR: 0, torsoX: 0, headX: 0, headY: 0, bodyY: 0 };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const viewHeight = Math.max(19, 15 / aspect);
    Object.assign(camera, { left: (-viewHeight * aspect) / 2, right: (viewHeight * aspect) / 2, top: viewHeight / 2, bottom: -viewHeight / 2 });
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
    M.lampGlass.emissiveIntensity = 0.2 + lamps * 2.2;
    flyMat.opacity = Math.max(0, lamps - 0.3) * 1.2;
    return lamps;
  }

  function setWallboard(discovered) { board.draw(discovered); }

  let trophyKey = "";
  function setTrophies(trophies) {
    const key = trophies.map(t => t?.uid ?? "-").join();
    if (key === trophyKey) return;
    trophyKey = key;
    trophies.forEach((t, i) => {
      trophyGroups[i].clear();
      if (!t) return;
      const f = models.makeHeldFish(FISH_BY_ID[t.speciesId].art);
      f.scale.setScalar(2.1);
      f.rotation.y = 0;
      trophyGroups[i].add(f);
    });
  }

  // Collection milestone rewards: pennants at home, a weathervane on the roof, golden bobber and hat band.
  const gold = new THREE.MeshStandardMaterial({ color: "#f2c24a", roughness: 0.3, metalness: 0.6, flatShading: true });
  const pennants = new THREE.Group();
  {
    // Bunting across the back wall above the trophy shelf: one pennant per location completed.
    const h = WORLD.home, x0 = h.cx + 1.2, x1 = h.cx + 5.2, y = 3.02, z = h.minZ + 0.3;
    const string = new THREE.Mesh(G.box(x1 - x0 + 0.4, 0.02, 0.02), M.woodDark);
    string.position.set((x0 + x1) / 2, y + 0.02, z);
    pennants.add(string);
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.36, 0, 0), new THREE.Vector3(0.36, 0, 0), new THREE.Vector3(0, -0.5, 0)]);
      geo.computeVertexNormals();
      const flag = new THREE.Mesh(geo, mat);
      flag.position.set(x0 + (i * (x1 - x0)) / 4, y, z);
      flag.userData.mat = mat;
      flag.visible = false;
      pennants.add(flag);
    }
    string.userData.isString = true;
  }
  scene.add(pennants);
  const vane = new THREE.Group();
  {
    const vk = new Kit(new GroupSink(vane));
    vk.part(G.cyl(0.04, 0.05, 1.1, 5), M.metal, [0, 0.55, 0]);
    vk.part(G.box(0.8, 0.04, 0.04), M.metal, [0, 0.62, 0]);
    vk.part(G.box(0.04, 0.04, 0.8), M.metal, [0, 0.62, 0]);
    const fish = new THREE.Group();
    const fk = new Kit(new GroupSink(fish));
    fk.part(G.sphere(0.22, 8, 6), gold, [0, 0, 0], [0, 0, 0], [1.8, 0.8, 0.3]);
    fk.part(G.cone(0.18, 0.3, 4), gold, [-0.48, 0, 0], [0, 0, Math.PI / 2], [1, 1, 0.3]);
    fish.position.y = 1.2;
    vane.add(fish);
    vane.userData.fish = fish;
    vane.position.set(-8 + 2, 5.9, -10);
    vane.visible = false;
  }
  scene.add(vane);
  // Harpooneer milestone: a carved wooden whale hanging from the rafters over the rug, like a ship's mobile.
  const carvedWhale = new THREE.Group();
  {
    const w = models.makeGiant({ color: "#b98a58", fin: "#8a6242", belly: "#d8b484", flippers: true });
    w.scale.setScalar(0.21);
    carvedWhale.add(w);
    const ck = new Kit(new GroupSink(carvedWhale));
    for (const x of [-0.55, 0.45]) ck.part(G.cyl(0.012, 0.012, 1.2, 4), M.rope, [x, 0.78, 0]);
  }
  carvedWhale.position.set(WORLD.home.cx + 0.2, 2.55, WORLD.home.cz + 0.3);
  carvedWhale.visible = false;
  scene.add(carvedWhale);
  const bobberRed = bobber.children[0].material;
  function setMilestones(fx) {
    pennants.children.filter(f => !f.userData.isString).forEach((f, i) => { f.visible = i < fx.pennants.length; if (f.visible) f.userData.mat.color.set(fx.pennants[i]); });
    pennants.children[0].visible = fx.pennants.length > 0;
    vane.visible = fx.weathervane;
    carvedWhale.visible = fx.carvedWhale;
    bobber.children[0].material = fx.goldenBobber ? gold : bobberRed;
    P.materials.band.color.set(fx.goldenBand ? "#f2c24a" : "#b8433a");
  }

  function setUnlocked(unlocked) {
    for (const [id, b] of Object.entries(env.barriers)) b.group.visible = !unlocked.includes(id);
  }

  function pickGround(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, hit) ? { x: hit.x, z: hit.z } : null;
  }

  function screenAxes() {
    const fwd = new THREE.Vector3(-CAMERA_OFFSET.x, 0, -CAMERA_OFFSET.z).normalize();
    return { up: { x: fwd.x, z: fwd.z }, right: { x: -fwd.z, z: fwd.x } };
  }

  // --- Player animation ------------------------------------------------------------
  function animatePlayer(mode, session, dt, t) {
    const target = { legL: 0, legR: 0, armLx: 0.05 * Math.sin(t), armLz: -0.08, armRx: 0.05 * Math.sin(t + 1), armRz: 0.08, foreL: -0.15, foreR: -0.15, torsoX: 0, headX: 0, headY: Math.sin(t * 0.45) * 0.35, bodyY: 0 };
    if (mode === "walk") {
      const before = walkPhase;
      walkPhase += dt * 11;
      // A foot lands at each half cycle of the leg swing.
      if (Math.floor(before / Math.PI) !== Math.floor(walkPhase / Math.PI)) footstep = true;
      const s = Math.sin(walkPhase);
      Object.assign(target, { legL: s * 0.65, legR: -s * 0.65, armLx: -s * 0.55, armRx: s * 0.55, foreL: -0.4, foreR: -0.4, headY: 0, bodyY: Math.abs(Math.cos(walkPhase)) * 0.07, torsoX: 0.06 });
    } else if (mode === "cast") {
      const c = Math.min(1, session.t / session.castMs);
      Object.assign(target, { armRx: -2.7 + c * 1.9, armRz: 0.1, foreR: -0.3, armLx: -0.7, armLz: 0.35, foreL: -0.6, torsoX: 0.12 - c * 0.2, headX: 0.05, headY: 0 });
    } else if (mode === "wait" || mode === "bite") {
      const j = mode === "bite" ? Math.sin(t * 45) * 0.08 : 0;
      Object.assign(target, { armRx: -0.85 + j, foreR: -0.45, armLx: -0.95, armLz: 0.5, foreL: -0.95 + Math.sin(t * 1.5) * 0.05, headX: 0.18, headY: 0 });
    } else if (mode === "fight") {
      const held = session.reelHeld;
      Object.assign(target, {
        torsoX: -0.2, armRx: -1.1 + (held ? Math.sin(t * 12) * 0.12 : 0), foreR: -0.55,
        armLx: -1.0, armLz: 0.5, foreL: held ? -1.2 + Math.sin(t * 16) * 0.55 : -1.0, headX: 0.1, headY: 0,
        legL: 0.25, legR: -0.35, bodyY: held ? -0.03 : 0,
      });
    } else if (mode === "harpoon") {
      // Harpoon raised over the shoulder; the arm swings through when a throw is in the air.
      const thrown = !!session.harpoon?.flight;
      Object.assign(target, thrown
        ? { armRx: -1.3, armRz: 0.1, foreR: -0.2, armLx: -0.6, armLz: 0.3, foreL: -0.5, torsoX: 0.25, headX: 0.1, headY: 0, legL: 0.35, legR: -0.3 }
        : { armRx: -2.9, armRz: 0.2, foreR: -0.9, armLx: -1.2, armLz: 0.35, foreL: -0.4, torsoX: -0.12, headX: 0.05, headY: 0, legL: -0.3, legR: 0.35 });
    } else if (mode === "celebrate") {
      Object.assign(target, { armLx: -2.95, armLz: 0.15, foreL: -0.2, armRx: -2.5, armRz: 0.35, foreR: -0.2, headX: -0.25, headY: 0, bodyY: Math.abs(Math.sin(t * 7)) * 0.25 });
    } else if (mode === "sad") {
      Object.assign(target, { armLx: 0.15, armRx: -0.4, foreR: -0.3, headX: 0.4, headY: 0, torsoX: 0.12 });
    }
    const k = 1 - Math.exp(-dt * (mode === "walk" ? 18 : 10));
    for (const key in pose) pose[key] = damp(pose[key], target[key], k);
    P.legs[0].rotation.x = pose.legL;
    P.legs[1].rotation.x = pose.legR;
    P.arms[0].arm.rotation.set(pose.armLx, 0, pose.armLz);
    P.arms[1].arm.rotation.set(pose.armRx, 0, pose.armRz);
    P.arms[0].fore.rotation.x = pose.foreL;
    P.arms[1].fore.rotation.x = pose.foreR;
    P.torso.rotation.x = pose.torsoX;
    P.torso.scale.y = 1 + (mode === "idle" ? Math.sin(t * 2.2) * 0.012 : 0);
    P.head.rotation.set(pose.headX, pose.headY, 0);
    P.body.position.y = pose.bodyY;
    // Rod lives in the hand while fishing or cheering, otherwise it rides on the creel.
    const socket = mode === "walk" || mode === "idle" || mode === "sad" ? P.backSocket : P.handSocket;
    // At the bow the harpoon takes the rod's place in the hand (and flies off while thrown).
    const harpoon = session?.mode === "harpoon" && socket === P.handSocket;
    if (harpoon && heldHarpoon.parent !== P.handSocket) P.handSocket.add(heldHarpoon);
    heldHarpoon.visible = harpoon && !session.harpoon?.flight;
    const rodSocket = harpoon ? P.backSocket : socket;
    if (P.rod.parent !== rodSocket) rodSocket.add(P.rod);
  }

  function setHeldFish(speciesId) {
    if (heldSpecies === speciesId) return;
    heldSpecies = speciesId;
    P.heldFish.clear();
    if (speciesId) {
      const f = models.makeHeldFish(FISH_BY_ID[speciesId].art);
      // With the arm raised the hand's -y points up: hold the fish above the hand, upright and side-on.
      f.position.set(0, -0.32, 0.05);
      f.rotation.set(0, 0, Math.PI);
      f.scale.setScalar(1.5);
      P.heldFish.add(f);
    }
  }

  function updateLine(session, t) {
    const pts = lineGeo.attributes.position.array;
    (session.mode === "harpoon" ? heldHarpoon.userData.tail : P.tip).getWorldPosition(tipWorld);
    const b = bobber.position;
    const taut = session.phase === "fight" ? 0.05 : session.phase === "cast" ? 0.3 : 0.9;
    for (let i = 0; i < LINE_POINTS; i++) {
      const u = i / (LINE_POINTS - 1);
      pts[i * 3] = tipWorld.x + (b.x - tipWorld.x) * u;
      pts[i * 3 + 2] = tipWorld.z + (b.z - tipWorld.z) * u;
      pts[i * 3 + 1] = tipWorld.y + (b.y + 0.15 - tipWorld.y) * u - Math.sin(u * Math.PI) * taut * (1 + Math.sin(t * 2) * 0.05);
    }
    lineGeo.attributes.position.needsUpdate = true;
  }

  /** Overcast light, fog, rain streaks, lightning and storm swell; eased toward the current weather. */
  function applyWeather(weather, dt, elapsed, indoors, danger = false) {
    const base = WEATHER_LOOK[weather] ?? WEATHER_LOOK.clear, k = 1 - Math.exp(-dt / 3);
    const target = danger ? Object.fromEntries(Object.keys(TRENCH_LOOK).map(key => [key, Math.max(base[key], TRENCH_LOOK[key])])) : base;
    TRENCH_GAIN.value += ((weather === "storm" ? 1.35 : 1) - TRENCH_GAIN.value) * k;
    for (const key of ["cloud", "rain", "fog", "storm"]) wx[key] += ((indoors ? 0 : target[key]) - wx[key]) * (indoors ? 1 : k);
    const bg = scene.background;
    const grey = (bg.r + bg.g + bg.b) / 3 * 0.92;
    bg.lerp(greyTmp.setRGB(grey, grey, grey * 1.06), wx.cloud * 0.75);
    hemi.color.lerp(greyTmp.setRGB(grey + 0.1, grey + 0.1, grey + 0.14), wx.cloud * 0.4);
    sun.intensity *= 1 - wx.cloud * 0.7;
    hemi.intensity *= 1 - wx.cloud * 0.12;
    // Lightning: a bright flash now and then; the thunder follows from the audio side.
    let lightning = false;
    if (wx.storm > 0.6 && elapsed > wx.nextBolt) {
      if (wx.nextBolt) { wx.flash = 1; lightning = true; }
      wx.nextBolt = elapsed + (danger ? 4 + Math.random() * 7 : 6 + Math.random() * 10);
    }
    wx.flash *= Math.exp(-dt * 7);
    if (wx.flash > 0.01) { hemi.intensity += wx.flash * 2.5; bg.lerp(WHITE, wx.flash * 0.5); }
    scene.fog.color.copy(bg);
    const f = wx.fog;
    scene.fog.near = f > 0.01 ? THREE.MathUtils.lerp(45, 6, f) : 1000;
    scene.fog.far = f > 0.01 ? THREE.MathUtils.lerp(110, 58, f) : 2000;
    WAVE_GAIN.value = 1 + wx.storm * 0.9 + wx.rain * 0.15;
    rain.visible = wx.rain > 0.02;
    if (rain.visible) {
      const n = Math.floor(RAIN_DROPS * Math.min(1, wx.rain));
      rainGeo.setDrawRange(0, n * 2);
      rain.material.opacity = 0.16 + 0.2 * wx.rain;
      const fall = (13 + 9 * wx.storm) * dt, len = 0.55 + wx.storm * 0.45, slant = 0.2 + wx.storm * 0.45;
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        let y = rainDrop[j + 1] - fall;
        if (y < 0) { y += RAIN_TOP; rainDrop[j] = (Math.random() * 2 - 1) * RAIN_BOX; rainDrop[j + 2] = (Math.random() * 2 - 1) * RAIN_BOX; }
        rainDrop[j + 1] = y;
        const x = rainDrop[j], z = rainDrop[j + 2], o = i * 6;
        rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z;
        rainPos[o + 3] = x + slant * len; rainPos[o + 4] = y + len; rainPos[o + 5] = z;
      }
      rainGeo.attributes.position.needsUpdate = true;
      rain.position.set(camLook.x, 0, camLook.z);
    }
    return lightning;
  }

  // --- Boats: they ride the wave surface (heave from height, pitch/roll from its slope) and the player rides the deck.
  const ride = (obj, baseY, x, z, elapsed, k = 1, w = undefined) => {
    const d = 1.2, h = waveHeight(x, z, elapsed, w);
    obj.position.y = baseY + h;
    obj.rotation.x = -Math.atan((waveHeight(x, z + d, elapsed, w) - waveHeight(x, z - d, elapsed, w)) / (2 * d)) * k;
    obj.rotation.z = Math.atan((waveHeight(x + d, z, elapsed, w) - waveHeight(x - d, z, elapsed, w)) / (2 * d)) * k;
    return h;
  };
  const deckTmp = new THREE.Vector3(), yawQ = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  /** Stand the player on a boat's deck: their deck position turned with the boat's pitch and roll, then lifted with it. */
  function standOnDeck(boat, deckY, p) {
    deckTmp.set(p.x - boat.position.x, deckY, p.z - boat.position.z).applyQuaternion(boat.quaternion).add(boat.position);
    P.root.position.copy(deckTmp);
    P.root.quaternion.copy(boat.quaternion).multiply(yawQ.setFromAxisAngle(UP, shownFacing));
  }
  function rideBoats(p, elapsed) {
    mooredBoat.visible = mooredTrawler.visible = rack.visible = p.area === "land";
    ride(mooredBoat, SEA_Y + 0.05, WORLD.boatMooring.x, WORLD.boatMooring.z, elapsed);
    if (owned.trawler) ride(mooredTrawler, SEA_Y - 0.25, WORLD.trawlerMooring.x, WORLD.trawlerMooring.z, elapsed, 0.8);
    else { // aground: listing to port, bow down, barely rocking
      mooredTrawler.position.y = SEA_Y - 1.0 + Math.sin(elapsed * 0.7) * 0.03;
      mooredTrawler.rotation.set(0.13, 0.35, -0.45 + Math.sin(elapsed * 0.7) * 0.01);
    }
    repairSign.visible = p.area === "land" && !owned.trawler;
    bigBoat.visible = p.area === "offshore";
    ride(bigBoat, SEA_Y - 0.12, off.cx, off.cz, elapsed, 0.8);
    trawler.visible = trench.root.visible = p.area === "trench";
    ride(trawler, SEA_Y - 0.3, tc.cx, tc.cz, elapsed, 0.7, TRENCH_WAVES);
    if (p.area === "offshore") standOnDeck(bigBoat, DECK_Y.offshore, p);
    else if (p.area === "trench") standOnDeck(trawler, DECK_Y.trench, p);
    else P.root.rotation.set(0, shownFacing, 0);
  }

  /** Where a lane position (0..1) is at sea for the bow spot: `dist` ahead, spread across 12 units. */
  function laneWorld(spot, u, dist, out) {
    const fx = Math.sin(spot.facing), fz = Math.cos(spot.facing);
    return out.set(spot.x + fx * dist + fz * (u - 0.5) * 12, 0, spot.z + fz * dist - fx * (u - 0.5) * 12);
  }
  const hv = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), lastSurfaced: false, lastHits: 0, lastPos: 0.5, y: -4, spoutAt: 0 };
  const STUCK = [[-0.4, 0.75, 0.2], [0.3, 0.8, -0.25], [-1.1, 0.7, -0.15], [0.9, 0.72, 0.18], [-1.7, 0.6, 0.1]];
  /** The harpoon round in 3D: the giant surfacing along the lane, its spout, the thrown harpoon and the rope. */
  function updateHarpoonView(s, dt, elapsed) {
    // Spout droplets always settle, even after the session ends.
    for (let i = 0; i < SPOUT; i++) {
      if (spoutLife[i] <= 0) { spoutPos[i * 3 + 1] = -50; continue; }
      spoutLife[i] -= dt;
      spoutVel[i * 3 + 1] -= 7 * dt;
      for (let a = 0; a < 3; a++) spoutPos[i * 3 + a] += spoutVel[i * 3 + a] * dt;
    }
    spoutGeo.attributes.position.needsUpdate = true;
    if (!s) {
      if (giantShown) giantShown.visible = false;
      flyingHarpoon.visible = false;
      stuckHarpoons.forEach(h => { h.visible = false; });
      hv.lastHits = 0;
      return;
    }
    const g = giantOf(s.encounter.speciesId);
    if (giantShown && giantShown !== g) giantShown.visible = false;
    giantShown = g;
    g.scale.setScalar(0.75);
    const h = s.harpoon, f = s.fight;
    const lanePos = s.phase === "fight" ? f.fishPos : h ? h.pos : 0.5 + Math.sin(elapsed * 0.4) * 0.25;
    const surfaced = s.phase === "fight" || s.phase === "bite" || (h && h.surfaced);
    laneWorld(s.spot, lanePos, s.phase === "fight" ? 7 : 8.5, hv.a);
    const water = SEA_Y + waveHeight(hv.a.x, hv.a.z, elapsed, TRENCH_WAVES);
    const targetY = s.phase === "cast" || s.phase === "wait" ? water - 5 : surfaced ? water + (s.phase === "fight" ? -0.1 : 0.15) : water - 3.2;
    hv.y += (targetY - hv.y) * (1 - Math.exp(-dt * 3));
    g.visible = hv.y > water - 4.6;
    // Face the way it swims (head = +x), with a gentle roll in the swell.
    const dir = lanePos - hv.lastPos;
    hv.lastPos = lanePos;
    const fx = Math.sin(s.spot.facing), fz = Math.cos(s.spot.facing);
    if (Math.abs(dir) > 0.0004) g.userData.dir = Math.sign(dir);
    const d = g.userData.dir ?? 1;
    g.position.set(hv.a.x, hv.y, hv.a.z);
    g.rotation.set(0, Math.atan2(-(-fx * d), fz * d), Math.sin(elapsed * 0.9) * 0.08);
    // Spouts: on the bite, whenever it surfaces again, and now and then while up.
    if (surfaced && (!hv.lastSurfaced || elapsed > hv.spoutAt)) {
      g.localToWorld(hv.b.set(1.2, 0.9, 0));
      blow(hv.b.x, hv.b.y, hv.b.z);
      hv.spoutAt = elapsed + 2.4 + Math.random() * 1.5;
    }
    hv.lastSurfaced = surfaced;
    // Harpoons that struck ride on its back.
    const hits = s.phase === "fight" ? (h?.need ?? 0) : h?.hits ?? 0;
    stuckHarpoons.forEach((sh, i) => {
      sh.visible = i < hits && g.visible;
      if (!sh.visible) return;
      if (sh.parent !== g) g.add(sh);
      sh.position.set(...STUCK[i]);
      sh.rotation.set(0.3, 0, -0.9 + i * 0.2);
    });
    // A harpoon in the air: an arc from the hand to where the aim was.
    if (h?.flight) {
      heldHarpoon.getWorldPosition(hv.b);
      laneWorld(s.spot, h.flight.at, 8.5, hv.c);
      hv.c.y = water + 0.3;
      const t = 1 - h.flight.left / 0.45, arc = Math.sin(Math.PI * t) * 2.2;
      const x = hv.b.x + (hv.c.x - hv.b.x) * t, y = hv.b.y + (hv.c.y - hv.b.y) * t + arc, z = hv.b.z + (hv.c.z - hv.b.z) * t;
      const vy = (hv.c.y - hv.b.y) + Math.cos(Math.PI * t) * Math.PI * 2.2;
      flyingHarpoon.position.set(x, y, z);
      flyingHarpoon.quaternion.setFromUnitVectors(UP, hv.a.set(hv.c.x - hv.b.x, vy, hv.c.z - hv.b.z).normalize());
      flyingHarpoon.visible = true;
    } else flyingHarpoon.visible = false;
    // Splash rings where a harpoon lands or the giant thrashes.
    if (h && h.resultAt >= 0 && h.t - h.resultAt < 1) {
      const k = h.t - h.resultAt;
      laneWorld(s.spot, h.resultPos, 8.5, hv.c);
      [splash, splash2].forEach((sp, i) => {
        const u = Math.min(1, k * 1.4 + i * 0.25);
        sp.position.set(hv.c.x, water + 0.05, hv.c.z);
        sp.scale.setScalar(2 + u * 7);
        sp.material.opacity = 0.9 * (1 - u);
      });
    } else if (s.phase === "fight") {
      [splash, splash2].forEach((sp, i) => {
        const u = (elapsed * 0.9 + i * 0.5) % 1;
        sp.position.set(hv.a.x, water + 0.05, hv.a.z);
        sp.scale.setScalar(3 + u * 6);
        sp.material.opacity = 0.7 * (1 - u);
      });
    } else splash.material.opacity = splash2.material.opacity = 0;
    // The rope: once a harpoon is in, from the harpoon in hand to the giant's back.
    bobber.visible = false;
    if (hits > 0 && g.visible) {
      g.localToWorld(bobber.position.set(-0.4, 0.6, 0));
      P.root.updateMatrixWorld(true);
      updateLine(s, elapsed);
      fishingLine.visible = true;
    } else fishingLine.visible = false;
  }

  function setOwned(state) {
    owned.trawler = !!state.trawlerOwned;
    if (owned.trawler) mooredTrawler.rotation.set(0, 0, 0);
    for (const t of [trawler, mooredTrawler]) t.userData.harpoonGun.visible = !!state.harpoonOwned;
  }

  function render({ state, session, walking, dt, elapsed, result, questReady = false, weather = "clear" }) {
    TIME.value = elapsed;
    footstep = false;
    const p = state.player;
    P.root.position.set(p.x, p.area === "offshore" ? 0.12 : p.area === "home" ? 0.07 : 0.02, p.z);
    let dFacing = p.facing - shownFacing;
    dFacing = Math.atan2(Math.sin(dFacing), Math.cos(dFacing));
    shownFacing += dFacing * Math.min(1, dt * 12);
    P.root.rotation.y = shownFacing;

    const active = session && session.phase !== "done" ? session : null;
    // Legendary bites and boss fights: golden ripples and a slow camera push-in.
    const boss = !!active && !!FISH_BY_ID[active.encounter.speciesId].legendary && (active.phase === "bite" || active.phase === "fight");
    const harpoonMode = active?.mode === "harpoon";
    const zoom = boss && !harpoonMode ? 1.22 : 1;
    if (Math.abs(camera.zoom - zoom) > 0.001) { camera.zoom += (zoom - camera.zoom) * Math.min(1, dt * 2.5); camera.updateProjectionMatrix(); }
    splash.material.color.set(boss ? "#ffd36a" : "#ffffff");
    splash2.material.color.copy(splash.material.color);
    const mode = result === "caught" ? "celebrate" : result ? "sad" : active ? (active.phase === "harpoon" ? "harpoon" : active.phase === "cast" ? (harpoonMode ? "wait" : "cast") : active.phase === "fight" ? "fight" : active.phase === "bite" ? "bite" : "wait") : walking ? "walk" : "idle";
    animatePlayer(mode, active, dt, elapsed);
    rideBoats(p, elapsed);
    animateNpcs(p, dt, elapsed, !!session);
    questMark.visible = questReady && p.area === "land";
    if (questMark.visible) {
      questMark.position.set(courier.n.x, 3.45 + Math.abs(Math.sin(elapsed * 3)) * 0.25, courier.n.z);
      questMark.scale.setScalar(0.9 + Math.sin(elapsed * 6) * 0.04);
    }
    setHeldFish(result === "caught" ? session?.encounter.speciesId : null);

    // Bobber + line (at the bow: the giant, its spout and the harpoons instead)
    updateHarpoonView(harpoonMode ? active : null, dt, elapsed);
    if (active && !harpoonMode) {
      const spot = active.spot;
      const bx = spot.x + Math.sin(spot.facing) * CAST_DISTANCE;
      const bz = spot.z + Math.cos(spot.facing) * CAST_DISTANCE;
      const waterY = spot.location === "lake" ? LAKE_Y + 0.04 : spot.location === "river" ? RIVER_Y + 0.05 : SEA_Y + 0.1 + waveHeight(bx, bz, elapsed, spot.location === "trench" ? TRENCH_WAVES : undefined);
      const castT = active.phase === "cast" ? Math.min(1, active.t / active.castMs) : 1;
      let by = waterY + Math.sin(elapsed * 2.5) * 0.04, ox = 0, oz = 0;
      if (active.phase === "cast") by = waterY + Math.sin(castT * Math.PI) * 2.5;
      if (active.phase === "bite") by = waterY - 0.16 + Math.sin(elapsed * 30) * 0.07;
      if (active.phase === "fight") {
        const lane = active.fight.fishPos - 0.5;
        ox = Math.cos(spot.facing) * lane * 2.4;
        oz = -Math.sin(spot.facing) * lane * 2.4;
        by = waterY - 0.06 + Math.sin(elapsed * 18) * 0.05;
      }
      bobber.visible = true;
      bobber.position.set(p.x + (bx + ox - p.x) * castT, by, p.z + (bz + oz - p.z) * castT);
      P.root.updateMatrixWorld(true);
      updateLine(active, elapsed);
      fishingLine.visible = true;
      const ripple = active.phase === "bite" || active.phase === "fight";
      [splash, splash2].forEach((s, i) => {
        const k = ((elapsed * (active.phase === "bite" ? 2.2 : 1.2) + i * 0.5) % 1);
        s.position.set(bobber.position.x, waterY + 0.02, bobber.position.z);
        s.scale.setScalar(1 + k * 3);
        s.material.opacity = ripple ? (boss ? 1 : 0.8) * (1 - k) : 0;
        if (boss) s.scale.multiplyScalar(1.6);
      });
    } else if (!harpoonMode) {
      bobber.visible = false;
      fishingLine.visible = false;
      splash.material.opacity = splash2.material.opacity = 0;
    }
    forSale.visible = !state.boatOwned;
    surf.forEach((m, i) => {
      const u = (elapsed / 5.5 + i / 3) % 1, e = 1 - Math.pow(1 - u, 2);
      const z = WORLD.land.maxZ + 3.4 - e * 2.6;
      m.position.set(m.position.x, beachSlopeY(z) + 0.04, z);
      m.scale.set(1, 0.5 + e * 0.9, 1);
      m.material.opacity = Math.pow(Math.sin(Math.PI * u), 1.5) * 0.75;
    });
    for (const m of env.markers) m.material.opacity = 0.3 + Math.sin(elapsed * 2) * 0.15;
    if (vane.visible) vane.userData.fish.rotation.y = Math.sin(elapsed * 0.4) * 0.8;
    if (carvedWhale.visible) carvedWhale.rotation.set(0, 0.5 + Math.sin(elapsed * 0.5) * 0.12, Math.sin(elapsed * 0.8) * 0.03);
    env.buoys.forEach((b, i) => { b.position.y = SEA_Y + waveHeight(b.position.x, b.position.z, elapsed); b.rotation.z = Math.sin(elapsed * 1.3 + i) * 0.18; });
    M.foam.opacity = 0.35 + Math.sin(elapsed * 1.2) * 0.2;
    env.seaFoam.position.z = WORLD.land.maxZ + 2.0 + Math.sin(elapsed * 1.2) * 0.35;
    for (const b of Object.values(env.barriers)) b.warn.material.emissiveIntensity = Math.sin(elapsed * 5) > 0 ? 2.2 : 0.2;

    // Ducks paddle around the lake; gulls circle the shore and the offshore boat.
    ducks.forEach((d, i) => {
      const a = elapsed * (i ? -0.12 : 0.09) + i * 2.5, r = i ? 3.2 : 4.6;
      d.position.set(lk.x + Math.cos(a) * r, LAKE_Y - 0.02 + Math.sin(elapsed * 2 + i) * 0.02, lk.z + Math.sin(a) * r);
      d.rotation.y = -a + (i ? Math.PI : 0); // clockwise vs counter-clockwise swimmer
    });
    for (const g of gulls) {
      const o = g.userData.orbit, a = elapsed * 0.35 + o.phase;
      g.position.set(o.cx + Math.cos(a) * o.r, o.h + Math.sin(elapsed * 0.8 + o.phase) * 0.4, o.cz + Math.sin(a) * o.r);
      g.rotation.y = -a;
      g.rotation.z = 0.25;
      const flap = Math.sin(elapsed * 7 + o.phase) * 0.5;
      g.userData.wings[0].rotation.z = flap;
      g.userData.wings[1].rotation.z = -flap;
    }

    // Lighting from time of day (also drives day/night critters)
    const lamps = applyLighting(dayFraction(state.timeMs));
    {
      const b = Math.floor(dayFraction(state.timeMs) * 4) % 4, p = bucketProgress(state.timeMs);
      const k = p > 1 - SUN_BLEND ? THREE.MathUtils.smoothstep(p, 1 - SUN_BLEND, 1) : 0;
      sunDir.copy(SUN_DIRS[b]).lerp(SUN_DIRS[(b + 1) % 4], k);
    }
    // Indoors: warm, steady light whatever the time of day, with a flickering fire.
    const indoors = p.area === "home";
    if (indoors) {
      scene.background.copy(HOME_LIGHT.bg);
      hemi.color.copy(HOME_LIGHT.sky); hemi.groundColor.copy(HOME_LIGHT.ground); hemi.intensity = 1.05;
      sun.color.copy(HOME_LIGHT.sun); sun.intensity = 1.5;
      sunDir.copy(HOME_LIGHT.dir);
      M.window.emissiveIntensity = 0.6 + lamps * 0.8;
    }
    home.fireLight.intensity = indoors ? 7 + Math.sin(elapsed * 9) * 1.2 + Math.sin(elapsed * 23) * 0.6 : 0;
    home.fire.emissiveIntensity = 1.4 + Math.sin(elapsed * 11) * 0.3;
    trophyGroups.forEach((g, i) => { g.rotation.z = Math.sin(elapsed * 0.8 + i) * 0.03; });
    butterflies.forEach((b, i) => {
      const h = b.userData.home;
      b.visible = lamps < 0.3;
      if (!b.visible) return;
      const a = elapsed * 0.6 + h.phase;
      b.position.set(h.x + Math.sin(a) * 1.4, 0.8 + Math.sin(elapsed * 3 + i) * 0.25, h.z + Math.sin(a * 1.7) * 0.9);
      b.rotation.y = a;
      const flap = Math.sin(elapsed * 22 + i) * 1.1;
      b.userData.wings[0].rotation.z = flap;
      b.userData.wings[1].rotation.z = -flap;
    });
    smoke.forEach(s => {
      const u = (elapsed * 0.18 + s.userData.phase) % 1;
      s.position.set(env.chimney.x + u * 1.2 + Math.sin(u * 6) * 0.2, env.chimney.y + u * 3.2, env.chimney.z - u * 0.4);
      s.scale.setScalar(0.4 + u * 1.2);
      s.material.opacity = 0.55 * (1 - u);
    });
    if (flyMat.opacity > 0) {
      for (let i = 0; i < flyCount; i++) {
        const [fx, fz, ph] = flySeeds[i];
        flyPos[i * 3] = fx + Math.sin(elapsed * 0.4 + ph) * 1.5;
        flyPos[i * 3 + 1] = 0.8 + Math.sin(elapsed * 1.1 + ph * 3) * 0.4;
        flyPos[i * 3 + 2] = fz + Math.cos(elapsed * 0.35 + ph) * 1.5;
      }
      flyGeo.attributes.position.needsUpdate = true;
    }
    glintSpots.forEach((g, i) => {
      const s = Math.max(0, Math.sin(elapsed * 1.3 + g.phase));
      tmp.p.set(g.x, g.y, g.flow ? -26 + ((g.z + 26 + elapsed * 1.2) % 42) : g.z);
      tmp.s.set(0.2 + s, 1, 1);
      glints.setMatrixAt(i, tmp.m.compose(tmp.p, tmp.q, tmp.s));
    });
    glints.instanceMatrix.needsUpdate = true;

    // Camera follows the player with gentle easing (snaps when changing areas).
    camTarget.set(p.x, 0, p.z).add(CAMERA_OFFSET);
    if (session?.mode === "harpoon" && session.phase !== "done") camTarget.add(hv.c.set(Math.sin(session.spot.facing) * 6.5, 0, Math.cos(session.spot.facing) * 6.5));
    if (!camInit || camera.position.distanceTo(camTarget) > 30) { camera.position.copy(camTarget); camInit = true; }
    else camera.position.lerp(camTarget, 1 - Math.exp(-dt * 6));
    camLook.copy(camera.position).sub(CAMERA_OFFSET);
    camera.lookAt(camLook);
    {
      const L = lightBasis.dir.copy(sunDir).normalize();
      lightBasis.right.crossVectors(lightBasis.up.set(0, 1, 0), L).normalize();
      lightBasis.up.crossVectors(L, lightBasis.right);
      const texel = (sun.shadow.camera.right - sun.shadow.camera.left) / sun.shadow.mapSize.x;
      const snap = v => Math.round(v / texel) * texel;
      const x = snap(camLook.dot(lightBasis.right)), y = snap(camLook.dot(lightBasis.up)), z = camLook.dot(L);
      shadowFocus.copy(lightBasis.right).multiplyScalar(x).addScaledVector(lightBasis.up, y).addScaledVector(L, z);
      sun.target.position.copy(shadowFocus);
      sun.position.copy(shadowFocus).add(sunDir);
    }

    const inTrench = p.area === "trench";
    if (inTrench) { scene.background.lerp(TRENCH_TINT, 0.5); hemi.intensity = Math.max(0.6, hemi.intensity * 0.85); sun.intensity *= 0.75; }
    const lightning = applyWeather(weather, dt, elapsed, indoors, inTrench);
    if (inTrench) {
      trench.update({ elapsed, dt, boat: trawler, night: lamps, flash: lightning });
      // At the bow the floodlight swings forward onto the water where the giants surface.
      const bow = session?.mode === "harpoon" && session.phase !== "done";
      trench.floodlight.position.set(0, bow ? 5 : 4.3, bow ? 9.5 : -2.6);
    }
    if (!inTrench) trench.beacon.intensity = trench.floodlight.intensity = 0; // lights stay in the scene: no shader recompiles
    env.farSea.visible = !inTrench;
    renderer.render(scene, camera);
    return { footstep, lightning };
  }

  resize();
  return { render, resize, pickGround, screenAxes, setWallboard, setTrophies, setUnlocked, setMilestones, setOwned, renderer, camera };
}
