// Procedural audio (Web Audio API only, no files): generative cozy music, nature ambience that follows the
// player's surroundings and the time of day, and sound effects. Volumes are tiny preferences in localStorage.
const PREFS_KEY = "driftwood-cove-audio";
const DEFAULT_PREFS = { music: 0.45, sfx: 0.8, ambience: 0.7, muted: false };

const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[Math.floor(Math.random() * list.length)];
const clamp01 = v => Math.min(1, Math.max(0, v));

// Chord progressions (MIDI notes) and melody scales per time of day.
const MUSIC = {
  dawn: { chords: [[48, 52, 55, 59], [45, 52, 55, 60], [41, 48, 53, 57], [43, 50, 55, 59]], scale: [72, 74, 76, 79, 81, 84, 86], cutoff: 1300, density: 0.34 },
  day: { chords: [[53, 57, 60, 64], [50, 53, 57, 60], [46, 53, 57, 62], [48, 52, 55, 57]], scale: [65, 67, 69, 72, 74, 77, 79, 81], cutoff: 1700, density: 0.42 },
  dusk: { chords: [[46, 53, 57, 62], [45, 52, 55, 60], [43, 50, 53, 58], [48, 52, 55, 58]], scale: [65, 67, 70, 72, 74, 77, 79], cutoff: 1100, density: 0.3 },
  night: { chords: [[45, 52, 55, 60], [41, 48, 52, 57], [48, 52, 55, 59], [43, 50, 55, 59]], scale: [69, 72, 74, 76, 79, 81], cutoff: 750, density: 0.22 },
};
const BEAT = 60 / 72;

function loadPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") }; }
  catch { return { ...DEFAULT_PREFS }; }
}
function savePrefs(p) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* preferences are optional */ }
}

