// Procedural fish portraits (inline SVG) built from each species' `art` parameters, plus rarity icons.
// Layering: tail + fins (behind) -> gradient body -> clipped markings/scales -> gill, pectoral fin, eye, mouth.

const SIL = { fill: "#8f8b84", stroke: "#77736c" };
let uidCounter = 0;

// Body proportions per shape family (viewBox 224 x 120, fish faces right).
const SHAPES = {
  deep: { L: 50, H: 34, peak: 0.6, belly: 0.95, blunt: 0.55, ny: 0.05, pH: 0.3, tail: "forkSoft", dorsal: [-0.6, 0.35, 18, "spinySoft"], anal: [-0.6, -0.05, 13], eye: [0.66, -0.28], eyeR: 6.5, gill: 0.42 },
  bass: { L: 62, H: 28, peak: 0.55, belly: 0.95, blunt: 0.35, ny: 0.05, pH: 0.3, tail: "truncate", dorsal: [-0.45, 0.3, 17, "spinySoft"], anal: [-0.55, -0.2, 12], eye: [0.7, -0.3], eyeR: 6, gill: 0.45 },
  catfish: { L: 70, H: 21, peak: 0.75, belly: 1, blunt: 0.85, ny: 0.1, pH: 0.35, tail: "truncate", dorsal: [0.12, 0.3, 17, "soft"], adipose: true, anal: [-0.72, -0.1, 9], eye: [0.8, -0.38], eyeR: 3.6, gill: 0.55 },
  pike: { L: 80, H: 15, peak: 0.4, belly: 1, blunt: 0.15, ny: 0.05, pH: 0.45, tail: "fork", dorsal: [-0.82, -0.55, 16, "soft"], anal: [-0.82, -0.55, 12], eye: [0.72, -0.42], eyeR: 4.6, gill: 0.55 },
  carp: { L: 58, H: 30, peak: 0.55, belly: 0.9, blunt: 0.55, ny: 0.1, pH: 0.32, tail: "fork", dorsal: [-0.5, 0.35, 14, "soft"], anal: [-0.6, -0.35, 13], eye: [0.72, -0.25], eyeR: 5, gill: 0.5 },
  trout: { L: 64, H: 22, peak: 0.55, belly: 0.95, blunt: 0.35, ny: 0.08, pH: 0.38, tail: "truncate", dorsal: [-0.1, 0.25, 15, "soft"], adipose: true, anal: [-0.6, -0.35, 11], eye: [0.74, -0.25], eyeR: 5, gill: 0.5 },
  salmon: { L: 66, H: 23, peak: 0.52, belly: 0.95, blunt: 0.25, ny: 0.12, pH: 0.34, tail: "fork", dorsal: [-0.1, 0.25, 15, "soft"], adipose: true, anal: [-0.6, -0.35, 11], eye: [0.75, -0.22], eyeR: 5, gill: 0.5 },
  sturgeon: { L: 80, H: 16, peak: 0.5, belly: 0.9, blunt: 0.05, ny: 0.3, pH: 0.3, tail: "hetero", dorsal: [-0.66, -0.5, 13, "soft"], anal: [-0.66, -0.5, 10], eye: [0.62, -0.38], eyeR: 3.5, gill: 0.45 },
  slim: { L: 58, H: 15, peak: 0.5, belly: 1, blunt: 0.3, ny: 0.05, pH: 0.35, tail: "fork", dorsal: [-0.05, 0.2, 12, "soft"], anal: [-0.6, -0.4, 7], eye: [0.74, -0.15], eyeR: 5.5, gill: 0.55 },
  tuna: { L: 64, H: 25, peak: 0.5, belly: 1, blunt: 0.3, ny: 0.05, pH: 0.2, tail: "lunate", dorsal: [0, 0.3, 18, "spiny"], dorsal2: [-0.38, -0.15, 14, "soft"], anal: [-0.38, -0.15, 12], finlets: true, eye: [0.74, -0.25], eyeR: 5, gill: 0.5 },
  mullet: { L: 54, H: 22, peak: 0.6, belly: 0.9, blunt: 0.75, ny: 0.25, pH: 0.35, tail: "fork", dorsal: [0, 0.3, 16, "spiny"], dorsal2: [-0.45, -0.2, 11, "soft"], anal: [-0.45, -0.2, 9], eye: [0.66, -0.35], eyeR: 5.5, gill: 0.42 },
  billfish: { L: 70, H: 19, peak: 0.55, belly: 1, blunt: 0.2, ny: 0, pH: 0.18, tail: "lunate", dorsal: [0, 0.45, 22, "sickle"], anal: [-0.45, -0.2, 12], eye: [0.74, -0.2], eyeR: 5, gill: 0.5 },
  mahi: { L: 66, H: 28, peak: 0.85, belly: 0.8, blunt: 0.95, ny: 0.15, pH: 0.2, tail: "fork", dorsal: [-0.85, 0.75, 11, "long"], anal: [-0.85, -0.05, 9], eye: [0.76, -0.05], eyeR: 5, gill: 0.55 },
  flat: { L: 56, H: 34, peak: 0.5, belly: 1, blunt: 0.5, ny: 0.1, pH: 0.3, tail: "round", eye: [0.64, -0.3], eyeR: 4.5, gill: 0.4 },
  puffer: { L: 42, H: 33, peak: 0.55, belly: 1, blunt: 0.85, ny: 0.1, pH: 0.24, tail: "truncate", dorsal: [-0.6, -0.28, 11, "soft"], anal: [-0.6, -0.3, 10], eye: [0.6, -0.32], eyeR: 7.5, gill: 0.38 },
  angler: { L: 50, H: 38, peak: 0.72, belly: 0.95, blunt: 0.95, ny: 0.15, pH: 0.24, tail: "forkSoft", dorsal: [-0.6, -0.25, 11, "soft"], anal: [-0.62, -0.3, 10], eye: [0.5, -0.5], eyeR: 4.2, gill: 0.28, noGill: true },
  shark: { L: 80, H: 20, peak: 0.55, belly: 0.85, blunt: 0.25, ny: 0.12, pH: 0.18, tail: "hetero", dorsal: [0.02, 0.32, 24, "shark"], dorsal2: [-0.62, -0.52, 7, "shark"], anal: [-0.62, -0.5, 6], eye: [0.74, -0.25], eyeR: 3.6, gill: "slits" },
};

