// Procedural fish illustrations (inline SVG) from each species' `art` parameters.
const SILHOUETTE = "#8d8a84";

export function fishSvg(species, { silhouette = false, size = 96 } = {}) {
  const a = species.art;
  const body = silhouette ? SILHOUETTE : a.color;
  const belly = silhouette ? SILHOUETTE : a.belly;
  const fin = silhouette ? SILHOUETTE : shade(a.color, -0.18);
  const cx = 52, cy = 32;
  const rx = 18 + a.len * 18;
  const ry = 6 + a.h * 30;
  const tailX = cx - rx + 3;
  const tail = a.fin === "fork" || a.fin === "sail" || a.fin === "sword" || a.fin === "shark"
    ? `M${tailX} ${cy} L${tailX - 13} ${cy - ry * 0.95} L${tailX - 7} ${cy} L${tailX - 13} ${cy + ry * 0.95} Z`
    : `M${tailX} ${cy} L${tailX - 12} ${cy - ry * 0.8} Q${tailX - 8} ${cy} ${tailX - 12} ${cy + ry * 0.8} Z`;
  let dorsal;
  switch (a.fin) {
    case "spiky": dorsal = `M${cx - rx * 0.5} ${cy - ry * 0.8} l4 -9 l4 7 l4 -8 l4 7 l4 -7 l3 9 Z`; break;
    case "sail": dorsal = `M${cx - rx * 0.6} ${cy - ry * 0.7} Q${cx - 4} ${cy - ry - 20} ${cx + rx * 0.4} ${cy - ry * 0.85} Z`; break;
    case "shark": dorsal = `M${cx - 6} ${cy - ry * 0.85} L${cx - 1} ${cy - ry - 11} L${cx + 7} ${cy - ry * 0.85} Z`; break;
    case "long": dorsal = `M${cx - rx * 0.7} ${cy - ry * 0.75} Q${cx} ${cy - ry - 7} ${cx + rx * 0.5} ${cy - ry * 0.8} Z`; break;
    case "flat": dorsal = `M${cx - rx * 0.8} ${cy - ry * 0.55} Q${cx} ${cy - ry - 4} ${cx + rx * 0.8} ${cy - ry * 0.55} Z`; break;
    default: dorsal = `M${cx - rx * 0.45} ${cy - ry * 0.85} Q${cx - 2} ${cy - ry - 8} ${cx + rx * 0.3} ${cy - ry * 0.9} Z`;
  }
  const headX = cx + rx;
  const extras = [];
  if (a.fin === "sword") extras.push(`<path d="M${headX - 2} ${cy - 2} L${headX + 16} ${cy - 1} L${headX - 2} ${cy + 1} Z" fill="${fin}"/>`);
  if (a.fin === "whisker" && !silhouette) extras.push(`<path d="M${headX - 3} ${cy + 3} q6 4 10 9 M${headX - 4} ${cy + 4} q3 5 4 11" stroke="${fin}" stroke-width="1.4" fill="none"/>`);
  const eye = silhouette ? "" : `<circle cx="${headX - 8}" cy="${cy - ry * 0.25}" r="2.6" fill="#fdf8ee"/><circle cx="${headX - 7.5}" cy="${cy - ry * 0.25}" r="1.4" fill="#2b2622"/>`;
  const bellyPath = `<path d="M${cx - rx * 0.8} ${cy + ry * 0.2} Q${cx} ${cy + ry * 1.05} ${cx + rx * 0.85} ${cy + ry * 0.15} Q${cx} ${cy + ry * 0.5} ${cx - rx * 0.8} ${cy + ry * 0.2} Z" fill="${belly}"/>`;
  return `<svg viewBox="0 0 104 64" width="${size}" height="${Math.round(size * 0.62)}" aria-hidden="true" focusable="false">
<path d="${dorsal}" fill="${fin}"/><path d="${tail}" fill="${fin}"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${body}"/>${bellyPath}
<path d="M${cx - 2} ${cy + 2} q5 6 -1 10 q-4 -4 1 -10 Z" fill="${fin}" opacity="0.8"/>${extras.join("")}${eye}</svg>`;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c + c * amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, "0")).join("")}`;
}
