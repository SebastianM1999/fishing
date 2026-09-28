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
  whaleshark: { L: 82, H: 22, peak: 0.6, belly: 0.9, blunt: 0.95, ny: 0.05, pH: 0.2, tail: "hetero", dorsal: [-0.08, 0.28, 20, "shark"], dorsal2: [-0.62, -0.52, 7, "shark"], anal: [-0.62, -0.5, 6], eye: [0.82, -0.12], eyeR: 3, gill: "slits" },
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
  if (CREATURES[a.shape]) return creatureSvg(species, silhouette, size);
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
      case "crystal": {
        // Facets: a lattice of pale triangles with bright edges.
        for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
          const x = cx - L + i * L * 0.24 + (j % 2) * L * 0.12, y = cy - H + j * H * 0.55;
          marks += `<path d="M${f1(x)} ${f1(y)} L${f1(x + L * 0.12)} ${f1(y + H * 0.55)} L${f1(x - L * 0.12)} ${f1(y + H * 0.55)} Z" fill="${(i + j) % 3 ? pc : "#bfe8f4"}" opacity="${(i + j) % 2 ? 0.55 : 0.3}" stroke="#fff" stroke-width="1" stroke-opacity="0.9"/>`;
        }
        break;
      }
      case "moon": {
        marks += `<path d="M${f1(cx - L * 0.05)} ${f1(cy - H * 0.55)} a${f1(H * 0.5)} ${f1(H * 0.5)} 0 1 0 ${f1(H * 0.2)} ${f1(H * 0.95)} a${f1(H * 0.38)} ${f1(H * 0.38)} 0 1 1 ${f1(-H * 0.2)} ${f1(-H * 0.95)} Z" fill="${pc}" opacity="0.95"/>`;
        marks += scatter(14, -0.7, 0.7, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="${pc}" opacity="0.3"/><circle cx="${f1(x)}" cy="${f1(y)}" r="1.1" fill="#fff"/>`);
        break;
      }
      case "planks": for (const dy of [-0.55, -0.15, 0.25, 0.65]) marks += `<path d="M${tailX} ${f1(cy + dy * H)} Q${cx} ${f1(cy + dy * H - 2)} ${cx + L} ${f1(cy + dy * H - 1)}" stroke="${pc}" stroke-width="1.3" fill="none" opacity="0.7"/>` + [0.2, 0.5, 0.8].map(t => `<circle cx="${f1(tailX + t * 2 * L - (dy * 20))}" cy="${f1(cy + dy * H + 3)}" r="0.9" fill="${pc}" opacity="0.8"/>`).join(""); break;
      case "lateral": marks += `<path d="M${tailX} ${cy - 2} Q${cx} ${cy - H * 0.35} ${cx + L * 0.55} ${cy - H * 0.25}" stroke="${pc}" stroke-width="2" fill="none" opacity="0.8"/>`; break;
    }
    if (a.stripe) marks += `<path d="M${tailX} ${cy + 1} Q${cx} ${cy - 3} ${cx + L * 0.62} ${cy - 1}" stroke="${a.stripe}" stroke-width="${f1(H * 0.38)}" stroke-linecap="round" fill="none" opacity="0.55"/>`;
    const scaleOpacity = a.pattern === "scales" ? 0.5 : ["shark", "whaleshark", "catfish", "sturgeon"].includes(a.shape) ? 0 : 0.2;
    if (scaleOpacity) marks += `<rect x="0" y="0" width="224" height="120" fill="url(#${id}scales)" opacity="${scaleOpacity}"/>`;
    if (a.pattern !== "lateral" && a.shape !== "flat" && a.shape !== "shark" && a.shape !== "whaleshark") marks += `<path d="M${tailX} ${cy - 1} Q${cx} ${f1(cy - H * 0.32)} ${cx + L * 0.5} ${f1(cy - H * 0.2)}" stroke="${shade(a.back, -0.25)}" stroke-width="0.9" fill="none" opacity="0.6" stroke-dasharray="2 2"/>`;
    // Soft highlight along the back + optional sheen
    marks += `<ellipse cx="${cx + L * 0.1}" cy="${f1(cy - H * 0.55)}" rx="${f1(L * 0.65)}" ry="${f1(H * 0.22)}" fill="#fff" opacity="${a.shine ? 0.35 : 0.14}"/>`;
    if (a.shine) marks += `<circle cx="${cx - L * 0.2}" cy="${f1(cy - H * 0.2)}" r="3" fill="#fff" opacity="0.8"/><circle cx="${cx + L * 0.2}" cy="${f1(cy + H * 0.2)}" r="2" fill="#fff" opacity="0.7"/>`;
  }

  // --- Head details ----------------------------------------------------------
  let head = "";
  // Two-headed trout: a second, smaller head sprouting up and forward from the shoulders.
  const h2 = { x: cx + L * 0.78, y: cy - H * 1.05 };
  const twoHeadPath = a.twoHead ? `M${f1(cx + L * 0.35)} ${f1(cy - H * 0.6)} C${f1(cx + L * 0.45)} ${f1(cy - H * 1.5)} ${f1(h2.x + 8)} ${f1(h2.y - 12)} ${f1(h2.x + 16)} ${f1(h2.y + 1)} C${f1(h2.x + 12)} ${f1(h2.y + 9)} ${f1(cx + L * 0.7)} ${f1(cy - H * 0.35)} ${f1(cx + L * 0.55)} ${f1(cy - H * 0.3)} Z` : "";
  // Hammerhead: a flat hammer across the nose, with the eye at its upper tip.
  const hammer = a.hammer ? { x: cx + L * 0.84, top: cy - H * 1.2, bot: cy + H * 1.1 } : null;
  const ex = a.shape === "flat" ? cx + 36 : hammer ? hammer.x + 1 : cx + L * S.eye[0];
  const ey = a.shape === "flat" ? cy - 10 : hammer ? hammer.top + 5 : cy + H * S.eye[1];
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
      case "grin": {
        // A big, friendly smile with a few rounded teeth.
        const gx = nx - L * 0.04, gy = my + H * 0.22;
        head += `<path d="M${f1(gx)} ${f1(gy - 3)} Q${f1(gx - 14)} ${f1(gy + 12)} ${f1(gx - 34)} ${f1(gy + 2)} Q${f1(gx - 16)} ${f1(gy + 4)} ${f1(gx)} ${f1(gy - 3)} Z" stroke="${outline}" stroke-width="1.6" fill="#b85a5a"/>`;
        for (let i = 0; i < 5; i++) { const x = gx - 5 - i * 5.5, y = gy + 0.4 + Math.sin((i + 1) / 6 * Math.PI) * 2.6; head += `<path d="M${f1(x - 2)} ${f1(y - 1)} L${f1(x)} ${f1(y + 3)} L${f1(x + 2)} ${f1(y - 1)} Z" fill="#fff" stroke="${outline}" stroke-width="0.5"/>`; }
        head += `<path d="M${f1(gx - 36)} ${f1(gy)} q-3 2 -2 5" stroke="${outline}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
        break;
      }
      case "wide": head += `<path d="M${nx + 1} ${f1(my + 2)} L${f1(nx - L * 0.16)} ${f1(my + 3)}" stroke="${outline}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`; break;
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
    const eye = (x, y, r) => eyeSvg(a, x, y, r);
    head += eye(ex, ey, eR);
    if (hammer) head += eye(hammer.x + 1, hammer.bot - 5, eR * 0.85);
    if (a.twoHead) head += eye(h2.x + 4, h2.y - 2, eR * 0.9) + `<path d="M${f1(h2.x + 16)} ${f1(h2.y + 1)} q-5 3 -8 1" stroke="${outline}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
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
  const pecLen = a.shape === "shark" || a.shape === "whaleshark" ? 26 : a.shape === "mahi" || a.shape === "tuna" || a.shape === "billfish" ? 20 : 15;
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
  ${a.twoHead ? `<path d="${twoHeadPath}" fill="${fill ?? `url(#${id}body)`}" stroke="${outline}" stroke-width="1.5"/>` : ""}
  ${hammer ? `<path d="M${f1(hammer.x - 7)} ${f1(hammer.top + 4)} Q${f1(hammer.x - 6)} ${f1(hammer.top - 2)} ${f1(hammer.x + 1)} ${f1(hammer.top - 1)} Q${f1(hammer.x + 8)} ${f1(hammer.top)} ${f1(hammer.x + 8)} ${f1(hammer.top + 6)} L${f1(hammer.x + 9)} ${f1(hammer.bot - 5)} Q${f1(hammer.x + 8)} ${f1(hammer.bot + 1)} ${f1(hammer.x + 1)} ${f1(hammer.bot)} Q${f1(hammer.x - 6)} ${f1(hammer.bot - 1)} ${f1(hammer.x - 5)} ${f1(hammer.bot - 6)} Z" fill="${fill ?? `url(#${id}body)`}" stroke="${outline}" stroke-width="1.5"/>` : ""}
  ${silhouette ? "" : `<g clip-path="url(#${id}clip)">${marks}</g>`}
  ${pectoral}
  ${head}
</g></svg>`;
}

