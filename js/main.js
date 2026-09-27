// Entry point: wires plain game state, input, UI, rendering, persistence into one rAF loop.
import * as content from "./game/content.js";
import { createRng } from "./game/rng.js";
import { createState, serialize, deserialize } from "./game/state.js";
import { advanceTime, timeBucket, bucketProgress } from "./game/time.js";
import { PLAYER_SPEED, isWalkable, nearestInteraction, regionName, TRAVEL } from "./game/world.js";
import * as fishing from "./game/fishing.js";
import * as economy from "./game/economy.js";
import { createInput } from "./input/input.js";
import { createUI } from "./ui/ui.js";
import { createRenderer } from "./render/scene.js";
import { loadSave, writeSave, deleteSave } from "./persistence/save.js";

const canvas = document.getElementById("world");
const params = new URLSearchParams(location.search);

let state = createState();
let rng = createRng(state.rngSeed);
const game = {
  session: null, // active fishing session (plain data)
  sessionResult: null,
  moveTarget: null,
  walking: false,
  travelling: false,
  elapsed: 0,
  saveTimer: 0,
};

// --- Persistence -----------------------------------------------------------
let saveQueued = null;
function saveNow() {
  clearTimeout(saveQueued);
  saveQueued = null;
  return writeSave(serialize(state, rng)).catch(err => console.warn("Save failed:", err));
}
function saveSoon() {
  clearTimeout(saveQueued);
  saveQueued = setTimeout(saveNow, 300);
}

// --- Audio (tiny Web Audio cues; optional) ---------------------------------
let audio = null;
function beep(freq, ms = 120, type = "sine", gain = 0.08) {
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000);
    o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + ms / 1000);
  } catch { /* audio is optional */ }
}

// --- UI handlers ------------------------------------------------------------
const ui = createUI({
  onAction: () => input.queueInteract(),
  onDialogClosed: () => canvas.focus?.(),
  sellOne(uid) {
    const v = economy.sellOne(state, uid);
    if (v) { ui.toast(`Sold for ${v} coins`); beep(880, 80); afterChange(); }
  },
  sellAll() {
    const v = economy.sellAll(state);
    if (v) { ui.toast(`Sold everything for ${v} coins`); beep(990, 120); afterChange(); }
  },
  buyGear(slot) {
    if (economy.buyGear(state, slot)) {
      ui.toast(`Equipped ${content.GEAR[slot][state.gear[slot]].name}`);
      beep(660, 150, "triangle"); afterChange();
    }
  },
  buyTackle(id) {
    if (economy.buyTackle(state, id)) { ui.toast(`Equipped ${content.TACKLE_BY_ID[id].name}`); beep(660, 150, "triangle"); afterChange(); }
  },
  equipTackle(id) {
    if (economy.equipTackle(state, id)) { ui.toast(`Equipped ${content.TACKLE_BY_ID[id].name}`); afterChange(); }
  },
  buyBoat() {
    if (economy.buyBoat(state)) {
      ui.toast(state.unlocked.includes("sea") ? "You bought a boat! Head to the dock to sail offshore." : "You bought a boat! Clear the beach construction to reach the dock.");
      beep(523, 400, "triangle"); afterChange();
    }
  },
  unlockRegion(id) {
    if (economy.unlockRegion(state, id)) {
      ui.toast(`The ${content.REGIONS[id].name.toLowerCase()} is open!`);
      beep(523, 160, "triangle"); setTimeout(() => beep(784, 260, "triangle"), 160);
      renderer.setUnlocked(state.unlocked);
      afterChange();
    }
  },
});

function afterChange() {
  ui.refreshOpenPanels();
  renderer.setWallboard(state.discovered);
  saveSoon();
}

const input = createInput({
  canvas,
  joystick: document.getElementById("joystick"),
  knob: document.getElementById("joystick-knob"),
  reelPad: document.getElementById("fishing"),
});
const renderer = createRenderer(canvas);
addEventListener("resize", () => renderer.resize());

