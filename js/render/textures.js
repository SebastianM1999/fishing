// Canvas-drawn textures: the in-world collection board (real fish portraits) and painted signs.
import * as THREE from "three";
import { FISH } from "../game/content.js";
import { fishSvg } from "../ui/fishArt.js";

const FONT = `"Segoe UI Rounded", "Nunito", "Segoe UI", system-ui, sans-serif`;

function loadSvg(svg) {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return img.decode().then(() => img, () => null);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

export function createBoardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 560;
  const g = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  let version = 0;

  async function draw(discovered) {
    const v = ++version;
    const images = await Promise.all(FISH.map(f => loadSvg(fishSvg(f, { silhouette: !discovered.includes(f.id), size: 170 }))));
    if (v !== version) return;
    // Cork board with a painted header
    g.fillStyle = "#b98a58"; g.fillRect(0, 0, 1024, 560);
    for (let i = 0; i < 900; i++) { g.fillStyle = i % 2 ? "rgba(90,60,30,0.12)" : "rgba(255,240,210,0.1)"; g.fillRect((i * 97) % 1024, (i * 53) % 560, 3, 3); }
    g.fillStyle = "#6b4a2e"; roundRect(g, 330, 10, 364, 54, 12); g.fill();
    g.fillStyle = "#f7efdf"; g.font = `800 34px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(`Collection  ${discovered.length} / 20`, 512, 38);
    const cw = 190, ch = 112, gx = 30, gy = 76;
    FISH.forEach((f, i) => {
      const x = gx + (i % 5) * (cw + 8), y = gy + Math.floor(i / 5) * (ch + 7);
      const found = discovered.includes(f.id);
      g.fillStyle = found ? "#fbf4e4" : "#d9ccb4"; roundRect(g, x, y, cw, ch, 10); g.fill();
      g.fillStyle = "#c9463d"; g.beginPath(); g.arc(x + cw / 2, y + 7, 6, 0, Math.PI * 2); g.fill(); // pin
      if (images[i]) g.drawImage(images[i], x + 10, y + 10, 170, 91);
      g.fillStyle = found ? "#3b3129" : "#8a7f70"; g.font = `700 17px ${FONT}`;
      g.fillText(found ? f.name : "???", x + cw / 2, y + ch - 10);
    });
    texture.needsUpdate = true;
  }
  return { texture, draw };
}

export function createSignTexture(lines, { width = 512, height = 256, bg = "#f4d35e", fg = "#3b3129", border = "#3b3129" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const g = canvas.getContext("2d");
  g.fillStyle = bg; roundRect(g, 0, 0, width, height, 24); g.fill();
  g.lineWidth = 14; g.strokeStyle = border; roundRect(g, 10, 10, width - 20, height - 20, 18); g.stroke();
  // hazard corners
  g.fillStyle = "#d4463a";
  for (const [x, y] of [[26, 26], [width - 26, 26], [26, height - 26], [width - 26, height - 26]]) { g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  const step = (height - 60) / lines.length;
  lines.forEach(([text, size], i) => { g.font = `800 ${size}px ${FONT}`; g.fillText(text, width / 2, 30 + step * (i + 0.5)); });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