/** The shared eye: rim, iris, pupil, two highlights. */
function eyeSvg(a, x, y, r) {
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r + 1.2)}" fill="${shade(a.back, -0.2)}" opacity="0.6"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${a.iris ?? "#e9c36a"}"/>
      <circle cx="${f1(x + r * 0.12)}" cy="${f1(y)}" r="${f1(r * 0.62)}" fill="#1d1a18"/>
      <circle cx="${f1(x + r * 0.4)}" cy="${f1(y - r * 0.35)}" r="${f1(r * 0.25)}" fill="#fff"/>
      <circle cx="${f1(x - r * 0.15)}" cy="${f1(y + r * 0.3)}" r="${f1(r * 0.12)}" fill="#fff" opacity="0.8"/>`;
}

// --- Creatures that aren't fish-shaped --------------------------------------------
// Same visual language as the fish: 224 x 120 viewBox facing right, back -> colour -> belly body gradient, fin
// gradient from `fin`, outline shade(back, -0.35), the shared eye, markings clipped to the body, flat grey silhouettes.

const pt = (x, y) => ({ x, y });
/** Smooth open path through points (quadratic curves through the midpoints). */
function smoothPath(p, move = true) {
  let d = move ? `M${f1(p[0].x)} ${f1(p[0].y)}` : ` L${f1(p[0].x)} ${f1(p[0].y)}`;
  for (let i = 1; i < p.length - 1; i++) d += ` Q${f1(p[i].x)} ${f1(p[i].y)} ${f1((p[i].x + p[i + 1].x) / 2)} ${f1((p[i].y + p[i + 1].y) / 2)}`;
  const last = p[p.length - 1];
  return `${d} L${f1(last.x)} ${f1(last.y)}`;
}
/** Closed ribbon around a centerline: widths above (wu) and below (wd) per point; rounded far end. */
function ribbon(c, wu, wd = wu) {
  const top = [], bot = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    let nx = -(b.y - a.y), ny = b.x - a.x;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    const u = typeof wu === "function" ? wu(i / (c.length - 1), i) : wu, w = typeof wd === "function" ? wd(i / (c.length - 1), i) : wd;
    top.push(pt(p.x - nx * u, p.y - ny * u));
    bot.push(pt(p.x + nx * w, p.y + ny * w));
  });
  const end = c[c.length - 1], prev = c[c.length - 2], tip = pt(end.x + (end.x - prev.x) * 0.8, end.y + (end.y - prev.y) * 0.8);
  const lt = top[top.length - 1], lb = bot[bot.length - 1];
  return `${smoothPath(top)} Q${f1(tip.x + (lt.x - end.x))} ${f1(tip.y + (lt.y - end.y))} ${f1(tip.x)} ${f1(tip.y)} Q${f1(tip.x + (lb.x - end.x))} ${f1(tip.y + (lb.y - end.y))} ${f1(lb.x)} ${f1(lb.y)}${smoothPath(bot.reverse(), false).replace(/^ L[^Q]*/, "")} Z`;
}
/** A curling limb: start point, heading, length, curl (radians gained over the length, mostly near the tip). */
function limb(x, y, ang, len, curl, steps = 16) {
  const c = [pt(x, y)];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    ang += (curl / steps) * (0.3 + 2.1 * t * t);
    x += Math.cos(ang) * (len / steps); y += Math.sin(ang) * (len / steps);
    c.push(pt(x, y));
  }
  return c;
}
function ellipsePath(cx, cy, rx, ry, rot = 0) {
  const k = 0.5523, c = Math.cos(rot), s = Math.sin(rot);
  const T = (x, y) => `${f1(cx + x * c - y * s)} ${f1(cy + x * s + y * c)}`;
  return `M${T(rx, 0)} C${T(rx, ry * k)} ${T(rx * k, ry)} ${T(0, ry)} C${T(-rx * k, ry)} ${T(-rx, ry * k)} ${T(-rx, 0)} C${T(-rx, -ry * k)} ${T(-rx * k, -ry)} ${T(0, -ry)} C${T(rx * k, -ry)} ${T(rx, -ry * k)} ${T(rx, 0)} Z`;
}
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Each builder returns { behind: [fin paths], limbs: [body-coloured paths behind the body], body: [paths],
 * front: [fin paths over the body], lines: [stroke-only paths], eyes: [[x, y, r]], extras (svg drawn last),
 * silExtras (the same, in silhouette mode), marks (clipped to the body), grad: "vertical" | "center" }.
 */
const CREATURES = {
  eel(a, rnd) {
    const serpent = a.shape === "serpent";
    const N = 40, xt = 14, xh = serpent ? 184 : 192, A = serpent ? 17 : 12, th = serpent ? 13 : a.thick ?? 12, ph = rnd() * 0.6;
    const c = Array.from({ length: N }, (_, i) => {
      const u = i / (N - 1);
      return pt(xt + u * (xh - xt), 62 + Math.pow(1 - u, serpent ? 0.6 : 1.1) * A * Math.sin(u * Math.PI * (serpent ? 3.2 : 2.4) + ph) - (serpent ? u * 8 : 0));
    });
    const w = u => th * (0.18 + 0.82 * Math.sin(Math.min(1, u / 0.8) * Math.PI / 2)) * (u > 0.9 ? 1 - (u - 0.9) * 3.5 : 1);
    const finTop = u => w(u) + (a.mouth === "moray" ? 5 * (1 - smoothstep(0.82, 0.9, u)) : 5.5 * (1 - smoothstep(0.35, 0.62, u)));
    const finBot = u => w(u) + 4.5 * (1 - smoothstep(0.25, 0.5, u));
    const head = c[N - 1], neck = c[N - 5];
    const out = { behind: [serpent ? null : ribbon(c, finTop, finBot)].filter(Boolean), body: [ribbon(c, w)], front: [], lines: [], eyes: [[head.x - 2, head.y - th * 0.38, a.eyeR ?? (serpent ? 4.6 : 3.4)]], extras: "", silExtras: "", marks: "" };
    if (serpent) {
      // Frill of soft spikes along the back, little horns and whiskers.
      for (let i = 6; i < N - 6; i += 3) {
        const p = c[i], u = i / (N - 1), h = 7 + 4 * Math.sin(u * Math.PI);
        out.behind.push(`M${f1(p.x - 5)} ${f1(p.y - w(u) + 3)} Q${f1(p.x - 1)} ${f1(p.y - w(u) - h)} ${f1(p.x + 4)} ${f1(p.y - w(u) - h * 0.9)} Q${f1(p.x + 2)} ${f1(p.y - w(u) - 2)} ${f1(p.x + 6)} ${f1(p.y - w(u) + 3)} Z`);
      }
      out.behind.push(`M${f1(head.x - 12)} ${f1(head.y - th * 0.7)} q-4 -14 -14 -16 q8 6 8 17 Z`, `M${f1(head.x - 5)} ${f1(head.y - th * 0.8)} q-1 -13 -9 -17 q5 7 3 18 Z`);
      out.lines.push(`M${f1(head.x + 6)} ${f1(head.y + 3)} q10 4 14 14`, `M${f1(head.x + 3)} ${f1(head.y + 5)} q4 8 2 16`);
    } else if (a.mouth !== "moray") {
      out.front.push(`M${f1(neck.x)} ${f1(neck.y + 2)} Q${f1(neck.x - 6)} ${f1(neck.y + 12)} ${f1(neck.x - 12)} ${f1(neck.y + 9)} Q${f1(neck.x - 6)} ${f1(neck.y + 4)} ${f1(neck.x - 4)} ${f1(neck.y - 1)} Z`);
    }
    out.mouth = a.mouth === "moray"
      ? `<ellipse cx="${f1(head.x + 5)}" cy="${f1(head.y + 3)}" rx="5" ry="4" fill="#5a2a2a" stroke="OUTLINE" stroke-width="1.3"/>`
      : `<path d="M${f1(head.x + 7)} ${f1(head.y + 1)} q-6 4 -12 2" stroke="OUTLINE" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    out.centre = c; out.width = w;
    return out;
  },
  squid(a, rnd) {
    const big = (a.eyeR ?? 6.5) > 7;
    const body = [`M20 60 C34 42 96 34 126 44 C134 47 138 54 138 60 C138 66 134 73 126 76 C96 86 34 78 20 60 Z`,
      ellipsePath(142, 60, 15, 15)];
    const behind = [`M34 58 L16 34 Q40 40 62 50 Z`, `M34 62 L16 86 Q40 80 62 70 Z`];
    const limbs = [];
    for (let i = 0; i < 6; i++) {
      const y = 50 + i * 4, c = limb(150, y, (i - 2.5) * 0.12, 48 + rnd() * 10, (rnd() - 0.5) * 1.6, 12);
      limbs.push(ribbon(c, u => 3.4 * (1 - u) + 0.8));
    }
    for (const s of [-1, 1]) {
      const c = limb(150, 60 + s * 3, s * 0.18, 64, -s * 0.7, 14);
      limbs.push(ribbon(c, u => (u > 0.82 ? 3.2 : 1.8)));
    }
    return { behind, limbs, body, front: [], lines: [], eyes: [[141, 56, a.eyeR ?? 6.5]], extras: "", silExtras: "", marks: "", mouth: "" , big };
  },
  octopus(a, rnd) {
    const kraken = a.shape === "kraken";
    const hx = 108, hy = kraken ? 38 : 40, rx = kraken ? 42 : 34, ry = kraken ? 30 : 25;
    const limbs = [], suckers = [];
    const arms = kraken ? 8 : 6;
    for (let i = 0; i < arms; i++) {
      const t = i / (arms - 1), x = hx - rx * 0.55 + t * rx * 1.1, dir = t < 0.5 ? -1 : 1;
      const ang = Math.PI / 2 + (0.5 - t) * (kraken ? 2.9 : 2.5), len = (kraken ? 84 : 62) + rnd() * 12, curl = -dir * (kraken ? 2.6 : 2.3) * (0.8 + rnd() * 0.4);
      const c = limb(x, hy + ry * 0.5, ang, len, curl, 18);
      limbs.push(ribbon(c, u => (kraken ? 8.5 : 6.5) * (1 - u * 0.85)));
      for (let k = 3; k < c.length - 2; k += 2) suckers.push([c[k].x, c[k].y, (kraken ? 2.2 : 1.7) * (1 - k / c.length)]);
    }
    const out = { behind: [], limbs, body: [ellipsePath(hx, hy, rx, ry, -0.25)], front: [], lines: [], eyes: [[hx + rx * 0.55, hy + ry * 0.35, a.eyeR ?? 5.5], [hx + rx * 0.2, hy + ry * 0.5, (a.eyeR ?? 5.5) * 0.85]], extras: "", silExtras: "", marks: "", mouth: "" };
    out.suckers = suckers;
    if (kraken) {
      // Barnacle crown on top of the head.
      for (let i = 0; i < 5; i++) { const x = hx - 26 + i * 12, y = hy - ry * 0.86 + Math.abs(i - 2) * 4 - 2; out.silExtras += `<path d="M${x - 5} ${y + 4} L${x - 3} ${y - 5} L${x + 3} ${y - 5} L${x + 5} ${y + 4} Z" fill="SILFILL" stroke="SILSTROKE" stroke-width="1"/>`; out.extras += `<path d="M${x - 5} ${y + 4} L${x - 3} ${y - 5} L${x + 3} ${y - 5} L${x + 5} ${y + 4} Z" fill="${a.crown ?? "#e8dcc0"}" stroke="${shade(a.crown ?? "#e8dcc0", -0.35)}" stroke-width="1"/><ellipse cx="${x}" cy="${y - 5}" rx="3" ry="1.2" fill="${shade(a.crown ?? "#e8dcc0", -0.3)}"/>`; }
    }
    return out;
  },
  jelly(a, rnd) {
    const bx = 112, top = 20, bot = 58, R = 46;
    let bell = `M${bx - R} ${bot} C${bx - R} ${top - 2} ${bx + R} ${top - 2} ${bx + R} ${bot}`;
    const sc = 7;
    for (let i = 0; i < sc; i++) { const x0 = bx + R - (i * 2 * R) / sc, x1 = bx + R - ((i + 1) * 2 * R) / sc; bell += ` Q${f1((x0 + x1) / 2)} ${bot + 7} ${f1(x1)} ${bot}`; }
    const behind = [], lines = [];
    const ribbons = a.mane ? 5 : 3;
    for (let i = 0; i < ribbons; i++) {
      const x = bx - 16 + (i * 32) / Math.max(1, ribbons - 1), c = [];
      for (let k = 0; k <= 10; k++) c.push(pt(x + Math.sin(k * 0.9 + i) * 4 + k * 0.6, bot - 2 + k * (a.mane ? 5.4 : 5)));
      behind.push(ribbon(c, u => (a.mane ? 5 : 4) * (1 - u * 0.6) + Math.sin(u * 18) * 1.2));
    }
    const tent = a.mane ? 14 : 8;
    for (let i = 0; i < tent; i++) {
      const x = bx - R + 4 + (i * (2 * R - 8)) / (tent - 1), len = (a.mane ? 52 : 40) + rnd() * 10;
      lines.push(`M${f1(x)} ${bot + 3} q${f1(4 + rnd() * 3)} ${f1(len * 0.35)} 0 ${f1(len * 0.6)} t${f1(rnd() * 3)} ${f1(len * 0.4)}`);
    }
    return { behind, limbs: [], body: [`${bell} Z`], front: [], lines, lineWidth: a.mane ? 1.5 : 1.2, eyes: [[bx - 11, 44, 3.4], [bx + 11, 44, 3.4]], extras: "", silExtras: "", marks: "", mouth: `<path d="M${bx - 4} 51 q4 3 8 0" stroke="OUTLINE" stroke-width="1.3" fill="none" stroke-linecap="round"/>`, grad: "vertical", bodyOpacity: 0.93 };
  },
  ray(a) {
    const manta = !!a.manta, tipX = manta ? 96 : 104, ty = manta ? 4 : 10;
    const nose = manta ? `C176 46 180 52 180 56 L180 64 C180 68 176 74 170 80` : `C170 40 178 52 180 60 C178 68 170 80 170 80`;
    const body = manta
      ? `M170 40 C150 22 124 ${ty} ${tipX} ${ty} C108 30 82 48 60 55 L60 65 C82 72 108 90 ${tipX} ${120 - ty} C124 ${120 - ty} 150 98 170 80 C176 74 180 68 180 64 L180 56 C180 52 176 46 170 40 Z`
      : `M180 60 C170 40 140 ${ty + 2} ${tipX} ${ty} C112 30 84 48 60 56 L60 64 C84 72 112 90 ${tipX} ${120 - ty} C140 ${118 - ty} 170 80 180 60 Z`;
    void nose;
    const tail = ribbon([pt(62, 60), pt(44, 59), pt(28, 60), pt(12, 58)], u => 3.2 * (1 - u) + 0.6);
    const behind = [tail, `M70 54 Q56 44 52 52 Q58 56 66 58 Z`, `M70 66 Q56 76 52 68 Q58 64 66 62 Z`];
    if (manta) behind.push(`M176 50 Q196 44 194 32 Q186 40 172 44 Z`, `M176 70 Q196 76 194 88 Q186 80 172 76 Z`);
    return { behind, limbs: [], body: [body], front: [], lines: [], eyes: [[156, 48, 3.4], [156, 72, 3.4]], extras: "", silExtras: "", marks: "", mouth: manta ? "" : `<path d="M174 57 q3 3 0 6" stroke="OUTLINE" stroke-width="1.2" fill="none" stroke-linecap="round"/>`, grad: "center" };
  },
  crab(a) {
    const body = [`M60 64 C58 40 88 32 112 32 C136 32 166 40 164 64 C162 80 140 86 112 86 C84 86 62 80 60 64 Z`];
    const behind = [], limbs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x0 = 112 + s * (38 - i * 8), y0 = 72 + i * 4;
      limbs.push(ribbon([pt(x0, y0), pt(x0 + s * 16, y0 + 4 - i * 2), pt(x0 + s * 24, y0 + 18 + i * 3), pt(x0 + s * 26, y0 + 28 + i * 3)], u => 3.6 - u * 2.2));
    }
    // Left claw resting, right claw raised in a wave.
    limbs.push(ribbon([pt(66, 62), pt(48, 66), pt(38, 72)], 4.5), ribbon([pt(158, 56), pt(174, 46), pt(182, 32)], 4.5));
    const front = [];
    const claw = (x, y, rot) => { const c = Math.cos(rot), s = Math.sin(rot), T = (u, v) => `${f1(x + u * c - v * s)} ${f1(y + u * s + v * c)}`;
      return [`M${T(-6, -8)} C${T(10, -14)} ${T(22, -8)} ${T(22, -2)} L${T(8, -1)} C${T(10, 3)} ${T(18, 6)} ${T(20, 9)} C${T(10, 14)} ${T(-6, 12)} ${T(-6, 0)} Z`]; };
    front.push(...claw(32, 74, Math.PI), ...claw(184, 26, -1.25));
    const lines = [`M100 36 L97 22`, `M124 36 L127 22`];
    return { behind, limbs, body, front, lines, lineWidth: 2.4, eyes: [[97, 20, 4.2], [127, 20, 4.2]], extras: "", silExtras: `<circle cx="97" cy="20" r="4.6" fill="SILFILL" stroke="SILSTROKE" stroke-width="1"/><circle cx="127" cy="20" r="4.6" fill="SILFILL" stroke="SILSTROKE" stroke-width="1"/>`, marks: "", mouth: `<path d="M104 58 q8 6 16 0" stroke="OUTLINE" stroke-width="1.5" fill="none" stroke-linecap="round"/>`, grad: "vertical" };
  },
  lobster(a) {
    const body = [`M112 48 C128 40 158 40 176 52 L188 54 L176 58 C168 68 140 72 116 70 C108 68 106 52 112 48 Z`];
    for (let i = 0; i < 5; i++) {
      const x = 112 - i * 15, y = 52 + i * 2.5, h = 18 - i * 1.6;
      body.push(`M${x + 4} ${y - 2} C${x - 4} ${y - 4} ${x - 13} ${y - 3} ${x - 15} ${y} L${x - 15} ${y + h} C${x - 13} ${y + h + 3} ${x - 4} ${y + h + 3} ${x + 4} ${y + h} Z`);
    }
    const behind = [`M40 60 Q24 48 14 52 Q20 60 16 68 Q26 74 40 72 Z`];
    const limbs = [];
    for (let i = 0; i < 4; i++) limbs.push(ribbon([pt(128 + i * 10, 66), pt(124 + i * 10, 76), pt(120 + i * 11, 86)], 2));
    limbs.push(ribbon([pt(162, 64), pt(178, 72), pt(188, 76)], 4.2), ribbon([pt(156, 60), pt(170, 48), pt(178, 36)], 4.2));
    const claw = (x, y, rot) => { const c = Math.cos(rot), s = Math.sin(rot), T = (u, v) => `${f1(x + u * c - v * s)} ${f1(y + u * s + v * c)}`;
      return `M${T(-4, -7)} C${T(10, -12)} ${T(24, -7)} ${T(26, -1)} L${T(10, 0)} C${T(12, 3)} ${T(20, 5)} ${T(22, 8)} C${T(10, 12)} ${T(-4, 10)} ${T(-4, 0)} Z`; };
    const front = [claw(190, 78, 0.1), claw(180, 32, -1.2)];
    const lines = [`M184 52 Q150 20 96 22`, `M182 54 Q160 30 120 28`];
    return { behind, limbs, body, front, lines, lineWidth: 1.4, eyes: [[172, 48, 3.4]], extras: "", silExtras: "", marks: "", mouth: "", grad: "vertical" };
  },
  turtle(a) {
    const shell = `M44 68 C44 30 96 18 126 22 C156 26 172 46 172 68 Z`;
    const body = [shell, `M42 66 L174 66 C172 74 164 78 152 78 L64 78 C52 78 44 74 42 66 Z`,
      `M166 60 C174 52 196 48 204 58 C208 66 198 74 186 74 C176 74 168 72 166 70 Z`];
    const behind = [`M150 72 C164 80 178 94 176 102 C166 100 150 88 140 78 Z`, `M70 72 C62 84 50 94 42 94 C44 86 54 76 62 72 Z`, `M46 70 L32 74 L46 76 Z`];
    const out = { behind, limbs: [], body, front: [], lines: [], eyes: [[192, 58, 3.8]], extras: "", silExtras: "", marks: "", mouth: `<path d="M204 63 q-6 5 -12 3" stroke="OUTLINE" stroke-width="1.4" fill="none" stroke-linecap="round"/>`, grad: "vertical" };
    if (a.ridges) for (const [x, y] of [[66, 40], [84, 29], [102, 24], [120, 23], [138, 27], [155, 37]]) out.front.push(`M${x - 6} ${y + 5} Q${x - 2} ${y - 7} ${x + 1} ${y - 8} Q${x + 3} ${y - 3} ${x + 6} ${y + 5} Z`);
    if (a.island) {
      // Sandy, grassy shell top and a tiny palm tree.
      const palm = `M120 28 C118 18 122 12 127 8 L130 10 C125 14 124 20 126 28 Z`;
      const leaves = [`M128 9 C120 3 110 4 104 11 C113 8 120 8 128 9 Z`, `M128 9 C136 2 147 4 153 11 C144 8 136 8 128 9 Z`, `M128 9 C126 0 131 -5 138 -5 C133 0 131 4 128 9 Z`];
      out.silExtras += [palm, ...leaves].map(d => `<path d="${d}" fill="SILFILL" stroke="SILSTROKE" stroke-width="1"/>`).join("");
      out.extras += `<path d="${palm}" fill="#9a6a3e" stroke="#5e3e22" stroke-width="1"/>` + leaves.map(d => `<path d="${d}" fill="#6fae52" stroke="#3e7032" stroke-width="1"/>`).join("") + `<circle cx="126" cy="11" r="2.4" fill="#8a5a2a"/><circle cx="130" cy="12" r="2.2" fill="#8a5a2a"/>`;
      out.islandTop = true;
    }
    return out;
  },
  whale(a) {
    // Side-on cartoon whale, head right. boxHead = sperm whale (and Moby Dick), tusk = narwhal, orca patches, humpback flippers.
    const box = !!a.boxHead, short = !!a.tusk;
    const hx = short ? 180 : 198, tx = short ? 52 : 40;
    const body = box
      ? `M${tx} 58 C70 50 96 34 132 30 L186 28 C196 28 ${hx} 36 ${hx} 50 L${hx} 70 C${hx} 80 190 86 176 86 L120 88 C92 88 64 76 ${tx} 64 Z`
      : `M${tx} 58 C70 50 100 28 140 30 C170 31 ${hx} 42 ${hx} 58 C${hx} 72 184 86 160 88 L120 88 C92 88 64 76 ${tx} 64 Z`;
    const behind = [`M${tx + 4} 60 C${tx - 10} 52 ${tx - 22} 38 ${tx - 34} 34 C${tx - 26} 46 ${tx - 24} 56 ${tx - 18} 61 C${tx - 24} 66 ${tx - 26} 76 ${tx - 34} 86 C${tx - 22} 82 ${tx - 10} 70 ${tx + 4} 63 Z`];
    const tall = a.dorsal === "tall";
    behind.push(tall ? `M86 44 C90 30 94 12 100 2 C106 18 110 34 116 40 Z` : `M84 46 C90 38 96 34 104 34 C102 38 104 42 108 44 Z`);
    const front = [];
    const flip = a.flippers ? 58 : 26;
    front.push(`M146 76 C140 ${80 + flip * 0.4} ${130 - flip * 0.5} ${86 + flip * 0.55} ${122 - flip * 0.8} ${86 + flip * 0.5} C${126 - flip * 0.4} ${82 + flip * 0.3} 132 80 138 74 Z`);
    const lines = [], out = { behind, limbs: [], body: [body], front, lines, lineWidth: 1.4, eyes: [[box ? 152 : 170, box ? 62 : 58, a.eyeR ?? 3.4]], extras: "", silExtras: "", marks: "", grad: "vertical" };
    out.mouth = box ? `<path d="M${hx - 4} 78 L142 81" stroke="OUTLINE" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M${hx - 2} 66 q-14 8 -36 7" stroke="OUTLINE" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    if (a.grooves) for (let i = 0; i < 5; i++) out.front.push(`M${184 - i * 2} ${76 + i * 2.2} Q150 ${84 + i * 1.6} 118 ${84 + i * 1.2} L118 ${84.8 + i * 1.2} Q150 ${85 + i * 1.6} ${184 - i * 2} ${77 + i * 2.2} Z`);
    if (a.tusk) {
      const tusk = `M${hx - 2} 55 L222 44 L${hx - 2} 59 Z`;
      out.extras += `<path d="${tusk}" fill="#f2ead2" stroke="#b8ab88" stroke-width="1"/>` + [0, 1, 2, 3].map(i => `<path d="M${hx + 6 + i * 9} ${55.5 - i * 2.4} l2 3" stroke="#b8ab88" stroke-width="0.9"/>`).join("");
      out.silExtras += `<path d="${tusk}" fill="SILFILL" stroke="SILSTROKE" stroke-width="1"/>`;
    }
    if (a.orca) out.orcaPatches = true;
    // A happy little spout above the blowhole.
    const bx = box ? 180 : 156;
    out.extras += `<path d="M${bx} 30 C${bx - 2} 22 ${bx - 10} 16 ${bx - 16} 16 M${bx} 30 C${bx + 2} 22 ${bx + 10} 16 ${bx + 16} 16 M${bx} 30 L${bx} 14" stroke="#9fd0ee" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.9"/>`;
    return out;
  },
};
CREATURES.serpent = CREATURES.eel;
CREATURES.kraken = CREATURES.octopus;

