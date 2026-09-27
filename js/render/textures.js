// Canvas-drawn textures: the in-world collection board (real fish portraits) and painted signs.
import * as THREE from "three";
import { FISH, COLLECTION } from "../game/content.js";
import { fishSvg } from "../ui/fishArt.js";

const FONT = `"Segoe UI Rounded", "Nunito", "Segoe UI", system-ui, sans-serif`;

function loadSvg(svg) {
  const img = new Image();
  // Inline SVG may omit the namespace; as a standalone image it is required, or the image never decodes.
  const src = svg.includes("xmlns=") ? svg : svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`;
  return img.decode().then(() => img, () => null);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

export function createBoardTexture() {
  const W = 2048, H = 1120;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  let version = 0;

  async function draw(discovered) {
    const v = ++version;
    const images = await Promise.all(COLLECTION.map(f => loadSvg(fishSvg(f, { silhouette: !discovered.includes(f.id), size: 170 }))));
    if (v !== version) return;
    // Cork board with a painted header
    g.fillStyle = "#b98a58"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 3600; i++) { g.fillStyle = i % 2 ? "rgba(90,60,30,0.12)" : "rgba(255,240,210,0.1)"; g.fillRect((i * 97) % W, (i * 53) % H, 5, 5); }
    g.fillStyle = "#6b4a2e"; roundRect(g, W / 2 - 380, 18, 760, 104, 22); g.fill();
    g.fillStyle = "#f7efdf"; g.font = `800 66px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(`Collection  ${discovered.length} / ${FISH.length}`, W / 2, 72);
    // Grid sized for the species count (keeps cells roughly as wide as tall), in collection order.
    const n = COLLECTION.length, cols = n <= 20 ? 5 : Math.ceil(Math.sqrt(n * 1.9)), rows = Math.ceil(n / cols);
    const gx = 36, gy = 144, gap = 12, cw = (W - gx * 2 - gap * (cols - 1)) / cols, ch = (H - gy - 26 - gap * (rows - 1)) / rows;
    const iw = Math.min(cw - 24, (ch - 50) * 1.87), ih = iw / 1.87;
    COLLECTION.forEach((f, i) => {
      const x = gx + (i % cols) * (cw + gap), y = gy + Math.floor(i / cols) * (ch + gap);
      const found = discovered.includes(f.id);
      g.fillStyle = found ? (f.legendary ? "#fff1c8" : "#fbf4e4") : "#d9ccb4"; roundRect(g, x, y, cw, ch, 16); g.fill();
      g.fillStyle = f.legendary ? "#e2b84a" : "#c9463d"; g.beginPath(); g.arc(x + cw / 2, y + 11, 9, 0, Math.PI * 2); g.fill(); // pin
      if (images[i]) g.drawImage(images[i], x + (cw - iw) / 2, y + 16 + (ch - 50 - ih) / 2, iw, ih);
      const name = found ? f.name : "???";
      let size = 26;
      g.font = `700 ${size}px ${FONT}`;
      while (size > 14 && g.measureText(name).width > cw - 12) g.font = `700 ${--size}px ${FONT}`;
      g.fillStyle = found ? "#3b3129" : "#8a7f70";
      g.fillText(name, x + cw / 2, y + ch - 20);
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
