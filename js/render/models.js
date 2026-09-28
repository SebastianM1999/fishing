// Low-poly model kit. Static builders write into a Kit (merged later); dynamic builders return Groups.
import * as THREE from "three";
import { G, Kit, GroupSink } from "./kit.js";

const PI = Math.PI;

// ---------------------------------------------------------------------------------------------
// Vegetation
// ---------------------------------------------------------------------------------------------
export function tree(k, M, kind, s) {
  k.push(0, 0, 0, 0, s);
  if (kind === "pine") {
    k.part(G.cyl(0.15, 0.26, 1.4, 7), M.trunk, [0, 0.7, 0]);
    [[1.35, 1.7, 1.55], [1.05, 1.5, 2.35], [0.72, 1.3, 3.05], [0.38, 0.8, 3.6]].forEach(([r, h, y], i) =>
      k.part(G.cone(r, h, 7), M.pine[i % 2], [0, y, 0], [0, i * 0.7, 0]));
  } else if (kind === "birch") {
    k.part(G.cyl(0.12, 0.17, 2.8, 7), M.birch, [0, 1.4, 0]);
    for (let i = 0; i < 5; i++) k.part(G.box(0.2, 0.05, 0.08), M.birchMark, [Math.cos(i * 2) * 0.1, 0.5 + i * 0.45, Math.sin(i * 2) * 0.1], [0, i * 1.3, 0.2]);
    k.part(G.cyl(0.04, 0.05, 0.9, 5), M.birch, [0.3, 2.3, 0], [0, 0, -0.8]);
    [[0, 3.1, 0, 0.95], [0.55, 2.65, 0.2, 0.7], [-0.45, 2.7, -0.2, 0.72], [0.1, 3.7, 0.1, 0.6]].forEach(([x, y, z, r], i) =>
      k.part(G.ico(1, 0), M.leaf[3 - (i % 2)], [x, y, z], [i, i * 2, 0], [r, r * 0.9, r]));
  } else {
    // Oak: flared roots, a side branch and a clustered canopy.
    k.part(G.cyl(0.2, 0.34, 1.7, 7), M.trunk, [0, 0.85, 0]);
    for (let i = 0; i < 3; i++) k.part(G.box(0.16, 0.2, 0.5), M.trunk, [Math.sin(i * 2.1) * 0.28, 0.1, Math.cos(i * 2.1) * 0.28], [0.3, i * 2.1, 0]);
    k.part(G.cyl(0.07, 0.1, 0.9, 5), M.trunk, [0.35, 1.6, 0], [0, 0, -0.9]);
    [[0, 2.5, 0, 1.3], [0.9, 2.15, 0.35, 0.9], [-0.8, 2.25, -0.3, 0.95], [0.15, 3.25, -0.1, 0.85], [-0.3, 2.1, 0.8, 0.75]].forEach(([x, y, z, r], i) =>
      k.part(G.ico(1, 0), M.leaf[i % 3], [x, y, z], [i * 0.7, i * 1.3, 0], [r, r * 0.88, r]));
  }
  k.pop();
}

export function bush(k, M, s, i = 0) {
  k.push(0, 0, 0, i, s);
  [[0, 0.45, 0, 0.62], [0.45, 0.35, 0.15, 0.45], [-0.4, 0.35, -0.1, 0.48], [0.05, 0.75, -0.05, 0.4]].forEach(([x, y, z, r], j) =>
    k.part(G.ico(1, 0), M.leaf[(i + j) % 3], [x, y, z], [j, j, 0], r));
  if (i % 2 === 0) for (let j = 0; j < 5; j++) k.part(G.sphere(0.07, 6, 4), M.red, [Math.cos(j * 1.3) * 0.5, 0.5 + (j % 2) * 0.25, Math.sin(j * 1.3) * 0.5]);
  k.pop();
}

export function rock(k, M, s, i = 0) {
  k.push(0, 0, 0, i * 1.7, s);
  k.part(G.dodeca(1), M.stone, [0, 0.35, 0], [i, 0, 0.2], [1, 0.7, 0.9]);
  k.part(G.dodeca(0.55), M.stoneDark, [0.75, 0.2, 0.35], [0, i, 0], [1, 0.8, 1]);
  k.part(G.dodeca(0.4), M.stoneLight, [-0.6, 0.15, 0.4], [i, 0, 0]);
  k.part(G.dodeca(0.7), M.moss, [0, 0.72, -0.05], [0, i, 0], [1, 0.25, 0.85]);
  k.pop();
}

export function flower(k, M, x, z, color, h = 0.35) {
  k.part(G.cyl(0.015, 0.015, h, 3), M.leaf[2], [x, h / 2, z]);
  k.part(G.sphere(0.08, 6, 4), color, [x, h, z], [0, 0, 0], [1, 0.5, 1]);
  k.part(G.sphere(0.035, 5, 3), M.petalYellow, [x, h + 0.035, z]);
}

export function grassTuft(k, M, x, z, i) {
  for (let j = 0; j < 3; j++) k.part(G.cone(0.05, 0.38 + (j % 2) * 0.12, 3), M.grassLight, [x + (j - 1) * 0.07, 0.19, z + ((i + j) % 3) * 0.04], [0.15 * (j - 1), i + j, 0.2 * (j - 1)]);
}

export function reeds(k, M, i) {
  for (let j = 0; j < 7; j++) {
    const a = j * 2.4 + i, r = 0.15 + (j % 3) * 0.15, h = 0.9 + (j % 4) * 0.25;
    k.part(G.cyl(0.025, 0.035, h, 4), M.reed, [Math.cos(a) * r, h / 2, Math.sin(a) * r], [0.08 * Math.cos(a), 0, 0.08 * Math.sin(a)]);
    if (j % 2 === 0) k.part(G.cyl(0.05, 0.05, 0.22, 5), M.reedTop, [Math.cos(a) * r, h - 0.05, Math.sin(a) * r]);
  }
}

export function lilyPad(k, M, i) {
  k.part(G.cyl(0.45, 0.45, 0.03, 10), M.lily, [0, 0.07, 0], [0, i, 0]);
  if (i % 2 === 0) {
    for (let j = 0; j < 5; j++) k.part(G.cone(0.07, 0.18, 4), M.pink, [Math.cos(j * 1.26) * 0.07, 0.15, Math.sin(j * 1.26) * 0.07], [Math.sin(j * 1.26) * 0.6, 0, -Math.cos(j * 1.26) * 0.6]);
    k.part(G.sphere(0.05, 6, 4), M.petalYellow, [0, 0.17, 0]);
  }
}