const markTouch = () => document.body.classList.add("touch");
if (matchMedia("(pointer: coarse)").matches || params.has("touch")) markTouch();
addEventListener("touchstart", markTouch, { once: true, passive: true });

addEventListener("keydown", e => {
  if (e.repeat || ui.anyDialogOpen() || game.session) return;
  if (e.code === "KeyI") ui.openBag();
  if (e.code === "KeyC") ui.openBoard();
});

// --- Interactions ------------------------------------------------------------
function travel(to) {
  game.travelling = true;
  ui.fade(true);
  setTimeout(() => {
    state.player.x = to.x; state.player.z = to.z; state.player.area = to.area;
    state.player.facing = to.area === "offshore" ? 0 : Math.PI;
    game.moveTarget = null;
    saveNow();
    setTimeout(() => { ui.fade(false); game.travelling = false; }, 250);
  }, 500);
}

function interact(it) {
  switch (it.type) {
    case "fish": startFishing(it); break;
    case "shop": ui.openShop(state); break;
    case "board": ui.openBoard(); break;
    case "dock":
      if (!state.boatOwned) ui.toast(`You need a boat — buy one at the shop (${content.BOAT_PRICE} coins).`);
      else travel(TRAVEL.toOffshore);
      break;
    case "return": travel(TRAVEL.toShore); break;
    case "barrier": ui.openUnlock(content.REGIONS[it.region], state); break;
  }
}

function actionLabelFor(it) {
  if (it.type === "dock" && !state.boatOwned) return { label: `Boat dock — boat ${content.BOAT_PRICE} coins at shop`, locked: true };
  if (it.type === "barrier") return { label: `${content.REGIONS[it.region].name} — clear for ${content.REGIONS[it.region].price} coins`, locked: state.coins < content.REGIONS[it.region].price };
  return { label: it.label, locked: false };
}

function startFishing(spot) {
  const stats = fishing.getStats(state);
  const bucket = timeBucket(state.timeMs);
  game.session = fishing.startCast(rng, spot.location, bucket, stats);
  game.session.spot = spot;
  game.moveTarget = null;
  state.player.x = spot.x; state.player.z = spot.z; state.player.facing = spot.facing;
  beep(420, 90);
}

function finishSession() {
  const s = game.session;
  if (s.outcome === "caught") {
    game.sessionResult = economy.addCatch(state, s.encounter);
    renderer.setWallboard(state.discovered);
    saveNow();
    beep(784, 120, "triangle"); setTimeout(() => beep(1046, 180, "triangle"), 120);
  } else {
    game.sessionResult = null;
    if (s.outcome === "broke") beep(160, 300, "sawtooth", 0.05);
  }
  if (s.outcome === "early") { ui.toast("Reeled in — nothing on the line yet."); game.session = null; return; }
  ui.showCatchResult(s, game.sessionResult);
}

function updateSession(actions, dtMs) {
  const s = game.session;
  const stats = fishing.getStats(state);
  if (ui.catchVisible()) {
    if (actions.interact || actions.taps.length) { ui.hideCatchResult(); game.session = null; }
    return;
  }
  const hookPress = actions.interact || (s.phase === "bite" && actions.taps.length > 0);
  if (hookPress && (s.phase === "bite" || actions.interact)) {
    const ev = fishing.pressAction(s, rng, stats);
    if (ev === "hooked") beep(s.hookQuality === "perfect" ? 988 : 740, 120, "triangle");
    if (ev === "early") { finishSession(); return; }
  }
  s.reelHeld = actions.reel && s.phase === "fight";
  const ev = fishing.updateFishing(s, dtMs, { reelHeld: s.reelHeld }, rng, stats);
  if (ev === "bite") { beep(1200, 90, "square", 0.05); navigator.vibrate?.(80); }
  if (s.phase === "done") finishSession();
}

const SLIDE_ANGLES = [0, 0.6, -0.6, 1.2, -1.2];

