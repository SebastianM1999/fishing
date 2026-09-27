// Small illustrated UI icons (inline SVG, 24x24). Decorative unless given a label.
const svg = (body, cls = "") => `<svg viewBox="0 0 24 24" class="ico ${cls}" aria-hidden="true" focusable="false">${body}</svg>`;
const ink = `fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"`;

export const ICONS = {
  // Gear slots (full colour)
  rod: svg(`<path d="M4 20 19 4" stroke="#6b4a2e" stroke-width="2.2" stroke-linecap="round"/><path d="M4 20l3-3" stroke="#c8a070" stroke-width="3.4" stroke-linecap="round"/><circle cx="8.5" cy="15.5" r="2.2" fill="#9aa0a6" stroke="#6d7278"/><path d="M19 4c1.5 4 1 9-1 12" stroke="#e8e2d4" stroke-width="1" fill="none"/><circle cx="18" cy="16.5" r="1.5" fill="#d8443a"/>`),
  reel: svg(`<circle cx="11" cy="13" r="7" fill="#9aa0a6" stroke="#5f656b" stroke-width="1.4"/><circle cx="11" cy="13" r="3.6" fill="#c9ced3" stroke="#5f656b"/><circle cx="11" cy="13" r="1.2" fill="#5f656b"/><path d="M11 13 19 6" stroke="#5f656b" stroke-width="1.8" stroke-linecap="round"/><circle cx="19.5" cy="5.5" r="2" fill="#c8a070" stroke="#8a6242"/>`),
  line: svg(`<ellipse cx="12" cy="12" rx="8" ry="8" fill="#4f86c6"/><ellipse cx="12" cy="12" rx="3" ry="3" fill="#f7efdf"/><path d="M5 9c3 1 11 1 14 0M4.5 13c3 1 12 1 15 0M6 17c3 1 9 1 12 0" stroke="#bfe0ff" stroke-width="1" fill="none"/><path d="M19 7c2 3 2 9 0 14" stroke="#3b3129" stroke-width="1" fill="none"/>`),
  hook: svg(`<path d="M13 3v11a4.5 4.5 0 1 1-9 0v-1" fill="none" stroke="#7d8288" stroke-width="2.4" stroke-linecap="round"/><path d="M4 13l2.5 2.5" stroke="#7d8288" stroke-width="2.4" stroke-linecap="round"/><circle cx="13" cy="3.5" r="1.8" fill="none" stroke="#7d8288" stroke-width="1.6"/><path d="M17 6l3-2M17 10h3.5" stroke="#e2b34a" stroke-width="1.6" stroke-linecap="round"/>`),
  float: svg(`<path d="M12 2v5" stroke="#3b3129" stroke-width="1.6"/><circle cx="12" cy="12" r="6" fill="#f6f1e6" stroke="#8a7f70"/><path d="M6 12a6 6 0 0 0 12 0Z" fill="#d8443a"/><path d="M3 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" stroke="#4f86c6" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),
  sinker: svg(`<path d="M12 3v4" stroke="#3b3129" stroke-width="1.6"/><path d="M12 7c4 0 6 4 6 8a6 6 0 0 1-12 0c0-4 2-8 6-8Z" fill="#6d7278" stroke="#4a4e52"/><ellipse cx="10" cy="13" rx="1.6" ry="2.6" fill="#b8bdc2"/>`),
  spinner: svg(`<path d="M5 12h4" stroke="#3b3129" stroke-width="1.6"/><path d="M9 12c3-5 9-6 11-4-1 4-7 6-11 4Z" fill="#e2b34a" stroke="#a8711a"/><path d="M9 12c3 5 9 6 11 4" fill="none" stroke="#d99a24" stroke-width="1.4"/><circle cx="7" cy="12" r="1.8" fill="#d8443a"/>`),
  boat: svg(`<path d="M3 14h18l-3 5H6Z" fill="#e9e1cf" stroke="#3f6e8c" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 3v11" stroke="#7a5638" stroke-width="1.6"/><path d="M12 4l6 8h-6Z" fill="#f5ecd8" stroke="#b8a888"/><path d="M2 21c2-1 4-1 6 0s4 1 6 0 4-1 6 0" stroke="#4f86c6" stroke-width="1.4" fill="none"/>`),
  barrier: svg(`<path d="M5 9v12M19 9v12" stroke="#a8784e" stroke-width="2" stroke-linecap="round"/><rect x="2.5" y="8" width="19" height="5" rx="1" fill="#f4efe4" stroke="#8a6242"/><path d="M6 8l-3 5M11 8l-3 5M16 8l-3 5M21 8l-3 5" stroke="#d4463a" stroke-width="2.2"/><path d="M12 2.5 15 7H9Z" fill="#ec7a2c"/><circle cx="12" cy="3" r="1.3" fill="#ffb347"/>`),
  fish: svg(`<path d="M3 12c3-5 10-6 14-1l4-3v8l-4-3c-4 5-11 4-14-1Z" fill="#6fa3c9" stroke="#3d6688" stroke-width="1.2"/><circle cx="7" cy="11" r="1" fill="#1d1a18"/>`),
  bag: svg(`<path d="M6 8h12l1 12H5Z" fill="#c49a5a" stroke="#8a6242" stroke-width="1.3"/><path d="M9 8a3 3 0 0 1 6 0" fill="none" stroke="#8a6242" stroke-width="1.6"/>`),
  board: svg(`<rect x="3" y="4" width="18" height="14" rx="1.5" fill="#b98a58" stroke="#6b4a2e"/><rect x="5.5" y="6.5" width="5" height="4" rx="1" fill="#fbf4e4"/><rect x="13.5" y="6.5" width="5" height="4" rx="1" fill="#fbf4e4"/><rect x="5.5" y="12" width="5" height="4" rx="1" fill="#fbf4e4"/><rect x="13.5" y="12" width="5" height="4" rx="1" fill="#d9ccb4"/><path d="M8 18v3M16 18v3" stroke="#6b4a2e" stroke-width="1.6"/>`),
  gear: svg(`<circle cx="12" cy="12" r="3.2" ${ink}/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" ${ink}/>`),
  music: svg(`<path d="M9 18V6l11-2v12" ${ink}/><circle cx="6.5" cy="18" r="2.5" ${ink}/><circle cx="17.5" cy="16" r="2.5" ${ink}/>`),
  speaker: svg(`<path d="M4 9h4l5-4v14l-5-4H4Z" ${ink}/><path d="M16 9c1.5 1.5 1.5 4.5 0 6M18.5 6.5c3 3 3 8 0 11" ${ink}/>`),
  leaf: svg(`<path d="M5 19C5 10 10 5 20 4c0 10-6 15-15 15Z" ${ink}/><path d="M5 19 13 11" ${ink}/>`),
  mute: svg(`<path d="M4 9h4l5-4v14l-5-4H4Z" ${ink}/><path d="M16 9l5 6M21 9l-5 6" ${ink}/>`),

  // Stat glyphs (inherit text colour)
  width: svg(`<path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3" ${ink}/><path d="M8 5v14M16 5v14" ${ink} stroke-dasharray="2 2.5"/>`),
  speed: svg(`<path d="M13 3 5 13h6l-1 8 8-10h-6Z" ${ink}/>`),
  recovery: svg(`<path d="M20 12a8 8 0 1 1-2.4-5.7" ${ink}/><path d="M20 4v5h-5" ${ink}/>`),
  tension: svg(`<path d="M4 20c4-2 4-6 8-8s4-6 8-8" ${ink}/><path d="M9 14l2 2M13 8l2 2" ${ink}/>`),
  timer: svg(`<circle cx="12" cy="13" r="7.5" ${ink}/><path d="M12 13V9M10 2h4M12 2v3" ${ink}/>`),
  grip: svg(`<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" ${ink}/><path d="M9 12l2 2 4-4" ${ink}/>`),
  smooth: svg(`<path d="M3 15c3-6 6-6 9 0s6 6 9 0" ${ink}/>`),
  burst: svg(`<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" ${ink}/>`),
  gem: svg(`<path d="M6 4h12l3 5-9 11L3 9Z" ${ink}/><path d="M3 9h18M9 4l3 16 3-16" ${ink}/>`),
  wait: svg(`<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" ${ink}/>`),
  check: svg(`<path d="M5 12l4.5 4.5L19 7" ${ink}/>`),
};

export const icon = (name, label) =>
  label ? `<span class="ico-wrap" role="img" aria-label="${label}" title="${label}">${ICONS[name]}</span>` : ICONS[name];
