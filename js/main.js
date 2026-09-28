// Entry point: wires plain game state, input, UI, rendering, persistence into one rAF loop.
import * as content from "./game/content.js";
import { createRng } from "./game/rng.js";
import { createState, serialize, deserialize } from "./game/state.js";
import { advanceTime, timeBucket, bucketProgress } from "./game/time.js";
import { PLAYER_SPEED, isWalkable, nearestInteraction, regionName, surfaceAt, TRAVEL } from "./game/world.js";
import * as fishing from "./game/fishing.js";
import * as economy from "./game/economy.js";
import * as skills from "./game/skills.js";
import * as orders from "./game/orders.js";
import * as weather from "./game/weather.js";
import { doneMilestones, milestoneEffects, claimable, claimMilestone } from "./game/collection.js";
import { createInput } from "./input/input.js";
import { createUI } from "./ui/ui.js";
import { createRenderer } from "./render/scene.js";
import { loadSave, writeSave, deleteSave } from "./persistence/save.js";
import { createAudio } from "./audio/audio.js";
import { ICONS } from "./ui/icons.js";

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

// --- Audio: starts on the first user gesture (browser autoplay rules) ----------
const audio = createAudio();
for (const type of ["pointerdown", "keydown"]) addEventListener(type, () => audio.init(), { capture: true });

function buyBoat() {
  if (!economy.buyBoat(state)) return;
  ui.toast("The boat is yours! Hop aboard to sail offshore.");
  audio.play("buy");
  afterChange();
}

// --- UI handlers ------------------------------------------------------------
const ui = createUI({
  onAction: () => input.queueInteract(),
  // A closed dialog hands focus back to the button that opened it. The canvas is not
  // focusable, so drop that focus unless the player got there by tabbing (keyboard a11y).
  onDialogClosed: () => {
    const a = document.activeElement;
    if (a instanceof HTMLElement && a !== document.body && !a.closest("dialog[open]") && !a.matches(":focus-visible")) a.blur();
  },
  sellOne(uid) {
    const v = economy.sellOne(state, uid);
    if (v) { ui.toast(`Sold for ${v} coins`); audio.play("coin"); afterChange(); }
  },
  sellAll() {
    const v = economy.sellAll(state);
    if (v) { ui.toast(`Sold everything for ${v} coins`); audio.play("coin"); setTimeout(() => audio.play("coin"), 140); afterChange(); }
  },
  buyGear(slot) {
    if (economy.buyGear(state, slot)) {
      ui.toast(`Equipped ${content.GEAR[slot][state.gear[slot]].name}`);
      audio.play("buy"); afterChange();
    }
  },
  buyBag() {
    if (economy.buyBag(state)) { ui.toast(`${content.BAGS[state.bag].name}: ${economy.bagCapacity(state)} slots`); audio.play("buy"); afterChange(); }
  },
  claimMilestone(id) {
    if (!claimMilestone(state, id)) { audio.play("denied"); return; }
    const m = content.MILESTONES.find(x => x.id === id);
    ui.toast(`${m.name} claimed! ${m.reward}`);
    audio.play("levelup");
    renderer.setMilestones(milestoneEffects(state));
    saveNow();
    afterChange();
  },
  mountTrophy(uid, slot) {
    const fish = state.inventory.find(f => f.uid === uid);
    if (!fish || !economy.mountTrophy(state, uid, slot)) { audio.play("denied"); return; }
    ui.toast(`${content.FISH_BY_ID[fish.speciesId].name} is on the trophy shelf`);
    audio.play("record"); afterChange();
  },
  unmountTrophy(slot) {
    if (!economy.unmountTrophy(state, slot)) { ui.toast("Your bag is full — make room first"); audio.play("denied"); return; }
    ui.toast("Trophy back in your bag"); audio.play("ui"); afterChange();
  },
  handIn(id) {
    const order = state.orders?.list.find(o => o.id === id);
    const res = orders.handIn(state, id);
    if (!res) { audio.play("denied"); return; }
    ui.toast(`Order done: ${orders.orderText(order)} · +${res.coins} coins, +${res.xp} XP`);
    audio.play("coin"); setTimeout(() => audio.play("coin"), 140);
    if (res.levels > 0) announceLevelUp(res.levels);
    afterChange();
  },
  learnSkill(id) {
    if (!skills.learn(state, id)) { audio.play("denied"); return; }
    const s = content.SKILLS_BY_ID[id];
    ui.toast(`${s.name} ${skills.rankOf(state, id)} / ${s.max}`);
    audio.play("buy"); afterChange();
  },
  respec() {
    const cost = skills.respecCost(state);
    if (skills.respec(state)) { ui.toast(`Skills refunded for ${cost} coins — spend your points again (press K)`); audio.play("unlock"); afterChange(); }
  },
  getPrefs: () => audio.prefs,
  setPref: (name, value) => audio.setPref(name, value),
  onDialogOpened: () => audio.play("open"),
  onCatchContinue: closeCatchCard,
  onCatchChoice: chooseFirstCatch,
});