function updateMovement(actions, dt) {
  const p = state.player;
  let mx = 0, mz = 0;
  if (actions.move.x || actions.move.y) {
    const ax = renderer.screenAxes();
    mx = ax.right.x * actions.move.x + ax.up.x * actions.move.y;
    mz = ax.right.z * actions.move.x + ax.up.z * actions.move.y;
    game.moveTarget = null;
  } else if (game.moveTarget) {
    const dx = game.moveTarget.x - p.x, dz = game.moveTarget.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.2) game.moveTarget = null;
    else { mx = dx / d; mz = dz / d; }
  }
  const len = Math.hypot(mx, mz);
  game.walking = false;
  if (len < 0.01) return;
  const step = PLAYER_SPEED * Math.min(1, len) * dt;
  const ux = mx / len, uz = mz / len;
  const ox = p.x, oz = p.z;
  // Try the wanted direction, then deflected ones so the player slides around corners and edges.
  for (const a of SLIDE_ANGLES) {
    const c = Math.cos(a), s = Math.sin(a);
    const nx = ox + (ux * c - uz * s) * step, nz = oz + (ux * s + uz * c) * step;
    if (isWalkable(nx, nz, p.area, state.unlocked)) { p.x = nx; p.z = nz; break; }
  }
  if (p.x === ox && p.z === oz) { game.moveTarget = null; return; }
  p.facing = Math.atan2(mx, mz);
  game.walking = true;
}

// --- Main loop -------------------------------------------------------------
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  game.elapsed += dt;

  const actions = input.poll();
  const dialogOpen = ui.anyDialogOpen();
  advanceTime(state, dt * 1000);

  if (game.travelling || dialogOpen) {
    game.walking = false;
    ui.setAction(null);
  } else if (game.session) {
    game.walking = false;
    ui.setAction(null);
    updateSession(actions, dt * 1000);
  } else {
    const tap = actions.taps.find(t => !t.pad);
    if (tap) game.moveTarget = renderer.pickGround(tap.x, tap.y);
    updateMovement(actions, dt);
    const it = nearestInteraction(state.player, state.unlocked);
    if (it) {
      const { label, locked } = actionLabelFor(it);
      ui.setAction(label, locked);
      if (actions.interact) interact(it);
    } else ui.setAction(null);
  }

  const bucket = timeBucket(state.timeMs);
  ui.updateHud(state, bucket, bucketProgress(state.timeMs), regionName(state.player));
  ui.updateFishing(game.session);
  const result = ui.catchVisible() && game.session ? (game.session.outcome === "caught" ? "caught" : "lost") : null;
  renderer.render({ state, session: game.session, walking: game.walking, dt, elapsed: game.elapsed, result });

  game.saveTimer += dt;
  if (game.saveTimer > 15) { game.saveTimer = 0; saveSoon(); } // position/time checkpoint
}

addEventListener("pagehide", () => saveNow());
document.addEventListener("visibilitychange", () => { if (document.hidden) saveNow(); });

async function boot() {
  try {
    if (params.has("debug") && params.has("reset")) await deleteSave(); // test hook: start a fresh game
    const data = await loadSave();
    if (data) {
      state = deserialize(data);
      rng = createRng(state.rngSeed);
    }
  } catch (err) {
    console.warn("Could not load save, starting fresh:", err);
  }
  ui.bind(state);
  renderer.setWallboard(state.discovered);
  renderer.setUnlocked(state.unlocked);
  requestAnimationFrame(frame);

  // Test/debug hook, only with ?debug in the URL.
  if (params.has("debug")) {
    window.cozy = {
      get state() { return state; }, get game() { return game; }, get rng() { return rng; },
      content, fishing, economy, saveNow, deleteSave, camera: renderer.camera,
      renderInfo: () => ({ ...renderer.renderer.info.render, geometries: renderer.renderer.info.memory.geometries }),
      setTime(ms) { state.timeMs = ms; },
      teleport(x, z, area = "land") { Object.assign(state.player, { x, z, area }); },
    };
  }
}
boot();