// ---------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------
export function prop(k, M, type, i) {
  switch (type) {
    case "bench":
      for (const x of [-0.7, 0.7]) { k.part(G.box(0.1, 0.45, 0.45), M.woodDark, [x, 0.22, 0]); k.part(G.box(0.1, 0.5, 0.08), M.woodDark, [x, 0.7, -0.22]); }
      for (let j = 0; j < 3; j++) k.part(G.box(1.7, 0.06, 0.14), M.woodLight, [0, 0.47, -0.16 + j * 0.16]);
      for (let j = 0; j < 2; j++) k.part(G.box(1.7, 0.12, 0.05), M.woodLight, [0, 0.72 + j * 0.2, -0.25], [-0.15, 0, 0]);
      break;
    case "barrel":
      k.part(G.cyl(0.36, 0.36, 0.9, 10), M.wood, [0, 0.45, 0]);
      k.part(G.cyl(0.4, 0.4, 0.16, 10), M.wood, [0, 0.45, 0]);
      for (const y of [0.12, 0.78]) k.part(G.cyl(0.375, 0.375, 0.06, 10), M.metal, [0, y, 0]);
      k.part(G.cyl(0.33, 0.33, 0.02, 10), M.woodDark, [0, 0.905, 0]);
      break;
    case "crate":
      k.part(G.box(0.8, 0.7, 0.8), M.woodLight, [0, 0.35, 0]);
      for (const z of [-0.41, 0.41]) for (const y of [0.12, 0.58]) k.part(G.box(0.84, 0.1, 0.04), M.wood, [0, y, z]);
      for (const z of [-0.41, 0.41]) k.part(G.box(0.1, 0.72, 0.04), M.wood, [0, 0.35, z], [0, 0, 0.9]);
      if (i % 2 === 0) for (let j = 0; j < 3; j++) k.part(G.sphere(0.15, 8, 5), M.blue, [-0.2 + j * 0.2, 0.74, 0], [0, 0, 0], [1.6, 0.6, 0.7]);
      break;
    case "mailbox":
      k.part(G.box(0.1, 1.0, 0.1), M.woodDark, [0, 0.5, 0]);
      k.part(G.box(0.34, 0.3, 0.5), M.red, [0, 1.1, 0]);
      k.part(G.cyl(0.17, 0.17, 0.5, 10), M.red, [0, 1.25, 0], [PI / 2, 0, 0]);
      k.part(G.box(0.04, 0.2, 0.06), M.yellow, [0.19, 1.3, -0.1]);
      break;
    case "well":
      k.part(G.cyl(0.95, 1.0, 0.8, 12), M.stone, [0, 0.4, 0]);
      k.part(G.cyl(1.02, 1.02, 0.12, 12), M.stoneLight, [0, 0.82, 0]);
      k.part(G.cyl(0.8, 0.8, 0.05, 12), M.lake, [0, 0.72, 0]);
      for (const x of [-0.85, 0.85]) k.part(G.box(0.14, 1.6, 0.14), M.woodDark, [x, 1.5, 0]);
      k.part(G.cyl(0.08, 0.08, 1.8, 6), M.wood, [0, 2.1, 0], [0, 0, PI / 2]);
      k.part(G.box(2.2, 0.08, 1.0), M.roofRed, [0, 2.55, 0.3], [0.55, 0, 0]);
      k.part(G.box(2.2, 0.08, 1.0), M.roofRedDark, [0, 2.55, -0.3], [-0.55, 0, 0]);
      k.part(G.cyl(0.18, 0.15, 0.25, 8), M.wood, [0.2, 1.5, 0]);
      k.part(G.cyl(0.01, 0.01, 0.5, 3), M.rope, [0.2, 1.85, 0]);
      break;
    case "stump":
      k.part(G.cyl(0.45, 0.55, 0.5, 9), M.trunk, [0, 0.25, 0]);
      k.part(G.cyl(0.42, 0.42, 0.02, 9), M.woodLight, [0, 0.51, 0]);
      k.part(G.box(0.4, 0.05, 0.05), M.metal, [0.1, 0.62, 0], [0, 0.5, 0.4]);
      break;
    case "log":
      k.part(G.cyl(0.32, 0.32, 1.8, 9), M.trunk, [0, 0.32, 0], [0, 0, PI / 2]);
      for (const x of [-0.91, 0.91]) k.part(G.cyl(0.29, 0.29, 0.02, 9), M.woodLight, [x, 0.32, 0], [0, 0, PI / 2]);
      k.part(G.ico(0.18, 0), M.moss, [0.3, 0.6, 0.05], [0, 0, 0], [2, 0.5, 1.5]);
      break;
    case "signpost":
      k.part(G.box(0.14, 2.0, 0.14), M.woodDark, [0, 1.0, 0]);
      [[0.35, 1.7, 0.4], [-0.3, 1.35, -0.5], [0.3, 1.0, 0.2]].forEach(([x, y, r]) => {
        k.push(0, y, 0, r);
        k.part(G.box(0.9, 0.24, 0.05), M.woodLight, [x, 0, 0.09]);
        k.part(G.box(0.2, 0.2, 0.05), M.woodLight, [x + Math.sign(x) * 0.5, 0, 0.09], [0, 0, PI / 4], [0.8, 0.8, 1]);
        k.pop();
      });
      break;
    case "flowerbed":
      k.part(G.box(2.2, 0.2, 0.9), M.soil, [0, 0.1, 0]);
      for (const z of [-0.47, 0.47]) k.part(G.box(2.3, 0.26, 0.08), M.woodDark, [0, 0.13, z]);
      for (let j = 0; j < 12; j++) flower(k, M, -0.95 + (j % 6) * 0.38, j < 6 ? -0.18 : 0.2, [M.pink, M.petalYellow, M.lilac, M.petalWhite, M.red][(j + i) % 5], 0.35 + (j % 3) * 0.08);
      break;
    case "umbrella":
      k.part(G.cyl(0.04, 0.04, 2.3, 5), M.white, [0, 1.15, 0], [0.1, 0, 0]);
      k.part(G.cone(1.2, 0.5, 8), M.red, [0.11, 2.3, 0], [0.1, 0, 0]);
      k.part(G.cone(0.62, 0.26, 8), M.white, [0.13, 2.45, 0], [0.1, 0, 0]);
      k.part(G.sphere(0.06, 6, 4), M.white, [0.14, 2.6, 0]);
      break;
    case "towel":
      for (let j = 0; j < 5; j++) k.part(G.box(0.2, 0.02, 1.6), j % 2 ? M.blue : M.white, [-0.4 + j * 0.2, 0.02, 0]);
      break;
    case "shell":
      k.part(G.sphere(0.14, 8, 5), M.pink, [0, 0.05, 0], [0, 0, 0], [1, 0.5, 1.2]);
      k.part(G.cone(0.12, 0.25, 6), M.cream, [0.35, 0.06, 0.2], [0, 0, PI / 2]);
      break;
    case "tacklebox":
      k.part(G.box(0.6, 0.3, 0.35), M.red, [0, 0.15, 0]);
      k.part(G.box(0.62, 0.08, 0.37), M.roofRedDark, [0, 0.33, 0]);
      k.part(G.box(0.3, 0.05, 0.05), M.black, [0, 0.4, 0]);
      break;
    case "bucket":
      k.part(G.cyl(0.2, 0.15, 0.32, 10), M.metal, [0, 0.16, 0]);
      k.part(G.torus(0.19, 0.01, 4, 10), M.metal, [0, 0.36, 0], [0, 0, PI / 2]);
      k.part(G.cyl(0.17, 0.17, 0.02, 10), M.lake, [0, 0.28, 0]);
      break;
  }
}

// ---------------------------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------------------------
function windowUnit(k, M, x, y, z, ry, shutter, flowers) {
  k.push(x, y, z, ry);
  k.part(G.box(1.15, 1.05, 0.12), M.white, [0, 0, 0]);
  k.part(G.box(0.92, 0.82, 0.06), M.window, [0, 0, 0.05]);
  k.part(G.box(0.06, 0.82, 0.08), M.white, [0, 0, 0.07]);
  k.part(G.box(0.92, 0.06, 0.08), M.white, [0, 0, 0.07]);
  for (const sx of [-0.78, 0.78]) {
    k.part(G.box(0.4, 1.0, 0.06), shutter, [sx, 0, 0.04]);
    for (let j = 0; j < 4; j++) k.part(G.box(0.32, 0.04, 0.04), shutter, [sx, -0.33 + j * 0.22, 0.09], [0.4, 0, 0]);
  }
  k.part(G.box(1.25, 0.08, 0.22), M.woodLight, [0, -0.56, 0.1]);
  if (flowers) {
    k.part(G.box(1.1, 0.24, 0.26), M.woodDark, [0, -0.72, 0.2]);
    for (let j = 0; j < 6; j++) {
      k.part(G.ico(0.1, 0), M.leafStill, [-0.45 + j * 0.18, -0.56, 0.2]);
      k.part(G.sphere(0.07, 6, 4), [M.pink, M.red, M.petalYellow][j % 3], [-0.45 + j * 0.18, -0.5, 0.27]);
    }
  }
  k.pop();
}

