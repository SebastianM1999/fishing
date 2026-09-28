// Web Audio: recorded music (assets/music/*.mp3, one playlist per time of day plus the title-screen loop),
// procedural nature ambience that follows the player's surroundings and the time of day, and synthesized sound
// effects. Volumes are tiny preferences in localStorage.

const PREFS_KEY = "driftwood-cove-audio";
// Slider 100% = VOLUME_RANGE of full output: the comfortable mix sits mid-slider (the default 50%).
const VOLUME_RANGE = 0.25;
const PREFS_SCALE = 2; // bumped when the slider range changed; older saved sliders are converted
const DEFAULT_PREFS = { music: 0.5, sfx: 0.5, ambience: 0.5, muted: false, scale: PREFS_SCALE };

const midi = n => 440 * Math.pow(2, (n - 69) / 12);

// Music playlists; a time of day alternates between its tracks. "menu" loops on the title screen.
const MUSIC_DIR = "assets/music/"; // relative to the page, so it works under any sub-path
export const PLAYLISTS = {
  menu: ["cozy-farming-village.mp3"],
  dawn: ["sunlit-turnip-path-2.mp3", "sunlit-turnip-path.mp3"],
  day: ["sunlit-turnip-path.mp3", "sunlit-turnip-path-2.mp3"],
  dusk: ["cedar-hearth-loop.mp3", "cedar-hearth-loop-2.mp3"],
  night: ["glowspore-cavern.mp3", "glowspore-cavern-2.mp3"],
};
const CROSSFADE = 2.5; // seconds between tracks (time-of-day change, next track, leaving the title screen)
const TRACK_GAIN = 0.75; // level of the recorded music within the music bus
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = v => Math.min(1, Math.max(0, v));


function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (!saved) return { ...DEFAULT_PREFS };
    // Sliders saved on the old full-range scale keep sounding the same on the new one.
    if (saved.scale !== PREFS_SCALE) for (const k of ["music", "sfx", "ambience"]) if (typeof saved[k] === "number") saved[k] = Math.min(1, saved[k] / VOLUME_RANGE);
    return { ...DEFAULT_PREFS, ...saved, scale: PREFS_SCALE };
  } catch { return { ...DEFAULT_PREFS }; }
}
function savePrefs(p) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* preferences are optional */ }
}

