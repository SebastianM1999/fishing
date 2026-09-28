// The Deep Trench seascape: dark, heaving water, jagged sea stacks, a wreck, a lighthouse sweeping its beam, the
// abyss itself (a dark swirl beside the trawler) with glowing plankton, bow spray and lightning. Built once far out
// at WORLD.trench; update() animates it only while the player is there.
import * as THREE from "three";
import { WORLD } from "../game/world.js";
import { G, Kit, Batch, TRENCH_WAVES, waveHeight } from "./kit.js";
import { SEA_Y } from "./environment.js";

const C = WORLD.trench;
// Sea stacks around the trawler: [dx, dz, height] from the deck centre (kept clear of the casting lanes).
const STACKS = [[-9, -6, 5.5], [-14.5, 2, 7.5], [11.5, -9.5, 6.5], [16, 4, 4.5], [-6, -16.5, 9.5], [6.5, -19, 5.5], [-19, -11, 5], [20, -15, 8.5], [-13, 13, 3.8], [14, 15, 3.2], [-22, 4, 6]];
const ABYSS = { dx: 6.8, dz: -0.6, r: 4.6 };
const LIGHTHOUSE = { dx: 17, dz: -23 };

function radialTexture(draw) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  draw(c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.center.set(0.5, 0.5);
  return t;
}