export function building(k, M, b) {
  const { w, d, h } = b;
  const wallMat = new THREE.MeshStandardMaterial({ color: b.wall, roughness: 0.95, flatShading: true });
  const roofA = b.id === "home" ? M.roofRed : M.roofGreen, roofB = b.id === "home" ? M.roofRedDark : M.roofGreenDark;
  const shutter = b.id === "home" ? M.leafStill : M.blue;
  const base = 0.4;
  k.push(b.x, 0, b.z);
  // Foundation with chunky stones
  k.part(G.box(w + 0.35, base, d + 0.35), M.stoneDark, [0, base / 2, 0]);
  for (let j = 0; j < Math.floor(w / 0.7); j++) k.part(G.box(0.55, 0.26, 0.1), j % 2 ? M.stone : M.stoneLight, [-w / 2 + 0.4 + j * 0.7, 0.2, d / 2 + 0.2]);
  // Walls + timber frame
  k.part(G.box(w, h, d), wallMat, [0, base + h / 2, 0]);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.part(G.box(0.24, h, 0.24), M.woodDark, [x * w / 2, base + h / 2, z * d / 2]);
  for (const z of [-1, 1]) for (const y of [base + 0.1, base + h - 0.1, base + h * 0.52]) k.part(G.box(w + 0.1, 0.16, 0.1), M.woodDark, [0, y, z * (d / 2 + 0.03)]);
  for (const x of [-1, 1]) {
    k.part(G.box(0.1, 0.16, d + 0.1), M.woodDark, [x * (w / 2 + 0.03), base + h - 0.1, 0]);
    k.part(G.box(0.1, 0.16, Math.hypot(d, h) * 0.95), M.woodDark, [x * (w / 2 + 0.04), base + h / 2, 0], [Math.atan2(h, d), 0, 0]);
  }
  // Roof: gable prism (wall-coloured gables) covered by stepped tile rows, ridge beam and eaves.
  const half = d / 2 + 0.6, rh = d * 0.46, len = w + 0.9;
  const shape = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, rh)]);
  const prism = new THREE.ExtrudeGeometry(shape, { depth: len - 0.2, bevelEnabled: false }).translate(0, 0, -(len - 0.2) / 2);
  k.part(prism, wallMat, [0, base + h, 0], [0, PI / 2, 0]);
  const slope = Math.atan2(rh, half), slopeLen = Math.hypot(half, rh), rows = 6;
  for (const s of [1, -1]) for (let r = 0; r < rows; r++) {
    const t = (r + 0.5) / rows, lift = 0.06 + r * 0.025;
    k.part(G.box(len, 0.09, (slopeLen / rows) * 1.12), r % 2 ? roofB : roofA,
      [0, base + h + rh * (1 - t) + lift * Math.cos(slope), s * (half * t + lift * Math.sin(slope))], [s * slope, 0, 0]);
  }
  k.part(G.box(len + 0.1, 0.22, 0.3), roofB, [0, base + h + rh + 0.1, 0]);
  for (const x of [-1, 1]) k.part(G.sphere(0.28, 10, 8), M.white, [x * (w / 2 + 0.46), base + h + rh * 0.42, 0], [0, 0, 0], [0.2, 1, 1]);
  // Door with frame, knob, step
  k.part(G.box(1.35, 2.15, 0.14), M.woodDark, [0, base + 1.07, d / 2 + 0.04]);
  k.part(G.box(1.05, 1.9, 0.1), M.wood, [0, base + 0.95, d / 2 + 0.09]);
  for (let j = 0; j < 3; j++) k.part(G.box(0.9, 0.05, 0.04), M.woodDark, [0, base + 0.4 + j * 0.55, d / 2 + 0.15]);
  k.part(G.sphere(0.06, 6, 4), M.yellow, [0.35, base + 0.95, d / 2 + 0.17]);
  k.part(G.box(1.7, 0.2, 0.7), M.stoneLight, [0, 0.1, d / 2 + 0.5]);
  // Windows (front + sides)
  for (const x of [-w / 3.2, w / 3.2]) windowUnit(k, M, x, base + 1.65, d / 2 + 0.06, 0, shutter, true);
  for (const s of [-1, 1]) windowUnit(k, M, s * (w / 2 + 0.06), base + 1.65, 0, s * PI / 2, shutter, false);
  if (b.id === "home") {
    // Chimney with cap, porch lantern hook, woodpile
    k.part(G.box(0.8, 2.0, 0.8), M.stone, [-w / 4, base + h + 1.1, -0.7]);
    k.part(G.box(0.95, 0.18, 0.95), M.stoneDark, [-w / 4, base + h + 2.15, -0.7]);
    for (let j = 0; j < 6; j++) k.part(G.cyl(0.16, 0.16, 0.9, 7), M.trunk, [w / 2 + 0.45, 0.18 + Math.floor(j / 3) * 0.3, -1.3 + (j % 3) * 0.33 + (j >= 3 ? 0.16 : 0)], [PI / 2, 0, 0]);
  } else {
    // Striped awning on brackets, a big fish weathervane on the ridge, counter with the day's catch
    for (let j = 0; j < 8; j++) k.part(G.box(w / 8, 0.08, 1.3), j % 2 ? M.cream : M.roofGreen, [-w / 2 + w / 16 + (j * w) / 8, base + 2.55, d / 2 + 0.6], [0.38, 0, 0]);
    for (let j = 0; j < 8; j++) k.part(G.cone(w / 16, 0.22, 3), j % 2 ? M.cream : M.roofGreen, [-w / 2 + w / 16 + (j * w) / 8, base + 2.18, d / 2 + 1.22], [PI, 0, 0]);
    for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) k.part(G.box(0.08, 0.08, 1.2), M.woodDark, [x, base + 2.4, d / 2 + 0.55], [0.4, 0, 0]);
    const vy = base + h + rh + 0.2;
    k.part(G.cyl(0.05, 0.06, 1.3, 6), M.metal, [0, vy + 0.6, 0]);
    k.part(G.sphere(0.45, 12, 8), M.yellow, [0.1, vy + 1.35, 0], [0, 0, 0], [2.1, 0.95, 0.4]);
    k.part(G.cone(0.42, 0.7, 4), M.yellow, [-1.15, vy + 1.35, 0], [0, 0, PI / 2], [1, 1, 0.4]);
    k.part(G.cone(0.18, 0.4, 3), M.orange, [0.1, vy + 1.85, 0], [0, 0, -0.3], [1.2, 1, 0.4]);
    for (const z of [-0.19, 0.19]) k.part(G.sphere(0.08, 8, 6), M.black, [0.8, vy + 1.45, z]);
    k.part(G.box(0.7, 0.05, 0.05), M.metal, [0, vy + 0.85, 0]);
    k.part(G.box(0.05, 0.05, 0.7), M.metal, [0, vy + 0.85, 0]);
    // Counter with fish on ice (the shopkeeper stands behind it, against the wall)
    const cx = -w / 2 + 1.5, cz = d / 2 + 1.3;
    k.part(G.box(2.2, 0.9, 0.7), M.wood, [cx, 0.45, cz]);
    for (let j = 0; j < 3; j++) k.part(G.box(2.24, 0.06, 0.74), M.woodDark, [cx, 0.15 + j * 0.3, cz]);
    k.part(G.box(2.1, 0.08, 0.62), M.petalWhite, [cx, 0.93, cz]);
    for (let j = 0; j < 4; j++) {
      k.part(G.sphere(0.13, 8, 5), [M.blue, M.orange, M.stoneLight, M.leafStill][j], [cx - 0.75 + j * 0.5, 1.01, cz], [0, 0.3, 0], [2.2, 0.55, 0.8]);
      k.part(G.cone(0.1, 0.18, 3), [M.blue, M.orange, M.stoneLight, M.leafStill][j], [cx - 1.1 + j * 0.5, 1.01, cz - 0.03], [0, 0.3, PI / 2]);
    }
    k.part(G.box(0.35, 0.3, 0.25), M.metal, [cx + 0.85, 1.12, cz - 0.1]); // cash box
  }
  k.pop();
}

export function wallboardFrame(k, M, wb) {
  k.push(wb.x, 0, wb.z);
  for (const x of [-wb.w / 2 - 0.05, wb.w / 2 + 0.05]) k.part(G.box(0.24, 3.4, 0.24), M.woodDark, [x, 1.7, 0]);
  k.part(G.box(wb.w + 0.2, 2.5, 0.16), M.wood, [0, 1.95, 0]);
  k.part(G.box(wb.w + 0.4, 0.14, 0.28), M.woodDark, [0, 0.66, 0.05]);
  // Little gable roof over the board
  k.part(G.box(wb.w + 0.9, 0.08, 0.75), M.roofRed, [0, 3.4, 0.25], [0.5, 0, 0]);
  k.part(G.box(wb.w + 0.9, 0.08, 0.75), M.roofRedDark, [0, 3.4, -0.25], [-0.5, 0, 0]);
  k.part(G.box(wb.w + 0.95, 0.12, 0.12), M.woodDark, [0, 3.58, 0]);
  // Lantern on the left post
  k.part(G.box(0.2, 0.28, 0.2), M.lampGlass, [-wb.w / 2 - 0.05, 2.6, 0.25]);
  k.pop();
}

export function lampPost(k, M) {
  k.part(G.cyl(0.22, 0.28, 0.25, 8), M.stoneDark, [0, 0.12, 0]);
  k.part(G.cyl(0.07, 0.09, 2.6, 7), M.woodDark, [0, 1.4, 0]);
  k.part(G.box(0.7, 0.08, 0.08), M.woodDark, [0.3, 2.65, 0]);
  k.part(G.box(0.08, 0.3, 0.08), M.woodDark, [0.06, 2.5, 0], [0, 0, -0.7]);
  k.part(G.cyl(0.01, 0.01, 0.2, 3), M.metal, [0.58, 2.52, 0]);
  k.part(G.cone(0.2, 0.18, 4), M.black, [0.58, 2.38, 0], [0, PI / 4, 0]);
  k.part(G.box(0.24, 0.3, 0.24), M.lampGlass, [0.58, 2.15, 0]);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.part(G.box(0.03, 0.32, 0.03), M.black, [0.58 + x * 0.12, 2.15, z * 0.12]);
  k.part(G.box(0.26, 0.04, 0.26), M.black, [0.58, 1.99, 0]);
}

export function walkway(k, M, w, withRails) {
  const along = w.maxZ - w.minZ > w.maxX - w.minX ? "z" : "x";
  const len = along === "z" ? w.maxZ - w.minZ : w.maxX - w.minX;
  const width = along === "z" ? w.maxX - w.minX : w.maxZ - w.minZ;
  const cx = (w.minX + w.maxX) / 2, cz = (w.minZ + w.maxZ) / 2;
  k.push(cx, 0, cz, along === "z" ? 0 : PI / 2);
  const n = Math.round(len / 0.42);
  for (let j = 0; j < n; j++) k.part(G.box(width, 0.1, 0.36), j % 3 ? M.plank : M.plankDark, [((j * 7) % 3 - 1) * 0.02, 0.14, -len / 2 + 0.21 + j * (len / n)], [0, ((j * 5) % 3 - 1) * 0.015, 0]);
  for (const s of [-1, 1]) k.part(G.box(0.1, 0.16, len), M.woodDark, [s * (width / 2 - 0.06), 0.05, 0]);
  const posts = Math.max(2, Math.round(len / 2) + 1);
  for (let j = 0; j < posts; j++) for (const s of [-1, 1]) {
    const z = -len / 2 + 0.15 + (j * (len - 0.3)) / (posts - 1);
    k.part(G.cyl(0.13, 0.15, withRails ? 2.3 : 1.5, 7), M.woodDark, [s * (width / 2 + 0.05), withRails ? 0.05 : -0.4, z]);
    if (withRails && j < posts - 1) k.part(G.cyl(0.025, 0.025, (len - 0.3) / (posts - 1), 4), M.rope, [s * (width / 2 + 0.05), 0.95, z + (len - 0.3) / (posts - 1) / 2], [PI / 2, 0, 0]);
  }
  k.pop();
}

/**
 * The old storm pier: the same planks as a walkway, but weathered, crooked and patched, with split and missing
 * planks along the edges, leaning posts (one snapped off), a sagging rope rail and a broken-off end.
 */