function creatureSvg(species, silhouette, size) {
  const a = species.art;
  const id = `f${++uidCounter}`;
  const rnd = hashRng(species.id);
  const C = { behind: [], limbs: [], front: [], lines: [], extras: "", silExtras: "", ...CREATURES[a.shape](a, rnd) };
  const outline = silhouette ? SIL.stroke : shade(a.back, -0.35);
  const finStroke = silhouette ? SIL.stroke : shade(a.fin, -0.35);
  const finFill = silhouette ? SIL.fill : `url(#${id}fin)`;
  const bodyFill = silhouette ? SIL.fill : `url(#${id}body)`;
  const P = (d, fill, stroke, w) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;

  let marks = "";
  if (!silhouette) {
    const pc = a.patternColor;
    const scatter = (n, fn) => { let o = ""; for (let i = 0; i < n; i++) o += fn(8 + rnd() * 208, 8 + rnd() * 104, i); return o; };
    switch (a.pattern) {
      case "spots": marks += scatter(60, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.2 + rnd() * 2)}" fill="${pc}" opacity="0.7"/>`); break;
      case "mottle": marks += scatter(40, (x, y) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(3 + rnd() * 6)}" ry="${f1(2 + rnd() * 3)}" fill="${pc}" opacity="0.45"/>`); break;
      case "lightspots": marks += scatter(55, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.4 + rnd() * 1.8)}" fill="${pc}" opacity="0.85"/>`); break;
      case "stars": marks += scatter(34, (x, y) => `<path d="M${f1(x)} ${f1(y - 2.6)} L${f1(x + 0.8)} ${f1(y - 0.8)} L${f1(x + 2.6)} ${f1(y)} L${f1(x + 0.8)} ${f1(y + 0.8)} L${f1(x)} ${f1(y + 2.6)} L${f1(x - 0.8)} ${f1(y + 0.8)} L${f1(x - 2.6)} ${f1(y)} L${f1(x - 0.8)} ${f1(y - 0.8)} Z" fill="${pc}" opacity="0.95"/>`); break;
      case "glow": {
        const dots = C.centre ? C.centre.filter((_, i) => i % 3 === 1 && i < C.centre.length - 3).map((p, i) => [p.x, p.y + C.width(i * 3 / C.centre.length) * 0.25]) : Array.from({ length: 14 }, () => [20 + rnd() * 190, 20 + rnd() * 80]);
        for (const [x, y] of dots) marks += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.6" fill="${pc}" opacity="0.35"/><circle cx="${f1(x)}" cy="${f1(y)}" r="1.5" fill="${pc}"/>`;
        break;
      }
      case "lateral": if (C.centre) marks += `<path d="${smoothPath(C.centre.slice(2, -3))}" stroke="${pc}" stroke-width="2.2" fill="none" opacity="0.9"/><path d="${smoothPath(C.centre.slice(2, -3))}" stroke="${pc}" stroke-width="6" fill="none" opacity="0.25"/>`; break;
      case "zap": if (C.centre) for (let i = 3; i < C.centre.length - 4; i += 4) { const p = C.centre[i]; marks += `<path d="M${f1(p.x - 3)} ${f1(p.y - 4)} l3 3 l-2 1 l3 4" stroke="${pc}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="4" fill="${pc}" opacity="0.25"/>`; } break;
      case "rings": for (const [x, y] of [[98, 34], [112, 29], [126, 34], [112, 42]]) marks += `<path d="M${x - 5} ${y + 2} a5 4.2 0 1 1 10 0" stroke="${pc}" stroke-width="2.6" fill="none" opacity="0.85"/>`; break;
      case "bands": for (let i = 0; i < 16; i++) marks += `<path d="M${14 + i * 13} 0 l-8 120" stroke="${pc}" stroke-width="3" opacity="0.4"/>`; break;
      case "plates": for (const [x, y, r] of [[80, 46, 11], [106, 38, 12], [132, 42, 11], [154, 56, 8], [60, 58, 8], [94, 60, 9], [120, 60, 9]]) marks += `<path d="M${x - r} ${y} L${x - r / 2} ${y - r * 0.8} L${x + r / 2} ${y - r * 0.8} L${x + r} ${y} L${x + r / 2} ${y + r * 0.8} L${x - r / 2} ${y + r * 0.8} Z" fill="none" stroke="${pc}" stroke-width="1.8" opacity="0.75"/>`; break;
      case "scars": for (let i = 0; i < 9; i++) { const x = 60 + rnd() * 120, y = 40 + rnd() * 34; marks += `<path d="M${f1(x)} ${f1(y)} q${f1(8 + rnd() * 8)} ${f1(-3 + rnd() * 6)} ${f1(16 + rnd() * 10)} ${f1(-1 + rnd() * 4)}" stroke="${pc}" stroke-width="1.3" fill="none" opacity="0.7"/>`; } break;
      case "patches": marks += `<ellipse cx="146" cy="36" rx="12" ry="7" fill="${pc}" opacity="0.8" transform="rotate(-25 146 36)"/><ellipse cx="146" cy="84" rx="12" ry="7" fill="${pc}" opacity="0.8" transform="rotate(25 146 84)"/>`; break;
    }
    if (C.orcaPatches) marks += `<ellipse cx="160" cy="50" rx="13" ry="6" fill="${a.belly}" transform="rotate(-8 160 50)"/><path d="M40 70 C80 78 120 84 150 86 L200 70 L200 120 L40 120 Z" fill="${a.belly}"/><ellipse cx="112" cy="40" rx="14" ry="5" fill="#8a9098" opacity="0.8"/>`;
    if (C.islandTop) marks += `<path d="M40 40 C70 14 150 10 176 40 L176 30 L40 30 Z" fill="#e6cf92"/><path d="M52 36 C80 18 146 16 168 36" stroke="#8ab35a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    // Soft highlight + optional sheen, as on the fish.
    marks += `<ellipse cx="112" cy="36" rx="70" ry="10" fill="#fff" opacity="${a.shine ? 0.3 : 0.12}"/>`;
    if (a.shine) marks += `<circle cx="92" cy="44" r="3" fill="#fff" opacity="0.8"/><circle cx="132" cy="62" r="2" fill="#fff" opacity="0.7"/>`;
  }
  const grad = C.grad === "center"
    ? `<stop offset="0" stop-color="${a.back}"/><stop offset="0.5" stop-color="${a.color}"/><stop offset="1" stop-color="${a.back}"/>`
    : a.aurora
      ? a.aurora.map((c, i) => `<stop offset="${f1(i / (a.aurora.length - 1))}" stop-color="${c}"/>`).join("")
      : `<stop offset="0" stop-color="${a.back}"/><stop offset="0.45" stop-color="${a.color}"/><stop offset="0.72" stop-color="${a.color}"/><stop offset="1" stop-color="${a.belly}"/>`;
  const defs = silhouette ? "" : `<defs>
    <linearGradient id="${id}body" x1="0" y1="0" x2="${a.aurora ? 1 : 0}" y2="${a.aurora ? 0.4 : 1}">${grad}</linearGradient>
    <linearGradient id="${id}fin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(a.fin, 0.15)}"/><stop offset="1" stop-color="${shade(a.fin, -0.15)}"/></linearGradient>
    <clipPath id="${id}clip">${C.body.map(d => `<path d="${d}"/>`).join("")}</clipPath>
  </defs>`;
  const sil = str => str.replaceAll("SILFILL", SIL.fill).replaceAll("SILSTROKE", SIL.stroke);
  const suckers = silhouette || !C.suckers ? "" : C.suckers.map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(Math.max(0.8, r))}" fill="${a.belly}" stroke="${shade(a.back, -0.2)}" stroke-width="0.5" opacity="0.9"/>`).join("");
  return `<svg viewBox="0 0 224 120" width="${size}" height="${Math.round(size * 0.536)}" aria-hidden="true" focusable="false" overflow="visible">${defs}
<g stroke-linejoin="round" stroke-linecap="round">
  ${C.lines.map(d => `<path d="${d}" stroke="${silhouette ? SIL.stroke : shade(a.fin, -0.2)}" stroke-width="${C.lineWidth ?? 1.3}" fill="none" opacity="${silhouette ? 1 : 0.85}"/>`).join("")}
  ${C.behind.map(d => P(d, finFill, finStroke, 1.1)).join("")}
  ${C.limbs.map(d => P(d, silhouette ? SIL.fill : a.limb ?? a.color, outline, 1.3)).join("")}
  ${suckers}
  <g opacity="${C.bodyOpacity ?? 1}">${C.body.map(d => P(d, bodyFill, outline, 1.6)).join("")}</g>
  ${silhouette ? "" : `<g clip-path="url(#${id}clip)">${marks}</g>`}
  ${C.front.map(d => P(d, finFill, finStroke, 1.1)).join("")}
  ${silhouette ? sil(C.silExtras) : C.extras}
  ${silhouette ? "" : (C.mouth ?? "").replaceAll("OUTLINE", outline) + C.eyes.map(([x, y, r]) => eyeSvg(a, x, y, r)).join("")}
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