const f1 = n => Math.round(n * 10) / 10;

function hashRng(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, "0")).join("")}`;
}

export function fishSvg(species, { silhouette = false, size = 96 } = {}) {
  const a = species.art;
  const S = { ...SHAPES[a.shape] };
  if (a.sail) S.dorsal = [-0.2, 0.55, 36, "sail"];
  const id = `f${++uidCounter}`;
  const rnd = hashRng(species.id);
  const cx = 112, cy = 60;
  const L = S.L, H = S.H;
  const tailX = cx - L + 3;
  const noseY = cy + S.ny * H;
  const pH = S.pH * H;

  const fill = silhouette ? SIL.fill : null;
  const outline = silhouette ? SIL.stroke : shade(a.back, -0.35);
  const finFill = silhouette ? SIL.fill : `url(#${id}fin)`;

  // Approximate body top/bottom edges (fins are drawn behind the body, so small errors are hidden).
  const tNorm = x => Math.min(1, Math.max(0, (x - (cx - L)) / (2 * L)));
  const topY = x => {
    const t = tNorm(x);
    if (t < S.peak) return cy - pH + (-H + pH) * Math.sin((Math.PI / 2) * (t / S.peak));
    return cy + S.ny * H + (-H - S.ny * H) * Math.cos((Math.PI / 2) * ((t - S.peak) / (1 - S.peak)));
  };
  const botY = x => {
    const t = tNorm(x), bH = H * S.belly;
    if (t < 0.55) return cy + pH + (bH - pH) * Math.sin((Math.PI / 2) * (t / 0.55));
    return cy + S.ny * H + (bH - S.ny * H) * Math.cos((Math.PI / 2) * ((t - 0.55) / 0.45));
  };

  // --- Body outline ---------------------------------------------------------
  let body;
  if (a.shape === "flat") {
    body = `M${cx + 58} ${cy + 4} C${cx + 58} ${cy - 30} ${cx + 10} ${cy - 38} ${cx - 20} ${cy - 30} C${cx - 48} ${cy - 22} ${cx - 56} ${cy - 8} ${cx - 56} ${cy + 2} C${cx - 56} ${cy + 16} ${cx - 44} ${cy + 30} ${cx - 16} ${cy + 34} C${cx + 16} ${cy + 38} ${cx + 58} ${cy + 30} ${cx + 58} ${cy + 4} Z`;
  } else {
    const nx = cx + L, px = cx - L + 2 * L * S.peak, bx = cx - L + 2 * L * 0.55, b = S.blunt;
    body = `M${nx} ${f1(noseY)} C${nx} ${f1(noseY - H * b)} ${f1(px + L * 0.35)} ${cy - H} ${f1(px)} ${cy - H}
      C${f1(px - L * 0.45)} ${cy - H} ${f1(tailX + L * 0.3)} ${f1(cy - pH)} ${tailX - 3} ${f1(cy - pH)}
      L${tailX - 3} ${f1(cy + pH)}
      C${f1(tailX + L * 0.3)} ${f1(cy + pH)} ${f1(bx - L * 0.45)} ${f1(cy + H * S.belly)} ${f1(bx)} ${f1(cy + H * S.belly)}
      C${f1(bx + L * 0.4)} ${f1(cy + H * S.belly)} ${nx} ${f1(noseY + H * b * 0.8)} ${nx} ${f1(noseY)} Z`;
  }

  // --- Tail ------------------------------------------------------------------
  const tH = Math.max(H * 0.95, 17), T = Math.max(22, H * 0.9);
  const tx = a.shape === "flat" ? cx - 50 : tailX;
  const tails = {
    fork: `M${tx} ${cy - pH} L${tx - T * 0.95} ${cy - tH} Q${tx - T * 0.72} ${cy - tH * 0.35} ${tx - T * 0.42} ${cy} Q${tx - T * 0.72} ${cy + tH * 0.35} ${tx - T * 0.95} ${cy + tH} L${tx} ${cy + pH} Z`,
    forkSoft: `M${tx} ${cy - pH} Q${tx - T * 0.6} ${cy - tH * 1.05} ${tx - T} ${cy - tH * 0.8} Q${tx - T * 0.6} ${cy} ${tx - T} ${cy + tH * 0.8} Q${tx - T * 0.6} ${cy + tH * 1.05} ${tx} ${cy + pH} Z`,
    truncate: `M${tx} ${cy - pH} L${tx - T} ${cy - tH * 0.9} Q${tx - T * 0.82} ${cy} ${tx - T} ${cy + tH * 0.9} L${tx} ${cy + pH} Z`,
    round: `M${tx} ${cy - pH} C${tx - T * 1.3} ${cy - tH} ${tx - T * 1.3} ${cy + tH} ${tx} ${cy + pH} Z`,
    lunate: `M${tx} ${cy - pH * 0.8} Q${tx - T * 0.45} ${cy - tH * 0.6} ${tx - T * 0.85} ${cy - tH * 1.35} Q${tx - T * 0.55} ${cy} ${tx - T * 0.85} ${cy + tH * 1.35} Q${tx - T * 0.45} ${cy + tH * 0.6} ${tx} ${cy + pH * 0.8} Z`,
    hetero: `M${tx} ${cy - pH} L${tx - T * 1.5} ${cy - tH * 1.25} Q${tx - T * 0.9} ${cy - tH * 0.15} ${tx - T * 0.75} ${cy + tH * 0.55} Q${tx - T * 0.35} ${cy + tH * 0.35} ${tx} ${cy + pH} Z`,
  };
  const tail = a.shape === "flat" ? tails.round : tails[S.tail];

  // --- Fins ------------------------------------------------------------------
  function topFin([from, to, h, type]) {
    const x1 = cx + L * from, x2 = cx + L * to, w = x2 - x1;
    const y1 = topY(x1) + 5, y2 = topY(x2) + 5, yt = Math.min(topY(x1), topY(x2));
    switch (type) {
      case "spiny": {
        const n = Math.max(3, Math.round(w / 7));
        let d = `M${f1(x1)} ${f1(y1)}`;
        for (let i = 0; i <= n; i++) {
          const x = x1 + (w * i) / n, top = topY(x) - h * (0.75 + 0.3 * Math.sin((Math.PI * (i + 0.5)) / (n + 1)));
          d += ` L${f1(x)} ${f1(top)} L${f1(x + w / n / 2)} ${f1(topY(x) - h * 0.45)}`;
        }
        return `${d} L${f1(x2)} ${f1(y2)} Z`;
      }
      case "spinySoft": {
        const xs = x1 + w * 0.55, n = Math.max(3, Math.round((xs - x1) / 6));
        let d = `M${f1(x1)} ${f1(y1)}`;
        for (let i = 0; i < n; i++) {
          const x = x1 + ((xs - x1) * i) / n;
          d += ` L${f1(x + 2)} ${f1(topY(x) - h * 0.95)} L${f1(x + (xs - x1) / n)} ${f1(topY(x) - h * 0.55)}`;
        }
        return `${d} Q${f1(xs + (x2 - xs) * 0.5)} ${f1(topY(xs) - h * 1.35)} ${f1(x2)} ${f1(y2)} Z`;
      }
      case "sickle": return `M${f1(x1)} ${f1(y1)} L${f1(x1 + w * 0.1)} ${f1(yt - h)} Q${f1(x1 + w * 0.3)} ${f1(yt - h * 0.25)} ${f1(x2)} ${f1(y2)} Z`;
      case "sail": return `M${f1(x1)} ${f1(y1)} C${f1(x1 + w * 0.05)} ${f1(yt - h * 1.5)} ${f1(x1 + w * 0.75)} ${f1(yt - h * 1.2)} ${f1(x2)} ${f1(y2)} Z`;
      case "shark": return `M${f1(x1)} ${f1(y1)} Q${f1(x1 + w * 0.35)} ${f1(yt - h * 0.7)} ${f1(x1 + w * 0.62)} ${f1(yt - h)} Q${f1(x1 + w * 0.62)} ${f1(yt - h * 0.35)} ${f1(x2)} ${f1(y2)} Z`;
      default: return `M${f1(x1)} ${f1(y1)} Q${f1(x1 + w * 0.3)} ${f1(yt - h * 1.45)} ${f1(x2)} ${f1(y2 - 1)} Z`;
    }
  }
  function bottomFin([from, to, h]) {
    const x1 = cx + L * from, x2 = cx + L * to, w = x2 - x1;
    const y1 = botY(x1) - 5, y2 = botY(x2) - 5, yb = Math.max(botY(x1), botY(x2));
    return `M${f1(x1)} ${f1(y1)} Q${f1(x1 + w * 0.3)} ${f1(yb + h * 1.4)} ${f1(x2)} ${f1(y2)} Z`;
  }

  const finPaths = [];
  if (a.shape === "flat") {
    finPaths.push(`M${cx + 50} ${cy - 22} C${cx + 30} ${cy - 50} ${cx - 30} ${cy - 46} ${cx - 50} ${cy - 16} L${cx - 40} ${cy - 10} C${cx - 20} ${cy - 34} ${cx + 30} ${cy - 38} ${cx + 44} ${cy - 16} Z`);
    finPaths.push(`M${cx + 44} ${cy + 26} C${cx + 20} ${cy + 52} ${cx - 30} ${cy + 50} ${cx - 50} ${cy + 18} L${cx - 40} ${cy + 12} C${cx - 20} ${cy + 36} ${cx + 20} ${cy + 40} ${cx + 38} ${cy + 22} Z`);
  } else {
    finPaths.push(topFin(S.dorsal));
    if (S.dorsal2) finPaths.push(topFin(S.dorsal2));
    finPaths.push(bottomFin(S.anal));
    if (S.adipose) { const x = cx - L * 0.62; finPaths.push(`M${f1(x - 6)} ${f1(topY(x) + 4)} Q${f1(x)} ${f1(topY(x) - 8)} ${f1(x + 6)} ${f1(topY(x) + 4)} Z`); }
    if (S.finlets || a.finlets) {
      for (let i = 0; i < 4; i++) {
        const x = cx - L * (0.55 + i * 0.09);
        finPaths.push(`M${f1(x - 2)} ${f1(topY(x) + 2)} L${f1(x - 4.5)} ${f1(topY(x) - 3.5)} L${f1(x + 1)} ${f1(topY(x) + 2)} Z`);
        finPaths.push(`M${f1(x - 2)} ${f1(botY(x) - 2)} L${f1(x - 4.5)} ${f1(botY(x) + 3.5)} L${f1(x + 1)} ${f1(botY(x) - 2)} Z`);
      }
    }
  }
  // Puffer spikes stick out all round the body (behind it, so only the tips show).
  if (a.spikes) {
    for (let i = 0; i < 9; i++) {
      const x = cx - L * 0.7 + i * L * 0.19;
      finPaths.push(`M${f1(x - 2.5)} ${f1(topY(x) + 3)} L${f1(x - 1)} ${f1(topY(x) - 6)} L${f1(x + 2.5)} ${f1(topY(x) + 3)} Z`);
      finPaths.push(`M${f1(x - 2.5)} ${f1(botY(x) - 3)} L${f1(x - 1)} ${f1(botY(x) + 6)} L${f1(x + 2.5)} ${f1(botY(x) - 3)} Z`);
    }
  }
  // Pelvic fin (lower, behind body)
  if (a.shape !== "flat") {
    const x = cx + L * 0.1;
    finPaths.push(`M${f1(x + 6)} ${f1(botY(x) - 4)} Q${f1(x - 2)} ${f1(botY(x) + 13)} ${f1(x - 10)} ${f1(botY(x) + 9)} Q${f1(x - 4)} ${f1(botY(x) + 2)} ${f1(x - 4)} ${f1(botY(x) - 4)} Z`);
  }

  const finRays = silhouette ? "" : `<g clip-path="url(#${id}fins)" stroke="${shade(a.fin, -0.35)}" stroke-width="0.9" opacity="0.55">${
    Array.from({ length: 40 }, (_, i) => { const x = i * 6; return `<line x1="${x}" y1="0" x2="${x - 14}" y2="120"/>`; }).join("")}</g>`;

  // --- Markings (clipped to body) ----------------------------------------------
  let marks = "";
  if (!silhouette) {
    const pc = a.patternColor;
    const within = (x, y) => y > topY(x) + 3 && y < botY(x) - 3;
    const scatter = (count, yFrom, yTo, fn) => {
      let out = "";
      for (let i = 0, tries = 0; i < count && tries < count * 8; tries++) {
        const x = cx - L * 0.85 + rnd() * L * 1.6, y = cy + H * (yFrom + rnd() * (yTo - yFrom));
        if (!within(x, y)) continue;
        out += fn(x, y, i);
        i++;
      }
      return out;
    };
    switch (a.pattern) {
      case "bars": for (let i = 0; i < 6; i++) { const x = cx - L * 0.7 + i * L * 0.26; marks += `<path d="M${f1(x)} ${cy - H} q${4 + (i % 2) * 3} ${H} 0 ${2 * H}" stroke="${pc}" stroke-width="${7 - (i % 3)}" opacity="0.38" fill="none"/>`; } break;
      case "band": marks += `<path d="M${tailX} ${cy + 2} ${Array.from({ length: 9 }, (_, i) => `L${f1(tailX + (i + 1) * L * 0.2)} ${f1(cy - 2 + (i % 2 ? -4 : 3) * rnd())}`).join(" ")} L${cx + L * 0.55} ${cy - 4}" stroke="${pc}" stroke-width="8" stroke-linejoin="round" opacity="0.55" fill="none"/>`; break;
      case "spots": marks += scatter(34, -0.85, 0.35, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.2 + rnd() * 1.6)}" fill="${pc}" opacity="0.75"/>`); break;
      case "lightspots": marks += scatter(26, -0.8, 0.6, (x, y) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(3 + rnd() * 2)}" ry="${f1(1.6 + rnd())}" fill="${pc}" opacity="0.8"/>`); break;
      case "waves": for (let i = 0; i < 11; i++) { const x = cx - L * 0.8 + i * L * 0.14; marks += `<path d="M${f1(x)} ${cy - H} q6 ${f1(H * 0.3)} -2 ${f1(H * 0.5)} q-6 ${f1(H * 0.2)} 2 ${f1(H * 0.45)}" stroke="${pc}" stroke-width="2.4" fill="none" opacity="0.85"/>`; } break;
      case "dots": marks += scatter(a.shape === "mahi" ? 40 : 9, a.shape === "mahi" ? -0.8 : -0.2, a.shape === "mahi" ? 0.6 : 0.05, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${a.shape === "mahi" ? 1.3 : 2.2}" fill="${pc}" opacity="0.8"/>`); break;
      case "mottle": marks += scatter(18, -0.8, 0.4, (x, y) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(4 + rnd() * 6)}" ry="${f1(2 + rnd() * 3)}" fill="${pc}" opacity="0.45"/>`); break;
      case "scutes": for (const row of [-0.55, 0.05]) for (let i = 0; i < 11; i++) { const x = cx - L * 0.8 + i * L * 0.15, y = cy + H * row; marks += `<path d="M${f1(x - 3.5)} ${f1(y)} l3.5 -3 l3.5 3 l-3.5 3 Z" fill="${pc}" opacity="0.85" stroke="${shade(a.back, -0.3)}" stroke-width="0.6"/>`; } break;
      case "stripe2": for (const dy of [-0.15, 0.2]) marks += `<path d="M${tailX} ${f1(cy + dy * H)} Q${cx} ${f1(cy + dy * H - 3)} ${cx + L * 0.7} ${f1(cy + dy * H - 2)}" stroke="${pc}" stroke-width="2.6" fill="none" opacity="0.9"/>`; break;
      case "vbars": for (let i = 0; i < 12; i++) { const x = cx - L * 0.75 + i * L * 0.12; marks += `<path d="M${f1(x)} ${cy - H} q2 ${H} 0 ${f1(H * 1.3)}" stroke="${pc}" stroke-width="2.4" opacity="0.7" fill="none"/>`; } break;
      case "orangespots": marks += scatter(16, -0.85, 0.85, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2.2 + rnd() * 1.4)}" fill="${pc}" stroke="${shade(a.back, -0.2)}" stroke-width="0.8" opacity="0.9"/>`); break;
      case "glow": {
        const rows = a.shape === "slim" ? [0.1, 0.55] : [0.35];
        for (const row of rows) for (let i = 0; i < 9; i++) {
          const x = cx - L * 0.72 + i * L * 0.17, y = cy + H * row + (row > 0.3 ? Math.sin(i) : 0);
          if (!within(x, y)) continue;
          marks += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.4" fill="${pc}" opacity="0.35"/><circle cx="${f1(x)}" cy="${f1(y)}" r="1.5" fill="${pc}" opacity="0.95"/>`;
        }
        break;
      }
      case "lateral": marks += `<path d="M${tailX} ${cy - 2} Q${cx} ${cy - H * 0.35} ${cx + L * 0.55} ${cy - H * 0.25}" stroke="${pc}" stroke-width="2" fill="none" opacity="0.8"/>`; break;
    }
    if (a.stripe) marks += `<path d="M${tailX} ${cy + 1} Q${cx} ${cy - 3} ${cx + L * 0.62} ${cy - 1}" stroke="${a.stripe}" stroke-width="${f1(H * 0.38)}" stroke-linecap="round" fill="none" opacity="0.55"/>`;
    const scaleOpacity = a.pattern === "scales" ? 0.5 : ["shark", "catfish", "sturgeon"].includes(a.shape) ? 0 : 0.2;
    if (scaleOpacity) marks += `<rect x="0" y="0" width="224" height="120" fill="url(#${id}scales)" opacity="${scaleOpacity}"/>`;
    if (a.pattern !== "lateral" && a.shape !== "flat" && a.shape !== "shark") marks += `<path d="M${tailX} ${cy - 1} Q${cx} ${f1(cy - H * 0.32)} ${cx + L * 0.5} ${f1(cy - H * 0.2)}" stroke="${shade(a.back, -0.25)}" stroke-width="0.9" fill="none" opacity="0.6" stroke-dasharray="2 2"/>`;
    // Soft highlight along the back + optional sheen
    marks += `<ellipse cx="${cx + L * 0.1}" cy="${f1(cy - H * 0.55)}" rx="${f1(L * 0.65)}" ry="${f1(H * 0.22)}" fill="#fff" opacity="${a.shine ? 0.35 : 0.14}"/>`;
    if (a.shine) marks += `<circle cx="${cx - L * 0.2}" cy="${f1(cy - H * 0.2)}" r="3" fill="#fff" opacity="0.8"/><circle cx="${cx + L * 0.2}" cy="${f1(cy + H * 0.2)}" r="2" fill="#fff" opacity="0.7"/>`;
  }

  // --- Head details ----------------------------------------------------------
  let head = "";
  const ex = a.shape === "flat" ? cx + 36 : cx + L * S.eye[0];
  const ey = a.shape === "flat" ? cy - 10 : cy + H * S.eye[1];
  const eR = a.shape === "flat" ? 4.5 : S.eyeR;
  if (!silhouette) {
    const gillC = shade(a.back, -0.3);
    if (S.gill === "slits") {
      for (let i = 0; i < 5; i++) head += `<path d="M${f1(cx + L * 0.44 - i * 3.5)} ${f1(cy - H * 0.3)} q2 ${f1(H * 0.35)} 0 ${f1(H * 0.6)}" stroke="${gillC}" stroke-width="1.1" fill="none" opacity="0.7"/>`;
    } else if (a.shape !== "flat" && !S.noGill) {
      const gx = cx + L * S.gill;
      head += `<path d="M${f1(gx + 4)} ${f1(topY(gx) + 4)} Q${f1(gx - 7)} ${cy} ${f1(gx + 2)} ${f1(botY(gx) - 3)}" stroke="${gillC}" stroke-width="1.6" fill="none" opacity="0.75"/>`;
      head += `<path d="M${f1(gx + 10)} ${f1(topY(gx) + 8)} Q${f1(gx + 2)} ${f1(cy + 2)} ${f1(gx + 7)} ${f1(botY(gx) - 6)}" stroke="${gillC}" stroke-width="0.9" fill="none" opacity="0.4"/>`;
    }
    if (a.ear) { const gx = cx + L * S.gill; head += `<path d="M${f1(gx - 1)} ${f1(cy - H * 0.28)} q-9 1 -9 7 q2 6 9 4 Z" fill="${a.ear}"/>`; }
    // Mouth
    const nx = a.shape === "flat" ? cx + 57 : cx + L;
    const my = a.shape === "flat" ? cy + 6 : noseY + H * 0.08;
    switch (a.mouth) {
      case "big": head += `<path d="M${nx} ${f1(my - 1)} L${f1(nx - L * 0.3)} ${f1(my + 3)} Q${f1(nx - L * 0.33)} ${f1(my + 6)} ${f1(nx - L * 0.26)} ${f1(my + 6)}" stroke="${outline}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`; break;
      case "duck": head += `<path d="M${nx + 1} ${f1(my)} L${f1(nx - L * 0.3)} ${f1(my + 2)}" stroke="${outline}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`; break;
      case "shark": head += `<path d="M${f1(nx - L * 0.12)} ${f1(my + H * 0.4)} q-8 4 -14 1" stroke="${outline}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`; break;
      case "sword": case "spear": break;
      case "fangs": {
        head += `<path d="M${nx} ${f1(my)} L${f1(nx - L * 0.2)} ${f1(my + 3)}" stroke="${outline}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
        for (const [dx, h] of [[4, 6], [10, 4.5], [15, 3.5]]) head += `<path d="M${f1(nx - dx - 1.6)} ${f1(my + 0.6)} L${f1(nx - dx)} ${f1(my + h)} L${f1(nx - dx + 1.6)} ${f1(my + 0.4)} Z" fill="#fbf6ea" stroke="${outline}" stroke-width="0.6"/>`;
        break;
      }
      case "angler": {
        head += `<path d="M${f1(nx + 1)} ${f1(my - 4)} Q${f1(nx - 10)} ${f1(my + 12)} ${f1(nx - L * 0.42)} ${f1(my + 4)}" stroke="${outline}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
        for (let i = 0; i < 5; i++) { const t = 0.12 + i * 0.17, x = nx - 2 - t * L * 0.4, y = my - 2 + Math.sin(t * Math.PI) * 9; head += `<path d="M${f1(x - 1.3)} ${f1(y - 0.5)} L${f1(x)} ${f1(y - 4)} L${f1(x + 1.3)} ${f1(y - 0.5)} Z" fill="#fbf6ea" stroke="${outline}" stroke-width="0.5"/>`; }
        break;
      }
      case "chin": head += `<path d="M${nx} ${f1(my)} q-6 3 -9 1" stroke="${outline}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M${f1(nx - 8)} ${f1(botY(nx - 8) - 2)} q-1 6 -4 9" stroke="${shade(a.fin, -0.2)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`; break;
      default: head += `<path d="M${nx} ${f1(my)} q-6 3 -9 1" stroke="${outline}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    }
    if (a.mouth === "barbels") {
      const bc = shade(a.fin, -0.2);
      const long = a.shape === "catfish";
      head += `<path d="M${nx - 2} ${f1(my)} q${long ? 14 : 6} ${long ? -2 : 4} ${long ? 22 : 8} ${long ? 12 : 12}" stroke="${bc}" stroke-width="${long ? 1.8 : 1.3}" fill="none" stroke-linecap="round"/>`;
      head += `<path d="M${nx - 5} ${f1(my + 2)} q${long ? 6 : 3} ${long ? 8 : 5} ${long ? 8 : 3} ${long ? 18 : 12}" stroke="${bc}" stroke-width="${long ? 1.6 : 1.2}" fill="none" stroke-linecap="round"/>`;
      if (long) head += `<path d="M${nx - 10} ${f1(noseY - H * 0.3)} q10 -8 20 -4" stroke="${bc}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    }
    // Eye: rim, iris, pupil, two highlights. Flounder has both eyes on the upper side.
    const eye = (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r + 1.2)}" fill="${shade(a.back, -0.2)}" opacity="0.6"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${a.iris ?? "#e9c36a"}"/>
      <circle cx="${f1(x + r * 0.12)}" cy="${f1(y)}" r="${f1(r * 0.62)}" fill="#1d1a18"/>
      <circle cx="${f1(x + r * 0.4)}" cy="${f1(y - r * 0.35)}" r="${f1(r * 0.25)}" fill="#fff"/>
      <circle cx="${f1(x - r * 0.15)}" cy="${f1(y + r * 0.3)}" r="${f1(r * 0.12)}" fill="#fff" opacity="0.8"/>`;
    head += eye(ex, ey, eR);
    if (a.shape === "flat") head += eye(ex - 12, ey - 8, eR * 0.9);
  }

  // Bills are part of the silhouette.
  let bill = "";
  if (a.mouth === "sword") bill = `<path d="M${cx + L - 4} ${f1(noseY - 3)} L${cx + L + 34} ${f1(noseY - 1)} L${cx + L - 4} ${f1(noseY + 3)} Z" fill="${fill ?? shade(a.back, -0.1)}" stroke="${outline}" stroke-width="1.2"/>`;
  if (a.mouth === "spear") bill = `<path d="M${cx + L - 4} ${f1(noseY - 2.5)} Q${cx + L + 14} ${f1(noseY - 2)} ${cx + L + 28} ${f1(noseY)} Q${cx + L + 14} ${f1(noseY + 1.5)} ${cx + L - 4} ${f1(noseY + 3)} Z" fill="${fill ?? shade(a.back, -0.1)}" stroke="${outline}" stroke-width="1.2"/>`;

  if (a.mouth === "angler") {
    const bx = cx + L * 0.2, by = topY(bx) + 2, lx = cx + L + 12, ly = noseY - H * 1.05;
    bill += `<path d="M${f1(bx)} ${f1(by)} Q${f1(bx + 8)} ${f1(ly - 14)} ${f1(lx)} ${f1(ly)}" stroke="${silhouette ? SIL.stroke : outline}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (!silhouette) bill += `<circle cx="${f1(lx)}" cy="${f1(ly + 3)}" r="9" fill="${a.patternGlow}" opacity="0.3"/>`;
    bill += `<circle cx="${f1(lx)}" cy="${f1(ly + 3)}" r="4.2" fill="${silhouette ? SIL.fill : a.patternGlow}" stroke="${silhouette ? SIL.stroke : shade(a.patternGlow, -0.35)}" stroke-width="1"/>`;
    if (!silhouette) bill += `<circle cx="${f1(lx - 1.3)}" cy="${f1(ly + 1.8)}" r="1.4" fill="#fff" opacity="0.9"/>`;
  }

  // Pectoral fin (in front of the body)
  const pecX = a.shape === "flat" ? cx + 18 : cx + L * (S.gill === "slits" ? 0.3 : S.gill - 0.1);
  const pecY = a.shape === "flat" ? cy + 8 : cy + H * 0.25;
  const pecLen = a.shape === "shark" ? 26 : a.shape === "mahi" || a.shape === "tuna" || a.shape === "billfish" ? 20 : 15;
  const pectoral = a.wings
    ? `<path d="M${f1(pecX)} ${f1(pecY - 3)} Q${f1(pecX - 14)} ${f1(pecY - 40)} ${f1(pecX - 50)} ${f1(pecY - 46)} Q${f1(pecX - 40)} ${f1(pecY - 24)} ${f1(pecX - 56)} ${f1(pecY - 8)} Q${f1(pecX - 24)} ${f1(pecY + 2)} ${f1(pecX)} ${f1(pecY + 3)} Z" fill="${finFill}" opacity="${silhouette ? 1 : 0.92}" stroke="${silhouette ? SIL.stroke : shade(a.fin, -0.3)}" stroke-width="1"/>`
      + (silhouette ? "" : [0, 1, 2, 3].map(i => `<path d="M${f1(pecX - 3)} ${f1(pecY - 1)} L${f1(pecX - 48 - i * 2)} ${f1(pecY - 42 + i * 11)}" stroke="${shade(a.fin, -0.3)}" stroke-width="0.8" opacity="0.6"/>`).join(""))
    : `<path d="M${f1(pecX)} ${f1(pecY - 3)} Q${f1(pecX - pecLen * 0.6)} ${f1(pecY - 6)} ${f1(pecX - pecLen)} ${f1(pecY + pecLen * 0.35)} Q${f1(pecX - pecLen * 0.4)} ${f1(pecY + 5)} ${f1(pecX)} ${f1(pecY + 3)} Z" fill="${finFill}" opacity="${silhouette ? 1 : 0.9}" stroke="${silhouette ? SIL.stroke : shade(a.fin, -0.3)}" stroke-width="0.8"/>`;

  const defs = silhouette ? "" : `<defs>
    <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${a.back}"/><stop offset="0.45" stop-color="${a.color}"/><stop offset="0.72" stop-color="${a.color}"/><stop offset="1" stop-color="${a.belly}"/>
    </linearGradient>
    <linearGradient id="${id}fin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${shade(a.fin, 0.15)}"/><stop offset="1" stop-color="${shade(a.fin, -0.15)}"/>
    </linearGradient>
    <pattern id="${id}scales" width="7" height="6" patternUnits="userSpaceOnUse">
      <path d="M0 3 Q3.5 -1 7 3 M-3.5 6 Q0 2 3.5 6 M3.5 6 Q7 2 10.5 6" stroke="${shade(a.back, -0.35)}" stroke-width="0.8" fill="none"/>
    </pattern>
    <clipPath id="${id}clip"><path d="${body}"/></clipPath>
    <clipPath id="${id}fins">${finPaths.map(d => `<path d="${d}"/>`).join("")}<path d="${tail}"/></clipPath>
  </defs>`;

  const finStroke = silhouette ? SIL.stroke : shade(a.fin, -0.35);
  return `<svg viewBox="0 0 224 120" width="${size}" height="${Math.round(size * 0.536)}" aria-hidden="true" focusable="false">${defs}
<g stroke-linejoin="round">
  <path d="${tail}" fill="${finFill}" stroke="${finStroke}" stroke-width="1.2"/>
  ${finPaths.map(d => `<path d="${d}" fill="${finFill}" stroke="${finStroke}" stroke-width="1.1"/>`).join("")}
  ${finRays}
  ${bill}
  <path d="${body}" fill="${fill ?? `url(#${id}body)`}" stroke="${outline}" stroke-width="1.6"/>
  ${silhouette ? "" : `<g clip-path="url(#${id}clip)">${marks}</g>`}
  ${pectoral}
  ${head}
</g></svg>`;
}

// --- Rarity icons -------------------------------------------------------------
const RARITY_ICON_SVG = {
  common: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#a9b89a" stroke="#6f8062" stroke-width="1.6"/><path d="M12 6.5 13.6 10.2 17.5 10.5 14.5 13 15.4 16.9 12 14.8 8.6 16.9 9.5 13 6.5 10.5 10.4 10.2Z" fill="#fff" opacity="0.95"/></svg>`,
  rare: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12l4 6-10 13L2 9Z" fill="#4f8fd6" stroke="#2b5f9e" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 9h20M8 3l-2 6 6 13 6-13-2-6M6 9l6-6 6 6" fill="none" stroke="#bfe0ff" stroke-width="0.9" opacity="0.9"/><path d="M7 4.5 9 8 6.5 8Z" fill="#fff" opacity="0.8"/></svg>`,
  legendary: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="11" fill="#ffd66b" opacity="0.35"/><path d="M3 18 4.5 7.5l4.5 4.5L12 5l3 7 4.5-4.5L21 18Z" fill="#f2b632" stroke="#a8711a" stroke-width="1.4" stroke-linejoin="round"/><rect x="3" y="18" width="18" height="3" rx="1" fill="#d99a24" stroke="#a8711a" stroke-width="1.2"/><circle cx="12" cy="14" r="1.8" fill="#d8443a"/><circle cx="7.3" cy="15" r="1.2" fill="#4f8fd6"/><circle cx="16.7" cy="15" r="1.2" fill="#4f8fd6"/><circle cx="4.5" cy="7.5" r="1.2" fill="#fff3c4"/><circle cx="12" cy="5" r="1.2" fill="#fff3c4"/><circle cx="19.5" cy="7.5" r="1.2" fill="#fff3c4"/></svg>`,
};
const RARITY_NAMES = { common: "Common", rare: "Rare", legendary: "Legendary" };

export function rarityIcon(rarity, size = 22) {
  return `<span class="rarity-icon ${rarity}" role="img" aria-label="${RARITY_NAMES[rarity]}" title="${RARITY_NAMES[rarity]}" style="--s:${size}px">${RARITY_ICON_SVG[rarity]}</span>`;
}