export function brokenPier(k, M, w) {
  const len = w.maxZ - w.minZ, width = w.maxX - w.minX;
  const cx = (w.minX + w.maxX) / 2, cz = (w.minZ + w.maxZ) / 2;
  k.push(cx, 0, cz, 0);
  const n = Math.round(len / 0.42);
  for (let j = 0; j < n; j++) {
    const z = -len / 2 + 0.21 + j * (len / n), h = (j * 37) % 11;
    const tilt = ((j * 5) % 3 - 1) * 0.05, dip = ((j * 7) % 4) * 0.015;
    if (h === 3) { // split plank: only half of it is left
      k.part(G.box(width * 0.55, 0.1, 0.36), M.plankDark, [-width * 0.22, 0.12 - dip, z], [0.04, tilt, 0.03]);
      continue;
    }
    if (h === 7) { // a patch nailed over a gap, crosswise
      k.part(G.box(width * 0.9, 0.08, 0.3), M.woodLight, [0.05, 0.12, z], [0, 0.18, 0]);
      continue;
    }
    k.part(G.box(width - (h === 5 ? 0.5 : 0), 0.1, 0.36), j % 3 ? M.plank : M.plankDark, [(h === 5 ? 0.25 : ((j * 7) % 3 - 1) * 0.04), 0.13 - dip, z], [0, tilt, ((j * 3) % 3 - 1) * 0.025]);
  }
  for (const s of [-1, 1]) k.part(G.box(0.1, 0.16, len), M.woodDark, [s * (width / 2 - 0.06), 0.03, 0], [0, 0, s * 0.03]);
  const posts = Math.round(len / 2) + 1;
  for (let j = 0; j < posts; j++) for (const s of [-1, 1]) {
    const z = -len / 2 + 0.15 + (j * (len - 0.3)) / (posts - 1), lean = ((j * 13 + (s > 0 ? 5 : 0)) % 5 - 2) * 0.07;
    const snapped = j === 3 && s > 0;
    k.part(G.cyl(0.13, 0.16, snapped ? 1.2 : 2.1, 6), M.woodDark, [s * (width / 2 + 0.06), snapped ? -0.3 : 0, z], [lean, 0, s * lean]);
    if (!snapped && j < posts - 1 && !(j === 2 && s > 0)) {
      const seg = (len - 0.3) / (posts - 1);
      k.part(G.cyl(0.025, 0.025, seg, 4), M.rope, [s * (width / 2 + 0.06), 0.8 - (j % 2) * 0.1, z + seg / 2], [PI / 2 + 0.05, 0, 0]);
    }
  }
  // Broken-off end: two jagged planks and a post sticking out of the water.
  k.part(G.box(0.8, 0.08, 0.36), M.plankDark, [0.6, 0.02, len / 2 + 0.3], [0.2, 0.3, -0.25]);
  k.part(G.box(0.6, 0.08, 0.3), M.plank, [-0.5, -0.05, len / 2 + 0.55], [-0.15, -0.4, 0.2]);
  k.part(G.cyl(0.12, 0.14, 1.6, 6), M.woodDark, [0.3, -0.5, len / 2 + 1.3], [0.3, 0, -0.2]);
  k.pop();
}

export function fenceLine(k, M, [x1, z1], [x2, z2]) {
  const len = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(len / 2);
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  k.push((x1 + x2) / 2, 0, (z1 + z2) / 2, ry);
  for (let j = 0; j <= n; j++) k.part(G.box(0.14, 1.0, 0.14), M.woodDark, [-len / 2 + (j * len) / n, 0.5, 0]);
  for (const y of [0.4, 0.78]) k.part(G.box(len, 0.1, 0.06), M.wood, [0, y, 0]);
  k.pop();
}

/** Construction barricades along a line with cones, sandbags and a plank pile near the gate. */
export function barrierLine(k, M, [x1, z1], [x2, z2], gate) {
  const len = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(len / 2.7);
  const dx = (x2 - x1) / len, dz = (z2 - z1) / len, ry = -Math.atan2(dz, dx);
  for (let j = 0; j < n; j++) {
    const t = (j + 0.5) * (len / n);
    const x = x1 + dx * t, z = z1 + dz * t;
    k.push(x, 0, z, ry);
    for (const sx of [-1.05, 1.05]) for (const s of [-1, 1]) k.part(G.box(0.08, 1.15, 0.08), M.woodLight, [sx, 0.55, s * 0.14], [s * 0.26, 0, 0]);
    k.part(G.box(2.35, 0.36, 0.07), M.barrier, [0, 0.95, 0]);
    k.part(G.box(2.35, 0.26, 0.07), M.barrier, [0, 0.5, 0]);
    if (j % 2) {
      k.part(G.cone(0.24, 0.62, 8), M.cone, [0, 0.33, 0.65]);
      k.part(G.cyl(0.14, 0.17, 0.1, 8), M.white, [0, 0.4, 0.65]);
      k.part(G.box(0.5, 0.05, 0.5), M.cone, [0, 0.025, 0.65]);
    }
    k.pop();
  }
  // Worksite clutter by the gate (on the unlocked side of the line)
  k.push(gate.x, 0, gate.z, ry);
  for (let j = 0; j < 5; j++) k.part(G.box(2.2, 0.1, 0.3), j % 2 ? M.plank : M.plankDark, [0.4, 0.06 + Math.floor(j / 2) * 0.1, 1.3 + (j % 2) * 0.32], [0, 0.05 * j, 0]);
  for (let j = 0; j < 5; j++) k.part(G.sphere(0.26, 8, 5), M.sandWet, [-1.6 + (j % 3) * 0.5, 0.15 + Math.floor(j / 3) * 0.25, -1.2 + (j >= 3 ? 0.25 : 0)], [0, j, 0], [1.3, 0.55, 0.8]);
  k.pop();
}

// ---------------------------------------------------------------------------------------------
// Dynamic models (individual meshes, animated each frame)
// ---------------------------------------------------------------------------------------------
function mesh(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  if (s) m.scale.set(...s);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function makeBoat(M, scale = 1) {
  const g = new THREE.Group();
  const k = new Kit(new GroupSink(g));
  const outline = [[-1.1, -2.3], [1.1, -2.3], [1.15, 1.2], [0, 3.0], [-1.15, 1.2]];
  const hullGeo = (sc, h) => {
    const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x * sc, -z * sc)));
    return new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }).rotateX(-PI / 2);
  };
  k.part(hullGeo(1, 0.8), M.boatHull, [0, -0.3, 0]);
  k.part(hullGeo(1.03, 0.14), M.boatTrim, [0, 0.2, 0]);
  k.part(hullGeo(1.04, 0.08), M.woodDark, [0, 0.48, 0]);
  k.part(hullGeo(0.86, 0.06), M.plank, [0, 0.47, 0]);
  for (let j = 0; j < 6; j++) k.part(G.box(1.8, 0.02, 0.04), M.plankDark, [0, 0.535, -1.8 + j * 0.75]);
  k.part(G.box(2.0, 0.1, 0.4), M.woodLight, [0, 0.75, -0.9]);
  k.part(G.box(1.6, 0.1, 0.4), M.woodLight, [0, 0.75, 1.1]);
  k.part(G.cyl(0.08, 0.08, 3.6, 6), M.woodDark, [0, 2.2, -0.5]);
  k.part(G.cyl(0.04, 0.04, 2.0, 5), M.woodDark, [0, 1.25, 0.45], [PI / 2, 0, 0]);
  const sail = new THREE.BufferGeometry();
  sail.setAttribute("position", new THREE.Float32BufferAttribute([0, 1.3, -0.45, 0, 3.9, -0.45, 0, 1.3, 1.4], 3));
  sail.computeVertexNormals();
  k.part(sail, M.sail, [0.05, 0, 0]);
  for (const s of [-1, 1]) k.part(G.box(0.08, 0.06, 2.2), M.woodLight, [s * 0.8, 0.62, -0.1], [0, s * 0.12, 0]);
  k.part(G.torus(0.22, 0.06, 5, 10), M.rope, [-0.55, 0.58, -1.7], [PI / 2, 0, 0]);
  k.part(G.box(0.5, 0.4, 0.4), M.woodLight, [0.55, 0.72, -1.6]);
  k.part(G.box(0.2, 0.26, 0.2), M.lampGlass, [0, 3.3, -0.35]);
  g.scale.setScalar(scale);
  return g;
}

/**
 * The Ironhull Trawler: a steel storm boat with a wheelhouse, fenders and a harpoon gun on the bow (shown once
 * bought). Bow = +z; the deck top is at y = TRAWLER_DECK (unscaled). userData: { harpoonGun, lights }.
 */