export function createAudio() {
  const prefs = loadPrefs();
  let ctx = null;
  const bus = {};
  let white, brown, reverb, padFilter;
  const amb = {};
  let meterNode = null;
  const music = { next: 0, step: 0, melody: 3 };
  const timers = { bird: 0, cricket: 0, gull: 0, owl: 0, tick: 0, creak: 0 };

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
    for (const [name, send] of [["music", 0.4], ["sfx", 0.12], ["ambience", 0.22]]) {
      bus[name] = gain(0, master);
      bus[name].connect(gain(send, reverb));
    }
    white = noiseBuffer(2, false);
    brown = noiseBuffer(4, true);
    padFilter = filter("lowpass", 1400, 0.4, gain(1, bus.music));

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
    applyVolumes();
  }

  function applyVolumes() {
    if (!ctx) return;
    for (const name of ["music", "sfx", "ambience"]) {
      bus[name].gain.setTargetAtTime(prefs.muted ? 0 : prefs[name] * (name === "music" ? 1.1 : 1), ctx.currentTime, 0.05);
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

  // --- Music --------------------------------------------------------------------------------------
  function scheduleMusic(bucket) {
    const now = ctx.currentTime;
    if (music.next < now - 0.5) music.next = now + 0.05;
    const style = MUSIC[bucket];
    padFilter.frequency.setTargetAtTime(style.cutoff, now, 2);
    while (music.next < now + 0.35) {
      const t = music.next, step = music.step; // 8th-note steps, 8 per bar
      const bar = Math.floor(step / 8), chord = style.chords[bar % 4];
      if (step % 8 === 0) {
        for (const n of chord) for (const d of [-7, 7]) tone(padFilter, { freq: midi(n), type: "triangle", t, peak: 0.022, attack: 0.9, decay: BEAT * 4.2, detune: d });
        tone(bus.music, { freq: midi(chord[0] - 12), t, peak: 0.13, attack: 0.02, decay: BEAT * 2.2 });
      }
      if (step % 8 === 4) tone(bus.music, { freq: midi(chord[0] - 5), t, peak: 0.07, attack: 0.02, decay: BEAT * 1.6 });
      // Plucked melody wandering over the scale; it rests every 4th bar.
      if (bar % 4 !== 3 && Math.random() < style.density) {
        music.melody = Math.max(0, Math.min(style.scale.length - 1, music.melody + pick([-2, -1, -1, 1, 1, 2, 0])));
        const f = midi(style.scale[music.melody]);
        tone(bus.music, { freq: f, t, peak: 0.055, decay: 0.9 });
        tone(bus.music, { freq: f * 2, type: "triangle", t, peak: 0.012, decay: 0.5 });
      }
      if (step % 32 === 28 && Math.random() < 0.6) tone(bus.music, { freq: midi(pick(style.scale) + 12), t, peak: 0.02, decay: 1.4 }); // music-box sparkle
      music.next += BEAT / 2;
      music.step++;
    }
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
      if (surface === "wood") { tone(S(), { freq: 150 * v, glide: 90, t, peak: 0.12, decay: 0.08 }); noise(S(), { t, peak: 0.05, freq: 1400, decay: 0.03 }); }
      else if (surface === "path") { noise(S(), { t, peak: 0.07, type: "highpass", freq: 2200 * v, decay: 0.05 }); noise(S(), { t: t + 0.025, peak: 0.04, freq: 3500, q: 2, decay: 0.03 }); }
      else if (surface === "sand") noise(S(), { t, peak: 0.08, type: "lowpass", freq: 1300 * v, decay: 0.09, attack: 0.015 });
      else noise(S(), { t, peak: 0.06, freq: 700 * v, q: 0.8, decay: 0.07, attack: 0.01 });
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
    ui() { tone(S(), { freq: 880, peak: 0.04, decay: 0.04 }); },
    open() { tone(S(), { freq: 520, glide: 820, peak: 0.05, attack: 0.01, decay: 0.08 }); },
    denied() { const t = ctx.currentTime; tone(S(), { freq: 220, t, peak: 0.06, decay: 0.12, type: "triangle" }); tone(S(), { freq: 196, t: t + 0.12, peak: 0.06, decay: 0.18, type: "triangle" }); },
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
    setPref(name, value) { prefs[name] = value; savePrefs(prefs); applyVolumes(); },
    play(name, ...args) {
      if (!ctx || ctx.state !== "running" || prefs.muted || !prefs.sfx) return;
      try { SFX[name]?.(...args); } catch (err) { console.warn("sfx failed", name, err); }
    },
    /**
     * Per-frame update. env: { bucket, area, x, z, fightHeld, tension (0..1), paused }
     */
    update(env) {
      if (!ctx || ctx.state !== "running") return;
      const now = ctx.currentTime;
      if (!prefs.muted && prefs.music > 0) scheduleMusic(env.bucket);
      else music.next = 0;
      // Ambience mix from surroundings
      const offshore = env.area === "offshore";
      const seaNear = offshore ? 1 : clamp01((env.z - 3) / 13);
      const riverNear = offshore ? 0 : clamp01(1 - Math.max(0, 13.5 - env.x) / 11) * (env.z < 14 ? 1 : 0.3);
      const swell = 0.55 + 0.45 * Math.sin((now * Math.PI * 2) / 6.5);
      amb.wave.gain.setTargetAtTime((0.05 + seaNear * 0.42) * swell, now, 0.25);
      amb.waveFilter.frequency.setTargetAtTime(offshore ? 380 : 560, now, 1);
      const wash = Math.max(0, Math.sin((now * Math.PI * 2) / 6.5 - 0.6));
      amb.wash.gain.setTargetAtTime((offshore ? 0.05 : seaNear * 0.09) * wash * wash, now, 0.2);
      amb.river.gain.setTargetAtTime(riverNear * 0.1, now, 0.4);
      amb.wind.gain.setTargetAtTime((offshore ? 0.4 : 0.12) * (0.7 + 0.3 * Math.sin(now * 0.37)), now, 1);
      if (prefs.muted || !prefs.ambience) return;
      const day = env.bucket === "day" || env.bucket === "dawn";
      const night = env.bucket === "night";
      if (!offshore && env.bucket !== "night" && now > timers.bird) { bird(now + 0.05); timers.bird = now + (day ? rand(0.6, 3) : rand(3, 8)); }
      if (!offshore && (night || env.bucket === "dusk") && now > timers.cricket) { cricket(now + 0.05); timers.cricket = now + (night ? rand(0.5, 1.4) : rand(2, 5)); }
      if (night && !offshore && now > timers.owl) { if (timers.owl) owl(now + 0.1); timers.owl = now + rand(14, 30); }
      if ((offshore || seaNear > 0.3) && !night && now > timers.gull) { if (timers.gull) gull(now + 0.1); timers.gull = now + rand(6, 16); }
      // Reel ratchet + line creak while fighting
      if (env.fightHeld && now > timers.tick) { this.play("reelTick"); timers.tick = now + 0.07; }
      if (env.tension > 0.78 && now > timers.creak) { this.play("creak"); timers.creak = now + rand(0.3, 0.6); }
    },
  };
}