export function buildTrench(M) {
  const root = new THREE.Group();
  const cx = C.cx, cz = C.cz;

  // Rough water: a dense patch with the trench swell and whitecaps.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(150, 150, 110, 110), M.trenchSea);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(cx, SEA_Y, cz);
  sea.receiveShadow = true;
  root.add(sea);
  // An inky floor under the swell, so the troughs never show the calm sea (hidden while here) or the sky.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({ color: "#07131d" }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, SEA_Y - 2.4, cz);
  root.add(floor);

  // Sea stacks: stacked, tilted blocks with wet dark bases and lighter tops; plus a wreck on the rocks.
  const batch = new Batch();
  const k = new Kit(batch);
  STACKS.forEach(([dx, dz, h], i) => {
    const x = cx + dx, z = cz + dz, r = 0.9 + h * 0.2, a = i * 1.7;
    const base = SEA_Y - 2.2;
    k.part(G.cyl(r * 0.95, r * 1.3, 3.2, 7), M.trenchRockWet, [x, base + 1.6, z], [0, a, 0]);
    k.part(G.cyl(r * 0.7, r * 0.98, h * 0.45, 6), M.trenchRock, [x + 0.15, base + 3.2 + h * 0.2, z - 0.1], [0.06, a * 2, 0.05]);
    k.part(G.cone(r * 0.72, h * 0.6, 6), M.trenchRockLight, [x - 0.1, base + 3.1 + h * 0.45 + h * 0.3, z + 0.1], [-0.07, a * 3, 0.06]);
    k.part(G.cone(r * 0.42, h * 0.55, 5), M.trenchRock, [x + r * 0.95, base + 2.4 + h * 0.2, z + r * 0.35], [0.1, a, -0.38]);
    k.part(G.dodeca(r * 0.55), M.trenchRockWet, [x - r * 1.05, SEA_Y - 0.2, z - r * 0.4], [a, a, 0]);
  });
  {
    // Wreck: a broken hull wedged on the rocks, a snapped mast and a torn sail.
    const x = cx - 8.5, z = cz + 7.5;
    k.push(x, SEA_Y - 0.5, z, 0.7, 1, 0.35, 0.25);
    k.part(G.box(2.2, 1.2, 5.2), M.woodDark, [0, 0, 0]);
    k.part(G.box(2.3, 0.2, 5.3), M.plankDark, [0, 0.62, 0]);
    for (let j = 0; j < 4; j++) k.part(G.box(0.12, 0.9, 0.12), M.woodDark, [0.95, 0.9, -1.8 + j * 1.2], [0, 0, 0.3 + j * 0.1]);
    k.part(G.cyl(0.1, 0.12, 3.2, 6), M.woodDark, [0, 2.2, 0.6], [0.2, 0, -0.5]);
    k.pop();
    k.part(G.dodeca(1.4), M.trenchRockWet, [x + 1.4, SEA_Y - 0.4, z - 1.5], [0.4, 0.3, 0]);
  }
  {
    // Lighthouse on its own crag.
    const x = cx + LIGHTHOUSE.dx, z = cz + LIGHTHOUSE.dz;
    k.part(G.cyl(3.2, 4.2, 5, 8), M.trenchRockWet, [x, SEA_Y + 0.2, z]);
    k.part(G.cyl(2.4, 3.1, 1.6, 8), M.trenchRock, [x, SEA_Y + 3.4, z]);
    for (let j = 0; j < 5; j++) k.part(G.cyl(0.95 - j * 0.08, 1.03 - j * 0.08, 1.4, 10), j % 2 ? M.red : M.white, [x, SEA_Y + 4.9 + j * 1.4, z]);
    k.part(G.cyl(1.15, 1.15, 0.2, 10), M.steelDark, [x, SEA_Y + 11.3, z]);
    k.part(G.cyl(0.65, 0.65, 1.1, 8), M.lampGlass, [x, SEA_Y + 12, z]);
    k.part(G.cone(0.9, 1.1, 8), M.red, [x, SEA_Y + 13.1, z]);
  }
  root.add(batch.build());

  // Lighthouse beam: a soft cone sweeping around, and its light.
  const lamp = new THREE.Vector3(cx + LIGHTHOUSE.dx, SEA_Y + 12, cz + LIGHTHOUSE.dz);
  const beam = new THREE.Group();
  beam.position.copy(lamp);
  const beamMat = new THREE.MeshBasicMaterial({ color: "#fff2c0", transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 42, 16, 1, true), beamMat);
  cone.rotation.z = Math.PI / 2 - 0.12;
  cone.position.x = -21;
  beam.add(cone);
  root.add(beam);
  const beacon = new THREE.PointLight("#ffe7a8", 0, 36, 1.4);
  // Deck floodlight on the trawler's mast (placed by scene.js), so the deck stays readable at night.
  const floodlight = new THREE.PointLight("#ffe2b0", 0, 24, 1.1);
  beacon.position.copy(lamp);
  root.add(beacon);

  // The abyss: a displaced disc that rides the swell, dark in the middle, with a slowly turning foam spiral on top.
  const disc = new THREE.RingGeometry(0.01, ABYSS.r, 40, 10).rotateX(-Math.PI / 2);
  const dark = radialTexture(g => {
    const gr = g.createRadialGradient(128, 128, 4, 128, 128, 128);
    gr.addColorStop(0, "rgba(2,6,16,0.95)"); gr.addColorStop(0.45, "rgba(4,14,30,0.75)"); gr.addColorStop(1, "rgba(8,26,46,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  const spiral = radialTexture(g => {
    g.strokeStyle = "rgba(220,240,255,0.55)"; g.lineCap = "round";
    for (let arm = 0; arm < 3; arm++) {
      g.lineWidth = 5;
      g.beginPath();
      for (let t = 0; t < 1; t += 0.01) {
        const a = arm * (Math.PI * 2 / 3) + t * 7, r = 18 + t * 104;
        const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r;
        if (t === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
  });
  const abyssPos = new THREE.Vector3(cx + ABYSS.dx, SEA_Y, cz + ABYSS.dz);
  const abyssDark = new THREE.Mesh(disc, new THREE.MeshBasicMaterial({ map: dark, transparent: true, depthWrite: false }));
  const abyssFoam = new THREE.Mesh(disc, new THREE.MeshBasicMaterial({ map: spiral, transparent: true, depthWrite: false }));
  abyssDark.renderOrder = 2;
  abyssFoam.renderOrder = 3;
  abyssDark.position.copy(abyssPos);
  abyssFoam.position.copy(abyssPos);
  root.add(abyssDark, abyssFoam);
  const discBase = Float32Array.from(disc.attributes.position.array);

  // Glowing plankton over the abyss.
  const PLANKTON = 110;
  const plankSeed = Array.from({ length: PLANKTON }, (_, i) => [Math.sqrt((i * 0.618) % 1) * ABYSS.r * 0.9, i * 2.399, i * 0.37]);
  const plankPos = new Float32Array(PLANKTON * 3);
  const plankGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(plankPos, 3));
  const plankton = new THREE.Points(plankGeo, new THREE.PointsMaterial({ color: "#7ff4ff", size: 5, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  plankton.frustumCulled = false;
  root.add(plankton);

  // Foam collars around the stacks.
  const collars = STACKS.map(([dx, dz, h]) => {
    const r = 0.9 + h * 0.2;
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 1.2, r * 1.55, 18).rotateX(-Math.PI / 2), M.foam.clone());
    m.position.set(cx + dx, SEA_Y, cz + dz);
    m.renderOrder = 2;
    root.add(m);
    return m;
  });

  // Spray: white droplets thrown up at the bow and sides as the trawler slams into the swell.
  const SPRAY = 120;
  const sprayPos = new Float32Array(SPRAY * 3), sprayVel = new Float32Array(SPRAY * 3), sprayLife = new Float32Array(SPRAY);
  const sprayGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(sprayPos, 3));
  const spray = new THREE.Points(sprayGeo, new THREE.PointsMaterial({ color: "#f2f8ff", size: 6, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false }));
  spray.frustumCulled = false;
  root.add(spray);
  let sprayNext = 0, sprayCursor = 0;
  function burst(x, y, z, dirX, dirZ, n, power) {
    for (let i = 0; i < n; i++) {
      const j = sprayCursor++ % SPRAY;
      sprayPos.set([x + (Math.random() - 0.5) * 1.2, y, z + (Math.random() - 0.5) * 1.2], j * 3);
      sprayVel.set([dirX * power * (0.4 + Math.random()) + (Math.random() - 0.5) * 2, power * (0.8 + Math.random() * 0.9), dirZ * power * (0.4 + Math.random()) + (Math.random() - 0.5) * 2], j * 3);
      sprayLife[j] = 0.9 + Math.random() * 0.6;
    }
  }

  // Lightning bolt: a jagged line from the clouds to the horizon, shown for a blink with each flash.
  const BOLT = 12;
  const boltPos = new Float32Array(BOLT * 3);
  const boltGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(boltPos, 3));
  const bolt = new THREE.Line(boltGeo, new THREE.LineBasicMaterial({ color: "#eef4ff", transparent: true, opacity: 0, fog: false }));
  bolt.frustumCulled = false;
  root.add(bolt);
  let boltLeft = 0;
  function strike() {
    const x0 = cx + (Math.random() - 0.5) * 50, z0 = cz - 22 - Math.random() * 14;
    let x = x0, z = z0;
    for (let i = 0; i < BOLT; i++) {
      const y = 34 - (i / (BOLT - 1)) * 34;
      boltPos.set([x, y, z], i * 3);
      x += (Math.random() - 0.5) * 3.2; z += (Math.random() - 0.5) * 1.5;
    }
    boltGeo.attributes.position.needsUpdate = true;
    boltLeft = 0.22;
  }

  /** Animate while the player is at the trench. boat = the trawler (for spray), night 0..1 (beam/beacon). */
  function update({ elapsed, dt, boat, night, flash }) {
    beam.rotation.y = elapsed * 0.45;
    beamMat.opacity = 0.03 + 0.2 * night;
    beacon.intensity = 8 + 22 * night;
    floodlight.intensity = 3 + 26 * night;
    // Discs and plankton ride the swell.
    const pos = disc.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = discBase[i * 3], z = discBase[i * 3 + 2];
      pos.setY(i, waveHeight(abyssPos.x + x, abyssPos.z + z, elapsed, TRENCH_WAVES) + 0.06);
    }
    pos.needsUpdate = true;
    spiral.rotation = -elapsed * 0.35;
    dark.rotation = elapsed * 0.1;
    for (let i = 0; i < PLANKTON; i++) {
      const [r, a0, ph] = plankSeed[i], a = a0 - elapsed * (0.25 + (1 - r / ABYSS.r) * 0.5);
      const x = abyssPos.x + Math.cos(a) * r, z = abyssPos.z + Math.sin(a) * r;
      plankPos[i * 3] = x; plankPos[i * 3 + 2] = z;
      plankPos[i * 3 + 1] = SEA_Y + waveHeight(x, z, elapsed, TRENCH_WAVES) + 0.12 + Math.sin(elapsed * 2 + ph) * 0.05;
    }
    plankGeo.attributes.position.needsUpdate = true;
    plankton.material.opacity = 0.35 + 0.5 * Math.max(night, 0.4) * (0.75 + 0.25 * Math.sin(elapsed * 1.7));
    collars.forEach((m, i) => {
      m.position.y = SEA_Y + waveHeight(m.position.x, m.position.z, elapsed, TRENCH_WAVES) + 0.3;
      m.material.opacity = 0.16 + 0.12 * Math.sin(elapsed * 1.6 + i * 1.3);
      m.scale.setScalar(1 + 0.12 * Math.sin(elapsed * 1.6 + i * 1.3));
    });
    // Spray bursts off the bow and the sides.
    if (boat && elapsed > sprayNext) {
      const b = boat.position, s = boat.scale.x;
      const bowX = b.x + Math.sin(boat.rotation.y) * 6.2 * s, bowZ = b.z + 6.2 * s;
      burst(bowX, b.y + 0.6, bowZ, 0, 1, 18, 3.4);
      const side = Math.random() < 0.5 ? -1 : 1;
      burst(b.x + side * 2.3 * s, b.y + 0.4, b.z + (Math.random() - 0.3) * 6 * s, side, 0, 10, 2.6);
      sprayNext = elapsed + 1.1 + Math.random() * 1.6;
    }
    for (let i = 0; i < SPRAY; i++) {
      if (sprayLife[i] <= 0) { sprayPos[i * 3 + 1] = -50; continue; }
      sprayLife[i] -= dt;
      sprayVel[i * 3 + 1] -= 9.8 * dt;
      sprayPos[i * 3] += sprayVel[i * 3] * dt;
      sprayPos[i * 3 + 1] += sprayVel[i * 3 + 1] * dt;
      sprayPos[i * 3 + 2] += sprayVel[i * 3 + 2] * dt;
    }
    sprayGeo.attributes.position.needsUpdate = true;
    if (flash) strike();
    boltLeft -= dt;
    bolt.material.opacity = boltLeft > 0 ? 1 : 0;
  }

  return { root, update, beacon, floodlight };
}