export const TRAWLER_DECK = 0.96;
export function makeTrawler(M, scale = 1) {
  const g = new THREE.Group();
  const k = new Kit(new GroupSink(g));
  const outline = [[-1.9, -5.4], [1.9, -5.4], [2.15, -3], [2.15, 3.2], [1.25, 5.6], [0, 6.9], [-1.25, 5.6], [-2.15, 3.2], [-2.15, -3]];
  const shapeOf = sc => new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x * sc, -z * sc)));
  const hullGeo = (sc, h, hole = 0) => {
    const shape = shapeOf(sc);
    if (hole) shape.holes.push(new THREE.Path(outline.map(([x, z]) => new THREE.Vector2(x * hole, -z * hole)).reverse()));
    return new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }).rotateX(-PI / 2);
  };
  k.part(hullGeo(0.96, 1.0), M.steelDark, [0, -1.25, 0]); // keel / waterline
  k.part(hullGeo(1, 1.2), M.steel, [0, -0.3, 0]); // red steel hull
  k.part(hullGeo(1.012, 0.12), M.steelLight, [0, 0.52, 0]); // white band
  k.part(hullGeo(1.015, 0.08), M.steelDark, [0, -0.32, 0]); // boot top
  k.part(hullGeo(1.0, 0.42, 0.9), M.steel, [0, 0.9, 0]); // bulwark
  k.part(hullGeo(1.02, 0.07, 0.88), M.steelLight, [0, 1.3, 0]); // capping rail
  k.part(hullGeo(0.92, 0.06), M.deckSteel, [0, 0.9, 0]); // deck
  for (let j = 0; j < 9; j++) k.part(G.box(3.4, 0.015, 0.05), M.steelDark, [0, 0.965, -2.2 + j * 0.85]);
  // Reinforcing ribs and tyre fenders along both sides.
  for (const sx of [-1, 1]) {
    for (let j = 0; j < 6; j++) k.part(G.box(0.07, 1.25, 0.12), M.steel, [sx * 2.17, 0.3, -4.2 + j * 1.5]);
    for (const z of [-2.4, -0.2, 2]) k.part(G.torus(0.26, 0.11, 6, 10), M.tyre, [sx * 2.28, 0.25, z], [0, PI / 2, 0]);
  }
  // Wheelhouse with a window band, roof, mast, radar and lamps.
  k.part(G.box(2.2, 1.75, 2.0), M.steelLight, [0, 0.96 + 0.875, -3.6]);
  k.part(G.box(2.24, 0.55, 2.04), M.window, [0, 2.2, -3.6]);
  for (const x of [-0.55, 0, 0.55]) k.part(G.box(0.06, 0.57, 2.06), M.steelLight, [x, 2.2, -3.6]);
  k.part(G.box(2.5, 0.14, 2.3), M.steel, [0, 2.78, -3.6]);
  k.part(G.box(0.7, 1.1, 0.06), M.steelDark, [0.55, 1.5, -2.58]); // door
  k.part(G.torus(0.26, 0.07, 6, 12), M.red, [-0.55, 1.5, -2.55]); // life ring
  k.part(G.torus(0.26, 0.072, 2, 4), M.white, [-0.55, 1.5, -2.54], [0, 0, PI / 4]);
  k.part(G.cyl(0.06, 0.07, 2.4, 6), M.steelDark, [0, 4.0, -3.9]);
  k.part(G.box(1.3, 0.08, 0.14), M.steelDark, [0, 4.6, -3.9]);
  k.part(G.box(0.9, 0.12, 0.26), M.steelLight, [0, 3.35, -3.9]); // radar
  k.part(G.cyl(0.32, 0.36, 1.4, 8), M.steel, [0, 3.2, -5.0]); // funnel
  k.part(G.cyl(0.33, 0.33, 0.3, 8), M.steelDark, [0, 3.95, -5.0]);
  // Bow: anchor winch and bollards.
  k.part(G.cyl(0.22, 0.22, 0.9, 8), M.steelDark, [0, 1.2, 4.4], [0, 0, PI / 2]);
  for (const sx of [-1, 1]) k.part(G.cyl(0.12, 0.14, 0.35, 6), M.steelDark, [sx * 1.4, 1.14, 3.6]);
  // Stern: a winch drum, net and crates behind the wheelhouse.
  k.part(G.box(0.7, 0.5, 0.6), M.woodDark, [1.55, 1.2, -1.9]);
  k.part(G.torus(0.3, 0.1, 5, 10), M.rope, [-1.55, 1.02, -2.0], [PI / 2, 0, 0]);
  const lights = [];
  for (const [x, y, z] of [[0.62, 4.62, -3.9], [-0.62, 4.62, -3.9], [0, 1.55, 6.2]]) {
    const l = new THREE.Mesh(G.box(0.16, 0.2, 0.16), M.lampGlass);
    l.position.set(x, y, z);
    g.add(l);
    lights.push(l);
  }
  k.part(G.cyl(0.03, 0.03, 0.4, 4), M.steelDark, [0, 1.35, 6.2]);
  // Harpoon gun on a swivel at the bow.
  const gun = new THREE.Group();
  const gk = new Kit(new GroupSink(gun));
  gk.part(G.cyl(0.2, 0.3, 0.5, 8), M.steelDark, [0, 0.25, 0]);
  gk.part(G.box(0.36, 0.24, 0.5), M.steelDark, [0, 0.6, 0]);
  gk.part(G.cyl(0.08, 0.1, 1.3, 8), M.steelDark, [0, 0.72, 0.5], [PI / 2, 0, 0]);
  gk.part(G.cone(0.1, 0.3, 4), M.metal, [0, 0.72, 1.3], [PI / 2, 0, 0]);
  gk.part(G.box(0.05, 0.3, 0.05), M.steelDark, [0, 0.45, -0.35], [0.4, 0, 0]);
  gk.part(G.torus(0.14, 0.05, 5, 10), M.rope, [0.28, 0.5, -0.05], [0, PI / 2, 0]);
  gun.position.set(0, TRAWLER_DECK, 5.3);
  gun.visible = false;
  g.add(gun);
  g.userData = { harpoonGun: gun, lights };
  g.scale.setScalar(scale);
  return g;
}

/** A hand-thrown harpoon (+y along the shaft like the rod); `tail` is where the rope starts. */
export function makeHarpoon(M) {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: "#8a9096", roughness: 0.4, metalness: 0.5, flatShading: true });
  g.add(mesh(G.cyl(0.035, 0.04, 2.0, 6), M.woodDark, 0, 0.8, 0));
  g.add(mesh(G.cyl(0.05, 0.05, 0.12, 6), iron, 0, 1.8, 0));
  g.add(mesh(G.cone(0.07, 0.34, 4), iron, 0, 2.0, 0));
  for (const s of [-1, 1]) g.add(mesh(G.box(0.02, 0.18, 0.02), iron, s * 0.06, 1.88, 0, 0, 0, s * 0.6));
  g.add(mesh(G.torus(0.06, 0.02, 4, 8), M.rope, 0, -0.15, 0));
  const tail = new THREE.Object3D();
  tail.position.y = -0.18;
  g.add(tail);
  g.userData.tail = tail;
  return g;
}

/** A giant for the harpoon round: a low-poly whale (head = +x, about 6 units long) coloured from its portrait art. */
export function makeGiant(art) {
  const g = new THREE.Group();
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, flatShading: true });
  const body = mat(art.color), fin = mat(art.fin), belly = mat(art.belly), eyeMat = mat("#15130f");
  const add = (...a) => g.add(mesh(...a));
  if (art.shape === "kraken") {
    const k = makeHeldFish(art);
    k.scale.setScalar(9);
    k.position.y = -0.4;
    g.add(k);
    return g;
  }
  const box = !!art.boxHead;
  add(G.sphere(1, 12, 8), body, -0.2, 0, 0, 0, 0, 0, [3.0, 0.78, 0.95]);
  if (box) add(G.box(2.0, 1.25, 1.5), body, 1.8, 0.1, 0, 0, 0, 0);
  else add(G.sphere(0.9, 10, 8), body, 1.6, -0.05, 0, 0, 0, 0, [1.3, 0.8, 0.9]);
  add(G.sphere(0.95, 10, 6), belly, 0.4, -0.35, 0, 0, 0, 0, [2.6, 0.45, 0.8]);
  // Tail stock and fluke.
  add(G.cone(0.55, 1.8, 8), body, -3.6, 0.05, 0, 0, 0, PI / 2, [1, 1, 0.8]);
  for (const s of [-1, 1]) add(G.sphere(0.6, 6, 4), fin, -4.6, 0.1, s * 0.75, 0, s * 0.5, 0, [0.7, 0.12, 1.3]);
  // Dorsal fin: a tall blade for the orca, a small hump for the others.
  const tall = art.dorsal === "tall";
  add(G.cone(tall ? 0.45 : 0.3, tall ? 1.8 : 0.5, 4), fin, tall ? -0.2 : -1.2, tall ? 1.4 : 0.8, 0, 0, 0, tall ? 0.15 : 0.5, [1, 1, 0.25]);
  const fl = art.flippers ? 2.2 : 0.9;
  for (const s of [-1, 1]) add(G.sphere(0.5, 6, 4), art.flippers ? belly : fin, 0.8, -0.45, s * (0.8 + fl * 0.35), 0, s * 0.6, 0, [fl * 0.6, 0.1, 0.35 + fl * 0.3]);
  if (art.orca) { for (const s of [-1, 1]) add(G.sphere(0.34, 8, 6), belly, 1.9, 0.25, s * 0.66, 0, 0, 0, [1.3, 0.6, 0.4]); add(G.sphere(0.5, 8, 6), mat("#9aa0a6"), -0.8, 0.62, 0, 0, 0, 0, [1.2, 0.3, 0.7]); }
  if (art.tusk) add(G.cone(0.07, 2.4, 5), mat("#efe6cc"), 3.3, 0.05, 0, 0, 0, -PI / 2);
  if (art.grooves) for (let i = 0; i < 4; i++) add(G.box(1.6, 0.03, 0.05), fin, 1.3, -0.62, -0.3 + i * 0.2);
  for (const s of [-1, 1]) add(G.sphere(0.09, 6, 4), eyeMat, box ? 1.3 : 1.6, box ? -0.05 : 0.02, s * (box ? 0.76 : 0.7));
  return g;
}