export function createAudio() {
  const prefs = loadPrefs();
  let ctx = null;
  const bus = {};
  let white, brown, reverb;
  const amb = {};
  let meterNode = null;
  const music = { key: null, deck: null, next: {} }; // next: playlist position per key
  const timers = { crackle: 0, bird: 0, cricket: 0, gull: 0, owl: 0, tick: 0, creak: 0 };

  // --- Graph ------------------------------------------------------------------------------
  function noiseBuffer(seconds, brownian) {
    const len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brownian) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }
  function impulse(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }
  const gain = (v, to) => { const g = ctx.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
  function filter(type, freq, q = 0.7, to) {
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    if (to) f.connect(to);
    return f;
  }
  function loop(buffer, to) {
    const s = ctx.createBufferSource();
    s.buffer = buffer; s.loop = true;
    s.connect(to);
    s.start(0, Math.random() * buffer.duration);
    return s;
  }

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = self.AudioContext || self.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    comp.connect(ctx.destination);
    const master = gain(0.9, comp);
    meterNode = ctx.createAnalyser();
    comp.connect(meterNode);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.6);
    reverb.connect(gain(0.5, master));
    for (const [name, send] of [["music", 0], ["sfx", 0.12], ["ambience", 0.22]]) {
      bus[name] = gain(0, master);
      if (send) bus[name].connect(gain(send, reverb)); // recorded music already has its own room
    }
    white = noiseBuffer(2, false);
    brown = noiseBuffer(4, true);

    // Ambience beds: surf (swell + wash), river, wind.
    amb.wave = gain(0, bus.ambience);
    amb.waveFilter = filter("lowpass", 520, 0.5, amb.wave);
    loop(brown, amb.waveFilter);
    amb.wash = gain(0, bus.ambience);
    loop(white, filter("bandpass", 1500, 0.6, amb.wash));
    amb.river = gain(0, bus.ambience);
    loop(white, filter("bandpass", 950, 0.8, filter("lowpass", 2400, 0.5, amb.river)));
    amb.wind = gain(0, bus.ambience);
    loop(brown, filter("lowpass", 260, 0.6, amb.wind));
    amb.rain = gain(0, bus.ambience);
    loop(white, filter("bandpass", 2600, 0.45, filter("lowpass", 7000, 0.5, amb.rain)));
    applyVolumes();
    // Hidden tab: pause everything (music would otherwise keep playing in the background).
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
  }

  function applyVolumes() {
    if (!ctx) return;
    for (const name of ["music", "sfx", "ambience"]) {
      bus[name].gain.setTargetAtTime(prefs.muted ? 0 : prefs[name] * VOLUME_RANGE * (name === "music" ? 1.1 : 1), ctx.currentTime, 0.05);
    }
  }

  // --- Voices ---------------------------------------------------------------------------------
  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function tone(to, { freq, type = "sine", t = ctx.currentTime, peak = 0.1, attack = 0.005, decay = 0.2, glide = null, pan = 0, detune = 0 }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + attack + decay);
    env(g, t, peak, attack, decay);
    let out = g;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    o.connect(g); out.connect(to);
    o.start(t); o.stop(t + attack + decay + 0.05);
  }
  function noise(to, { t = ctx.currentTime, peak = 0.1, attack = 0.005, decay = 0.1, type = "bandpass", freq = 1000, q = 1, sweep = null, pan = 0, buffer = white }) {
    const s = ctx.createBufferSource(), f = filter(type, freq, q), g = ctx.createGain();
    s.buffer = buffer;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + attack + decay);
    env(g, t, peak, attack, decay);
    let out = g;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    s.connect(f).connect(g); out.connect(to);
    s.start(t, Math.random() * (buffer.duration - 0.5)); s.stop(t + attack + decay + 0.05);
  }

  // --- Music ---------------------------------------------------------------------------------------
  /** Fade a deck out, then release its element and nodes. */
  function retire(deck, fade = CROSSFADE) {
    deck.retired = true;
    deck.gain.gain.cancelScheduledValues(ctx.currentTime);
    deck.gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
    setTimeout(() => { deck.el.pause(); deck.el.removeAttribute("src"); deck.el.load(); deck.node.disconnect(); deck.gain.disconnect(); }, fade * 1000 + 500);
  }

  /** Start the next track of a playlist, crossfading from whatever plays now. */
  function startTrack(key) {
    const list = PLAYLISTS[key], i = music.next[key] ?? 0;
    music.next[key] = (i + 1) % list.length;
    if (music.deck) retire(music.deck);
    const el = new Audio(MUSIC_DIR + list[i]);
    el.loop = list.length === 1;
    el.preload = "auto";
    const deck = { key, el, gain: gain(0, bus.music), node: ctx.createMediaElementSource(el), retired: false };
    deck.node.connect(deck.gain);
    deck.gain.gain.setTargetAtTime(TRACK_GAIN, ctx.currentTime + 0.05, CROSSFADE / 3);
    // Roll into the playlist's next track shortly before this one ends.
    el.addEventListener("timeupdate", () => {
      if (!deck.retired && !el.loop && el.duration - el.currentTime < CROSSFADE && music.deck === deck) startTrack(key);
    });
    el.addEventListener("ended", () => { if (!deck.retired && music.deck === deck) startTrack(key); });
    el.play().catch(err => console.warn("music could not start:", err.message));
    music.deck = deck;
  }

  function updateMusic(key) {
    if (music.key === key) return;
    music.key = key;
    startTrack(key);
  }

  // --- Nature ---------------------------------------------------------------------------------------
  function bird(t) {
    const pan = rand(-0.8, 0.8), kind = Math.floor(Math.random() * 3);
    if (kind === 0) for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) { const f = rand(3000, 4200); tone(bus.ambience, { freq: f, glide: f * 1.25, t: t + i * 0.11, peak: 0.03, decay: 0.07, pan }); }
    else if (kind === 1) for (let i = 0; i < 8; i++) tone(bus.ambience, { freq: 4600 - i * 60, glide: 4100 - i * 60, t: t + i * 0.035, peak: 0.018, decay: 0.028, pan });
    else { tone(bus.ambience, { freq: 2200, glide: 2900, t, peak: 0.03, attack: 0.03, decay: 0.24, pan }); tone(bus.ambience, { freq: 2600, glide: 2000, t: t + 0.32, peak: 0.025, attack: 0.03, decay: 0.3, pan }); }
  }
  function cricket(t) {
    const pan = rand(-0.9, 0.9), f = rand(4200, 4800);
    for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) tone(bus.ambience, { freq: f, t: t + i * 0.055, peak: 0.012, decay: 0.035, pan });
  }
  function gull(t) {
    const pan = rand(-0.7, 0.7);
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = filter("bandpass", 1300, 3), p = ctx.createStereoPanner();
      const s = t + i * 0.42;
      o.type = "sawtooth"; o.frequency.setValueAtTime(1500, s); o.frequency.exponentialRampToValueAtTime(880, s + 0.34);
      env(g, s, 0.035, 0.04, 0.3);
      p.pan.value = pan;
      o.connect(f).connect(g).connect(p).connect(bus.ambience);
      o.start(s); o.stop(s + 0.4);
    }
  }
  function owl(t) {
    const out = filter("lowpass", 700, 0.7, bus.ambience);
    tone(out, { freq: 380, glide: 330, t, peak: 0.06, attack: 0.06, decay: 0.35 });
    tone(out, { freq: 360, glide: 320, t: t + 0.55, peak: 0.05, attack: 0.06, decay: 0.5 });
  }

  // --- Sound effects -----------------------------------------------------------------------------------
  const S = () => bus.sfx;
  const SFX = {
    step(surface) {
      const t = ctx.currentTime, v = rand(0.85, 1.15);
      // Audible on small speakers: energy sits in the 250 Hz – 3 kHz range, soft attack, no harsh highs.
      const knock = (freq, peak) => tone(S(), { freq: freq * v, glide: freq * 0.7, type: "triangle", t, peak, attack: 0.006, decay: 0.06 });
      const brush = (freq, q, peak, decay) => noise(S(), { t, peak, type: "bandpass", freq: freq * v, q, attack: 0.012, decay });
      if (surface === "wood") { knock(320, 0.07); brush(1300, 1.2, 0.02, 0.04); }
      else if (surface === "path") { brush(1900, 1.1, 0.1, 0.05); brush(2900, 2, 0.035, 0.03); knock(240, 0.035); }
      else if (surface === "sand") { brush(1200, 0.7, 0.11, 0.1); knock(200, 0.02); }
      else { brush(1500, 0.9, 0.09, 0.07); knock(220, 0.03); }
    },
    cast() { const t = ctx.currentTime; noise(S(), { t, peak: 0.12, freq: 500, sweep: 2600, q: 1.2, attack: 0.08, decay: 0.3 }); },
    plop() { const t = ctx.currentTime; tone(S(), { freq: 700, glide: 170, t, peak: 0.16, decay: 0.12 }); noise(S(), { t, peak: 0.06, type: "lowpass", freq: 900, decay: 0.2 }); },
    bite() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) tone(S(), { freq: 520 - i * 60, glide: 220, t: t + i * 0.09, peak: 0.14, decay: 0.08 }); tone(S(), { freq: 1320, t, peak: 0.05, decay: 0.12, type: "square" }); },
    hook(perfect) { const t = ctx.currentTime; noise(S(), { t, peak: 0.1, type: "highpass", freq: 2500, sweep: 6000, decay: 0.1 }); tone(S(), { freq: perfect ? 988 : 740, t: t + 0.05, peak: 0.08, decay: 0.15, type: "triangle" }); },
    reelTick() { noise(S(), { peak: 0.035, type: "highpass", freq: 4200, decay: 0.012 }); },
    creak() { tone(S(), { freq: 95, glide: 80, type: "sawtooth", peak: 0.025, attack: 0.05, decay: 0.25 }); },
    splash() { const t = ctx.currentTime; noise(S(), { t, peak: 0.16, type: "lowpass", freq: 2200, sweep: 500, decay: 0.5 }); },
    catch() { const t = ctx.currentTime; SFX.splash(); [72, 76, 79, 84].forEach((n, i) => tone(S(), { freq: midi(n), type: "triangle", t: t + 0.12 + i * 0.09, peak: 0.09, decay: 0.35 })); },
    discover() { const t = ctx.currentTime; [79, 83, 86, 91, 95].forEach((n, i) => tone(S(), { freq: midi(n), t: t + 0.55 + i * 0.07, peak: 0.05, decay: 0.5 })); },
    record() { const t = ctx.currentTime; [67, 72, 76, 79].forEach((n, i) => tone(S(), { freq: midi(n), type: "square", t: t + 0.5 + i * 0.1, peak: 0.03, decay: 0.3 })); },
    lose() { const t = ctx.currentTime; tone(S(), { freq: midi(64), type: "triangle", t, peak: 0.08, decay: 0.3 }); tone(S(), { freq: midi(59), type: "triangle", t: t + 0.22, peak: 0.08, decay: 0.5 }); },
    snap() { const t = ctx.currentTime; noise(S(), { t, peak: 0.25, type: "highpass", freq: 3000, decay: 0.05 }); tone(S(), { freq: 240, glide: 60, t, peak: 0.12, decay: 0.25, type: "sawtooth" }); SFX.lose(); },
    coin() { const t = ctx.currentTime; tone(S(), { freq: 1568, t, peak: 0.08, decay: 0.12 }); tone(S(), { freq: 2093, t: t + 0.07, peak: 0.08, decay: 0.3 }); tone(S(), { freq: 4186, t: t + 0.07, peak: 0.015, decay: 0.3 }); },
    buy() { SFX.coin(); const t = ctx.currentTime; [60, 64, 67, 72].forEach(n => tone(S(), { freq: midi(n), type: "triangle", t: t + 0.18, peak: 0.04, attack: 0.02, decay: 0.8 })); },
    unlock() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) { tone(S(), { freq: 180, glide: 120, t: t + i * 0.18, peak: 0.18, decay: 0.07 }); noise(S(), { t: t + i * 0.18, peak: 0.08, freq: 1800, decay: 0.04 }); } [72, 76, 79, 84, 88].forEach((n, i) => tone(S(), { freq: midi(n), type: "triangle", t: t + 0.6 + i * 0.08, peak: 0.07, decay: 0.45 })); },
    levelup() { const t = ctx.currentTime; [60, 64, 67, 72, 76, 79].forEach((n, i) => tone(S(), { freq: midi(n), type: "triangle", t: t + i * 0.08, peak: 0.07, attack: 0.01, decay: 0.5 })); [84, 88].forEach((n, i) => tone(S(), { freq: midi(n), t: t + 0.52 + i * 0.1, peak: 0.04, decay: 0.9 })); },
    secondwind() { const t = ctx.currentTime; noise(S(), { t, peak: 0.1, freq: 400, sweep: 2400, q: 1, attack: 0.1, decay: 0.35 }); [67, 71, 74].forEach((n, i) => tone(S(), { freq: midi(n), type: "triangle", t: t + 0.12 + i * 0.07, peak: 0.07, decay: 0.35 })); },
    ui() { tone(S(), { freq: 880, peak: 0.04, decay: 0.04 }); },
    legendbite() { const t = ctx.currentTime; SFX.bite(); tone(S(), { freq: 55, glide: 41, type: "sawtooth", t, peak: 0.12, attack: 0.05, decay: 1.1 }); [83, 88, 95].forEach((n, i) => tone(S(), { freq: midi(n), t: t + 0.2 + i * 0.09, peak: 0.035, decay: 0.6 })); },
    legendcatch() { const t = ctx.currentTime; SFX.catch(); [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(S(), { freq: midi(n), type: "square", t: t + 0.55 + i * 0.09, peak: 0.028, decay: 0.45 })); [48, 55, 60].forEach(n => tone(S(), { freq: midi(n), type: "triangle", t: t + 1.2, peak: 0.07, attack: 0.05, decay: 1.6 })); },
    ink() { const t = ctx.currentTime; noise(S(), { t, peak: 0.12, type: "lowpass", freq: 900, sweep: 200, attack: 0.02, decay: 0.45, buffer: brown }); tone(S(), { freq: 180, glide: 90, t, peak: 0.05, decay: 0.3 }); },
    grab() { const t = ctx.currentTime; tone(S(), { freq: 140, glide: 220, type: "triangle", t, peak: 0.09, attack: 0.03, decay: 0.35 }); noise(S(), { t: t + 0.05, peak: 0.05, freq: 500, q: 3, decay: 0.25 }); },
    glow() { const t = ctx.currentTime; [76, 83].forEach((n, i) => tone(S(), { freq: midi(n), t: t + i * 0.08, peak: 0.04, attack: 0.04, decay: 0.5 })); },
    charge() { const t = ctx.currentTime; noise(S(), { t, peak: 0.05, freq: 3000, q: 6, attack: 0.3, decay: 0.6 }); tone(S(), { freq: 220, glide: 660, type: "square", t, peak: 0.02, attack: 0.4, decay: 0.5 }); },
    jolt() { const t = ctx.currentTime; noise(S(), { t, peak: 0.16, freq: 2400, q: 0.8, decay: 0.25 }); tone(S(), { freq: 110, type: "square", t, peak: 0.06, decay: 0.25 }); },
    rage() { const t = ctx.currentTime; noise(S(), { t, peak: 0.14, type: "lowpass", freq: 300, sweep: 1400, attack: 0.05, decay: 0.5, buffer: brown }); tone(S(), { freq: 90, glide: 60, type: "sawtooth", t, peak: 0.1, decay: 0.6 }); },
    door() { const t = ctx.currentTime; tone(S(), { freq: 150, glide: 110, type: "sawtooth", t, peak: 0.03, attack: 0.08, decay: 0.35 }); tone(S(), { freq: 210, type: "triangle", t: t + 0.42, peak: 0.12, decay: 0.08 }); noise(S(), { t: t + 0.42, peak: 0.06, type: "lowpass", freq: 700, decay: 0.08 }); },
    crackle() { noise(S(), { peak: rand(0.01, 0.035), type: "bandpass", freq: rand(1800, 4200), q: 2, decay: rand(0.01, 0.03) }); },
    open() { tone(S(), { freq: 520, glide: 820, peak: 0.05, attack: 0.01, decay: 0.08 }); },
    denied() { const t = ctx.currentTime; tone(S(), { freq: 220, t, peak: 0.06, decay: 0.12, type: "triangle" }); tone(S(), { freq: 196, t: t + 0.12, peak: 0.06, decay: 0.18, type: "triangle" }); },
    thunder() {
      const t = ctx.currentTime + rand(0.4, 1.6); // light travels faster than sound
      noise(S(), { t, peak: 0.32, type: "lowpass", freq: 420, sweep: 70, attack: 0.08, decay: 2.8, buffer: brown });
      noise(S(), { t, peak: 0.07, type: "bandpass", freq: 900, sweep: 180, attack: 0.02, decay: 0.7 });
    },
    boat() { const t = ctx.currentTime; noise(S(), { t, peak: 0.18, type: "lowpass", freq: 400, sweep: 1500, attack: 0.4, decay: 1.4, buffer: brown }); tone(S(), { freq: 110, glide: 85, type: "sawtooth", t: t + 0.2, peak: 0.02, attack: 0.1, decay: 0.5 }); },
  };

  return {
    init,
    get state() { return ctx ? ctx.state : "not started"; },
    /** Output RMS level (0..1), used by automated checks. */
    level() {
      if (!meterNode) return 0;
      const d = new Float32Array(meterNode.fftSize);
      meterNode.getFloatTimeDomainData(d);
      return Math.sqrt(d.reduce((a, v) => a + v * v, 0) / d.length);
    },
    get prefs() { return { ...prefs }; },
    /** Currently playing music file (for automated checks). */
    get track() { return music.deck ? music.deck.el.src.split("/").pop() : null; },
    setPref(name, value) { prefs[name] = value; savePrefs(prefs); applyVolumes(); },
    play(name, ...args) {
      if (!ctx || ctx.state !== "running" || prefs.muted || !prefs.sfx) return;
      try { SFX[name]?.(...args); } catch (err) { console.warn("sfx failed", name, err); }
    },
    /**
     * Per-frame update. env: { menu, bucket, weather, area, x, z, fightHeld, tension (0..1) }
     */
    update(env) {
      if (!ctx || ctx.state !== "running") return;
      const now = ctx.currentTime;
      updateMusic(env.menu ? "menu" : env.bucket);
      // Ambience mix from surroundings
      const offshore = env.area === "offshore", indoors = env.area === "home";
      const seaNear = offshore ? 1 : indoors ? 0 : clamp01((env.z - 3) / 13);
      const riverNear = offshore || indoors ? 0 : clamp01(1 - Math.max(0, 13.5 - env.x) / 11) * (env.z < 14 ? 1 : 0.3);
      const swell = 0.55 + 0.45 * Math.sin((now * Math.PI * 2) / 6.5);
      amb.wave.gain.setTargetAtTime((indoors ? 0 : 0.012 + seaNear * 0.1) * swell, now, 0.25);
      amb.waveFilter.frequency.setTargetAtTime(offshore ? 380 : 560, now, 1);
      const wash = Math.max(0, Math.sin((now * Math.PI * 2) / 6.5 - 0.6));
      amb.wash.gain.setTargetAtTime((offshore ? 0.012 : seaNear * 0.025) * wash * wash, now, 0.2);
      amb.river.gain.setTargetAtTime(riverNear * 0.045, now, 0.4);
      const storm = env.weather === "storm", wet = storm || env.weather === "rain";
      amb.wind.gain.setTargetAtTime(((offshore ? 0.1 : indoors ? 0.004 : 0.03) + (storm && !indoors ? 0.09 : 0)) * (0.7 + 0.3 * Math.sin(now * 0.37)), now, 1);
      amb.rain.gain.setTargetAtTime(wet ? (storm ? 0.07 : 0.04) * (indoors ? 0.3 : 1) : 0, now, 2.5);
      if (prefs.muted || !prefs.ambience) return;
      if (indoors) {
        // Muffled indoors: only the fire crackles.
        if (now > timers.crackle) { this.play("crackle"); timers.crackle = now + rand(0.05, 0.5); }
        if (env.fightHeld && now > timers.tick) { this.play("reelTick"); timers.tick = now + 0.07; }
        return;
      }
      const day = env.bucket === "day" || env.bucket === "dawn";
      const night = env.bucket === "night";
      if (!offshore && env.bucket !== "night" && now > timers.bird && !(wet && Math.random() < 0.8)) { bird(now + 0.05); timers.bird = now + (day ? rand(0.6, 3) : rand(3, 8)); }
      if (!offshore && (night || env.bucket === "dusk") && now > timers.cricket) { cricket(now + 0.05); timers.cricket = now + (night ? rand(0.5, 1.4) : rand(2, 5)); }
      if (night && !offshore && now > timers.owl) { if (timers.owl) owl(now + 0.1); timers.owl = now + rand(14, 30); }
      if ((offshore || seaNear > 0.3) && !night && !storm && now > timers.gull) { if (timers.gull) gull(now + 0.1); timers.gull = now + rand(6, 16); }
      // Reel ratchet + line creak while fighting
      if (env.fightHeld && now > timers.tick) { this.play("reelTick"); timers.tick = now + 0.07; }
      if (env.tension > 0.78 && now > timers.creak) { this.play("creak"); timers.creak = now + rand(0.3, 0.6); }
    },
  };
}
