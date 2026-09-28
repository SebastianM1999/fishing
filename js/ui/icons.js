// Small illustrated UI icons (inline SVG, 24x24). Decorative unless given a label.
const svg = (body, cls = "") => `<svg viewBox="0 0 24 24" class="ico ${cls}" aria-hidden="true" focusable="false">${body}</svg>`;
const ink = `fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"`;

export const ICONS = {
  // Gear slots (full colour)
  rod: svg(`<path d="M4 20 19 4" stroke="#6b4a2e" stroke-width="2.2" stroke-linecap="round"/><path d="M4 20l3-3" stroke="#c8a070" stroke-width="3.4" stroke-linecap="round"/><circle cx="8.5" cy="15.5" r="2.2" fill="#9aa0a6" stroke="#6d7278"/><path d="M19 4c1.5 4 1 9-1 12" stroke="#e8e2d4" stroke-width="1" fill="none"/><circle cx="18" cy="16.5" r="1.5" fill="#d8443a"/>`),
  reel: svg(`<circle cx="11" cy="13" r="7" fill="#9aa0a6" stroke="#5f656b" stroke-width="1.4"/><circle cx="11" cy="13" r="3.6" fill="#c9ced3" stroke="#5f656b"/><circle cx="11" cy="13" r="1.2" fill="#5f656b"/><path d="M11 13 19 6" stroke="#5f656b" stroke-width="1.8" stroke-linecap="round"/><circle cx="19.5" cy="5.5" r="2" fill="#c8a070" stroke="#8a6242"/>`),
  line: svg(`<ellipse cx="12" cy="12" rx="8" ry="8" fill="#4f86c6"/><ellipse cx="12" cy="12" rx="3" ry="3" fill="#f7efdf"/><path d="M5 9c3 1 11 1 14 0M4.5 13c3 1 12 1 15 0M6 17c3 1 9 1 12 0" stroke="#bfe0ff" stroke-width="1" fill="none"/><path d="M19 7c2 3 2 9 0 14" stroke="#3b3129" stroke-width="1" fill="none"/>`),
  boat: svg(`<path d="M3 14h18l-3 5H6Z" fill="#e9e1cf" stroke="#3f6e8c" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 3v11" stroke="#7a5638" stroke-width="1.6"/><path d="M12 4l6 8h-6Z" fill="#f5ecd8" stroke="#b8a888"/><path d="M2 21c2-1 4-1 6 0s4 1 6 0 4-1 6 0" stroke="#4f86c6" stroke-width="1.4" fill="none"/>`),
  barrier: svg(`<path d="M5 9v12M19 9v12" stroke="#a8784e" stroke-width="2" stroke-linecap="round"/><rect x="2.5" y="8" width="19" height="5" rx="1" fill="#f4efe4" stroke="#8a6242"/><path d="M6 8l-3 5M11 8l-3 5M16 8l-3 5M21 8l-3 5" stroke="#d4463a" stroke-width="2.2"/><path d="M12 2.5 15 7H9Z" fill="#ec7a2c"/><circle cx="12" cy="3" r="1.3" fill="#ffb347"/>`),
  fish: svg(`<path d="M3 12c3-5 10-6 14-1l4-3v8l-4-3c-4 5-11 4-14-1Z" fill="#6fa3c9" stroke="#3d6688" stroke-width="1.2"/><circle cx="7" cy="11" r="1" fill="#1d1a18"/>`),
  bag: svg(`<path d="M6 8h12l1 12H5Z" fill="#c49a5a" stroke="#8a6242" stroke-width="1.3"/><path d="M9 8a3 3 0 0 1 6 0" fill="none" stroke="#8a6242" stroke-width="1.6"/>`),
  board: svg(`<rect x="3" y="4" width="18" height="14" rx="1.5" fill="#b98a58" stroke="#6b4a2e"/><rect x="5.5" y="6.5" width="5" height="4" rx="1" fill="#fbf4e4"/><rect x="13.5" y="6.5" width="5" height="4" rx="1" fill="#fbf4e4"/><rect x="5.5" y="12" width="5" height="4" rx="1" fill="#fbf4e4"/><rect x="13.5" y="12" width="5" height="4" rx="1" fill="#d9ccb4"/><path d="M8 18v3M16 18v3" stroke="#6b4a2e" stroke-width="1.6"/>`),
  gear: svg(`<path d="M10.3 2.5h3.4l.5 2.6a7.5 7.5 0 0 1 1.9 1.1l2.5-.9 1.7 2.9-2 1.7a7.6 7.6 0 0 1 0 2.2l2 1.7-1.7 2.9-2.5-.9a7.5 7.5 0 0 1-1.9 1.1l-.5 2.6h-3.4l-.5-2.6a7.5 7.5 0 0 1-1.9-1.1l-2.5.9-1.7-2.9 2-1.7a7.6 7.6 0 0 1 0-2.2l-2-1.7 1.7-2.9 2.5.9a7.5 7.5 0 0 1 1.9-1.1Z" ${ink}/><circle cx="12" cy="12" r="3" ${ink}/>`),
  music: svg(`<path d="M9 18V6l11-2v12" ${ink}/><circle cx="6.5" cy="18" r="2.5" ${ink}/><circle cx="17.5" cy="16" r="2.5" ${ink}/>`),
  speaker: svg(`<path d="M4 9h4l5-4v14l-5-4H4Z" ${ink}/><path d="M16 9c1.5 1.5 1.5 4.5 0 6M18.5 6.5c3 3 3 8 0 11" ${ink}/>`),
  leaf: svg(`<path d="M5 19C5 10 10 5 20 4c0 10-6 15-15 15Z" ${ink}/><path d="M5 19 13 11" ${ink}/>`),
  mute: svg(`<path d="M4 9h4l5-4v14l-5-4H4Z" ${ink}/><path d="M16 9l5 6M21 9l-5 6" ${ink}/>`),

  // Weather (full colour)
  wx_clear: svg(`<circle cx="12" cy="12" r="4.6" fill="#ffcf5a" stroke="#d99a24" stroke-width="1.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="#e6a62c" stroke-width="1.8" stroke-linecap="round"/>`),
  wx_rain: svg(`<path d="M7 15.5a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 8a3.8 3.8 0 0 1 .5 7.5Z" fill="#e9eef3" stroke="#7d8c9a" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" stroke="#4f86c6" stroke-width="1.8" stroke-linecap="round"/>`),
  wx_fog: svg(`<path d="M7 11a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 3.5a3.8 3.8 0 0 1 .5 7.5Z" fill="#eeeeea" stroke="#9a968e" stroke-width="1.2" stroke-linejoin="round" transform="translate(0 2)"/><path d="M3.5 16h13M6.5 19h14M3 22h11" stroke="#9a968e" stroke-width="1.8" stroke-linecap="round"/>`),
  wx_storm: svg(`<path d="M7 14a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 6.5a3.8 3.8 0 0 1 .5 7.5Z" fill="#8f8aa8" stroke="#4a3d86" stroke-width="1.3" stroke-linejoin="round"/><path d="M12.5 12.5 9.5 17.5h3l-1.5 4.5 4.5-6h-3l1.5-3.5Z" fill="#ffd34a" stroke="#c9962a" stroke-width="0.9" stroke-linejoin="round"/>`),

  // Stat glyphs (inherit text colour)
  width: svg(`<path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3" ${ink}/><path d="M8 5v14M16 5v14" ${ink} stroke-dasharray="2 2.5"/>`),
  speed: svg(`<path d="M13 3 5 13h6l-1 8 8-10h-6Z" ${ink}/>`),
  recovery: svg(`<path d="M20 12a8 8 0 1 1-2.4-5.7" ${ink}/><path d="M20 4v5h-5" ${ink}/>`),
  tension: svg(`<path d="M4 20c4-2 4-6 8-8s4-6 8-8" ${ink}/><path d="M9 14l2 2M13 8l2 2" ${ink}/>`),
  timer: svg(`<circle cx="12" cy="13" r="7.5" ${ink}/><path d="M12 13V9M10 2h4M12 2v3" ${ink}/>`),
  smooth: svg(`<path d="M3 15c3-6 6-6 9 0s6 6 9 0" ${ink}/>`),
  burst: svg(`<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" ${ink}/>`),
  gem: svg(`<path d="M6 4h12l3 5-9 11L3 9Z" ${ink}/><path d="M3 9h18M9 4l3 16 3-16" ${ink}/>`),
  wait: svg(`<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" ${ink}/>`),
  net: svg(`<path d="M4 4l6 6" stroke="#8a6242" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="14.5" cy="14.5" rx="6.5" ry="6.5" fill="#e8f3e0" stroke="#4f7a44" stroke-width="1.8"/><path d="M10 11l9 9M11 18l7-7M14.5 8v13M8 14.5h13" stroke="#6f9a5a" stroke-width="0.9"/>`),
  line2: svg(`<path d="M3 5c6 0 6 14 18 14" fill="none" stroke="#e8e2d4" stroke-width="2.4" stroke-linecap="round"/><path d="M3 5c6 0 6 14 18 14" fill="none" stroke="#8a7f70" stroke-width="1" stroke-dasharray="1 2.5"/><circle cx="3" cy="5" r="2" fill="#6b4a2e"/><circle cx="21" cy="19" r="2.2" fill="#d8443a"/>`),
  zigzag: svg(`<path d="M3 16l4-8 4 8 4-8 4 8 2-4" ${ink}/>`),
  weight: svg(`<path d="M9 7a3 3 0 1 1 6 0" ${ink}/><path d="M6 9h12l2 11H4Z" ${ink}/>`),
  flame: svg(`<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 2 4 1-2 1-4 1-7Z" ${ink}/>`),
  sleep: svg(`<path d="M4 8h5l-5 6h5M13 5h4l-4 5h4M16 14h4l-4 5h4" ${ink}/>`),
  bobber: svg(`<path d="M12 2v5" stroke="#3b3129" stroke-width="1.6"/><circle cx="12" cy="12" r="5.5" fill="#f6f1e6" stroke="#8a7f70"/><path d="M6.5 12a5.5 5.5 0 0 0 11 0Z" fill="#d8443a"/><path d="M2 20c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0 3.5-1 5-.5" stroke="#4f86c6" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),
  alert: svg(`<circle cx="12" cy="12" r="10" fill="#d8443a"/><path d="M12 6v8" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="18" r="1.7" fill="#fff"/>`),
  star: svg(`<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z" fill="#f2cf5b" stroke="#c9962a" stroke-width="1.2" stroke-linejoin="round"/>`),
  mouse: svg(`<rect x="6" y="3" width="12" height="18" rx="6" ${ink}/><path d="M12 3v6" ${ink}/><path d="M6.5 9h5.5V3.5A6 6 0 0 0 6.5 9Z" fill="currentColor" opacity="0.5"/>`),
  check: svg(`<path d="M5 12l4.5 4.5L19 7" ${ink}/>`),

  // Skill tree
  coin: svg(`<circle cx="12" cy="12" r="8.5" fill="#e6b83f" stroke="#b88a20" stroke-width="1.6"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#fff2b0" stroke-width="1.2" opacity="0.8"/><path d="M12 8.5v7M10 10.2c0-1 4-1.3 4 .3s-4 1-4 2.8 4 1.4 4 .3" fill="none" stroke="#8a6414" stroke-width="1.4" stroke-linecap="round"/>`),
  sprout: svg(`<path d="M12 21v-9" stroke="#6b4a2e" stroke-width="2" stroke-linecap="round"/><path d="M12 13C12 8 8.5 5.5 4 6c0 4.5 3.5 7 8 7Z" fill="#8cc46a" stroke="#4f7a44" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 11c0-4.5 3-7 7.5-7 0 4.5-3 7-7.5 7Z" fill="#a9d88a" stroke="#4f7a44" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 21h10" stroke="#a8784e" stroke-width="2" stroke-linecap="round"/>`),
  eye: svg(`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" ${ink}/><circle cx="12" cy="12" r="3.2" ${ink}/><path d="M17 3.5l1.5-1.5M20 6.5l1.5-.5" ${ink}/>`),
  book: svg(`<path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5Z" ${ink}/><path d="M12 6v13.5M7 9.5c1-.4 2-.4 3 0M14 9.5c1-.4 2-.4 3 0" ${ink}/>`),
  moon: svg(`<path d="M19 15.5A8 8 0 0 1 8.5 5a8 8 0 1 0 10.5 10.5Z" ${ink}/><path d="M17 3v3M15.5 4.5h3" ${ink}/>`),
  whisper: svg(`<path d="M8 17c0-3-2-4-2-8a6 6 0 0 1 12 0c0 3-3 3.5-3 6.5 0 3-2.5 4.5-4.5 3.5" ${ink}/><path d="M10 9.5a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5" ${ink}/><path d="M20 15l1.5-.5M19.5 18.5l1.5.8" ${ink}/>`),
  ruler: svg(`<rect x="2.5" y="8" width="19" height="8" rx="1.5" ${ink}/><path d="M6.5 8v3M10.5 8v4.5M14.5 8v3M18.5 8v4.5" ${ink}/>`),
  crate: svg(`<rect x="3.5" y="7" width="17" height="13" rx="1.5" ${ink}/><path d="M3.5 12h17M9 7V4.5h6V7M8 16h8" ${ink}/>`),
  trophy: svg(`<path d="M8 4h8v5a4 4 0 0 1-8 0Z" ${ink}/><path d="M8 6H5c0 3 1.5 4.5 3.5 4.5M16 6h3c0 3-1.5 4.5-3.5 4.5M12 13v4M8.5 20h7M10 17h4" ${ink}/>`),
  ink: svg(`<path d="M12 3c2 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 3-6 5-10Z" ${ink}/><path d="M9.5 13.5a2.5 2.5 0 0 0 2.5 2.5" ${ink}/>`),
  jelly: svg(`<path d="M5 12a7 7 0 0 1 14 0c-1.2 1-2.3-.4-3.5.6S13.2 11 12 12s-2.3-.4-3.5.6S6.2 11 5 12Z" ${ink}/><path d="M8.5 14c-1 2 1 3 0 6M12 14c-1 2 1 3 0 6M15.5 14c-1 2 1 3 0 6" ${ink}/>`),
  tentacle: svg(`<path d="M5 21c0-7 3-12 8-14 4-1.5 7 1 6 4-.8 2.4-4 2.6-4.6.6-.4-1.2.6-2 1.6-1.6" ${ink}/><circle cx="9" cy="15.5" r="1" fill="currentColor"/><circle cx="11" cy="11.5" r="1" fill="currentColor"/>`),
  bolt: svg(`<path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6Z" ${ink}/>`),
  gift: svg(`<rect x="4" y="10" width="16" height="10" rx="1.5" fill="#f2cf5b" stroke="#a8711a" stroke-width="1.3"/><rect x="3" y="7" width="18" height="4" rx="1" fill="#e2a83a" stroke="#a8711a" stroke-width="1.3"/><path d="M12 7v13" stroke="#c9463d" stroke-width="2.2"/><path d="M12 7c-2-4-6-4-6-1.5S10 7 12 7c2 0 6-1 6-1.5S14 3 12 7Z" fill="none" stroke="#c9463d" stroke-width="1.6" stroke-linejoin="round"/>`),
  harpoon: svg(`<path d="M4 20 17.5 6.5" stroke="#7a5638" stroke-width="2.2" stroke-linecap="round"/><path d="M16 4.5 21 3l-1.5 5-2 .5-2-2Z" fill="#9aa0a6" stroke="#5f656b" stroke-width="1.2" stroke-linejoin="round"/><path d="M15.5 9.5l-1-2.5M14.5 8.5l-2.5-1" stroke="#5f656b" stroke-width="1.3" stroke-linecap="round"/><path d="M3 18c1.5 0 2 1.5 1 3" fill="none" stroke="#cdb58a" stroke-width="1.4" stroke-linecap="round"/>`),
  whale: svg(`<path d="M2.5 13c0-4 4-6 9-6 5.5 0 8 3 8 6.5 0 2-1.5 3.5-4 3.5H7c-2.5 0-4.5-1.5-4.5-4Z" fill="#5a6c86" stroke="#2e3848" stroke-width="1.2"/><path d="M19.5 11.5c1-1.5 2.2-2 2.5-3.5-1.5.4-2.2 1-2.8 2" fill="#5a6c86" stroke="#2e3848" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 14.5c2 1.3 6 1.6 10 1" fill="none" stroke="#dfe4ea" stroke-width="1.3" stroke-linecap="round"/><circle cx="6.5" cy="11.5" r="1" fill="#15130f"/><path d="M9 6c0-1.5-.8-2.5-1.8-3M9 6c0-1.5.8-2.5 1.8-3" fill="none" stroke="#9fd0ee" stroke-width="1.2" stroke-linecap="round"/>`),
  trawler: svg(`<path d="M2 14h20l-3 5.5H5Z" fill="#8a3a30" stroke="#4a1e18" stroke-width="1.3" stroke-linejoin="round"/><path d="M2.5 15.5h19" stroke="#e9e1cf" stroke-width="1.1"/><rect x="6" y="8" width="7" height="6" fill="#e9e1cf" stroke="#4a4a4a" stroke-width="1.1"/><rect x="7" y="9" width="5" height="2" fill="#46586a"/><path d="M9.5 8V3.5M8 4.5h3" stroke="#2a2c30" stroke-width="1.3" stroke-linecap="round"/><rect x="14.5" y="10" width="2" height="4" fill="#8a3a30" stroke="#4a1e18" stroke-width="1"/>`),
  lock: svg(`<rect x="5" y="10.5" width="14" height="10" rx="2" ${ink}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" ${ink}/>`),
};

export const icon = (name, label) =>
  label ? `<span class="ico-wrap" role="img" aria-label="${label}" title="${label}">${ICONS[name]}</span>` : ICONS[name];