/** A small caught-fish mesh coloured like the species (held up when celebrating). */
/** The held-up catch (and trophy): a tiny low-poly model per body type, coloured from art.color / art.fin. Head = +x. */
export function makeHeldFish(art) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: art.color, roughness: 0.4, flatShading: true });
  const fin = new THREE.MeshStandardMaterial({ color: art.fin, roughness: 0.6, flatShading: true });
  const limb = art.limb ? new THREE.MeshStandardMaterial({ color: art.limb, roughness: 0.5, flatShading: true }) : body;
  const eyeMat = new THREE.MeshStandardMaterial({ color: "#1d1a18" });
  const eye = (x, y, z = 0.08, r = 0.035) => { g.add(mesh(G.sphere(r, 6, 4), eyeMat, x, y, z)); g.add(mesh(G.sphere(r, 6, 4), eyeMat, x, y, -z)); };
  const add = (...a) => g.add(mesh(...a));
  switch (art.shape) {
    case "eel": case "serpent": {
      // Segmented tube along a gentle wave; the serpent gets a frill.
      const n = 9, r = art.shape === "serpent" ? 0.085 : 0.065;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), x = -0.55 + u * 1.05, y = Math.sin(u * 5) * 0.06 * (1 - u);
        const k = 0.45 + 0.55 * Math.sin(Math.min(1, u / 0.8) * PI / 2);
        add(G.sphere(r, 8, 6), body, x, y, 0, 0, 0, 0, [1.5, k, k * 0.9]);
        if (art.shape === "serpent" && i > 1 && i < n - 1) add(G.cone(0.05, 0.12, 3), fin, x, y + r * k + 0.04, 0, 0, 0, -0.3, [1, 1, 0.3]);
      }
      add(G.cone(0.07, 0.16, 4), fin, -0.62, 0, 0, 0, 0, PI / 2, [1, 1, 0.3]);
      eye(0.47, 0.03, 0.05, 0.028);
      break;
    }
    case "squid": {
      add(G.cone(0.13, 0.5, 7), body, -0.2, 0, 0, 0, 0, PI / 2);
      add(G.cone(0.12, 0.12, 3), fin, -0.42, 0, 0, 0, 0, PI / 2, [1, 2, 0.25]);
      add(G.sphere(0.11, 8, 6), body, 0.1, 0, 0);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; add(G.box(0.3, 0.025, 0.035), limb, 0.33, Math.sin(a) * 0.05, Math.cos(a) * 0.05, 0, 0, Math.sin(a) * 0.25); }
      eye(0.12, 0.03, 0.09, 0.04);
      break;
    }
    case "octopus": case "kraken": {
      const k = art.shape === "kraken" ? 1.25 : 1;
      add(G.sphere(0.17 * k, 10, 8), body, 0, 0.12 * k, 0, 0, 0, 0.35, [1, 1.15, 1]);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2, cx = Math.cos(a) * 0.1 * k, cz = Math.sin(a) * 0.1 * k;
        add(G.cyl(0.035 * k, 0.02 * k, 0.22 * k, 5), limb, cx * 1.3, -0.05 * k, cz * 1.3, cz * 3, 0, -cx * 3);
        add(G.cyl(0.02 * k, 0.01 * k, 0.16 * k, 5), limb, cx * 2.4, -0.19 * k, cz * 2.4, cz * 1.5, 0, -cx * 1.5);
      }
      eye(0.13 * k, 0.1 * k, 0.07 * k, 0.035 * k);
      break;
    }
    case "jelly": {
      const bell = new THREE.MeshStandardMaterial({ color: art.color, roughness: 0.3, flatShading: true, transparent: true, opacity: 0.85 });
      add(new THREE.SphereGeometry(0.22, 10, 6, 0, PI * 2, 0, PI / 2), bell, 0, 0.1, 0, 0, 0, 0, [1, 0.8, 1]);
      for (let i = 0; i < (art.mane ? 10 : 6); i++) { const a = (i / (art.mane ? 10 : 6)) * PI * 2; add(G.box(0.03, art.mane ? 0.42 : 0.3, 0.012), fin, Math.cos(a) * 0.13, art.mane ? -0.12 : -0.06, Math.sin(a) * 0.13, 0, a, 0); }
      eye(0.2, 0.15, 0.07, 0.025);
      break;
    }
    case "ray": {
      add(G.sphere(0.25, 4, 2), body, 0, 0, 0, 0, 0, 0, [1, 1.55, 0.12]);
      add(G.cyl(0.012, 0.02, 0.45, 4), fin, -0.45, 0, 0, 0, 0, PI / 2);
      if (art.manta) { add(G.cone(0.03, 0.12, 4), fin, 0.28, 0.07, 0, 0, 0, -PI / 2); add(G.cone(0.03, 0.12, 4), fin, 0.28, -0.07, 0, 0, 0, -PI / 2); }
      eye(0.14, 0.06, 0.03, 0.025); eye(0.14, -0.06, 0.03, 0.025);
      break;
    }
    case "crab": case "lobster": {
      const lob = art.shape === "lobster";
      if (lob) for (let i = 0; i < 5; i++) add(G.sphere(0.075 - i * 0.008, 7, 5), body, -0.08 - i * 0.1, -0.01 * i, 0, 0, 0, 0, [1.1, 0.8, 1]);
      add(G.sphere(0.16, 8, 6), body, lob ? 0.12 : 0, 0, 0, 0, 0, 0, lob ? [1.2, 0.7, 0.75] : [1.3, 0.75, 0.95]);
      for (const s of [-1, 1]) {
        add(G.cyl(0.02, 0.02, 0.2, 4), limb, lob ? 0.3 : 0.1, 0.02, s * (lob ? 0.08 : 0.2), s * 0.9, 0, lob ? -1.1 : -0.3);
        add(G.sphere(0.065, 6, 5), limb, lob ? 0.42 : 0.2, lob ? 0.04 : 0.1, s * (lob ? 0.12 : 0.28), 0, 0, 0, [1.4, 0.8, 0.7]);
        for (let i = 0; i < 3; i++) add(G.cyl(0.012, 0.012, 0.16, 4), limb, (lob ? 0.08 : -0.08) + i * 0.08, -0.08, s * 0.13, s * 0.7, 0, 0);
      }
      eye(lob ? 0.26 : 0.16, 0.08, lob ? 0.04 : 0.05, 0.03);
      break;
    }
    case "turtle": {
      const shell = new THREE.MeshStandardMaterial({ color: art.back, roughness: 0.6, flatShading: true });
      add(new THREE.SphereGeometry(0.24, 9, 6, 0, PI * 2, 0, PI / 2), shell, 0, 0, 0, 0, 0, 0, [1.25, 0.8, 1]);
      add(G.cyl(0.29, 0.29, 0.04, 9), new THREE.MeshStandardMaterial({ color: art.belly, roughness: 0.7, flatShading: true }), 0, 0, 0, 0, 0, 0, [1.03, 1, 0.84]);
      add(G.sphere(0.08, 8, 6), fin, 0.34, 0.03, 0, 0, 0, 0, [1.3, 0.9, 0.9]);
      for (const [x, z, r] of [[0.16, 0.2, -0.5], [0.16, -0.2, 0.5], [-0.18, 0.18, 0.4], [-0.18, -0.18, -0.4]]) add(G.box(0.16, 0.025, 0.07), fin, x, -0.02, z, 0, r, 0);
      if (art.island) {
        add(G.cyl(0.018, 0.024, 0.28, 5), new THREE.MeshStandardMaterial({ color: "#9a6a3e", flatShading: true }), 0.02, 0.32, 0, 0, 0, -0.15);
        add(G.cone(0.14, 0.06, 5), new THREE.MeshStandardMaterial({ color: "#6fae52", flatShading: true }), 0.04, 0.47, 0);
      }
      eye(0.4, 0.06, 0.05, 0.022);
      break;
    }
    case "whale": {
      const w = makeGiant(art);
      w.scale.setScalar(0.12);
      g.add(w);
      break;
    }
    default: {
      add(G.sphere(0.2, 10, 8), body, 0, 0, 0, 0, 0, 0, [1.7, art.shape === "puffer" ? 1.3 : 0.75, art.shape === "puffer" ? 1 : 0.45]);
      add(G.cone(0.16, 0.28, 4), fin, -0.42, 0, 0, 0, 0, PI / 2, [1, 1, 0.3]);
      add(G.cone(0.08, 0.18, 3), fin, 0, art.shape === "puffer" ? 0.27 : 0.17, 0, 0, 0, 0, [1.5, 1, 0.3]);
      if (art.hammer) add(G.box(0.07, 0.05, 0.36), body, 0.3, 0.02, 0);
      if (art.wings) for (const s of [-1, 1]) add(G.box(0.26, 0.012, 0.16), fin, 0.02, 0.02, s * 0.14, s * 0.4, 0, 0);
      if (art.mouth === "sword" || art.mouth === "spear") add(G.cone(0.025, 0.3, 4), fin, 0.46, 0, 0, 0, 0, -PI / 2);
      g.add(mesh(G.sphere(0.035, 6, 4), eyeMat, 0.24, 0.04, 0.08));
    }
  }
  return g;
}

