// Shared low-poly kit: palette materials, cached geometries, a transform-stack builder, and a static
// batcher that merges many small parts into one mesh per material (keeps draw calls low).
import * as THREE from "three";

// Shared time uniform for shader-animated materials (water waves, wind sway).
export const TIME = { value: 0 };

function std(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...extra });
}

/** Adds gentle wind sway to vertices above `base` height (world space, for merged static meshes). */
function withSway(mat, amount, base = 0.4) {
  // Programs are cached by onBeforeCompile source; each variant needs its own key.
  mat.customProgramCacheKey = () => `sway:${amount}:${base}`;
  mat.onBeforeCompile = shader => {
    shader.uniforms.uTime = TIME;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        float swayH = max(0.0, transformed.y - ${base.toFixed(2)});
        float swayP = uTime * 1.6 + transformed.x * 0.35 + transformed.z * 0.27;
        transformed.x += sin(swayP) * ${amount.toFixed(3)} * swayH;
        transformed.z += cos(swayP * 0.8) * ${(amount * 0.6).toFixed(3)} * swayH;`);
  };
  return mat;
}

// Wave model shared by the water shader and JS (boats/bobbers ride the same surface).
// Height ramps from `near` at the shore (z <= z0) to `far` out at sea (z >= z1).
export const SEA_WAVES = { freq: 0.42, near: 0.1, far: 0.55, z0: 17, z1: 55 };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function waveHeight(x, z, t, w = SEA_WAVES) {
  const f = w.freq, amp = w.near + (w.far - w.near) * smooth(w.z0, w.z1, z);
  return (Math.sin(x * f + t * 1.2) * 0.5 + Math.sin(z * f * 0.8 - t * 0.9) * 0.35 + Math.sin((x + z) * f * 1.7 + t * 1.9) * 0.15) * amp;
}

/** Low-poly animated water: layered swells, faceted shading (flatShading) and white crests on the peaks. */
function water(color, { freq, near, far = near, z0 = 0, z1 = 1, crest = 0 }) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05, flatShading: true, transparent: true, opacity: 0.94 });
  const n = v => v.toFixed(3);
  mat.customProgramCacheKey = () => `water:${freq}:${near}:${far}:${z0}:${z1}:${crest}`;
  mat.onBeforeCompile = shader => {
    shader.uniforms.uTime = TIME;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying float vWave;\nvarying vec2 vXZ;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float amp = mix(${n(near)}, ${n(far)}, smoothstep(${n(z0)}, ${n(z1)}, wp.z));
        float w = sin(wp.x * ${n(freq)} + uTime * 1.2) * 0.5 + sin(wp.z * ${n(freq * 0.8)} - uTime * 0.9) * 0.35
                + sin((wp.x + wp.z) * ${n(freq * 1.7)} + uTime * 1.9) * 0.15;
        transformed.z += w * amp;
        vWave = w * smoothstep(0.05, 0.3, amp); // normalized swell phase, only where the sea is rough
        vXZ = wp.xz;`);
    if (crest) {
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying float vWave;\nvarying vec2 vXZ;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          // Whitecaps: only near swell peaks, broken up by a finer moving ripple pattern.
          float ripple = sin(vXZ.x * 2.3 + uTime * 2.1) * sin(vXZ.y * 2.7 - uTime * 1.6) + 0.5 * sin((vXZ.x - vXZ.y) * 4.1 + uTime * 3.0);
          float capMask = smoothstep(0.6, 0.85, vWave) * smoothstep(0.55, 1.1, ripple);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.97, 1.0), capMask * ${n(crest)});
          diffuseColor.rgb *= 1.0 + vWave * 0.08;`);
    }
  };
  return mat;
}

function stripeTexture(a, b, n = 6) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = a; g.fillRect(0, 0, 128, 32);
  g.fillStyle = b;
  for (let i = -1; i < n + 1; i++) {
    g.beginPath();
    const x = (i * 128) / n;
    g.moveTo(x, 32); g.lineTo(x + 64 / n, 32); g.lineTo(x + 64 / n + 16, 0); g.lineTo(x + 16, 0); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createMaterials() {
  const M = {
    grass: std("#8fb56a"), grassDark: std("#7aa35c"), grassLight: std("#a3c476"), sand: std("#e8d3a2"), sandWet: std("#d6bd88"),
    path: std("#d8bf8e"), pathEdge: std("#c4a676"), soil: std("#7a5a3e"),
    wood: std("#a8784e"), woodDark: std("#7a5638"), woodLight: std("#c9a274"), plank: std("#c49a68"), plankDark: std("#a98252"),
    stone: std("#a9a59b"), stoneDark: std("#8a867d"), stoneLight: std("#c2beb3"), moss: std("#7f9b55"),
    cream: std("#f2e6cc"), plaster: std("#ece0c6"), terracotta: std("#c8704f"), roofRed: std("#b8664a"), roofRedDark: std("#9c5038"),
    roofGreen: std("#5f7f5a"), roofGreenDark: std("#4c6a48"), trunk: std("#8a6242"), birch: std("#ece7dc"), birchMark: std("#3f3a35"),
    leaf: [std("#6f9d58"), std("#88ad5c"), std("#5f8c55"), std("#98b865")],
    leafStill: std("#6f9d58"), // for greenery on buildings: must not sway
    pine: [std("#4f7d52"), std("#5c8a58")],
    white: std("#f6f1e6"), red: std("#c9463d"), orange: std("#e8872e"), yellow: std("#f2cf5b"), blue: std("#4f7fb0"), black: std("#2e2925"),
    metal: std("#7d8288", { metalness: 0.4, roughness: 0.5 }), rope: std("#cdb58a"),
    pink: std("#e8a0b4"), lilac: std("#b69ad8"), petalWhite: std("#f7f2e8"), petalYellow: std("#f2d06b"),
    lily: std("#5f9a58"), reed: std("#7e9a4a"), reedTop: std("#8a6242"),
    window: new THREE.MeshStandardMaterial({ color: "#46586a", emissive: "#ffc46b", emissiveIntensity: 0, roughness: 0.3, flatShading: true }),
    lampGlass: new THREE.MeshStandardMaterial({ color: "#fff1c9", emissive: "#ffcf7a", emissiveIntensity: 0.2, roughness: 0.4 }),
    boatHull: std("#e9e1cf"), boatTrim: std("#3f6e8c"), sail: std("#f5ecd8", { side: THREE.DoubleSide }),
    lake: water("#5aa7b3", { freq: 0.9, near: 0.035 }), lakeDeep: water("#428ea0", { freq: 0.9, near: 0.03 }),
    river: water("#62afbc", { freq: 0.7, near: 0.05 }), sea: water("#4a9ab4", { ...SEA_WAVES, crest: 0.85 }),
    foam: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false }),
    glint: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55, depthWrite: false }),
    spot: new THREE.MeshBasicMaterial({ color: "#fff4d6", transparent: true, opacity: 0.45, depthWrite: false }),
    smoke: new THREE.MeshStandardMaterial({ color: "#e8e4dc", transparent: true, opacity: 0.6, roughness: 1, flatShading: true, depthWrite: false }),
    barrier: std("#ffffff", { map: stripeTexture("#f4efe4", "#d4463a") }),
    cone: std("#ec7a2c"),
  };
  // Leaves, reeds and grass sway in the wind (after merging, heights are world heights).
  M.leaf.forEach(m => withSway(m, 0.025, 1.2));
  M.pine.forEach(m => withSway(m, 0.015, 1.0));
  withSway(M.reed, 0.09, 0.1);
  withSway(M.reedTop, 0.09, 0.1);
  withSway(M.grassLight, 0.12, 0.02);
  return M;
}

// Geometry cache so identical primitives are shared.
const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
export const G = {
  box: (w, h, d) => cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
  cyl: (rt, rb, h, s = 8) => cached(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s)),
  cone: (r, h, s = 8) => cached(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s)),
  sphere: (r, w = 10, h = 8) => cached(`s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h)),
  ico: (r, d = 0) => cached(`i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d)),
  dodeca: r => cached(`d${r}`, () => new THREE.DodecahedronGeometry(r, 0)),
  torus: (r, t, rs = 6, ts = 12) => cached(`t${r},${t},${rs},${ts}`, () => new THREE.TorusGeometry(r, t, rs, ts)),
  circle: (r, s = 16) => cached(`o${r},${s}`, () => new THREE.CircleGeometry(r, s).rotateX(-Math.PI / 2)),
};

const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function compose(x, y, z, rx, ry, rz, sx, sy, sz) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}

/** Transform-stack builder writing parts into a sink (Batch for static scenery, GroupSink for live objects). */
export class Kit {
  constructor(sink) { this.sink = sink; this.stack = [new THREE.Matrix4()]; }
  get top() { return this.stack[this.stack.length - 1]; }
  push(x = 0, y = 0, z = 0, ry = 0, s = 1, rx = 0, rz = 0) {
    this.stack.push(this.top.clone().multiply(compose(x, y, z, rx, ry, rz, s, s, s)));
    return this;
  }
  pop() { this.stack.pop(); return this; }
  /** part(geo, mat, [x,y,z], [rx,ry,rz], [sx,sy,sz]) */
  part(geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
    const sc = typeof s === "number" ? [s, s, s] : s;
    this.sink.add(geo, mat, this.top.clone().multiply(compose(p[0], p[1], p[2], r[0], r[1], r[2], sc[0], sc[1], sc[2])));
    return this;
  }
}

/** Collects static parts and merges them per material. */
export class Batch {
  constructor() { this.byMat = new Map(); }
  add(geo, mat, matrix) {
    if (!this.byMat.has(mat)) this.byMat.set(mat, []);
    this.byMat.get(mat).push([geo, matrix]);
  }
  build({ castShadow = true, receiveShadow = true, noShadow = [] } = {}) {
    const group = new THREE.Group();
    const normalMatrix = new THREE.Matrix3();
    const v = new THREE.Vector3();
    for (const [mat, parts] of this.byMat) {
      let count = 0;
      const flat = parts.map(([geo, m]) => {
        const g = geo.index ? cached(geo.uuid + "ni", () => geo.toNonIndexed()) : geo;
        count += g.attributes.position.count;
        return [g, m];
      });
      const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), uv = new Float32Array(count * 2);
      let o = 0;
      for (const [g, m] of flat) {
        normalMatrix.getNormalMatrix(m);
        const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
        for (let i = 0; i < P.count; i++, o++) {
          v.fromBufferAttribute(P, i).applyMatrix4(m);
          pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
          v.fromBufferAttribute(N, i).applyMatrix3(normalMatrix).normalize();
          nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z;
          if (U) { uv[o * 2] = U.getX(i); uv[o * 2 + 1] = U.getY(i); }
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = castShadow && !noShadow.includes(mat);
      mesh.receiveShadow = receiveShadow;
      group.add(mesh);
    }
    return group;
  }
}

/** Sink that creates individual meshes in a group (for animated/dynamic objects). */
export class GroupSink {
  constructor(group, { castShadow = true } = {}) { this.group = group; this.castShadow = castShadow; }
  add(geo, mat, matrix) {
    const mesh = new THREE.Mesh(geo, mat);
    matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.castShadow = this.castShadow;
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }
}