/** Golden first-catch card: mount the new species on the wallboard or keep it to sell. */
function chooseFirstCatch(choice) {
  const s = game.session;
  if (!s || !ui.catchIsChoice() || !ui.catchReady()) return;
  if (choice === "bag" && !ui.bagChoiceAvailable()) return;
  const res = economy.placeNewSpecies(state, s.encounter, choice);
  if (!res) return;
  const name = content.FISH_BY_ID[s.encounter.speciesId].name;
  if (choice === "wall") {
    ui.toast(`${name} mounted on the collection board at home (${state.discovered.length} / ${content.FISH.length})`);
    audio.play("discover");
  } else {
    ui.toast(`${name} is in your bag — mount a later catch to fill its wallboard slot`);
    audio.play("coin");
  }
  renderer.setWallboard(state.discovered);
  saveNow();
  ui.hideCatchResult();
  game.session = null;
}

function closeCatchCard() {
  if (!ui.catchVisible() || !ui.catchReady() || ui.catchIsChoice()) return;
  ui.hideCatchResult();
  game.session = null;
  audio.play("ui");
}

function unlockRegion(id) {
  if (!economy.unlockRegion(state, id)) return;
  ui.toast(`The ${content.REGIONS[id].name.toLowerCase()} is open!`);
  audio.play("unlock");
  renderer.setUnlocked(state.unlocked);
  afterChange();
}

/** Toast newly reached collection milestones and update their rewards in the world. */
function checkMilestones() {
  if (game.milestoneKey === state.discovered.length) return;
  const done = doneMilestones(state).map(m => m.id);
  if (game.milestoneKey !== undefined) {
    for (const m of doneMilestones(state)) if (!game.milestonesDone.includes(m.id)) {
      setTimeout(() => { ui.toast(`Milestone reached: ${m.name}! Claim it at the collection board at home.`); audio.play("record"); }, 1200);
    }
  }
  game.milestoneKey = state.discovered.length;
  game.milestonesDone = done;
  renderer.setMilestones(milestoneEffects(state));
  renderer.setWallboard(state.discovered);
  ui.refreshOpenPanels();
}