/**
 * Player: straw hat, neckerchief, plaid shirt + fishing vest with pockets, wicker creel on the back,
 * jointed arms/legs, boots, and a rod with cork grip, reel and line guides.
 */
/** The angler (player). NPCs reuse the same rig with a different outfit via makeCharacter(). */
export function makePlayer() {
  return makeCharacter({});
}

export const OUTFITS = {
  // Shopkeeper: flat cap, white shirt, striped apron, grey mustache.
  shopkeeper: { hat: "cap", vest: false, creel: false, rod: false, apron: true, mustache: true,
    colors: { shirt: "#f2ede0", shirtDark: "#d6cdb8", denim: "#5d5048", denimLight: "#74665c", hair: "#8d8d8d", cap: "#5f7f5a", apron: "#4f86c6", scarf: "#c9463d" } },
  // Boat seller: sailor cap, blue-striped shirt, full beard.
  sailor: { hat: "sailor", vest: false, creel: false, rod: false, stripes: true, beard: true,
    colors: { shirt: "#f4f1ea", shirtDark: "#3f6e8c", denim: "#2f3f5a", denimLight: "#44567a", hair: "#b0764a", skin: "#e8b88f", scarf: "#3f6e8c" } },
  // Notice-board courier: hair bun with a flower, rosy cardigan, satchel full of letters.
  courier: { hat: "bun", vest: false, creel: false, rod: false, satchel: true,
    colors: { shirt: "#d98a8a", shirtDark: "#b86a6a", denim: "#6b5a7a", denimLight: "#85749a", hair: "#9a5a34", scarf: "#f2cf5b", satchel: "#8a6242" } },
};

export function makeCharacter(opts) {
  const o = { hat: "straw", vest: true, creel: true, rod: true, ...opts };
  const col = { ...o.colors };
  const C = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true });
  const M = {
    skin: C("#f0c9a0"), cheek: C("#eaa38c"), hair: C("#6b4a32"), eye: C("#2a211c"), white: C("#ffffff"),
    shirt: C("#c85a3c"), shirtDark: C("#a8452c"), vest: new THREE.MeshStandardMaterial({ color: "#6f7a45", roughness: 0.95, flatShading: true, side: THREE.DoubleSide }),
    vestDark: C("#58623a"), denim: C("#4e6a88"), denimLight: C("#6d87a2"), boot: C("#5a3e2b"), sole: C("#3a2a1f"),
    belt: C("#3d2e22"), gold: C("#e2b34a"), straw: C("#e4c46c"), strawDark: C("#c9a44c"), band: C("#b8433a"),
    scarf: C("#e8b93e"), leaf: C("#6f9d58"), wicker: C("#c49a5a"), wickerDark: C("#9c7640"), cork: C("#c8a070"), rod: C("#3b3029"), metal: C("#9aa0a6"),
  };
  for (const [k, c] of Object.entries(col)) M[k] = C(c);
  const root = new THREE.Group();
  const body = new THREE.Group(); // bobbing
  root.add(body);

  // Legs (pivot at hip)
  const legs = [-0.14, 0.14].map(x => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.82, 0);
    leg.add(mesh(G.cyl(0.125, 0.105, 0.64, 8), M.denim, 0, -0.32, 0));
    leg.add(mesh(G.cyl(0.118, 0.118, 0.1, 8), M.denimLight, 0, -0.6, 0));
    leg.add(mesh(G.box(0.22, 0.18, 0.34), M.boot, 0, -0.72, 0.05));
    leg.add(mesh(G.box(0.24, 0.05, 0.37), M.sole, 0, -0.8, 0.05));
    leg.add(mesh(G.box(0.2, 0.05, 0.08), M.sole, 0, -0.66, 0.2));
    body.add(leg);
    return leg;
  });

  const torso = new THREE.Group();
  torso.position.y = 0.82;
  body.add(torso);
  torso.add(mesh(G.cyl(0.25, 0.24, 0.14, 10), M.denim, 0, 0.02, 0));
  torso.add(mesh(G.cyl(0.262, 0.262, 0.08, 10), M.belt, 0, 0.1, 0));
  torso.add(mesh(G.box(0.1, 0.08, 0.04), M.gold, 0, 0.1, 0.26));
  torso.add(mesh(G.cyl(0.24, 0.27, 0.6, 10), M.shirt, 0, 0.44, 0));
  torso.add(mesh(G.box(0.03, 0.5, 0.02), M.shirtDark, 0, 0.44, 0.255)); // button placket
  if (o.stripes) for (let j = 0; j < 5; j++) torso.add(mesh(G.cyl(0.255 + j * 0.006, 0.255 + j * 0.006, 0.045, 12), M.shirtDark, 0, 0.2 + j * 0.11, 0));
  else for (let j = 0; j < 3; j++) torso.add(mesh(G.box(0.24, 0.025, 0.02), M.shirtDark, 0, 0.26 + j * 0.16, 0.25 - j * 0.004)); // plaid lines
  if (o.vest) {
    const gap = 1.1;
    torso.add(mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.5, 14, 1, true, gap / 2, 2 * PI - gap), M.vest, 0, 0.4, 0));
    for (const s of [-1, 1]) {
      torso.add(mesh(G.box(0.14, 0.14, 0.05), M.vestDark, s * 0.18, 0.32, 0.23, 0, s * 0.62, 0));
      torso.add(mesh(G.box(0.15, 0.04, 0.06), M.vest, s * 0.18, 0.4, 0.235, 0, s * 0.62, 0));
      torso.add(mesh(G.box(0.1, 0.1, 0.04), M.vestDark, s * 0.2, 0.52, 0.215, 0, s * 0.7, 0));
    }
  }
  if (o.apron) {
    torso.add(mesh(G.box(0.46, 0.72, 0.04), M.apron, 0, 0.18, 0.27, -0.08, 0, 0));
    for (let j = 0; j < 4; j++) torso.add(mesh(G.box(0.07, 0.72, 0.045), M.white, -0.15 + j * 0.1, 0.18, 0.275, -0.08, 0, 0));
    torso.add(mesh(G.box(0.2, 0.12, 0.05), M.white, 0, 0.08, 0.3, -0.08, 0, 0)); // pocket
  }
  torso.add(mesh(G.torus(0.15, 0.06, 6, 12), M.scarf, 0, 0.74, 0.02, PI / 2, 0, 0));
  torso.add(mesh(G.cone(0.08, 0.16, 4), M.scarf, 0, 0.64, 0.17, PI, 0, 0, [1, 1, 0.5]));
  if (o.satchel) {
    torso.add(mesh(G.box(0.05, 0.75, 0.04), M.satchel, -0.1, 0.42, 0.01, 0, 0, -0.62));
    torso.add(mesh(G.box(0.3, 0.26, 0.12), M.satchel, 0.27, 0.12, 0.08, 0, 0.5, 0));
    torso.add(mesh(G.box(0.18, 0.12, 0.02), M.white, 0.22, 0.28, 0.14, 0, 0.5, 0.1));
  }
  if (o.creel) {
    // Creel basket with strap
    torso.add(mesh(G.box(0.44, 0.4, 0.24), M.wicker, 0, 0.42, -0.36));
    for (let j = 0; j < 4; j++) torso.add(mesh(G.box(0.45, 0.03, 0.25), M.wickerDark, 0, 0.26 + j * 0.1, -0.36));
    torso.add(mesh(G.box(0.48, 0.06, 0.28), M.wickerDark, 0, 0.64, -0.36, -0.1, 0, 0));
    torso.add(mesh(G.box(0.05, 0.75, 0.04), M.belt, 0.1, 0.42, 0.01, 0, 0, 0.62));
  }
  // Neck + head
  torso.add(mesh(G.cyl(0.1, 0.11, 0.16, 8), M.skin, 0, 0.78, 0));
  const head = new THREE.Group();
  head.position.y = 1.06;
  torso.add(head);
  // Slightly chibi proportions so the face reads from the high camera.
  head.add(mesh(G.sphere(0.34, 16, 12), M.skin, 0, 0, 0, 0, 0, 0, [1, 0.95, 0.95]));
  head.add(mesh(G.sphere(0.08, 8, 6), M.skin, 0, -0.04, 0.33));
  for (const s of [-1, 1]) {
    head.add(mesh(G.sphere(0.085, 8, 6), M.skin, s * 0.33, -0.02, 0, 0, 0, 0, [0.5, 1, 0.7]));
    head.add(mesh(G.sphere(0.062, 10, 8), M.eye, s * 0.125, 0.05, 0.29, 0, 0, 0, [1, 1.15, 0.8]));
    head.add(mesh(G.sphere(0.021, 6, 4), M.white, s * 0.125 + 0.02, 0.08, 0.34));
    head.add(mesh(G.box(0.12, 0.03, 0.035), M.hair, s * 0.125, 0.16, 0.3, -0.2, 0, s * -0.15));
    head.add(mesh(G.sphere(0.065, 8, 6), M.cheek, s * 0.21, -0.09, 0.26, 0, 0, 0, [1, 0.6, 0.35]));
    head.add(mesh(G.box(0.08, 0.18, 0.09), M.hair, s * 0.3, 0.05, 0.06));
  }
  head.add(mesh(new THREE.TorusGeometry(0.05, 0.014, 4, 8, PI), M.eye, 0, -0.14, 0.31, 0, 0, PI)); // smile
  if (o.mustache) for (const s of [-1, 1]) head.add(mesh(G.sphere(0.07, 8, 6), M.hair, s * 0.06, -0.1, 0.32, 0, 0, s * 0.4, [1.4, 0.6, 0.6]));
  if (o.beard) {
    head.add(mesh(G.sphere(0.3, 12, 8), M.hair, 0, -0.14, 0.08, 0, 0, 0, [1.05, 0.75, 0.95]));
    head.add(mesh(new THREE.TorusGeometry(0.05, 0.014, 4, 8, PI), M.eye, 0, -0.1, 0.33, 0, 0, PI));
  }
  head.add(mesh(G.ico(0.32, 0), M.hair, 0, 0.08, -0.13, 0, 0, 0, [1.05, 0.8, 0.85]));
  if (o.hat !== "bun") head.add(mesh(G.ico(0.12, 0), M.hair, 0.08, 0.22, 0.2, 0.4, 0, 0, [1.4, 0.5, 0.8])); // fringe under the hat
  const hat = new THREE.Group();
  head.add(hat);
  if (o.hat === "bun") {
    // No hat: smooth hair cap with side-swept bangs, a round bun on top and a little flower
    hat.add(mesh(G.sphere(0.355, 16, 12), M.hair, 0, 0.06, -0.05, 0, 0, 0, [1.03, 0.82, 1.02]));
    hat.add(mesh(G.sphere(0.3, 14, 10), M.hair, 0, -0.06, -0.14, 0, 0, 0, [1.08, 0.9, 0.85]));
    hat.add(mesh(G.sphere(0.2, 12, 8), M.hair, -0.05, 0.19, 0.2, 0.35, 0, 0.25, [1.25, 0.42, 0.7]));
    hat.add(mesh(G.sphere(0.15, 12, 10), M.hair, 0, 0.36, -0.08));
    hat.add(mesh(G.torus(0.1, 0.025, 6, 12), M.scarf, 0, 0.3, -0.08, PI / 2, 0, 0));
    hat.add(mesh(G.sphere(0.055, 8, 6), M.white, 0.2, 0.22, 0.12));
    hat.add(mesh(G.sphere(0.03, 6, 4), M.scarf, 0.22, 0.23, 0.16));
  } else if (o.hat === "cap") {
    // Flat cap with a short brim
    hat.position.set(0, 0.22, 0);
    hat.rotation.x = -0.15;
    hat.add(mesh(G.sphere(0.33, 14, 8), M.cap, 0, 0.02, -0.02, 0, 0, 0, [1.05, 0.42, 1.08]));
    hat.add(mesh(G.box(0.42, 0.04, 0.2), M.cap, 0, -0.02, 0.3, 0.2, 0, 0));
    hat.add(mesh(G.sphere(0.04, 6, 4), M.cap, 0, 0.16, 0));
  } else if (o.hat === "sailor") {
    // White sailor cap with a navy band and anchor badge
    hat.position.set(0, 0.25, -0.02);
    hat.rotation.x = -0.2;
    hat.add(mesh(G.cyl(0.36, 0.3, 0.16, 14), M.white, 0, 0.08, 0));
    hat.add(mesh(G.cyl(0.305, 0.305, 0.08, 14), M.shirtDark, 0, -0.01, 0));
    hat.add(mesh(G.box(0.36, 0.035, 0.18), M.eye, 0, -0.04, 0.3, 0.25, 0, 0));
    hat.add(mesh(G.box(0.07, 0.09, 0.02), M.gold, 0, 0.02, 0.31));
  } else {
    // Straw hat, tipped back to show the face
    hat.position.set(0, 0.23, -0.04);
    hat.rotation.x = -0.38;
    hat.add(mesh(G.cyl(0.47, 0.5, 0.05, 18), M.straw, 0, 0.02, 0));
    hat.add(mesh(G.torus(0.485, 0.025, 4, 18), M.strawDark, 0, 0.02, 0, PI / 2, 0, 0));
    hat.add(mesh(G.cyl(0.28, 0.33, 0.28, 12), M.straw, 0, 0.18, 0));
    hat.add(mesh(G.cyl(0.335, 0.335, 0.08, 12), M.band, 0, 0.09, 0));
    hat.add(mesh(G.sphere(0.28, 12, 6), M.strawDark, 0, 0.3, 0, 0, 0, 0, [1, 0.25, 1]));
    hat.add(mesh(G.box(0.04, 0.16, 0.1), M.gold, 0.31, 0.12, 0.12, 0, 0.5, 0.3));
    hat.add(mesh(G.cone(0.05, 0.3, 4), M.leaf, 0.3, 0.2, -0.05, 0.2, 0, -0.5)); // feather
  }
  hat.traverse(o => { o.castShadow = false; }); // keep the face lit from above

  // Arms (pivot at shoulder, elbow joint)
  const arms = [-1, 1].map(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.33, 0.66, 0);
    arm.add(mesh(G.sphere(0.1, 8, 6), M.shirt, 0, 0, 0));
    arm.add(mesh(G.cyl(0.088, 0.08, 0.32, 8), M.shirt, 0, -0.17, 0));
    arm.add(mesh(G.cyl(0.098, 0.098, 0.08, 8), M.shirtDark, 0, -0.33, 0));
    const fore = new THREE.Group();
    fore.position.y = -0.36;
    arm.add(fore);
    fore.add(mesh(G.cyl(0.072, 0.064, 0.28, 8), M.skin, 0, -0.14, 0));
    fore.add(mesh(G.sphere(0.085, 8, 6), M.skin, 0, -0.31, 0));
    const hand = new THREE.Group();
    hand.position.y = -0.31;
    fore.add(hand);
    torso.add(arm);
    return { arm, fore, hand };
  });

  // Fishing rod (+y along the blank); tip is where the line starts.
  const rod = new THREE.Group();
  rod.add(mesh(G.cyl(0.035, 0.04, 0.4, 7), M.cork, 0, 0.05, 0));
  rod.add(mesh(G.cyl(0.07, 0.07, 0.06, 10), M.metal, 0.07, 0.12, 0, 0, 0, PI / 2));
  rod.add(mesh(G.box(0.02, 0.1, 0.02), M.rod, 0.11, 0.16, 0));
  rod.add(mesh(G.cyl(0.011, 0.027, 2.5, 6), M.rod, 0, 1.5, 0));
  for (let j = 0; j < 4; j++) rod.add(mesh(G.torus(0.028 - j * 0.004, 0.006, 4, 8), M.metal, 0, 0.7 + j * 0.55, 0.03));
  const tip = new THREE.Object3D();
  tip.position.y = 2.75;
  rod.add(tip);

  // Rod sockets: in the right hand while fishing, strapped to the creel otherwise.
  const handSocket = new THREE.Group();
  handSocket.rotation.x = 1.7;
  arms[1].hand.add(handSocket);
  const backSocket = new THREE.Group();
  backSocket.position.set(0.12, 0.1, -0.52);
  backSocket.rotation.set(-0.15, 0, -0.45);
  torso.add(backSocket);
  if (o.rod) backSocket.add(rod);

  const heldFish = new THREE.Group();
  heldFish.position.set(0, -0.05, 0.1);
  arms[0].hand.add(heldFish);

  return { root, body, torso, head, hat, legs, arms, rod, tip, handSocket, backSocket, heldFish, materials: M };
}

export function makeDuck() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: "#8a6a4a", flatShading: true });
  const green = new THREE.MeshStandardMaterial({ color: "#3f7a4a", flatShading: true });
  const orange = new THREE.MeshStandardMaterial({ color: "#e8962e", flatShading: true });
  g.add(mesh(G.sphere(0.28, 8, 6), white, 0, 0.12, 0, 0, 0, 0, [0.8, 0.6, 1.2]));
  g.add(mesh(G.cone(0.12, 0.2, 4), white, 0, 0.22, -0.32, -1.2, 0, 0));
  g.add(mesh(G.sphere(0.14, 8, 6), green, 0, 0.36, 0.26));
  g.add(mesh(G.cone(0.05, 0.16, 4), orange, 0, 0.34, 0.43, PI / 2, 0, 0, [1.4, 1, 0.6]));
  return g;
}

export function makeGull() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: "#f4f2ee", flatShading: true });
  const grey = new THREE.MeshStandardMaterial({ color: "#9aa3aa", flatShading: true });
  g.add(mesh(G.sphere(0.2, 8, 6), white, 0, 0, 0, 0, 0, 0, [0.8, 0.7, 1.6]));
  g.add(mesh(G.cone(0.05, 0.14, 4), new THREE.MeshStandardMaterial({ color: "#e8b43e" }), 0, 0.02, 0.36, PI / 2, 0, 0));
  const wings = [-1, 1].map(s => {
    const w = new THREE.Group();
    w.position.set(s * 0.12, 0.05, 0);
    w.add(mesh(G.box(0.7, 0.03, 0.28), grey, s * 0.35, 0, 0));
    g.add(w);
    return w;
  });
  g.userData.wings = wings;
  return g;
}

export function makeButterfly(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, flatShading: true });
  const wings = [-1, 1].map(s => {
    const w = new THREE.Group();
    w.add(mesh(G.circle(0.12, 5), mat, s * 0.1, 0, 0));
    g.add(w);
    return w;
  });
  g.userData.wings = wings;
  return g;
}