function afterChange() {
  ui.refreshOpenPanels();
  renderer.setWallboard(state.discovered);
  renderer.setTrophies(state.trophies);
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
addEventListener("pointerdown", () => { screen.orientation?.lock?.("landscape").catch(() => {}); }, { once: true });
if (matchMedia("(pointer: coarse)").matches || params.has("touch")) markTouch();
addEventListener("touchstart", markTouch, { once: true, passive: true });

// --- Title screen: the world waits behind it; its music starts with the first key/click (autoplay rules).
const title = {
  el: document.getElementById("title-screen"),
  press: document.getElementById("title-press"),
  menu: document.getElementById("title-menu"),
  play: document.getElementById("title-play"),
  shownAt: 0,
};
title.el.querySelectorAll("[data-icon]").forEach(n => { n.innerHTML = ICONS[n.dataset.icon]; });
game.menu = !params.has("debug") || params.has("title"); // automated tests start in the world unless ?title
function showTitleMenu() {
  if (!title.menu.hidden) return;
  title.press.hidden = true;
  title.menu.hidden = false;
  title.shownAt = performance.now();
  audio.play("open");
}
function startGame() {
  if (!game.menu || performance.now() - title.shownAt < 350) return; // the revealing click can't also press Play
  game.menu = false;
  input.cancelInteract();
  document.body.classList.remove("at-title");
  title.el.classList.add("leaving");
  setTimeout(() => { title.el.hidden = true; }, 650);
  canvas.focus?.();
}
title.el.addEventListener("pointerdown", () => { if (!ui.anyDialogOpen()) showTitleMenu(); });
title.play.addEventListener("click", startGame);
document.getElementById("title-settings").addEventListener("click", () => ui.openSettings());
addEventListener("keydown", e => {
  if (!game.menu || ui.anyDialogOpen()) return; // the settings dialog handles its own keys
  e.stopImmediatePropagation();
  if (title.menu.hidden) { e.preventDefault(); showTitleMenu(); return; }
  if (["KeyE", "Enter", "Space"].includes(e.code) && !e.repeat && document.activeElement?.id !== "title-settings") { e.preventDefault(); startGame(); }
}, { capture: true });

addEventListener("keydown", e => {
  const consume = () => { e.stopImmediatePropagation(); e.preventDefault(); input.cancelInteract(); };
  if (e.code === "KeyE" && !e.repeat && (ui.catchVisible() || ui.anyDialogOpen())) {
    if (ui.catchIsChoice()) chooseFirstCatch("wall");
    else if (ui.catchVisible()) closeCatchCard();
    else ui.dialogPrimary();
    consume();
    return;
  }
  if (e.code === "KeyB" && !e.repeat && ui.catchIsChoice()) { chooseFirstCatch("bag"); consume(); return; }
  if (e.code === "Escape" && ui.catchVisible()) { closeCatchCard(); return; }
}, { capture: true });

addEventListener("keydown", e => {
  if (e.repeat || ui.anyDialogOpen() || game.session) return;
  if (e.code === "KeyI") ui.openBag();
  if (e.code === "KeyK") ui.openSkills();
});

// Cheat: Ctrl+Alt+G adds coins (also AltGr+G on German keyboards).
addEventListener("keydown", e => {
  if (e.code !== "KeyG" || !e.ctrlKey || !e.altKey || e.repeat || game.menu) return;
  e.preventDefault();
  state.coins += content.CHEAT_COINS;
  ui.toast(`Cheat: +${content.CHEAT_COINS} coins`);
  audio.play("coin");
  afterChange();
});

// --- Weather -----------------------------------------------------------------
const weatherNow = () => game.forcedWeather ?? weather.currentWeather(state);
const WEATHER_NEWS = {
  clear: "The skies clear up.",
  rain: "Rain is falling — fish bite faster, and tench are about!",
  fog: "Fog rolls in — rare fish rise, grayling and moonfish too.",
  storm: "A storm! Wild fights, rare fish — garfish and great whites hunt.",
};
function announceWeather(wx) { ui.toast(WEATHER_NEWS[wx]); }

// --- Interactions ------------------------------------------------------------
function travel(to) {
  game.travelling = true;
  audio.play(to.area === "home" || state.player.area === "home" ? "door" : "boat");
  ui.fade(true);
  setTimeout(() => {
    state.player.x = to.x; state.player.z = to.z; state.player.area = to.area;
    state.player.facing = to.facing ?? (to.area === "offshore" ? 0 : Math.PI);
    game.moveTarget = null;
    saveNow();
    setTimeout(() => { ui.fade(false); game.travelling = false; }, 250);
  }, 500);
}

function interact(it) {
  switch (it.type) {
    case "fish":
      if (fishing.locationOpen(state, it.location)) startFishing(it);
      else ui.toast(content.LOCATION_GATES[it.location].hint);
      break;
    case "shop": ui.openShop(state); break;
    case "board": ui.openBoard(); break;
    case "trophies": ui.openTrophies(); break;
    case "quests": orders.ensureOrders(state); ui.openOrders(); break;
    case "enter": travel(TRAVEL.toHome); break;
    case "exit": travel(TRAVEL.fromHome); break;
    case "dock":
      if (state.boatOwned) travel(TRAVEL.toOffshore);
      else ui.openPurchase(state, {
        title: "Small Fishing Boat", art: "boat", price: content.BOAT_PRICE, confirmLabel: "Buy the boat", onConfirm: buyBoat,
        text: "A sturdy little sailboat, moored and ready. Own it for good and sail offshore for tuna, marlin and sharks.",
      });
      break;
    case "return": travel(TRAVEL.toShore); break;
    case "barrier": {
      const region = content.REGIONS[it.region];
      const needs = region.requires && !economy.regionAvailable(state, region.id) ? content.REGIONS[region.requires] : null;
      ui.openPurchase(state, {
        blocked: needs ? `Clear the ${needs.name.toLowerCase()} first!` : null,
        title: region.name, art: "barrier", price: region.price, confirmLabel: "Pay the builders", onConfirm: () => unlockRegion(region.id),
        text: region.sign + ". The builders will clear the barricades for good once they're paid.",
      });
      break;
    }
  }
}

function actionLabelFor(it) {
  if (it.type === "dock" && !state.boatOwned) return { label: `Buy the boat — ${content.BOAT_PRICE} coins`, locked: state.coins < content.BOAT_PRICE };
  if (it.type === "barrier" && !economy.regionAvailable(state, it.region)) {
    return { label: `${content.REGIONS[it.region].name} — clear the ${content.REGIONS[content.REGIONS[it.region].requires].name.toLowerCase()} first`, locked: true };
  }
  if (it.type === "barrier") return { label: `${content.REGIONS[it.region].name} — clear for ${content.REGIONS[it.region].price} coins`, locked: state.coins < content.REGIONS[it.region].price };
  if ((it.type === "board" || it.type === "enter") && claimable(state).length) return { label: `${it.label} · rewards to claim`, locked: false };
  if (it.type === "fish" && !fishing.locationOpen(state, it.location)) return { label: `${it.label} — needs a ${content.GEAR.line[content.LOCATION_GATES[it.location].gear.line].name}`, locked: true };
  return { label: it.label, locked: false };
}

function startFishing(spot) {
  if (economy.bagFull(state)) ui.toast(`Bag full (${state.inventory.length}/${economy.bagCapacity(state)}) — only new species can be kept. Sell at the shop!`);
  const bucket = timeBucket(state.timeMs);
  const wx = weatherNow();
  const stats = fishing.getStats(state, bucket, wx);
  const hunt = fishing.huntAt(state, spot.location, bucket, bucketProgress(state.timeMs));
  game.session = fishing.startCast(rng, spot.location, bucket, stats, hunt);
  game.session.spot = spot;
  game.session.weather = wx;
  game.moveTarget = null;
  state.player.x = spot.x; state.player.z = spot.z; state.player.facing = spot.facing;
  audio.play("cast");
}

/** XP for a landed fish; level-ups earn a skill point each. */
function awardCatchXp(s) {
  const species = content.FISH_BY_ID[s.encounter.speciesId];
  const xp = skills.catchXp(species, s.encounter.rarity, s.encounter.sizeCm, {
    first: economy.isFirstCatch(state, s.encounter), perfect: s.hookQuality === "perfect", mult: fishing.getStats(state, s.bucket).xpMult,
  });
  const levels = skills.addXp(state, xp);
  if (levels > 0) announceLevelUp(levels);
  return xp;
}

function announceLevelUp(levels) {
  const level = skills.levelOf(state.xp);
  setTimeout(() => {
    ui.toast(`Level ${level}! +${levels} skill point${levels > 1 ? "s" : ""} (press K)`);
    ui.levelUp();
    audio.play("levelup");
  }, 650);
}

function finishSession() {
  const s = game.session;
  let xp = 0;
  const lost = economy.updateStreak(state, s.outcome, s.encounter);
  if (lost) saveSoon();
  if (lost >= 2) setTimeout(() => ui.toast(`Streak of ${lost} lost`), 400);
  if (s.outcome === "caught") {
    xp = awardCatchXp(s);
    orders.recordCatch(state, s.encounter, s.location, s.bucket);
    saveSoon();
    audio.play(content.FISH_BY_ID[s.encounter.speciesId].legendary ? "legendcatch" : "catch");
    if (economy.isNewSpecies(state, s.encounter)) {
      game.sessionResult = { newSpecies: true };
      audio.play("discover");
    } else {
      game.sessionResult = economy.addCatch(state, s.encounter);
      saveNow();
      if (game.sessionResult.newRecord) audio.play("record");
    }
  } else {
    game.sessionResult = null;
    if (s.outcome === "broke") audio.play("snap");
    else if (s.outcome !== "early") audio.play("lose");
  }
  if (s.outcome === "early") { ui.toast("Reeled in — nothing on the line yet."); game.session = null; return; }
  ui.showCatchResult(s, game.sessionResult, xp);
}

function updateSession(actions, dtMs) {
  const s = game.session;
  const stats = fishing.getStats(state, s.bucket, s.weather);
  if (ui.catchVisible()) return; // closed only by its Continue button or Esc
  const reelIn = actions.interact && (s.phase === "cast" || s.phase === "wait");
  const hook = actions.hook && s.phase === "bite";
  if (reelIn || hook) {
    const ev = fishing.pressAction(s, rng, stats);
    if (ev === "hooked") audio.play("hook", s.hookQuality === "perfect");
    if (ev === "early") { finishSession(); return; }
  }
  s.reelHeld = actions.reel && s.phase === "fight";
  const before = s.phase;
  const ev = fishing.updateFishing(s, dtMs, { reelHeld: s.reelHeld }, rng, stats);
  if (before === "cast" && s.phase === "wait") audio.play("plop");
  if (ev === "secondwind") { audio.play("secondwind"); ui.toast("Second wind! The line holds."); }
  if (ev === "rage") audio.play("rage");
  if (["ink", "grab", "glow", "charge", "jolt"].includes(ev)) audio.play(ev);
  if (ev === "bite") {
    audio.play(content.FISH_BY_ID[s.encounter.speciesId].legendary ? "legendbite" : "bite");
    if (document.body.classList.contains("touch") && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(80);
  }
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
  const dialogOpen = ui.anyDialogOpen() || game.menu;
  if (!game.menu) advanceTime(state, dt * 1000); // time waits on the title screen
  if (orders.ensureOrders(state)) { ui.refreshOpenPanels(); if (game.ordersSeen) ui.toast("New orders on the village notice board"); saveSoon(); }
  game.ordersSeen = true;
  checkMilestones();

  const bucket = timeBucket(state.timeMs);
  const wx = weatherNow();
  if (game.weather !== wx) {
    if (game.weather && state.player.area !== "home") announceWeather(wx);
    game.weather = wx;
  }
  let finder = null, finderHunt = null;
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
      if (it.type === "fish" && skills.skillEffects(state).fishFinder) {
        finder = fishing.fishTable(it.location, bucket, wx, state.gear);
        finderHunt = fishing.huntAt(state, it.location, bucket, bucketProgress(state.timeMs));
      }
      if (actions.interact) interact(it);
    } else ui.setAction(null);
  }
  ui.setFinder(game.session ? null : finder, state.discovered, finderHunt);

  ui.updateHud(state, bucket, bucketProgress(state.timeMs), regionName(state.player));
  ui.setWeather(wx, weather.nextWeather(state));
  ui.updateFishing(game.session);
  const result = ui.catchVisible() && game.session ? (game.session.outcome === "caught" ? "caught" : "lost") : null;
  const questReady = !!state.orders?.list.some(o => orders.canHandIn(state, o));
  const view = renderer.render({ state, session: game.session, walking: game.walking, dt, elapsed: game.elapsed, result, questReady, weather: wx });
  if (view.lightning) audio.play("thunder");
  if (view.footstep) audio.play("step", surfaceAt(state.player.x, state.player.z, state.player.area));
  const fight = game.session?.phase === "fight" ? game.session.fight : null;
  audio.update({ menu: game.menu, bucket, weather: wx, area: state.player.area, x: state.player.x, z: state.player.z, fightHeld: !!(fight && game.session.reelHeld), tension: fight ? fight.tension / fight.tensionLimit : 0 });

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
      game.hadSave = true;
      state = deserialize(data);
      rng = createRng(state.rngSeed);
    }
  } catch (err) {
    console.warn("Could not load save, starting fresh:", err);
  }
  ui.bind(state);
  if (game.menu) {
    document.body.classList.add("at-title");
    title.el.hidden = false;
    title.play.firstChild.textContent = game.hadSave ? "Continue " : "Start fishing ";
  }
  renderer.setWallboard(state.discovered);
  renderer.setTrophies(state.trophies);
  renderer.setUnlocked(state.unlocked);
  requestAnimationFrame(frame);

  // Test/debug hook, only with ?debug in the URL.
  if (params.has("debug")) {
    window.cozy = {
      get state() { return state; }, get game() { return game; }, get rng() { return rng; },
      content, fishing, economy, skills, orders, weather, saveNow,
      /** Override the weather for tests (null = back to the forecast). */
      setWeather(id) { game.forcedWeather = id; }, deleteSave, audio, camera: renderer.camera,
      renderInfo: () => ({ ...renderer.renderer.info.render, geometries: renderer.renderer.info.memory.geometries }),
      setTime(ms) { state.timeMs = ms; },
      teleport(x, z, area = "land") { Object.assign(state.player, { x, z, area }); },
    };
  }
}
boot();
