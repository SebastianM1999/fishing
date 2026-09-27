// HTML/CSS UI: HUD, fishing panel, catch card, shop, bag, wallboard. Reads state; calls handlers for actions.
import {
  FISH, FISH_BY_ID, TIME_LABELS, LOCATION_LABELS, RARITY_LABELS, GEAR, GEAR_SLOTS, GEAR_LABELS,
  TACKLE, BAGS,
} from "../game/content.js";
import { fishSvg, rarityIcon } from "./fishArt.js";
import { ICONS } from "./icons.js";

const pct = v => `${Math.round(v * 100)}%`;
const mult = v => `${+v.toFixed(2)}×`;
const STAT_DEFS = {
  rod: [{ icon: "width", label: "Catch zone width", get: i => pct(i.zoneWidth) }],
  reel: [{ icon: "speed", label: "Reel speed", get: i => mult(i.speed) }, { icon: "recovery", label: "Tension recovery", get: i => mult(i.recovery) }],
  line: [{ icon: "tension", label: "Tension limit", get: i => String(i.tensionLimit) }],
  hook: [{ icon: "timer", label: "Hook window", get: i => `${+(i.hookWindowMs / 1000).toFixed(2)}s` }, { icon: "grip", label: "Slower progress loss", optional: true, get: i => (i.progressLossMult < 1 ? "−5%" : "—") }],
};
const TACKLE_ICON = { tackle_float: "float", tackle_heavy_sinker: "sinker", tackle_spinner: "spinner" };
const TACKLE_CHIPS = {
  tackle_float: [{ icon: "smooth", value: "+12%", label: "Smoother zone movement" }],
  tackle_heavy_sinker: [{ icon: "burst", value: "−10%", label: "Weaker fish bursts" }, { icon: "speed", value: "−8%", label: "Slower zone speed" }],
  tackle_spinner: [{ icon: "gem", value: "+25%", label: "More rare & legendary fish" }, { icon: "wait", value: "+1s", label: "Longer max bite wait" }],
};

const $ = id => document.getElementById(id);
const BEHAVIOR_ICONS = { calm: "smooth", darting: "speed", zigzag: "zigzag", heavy: "weight", frenzy: "flame" };
const BEHAVIOR_HINTS = { calm: "Calm fish", darting: "Darting fish", zigzag: "Zigzagging fish", heavy: "Heavy fish", frenzy: "Frenzied fish" };

const coinHtml = n => `<span class="value"><span class="coin-icon" aria-hidden="true"></span>${n}</span>`;
const rarityHtml = (r, size) => rarityIcon(r, size);

export function createUI(handlers) {
  const el = {
    coins: $("hud-coins"), time: $("hud-time"), timeChip: $("hud-time-chip"), timeBar: $("hud-time-bar"),
    region: $("hud-region"), collection: $("hud-collection"), bagCount: $("bag-count"),
    action: $("action-btn"), actionLabel: $("action-label"),
    fishing: $("fishing"), status: $("fishing-status"), statusIco: $("fishing-status-ico"), statusText: $("fishing-status-text"), minigame: $("minigame"),
    mgBehavior: $("mg-behavior"), mgBehaviorIco: $("mg-behavior-ico"), mgPhase: $("mg-phase"), zone: $("mg-zone"), laneFish: $("mg-fish"),
    progressVal: $("mg-progress-val"), tensionVal: $("mg-tension-val"), catchOk: $("catch-ok"),
    catchChoice: $("catch-choice"), catchWall: $("catch-wall"), catchBag: $("catch-bag"), catchBagSub: $("catch-bag-sub"),
    progress: $("mg-progress"), tension: $("mg-tension"),
    catchCard: $("catch-card"), catchArt: $("catch-art"), catchTitle: $("catch-title"), catchDetails: $("catch-details"), catchNote: $("catch-note"),
    toasts: $("toasts"), fade: $("fade"),
    shop: $("shop-dialog"), shopCoins: $("shop-coins"), market: $("shop-market"), gear: $("shop-gear"),
    bag: $("bag-dialog"), bagBody: $("bag-body"),
    board: $("board-dialog"), boardBody: $("board-body"), boardCount: $("board-count"), boardTip: $("board-tip"),
    unlock: $("unlock-dialog"), unlockTitle: $("unlock-title"), unlockText: $("unlock-text"), unlockPrice: $("unlock-price"), unlockHave: $("unlock-have"), unlockPay: $("unlock-pay"),
    catchExtra: $("catch-extra"),
    settings: $("settings-dialog"),
  };
  let purchase = null;
  const last = {};
  let state = null;

  // --- Dialog wiring ------------------------------------------------------
  for (const d of [el.shop, el.bag, el.board, el.unlock, el.settings]) {
    d.addEventListener("click", e => {
      if (e.target === d || e.target.closest("[data-close]")) d.close();
    });
    d.addEventListener("close", () => handlers.onDialogClosed?.());
  }
  document.querySelectorAll(".tabs [data-tab]").forEach(tab => tab.addEventListener("click", () => selectTab(tab.dataset.tab)));
  $("tab-market").insertAdjacentHTML("afterbegin", ICONS.fish);
  $("tab-gear").insertAdjacentHTML("afterbegin", ICONS.rod);
  $("btn-bag").insertAdjacentHTML("afterbegin", ICONS.bag);
  $("btn-board").insertAdjacentHTML("afterbegin", ICONS.board);
  $("btn-settings").insertAdjacentHTML("afterbegin", ICONS.gear);
  function selectTab(name) {
    document.querySelectorAll(".tabs [data-tab]").forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    el.market.hidden = name !== "market";
    el.gear.hidden = name !== "gear";
  }

  el.market.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.sell) handlers.sellOne(Number(b.dataset.sell));
    if (b.dataset.sellAll !== undefined) handlers.sellAll();
  });
  el.gear.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.buyGear) handlers.buyGear(b.dataset.buyGear);
    if (b.dataset.buyBag !== undefined) handlers.buyBag();
    if (b.dataset.buyTackle) handlers.buyTackle(b.dataset.buyTackle);
    if (b.dataset.equipTackle) handlers.equipTackle(b.dataset.equipTackle);
  });
  el.unlockPay.addEventListener("click", () => { purchase?.onConfirm(); el.unlock.close(); });

  // Wallboard: hover / focus / tap a slot to see the best specimen caught so far.
  function showTip(slot) {
    const f = FISH_BY_ID[slot.dataset.species];
    const found = state.discovered.includes(f.id);
    const rec = state.records[f.id];
    let html;
    if (!found) {
      html = `<strong>Undiscovered</strong><span>Found at the ${LOCATION_LABELS[f.location]} · ${f.times.map(t => TIME_LABELS[t]).join(", ")}</span>`
        + (rec ? `<span class="tip-label">Caught, not mounted yet</span><span>Best so far: ${rec.sizeCm.toFixed(1)} cm ${rarityHtml(rec.rarity, 18)}</span>` : "");
    } else if (!rec) {
      html = `<strong>${f.name}</strong><span>No record yet — catch another one to log your best.</span>`;
    } else {
      const fate = rec.sold ? `Sold for ${coinHtml(rec.value)}` : rec.released ? `Released (bag was full) · worth ${coinHtml(rec.value)}` : rec.mounted ? `Mounted on the wallboard · worth ${coinHtml(rec.value)}` : `In your bag · worth ${coinHtml(rec.value)}`;
      html = `<div class="tip-art">${fishSvg(f, { size: 200 })}</div>
        <strong>${f.name} ${rarityHtml(rec.rarity, 22)}</strong>
        <span class="tip-label">Best catch</span>
        <span class="tip-stat">${rec.sizeCm.toFixed(1)} cm · ${RARITY_LABELS[rec.rarity]}</span>
        <span>${fate}</span>`;
    }
    el.boardTip.innerHTML = html;
    el.boardTip.hidden = false;
    const r = slot.getBoundingClientRect(), t = el.boardTip.getBoundingClientRect();
    let x = r.left + r.width / 2 - t.width / 2, y = r.top - t.height - 8;
    if (y < 8) y = r.bottom + 8;
    x = Math.max(8, Math.min(innerWidth - t.width - 8, x));
    y = Math.max(8, Math.min(innerHeight - t.height - 8, y));
    el.boardTip.style.left = `${x}px`;
    el.boardTip.style.top = `${y}px`;
  }
  const hideTip = () => { el.boardTip.hidden = true; };
  el.boardBody.addEventListener("pointerover", e => { const slot = e.target.closest(".board-slot"); if (slot) showTip(slot); });
  el.boardBody.addEventListener("pointerleave", hideTip);
  el.boardBody.addEventListener("focusin", e => { const slot = e.target.closest(".board-slot"); if (slot) showTip(slot); });
  el.boardBody.addEventListener("focusout", hideTip);
  el.boardBody.addEventListener("click", e => { const slot = e.target.closest(".board-slot"); if (slot) showTip(slot); });
  el.board.addEventListener("close", hideTip);

  // Settings: icons, sliders and mute toggle
  el.settings.querySelectorAll("[data-icon]").forEach(n => { n.innerHTML = ICONS[n.dataset.icon]; });
  for (const name of ["music", "sfx", "ambience"]) {
    const input = $(`vol-${name}`), out = input.nextElementSibling;
    input.addEventListener("input", () => { out.value = `${input.value}%`; handlers.setPref(name, input.value / 100); });
  }
  $("vol-mute").addEventListener("change", e => handlers.setPref("muted", e.target.checked));
  function openSettings() {
    const p = handlers.getPrefs();
    for (const name of ["music", "sfx", "ambience"]) {
      const input = $(`vol-${name}`);
      input.value = Math.round(p[name] * 100);
      input.nextElementSibling.value = `${input.value}%`;
    }
    $("vol-mute").checked = p.muted;
    showModal(el.settings);
  }
  $("btn-settings").addEventListener("click", openSettings);
  function showModal(d) { d.showModal(); last.dialogOpenedAt = performance.now(); handlers.onDialogOpened?.(); }

  el.action.addEventListener("click", () => handlers.onAction());
  el.catchOk.addEventListener("click", () => handlers.onCatchContinue());
  el.catchWall.addEventListener("click", () => handlers.onCatchChoice("wall"));
  el.catchBag.addEventListener("click", () => handlers.onCatchChoice("bag"));
  el.catchCard.querySelectorAll("[data-icon]").forEach(n => { n.innerHTML = ICONS[n.dataset.icon]; });
  // Space/Enter are catching keys: never let them activate the Continue button.
  el.catchOk.addEventListener("keydown", e => { if (e.code === "Space" || e.code === "Enter") e.preventDefault(); });
  el.catchOk.addEventListener("keyup", e => { if (e.code === "Space" || e.code === "Enter") e.preventDefault(); });
  document.querySelectorAll("#fishing [data-icon]").forEach(n => { n.innerHTML = ICONS[n.dataset.icon]; });
  el.laneFish.innerHTML = `<svg viewBox="0 0 64 32" aria-hidden="true"><path d="M4 16c8-11 30-13 42-4l12-9v26l-12-9C34 29 12 27 4 16Z" fill="currentColor"/><path d="M22 8c4-5 12-6 16-3-5 1-9 3-11 6Z" fill="currentColor"/><circle cx="13" cy="14" r="2.2" fill="#fff" opacity="0.9"/></svg><span class="fish-zzz">z</span>`;
  $("btn-bag").addEventListener("click", () => openBag());
  $("btn-board").addEventListener("click", () => openBoard());

  // --- Rendering helpers -----------------------------------------------
  function fishRow(f, { sellable }) {
    const s = FISH_BY_ID[f.speciesId];
    return `<li class="fish-row">${fishSvg(s, { size: 64 })}
      <div><div class="name">${rarityHtml(f.rarity, 20)} ${s.name}</div><div class="meta">${f.sizeCm.toFixed(1)} cm · ${LOCATION_LABELS[s.location]}</div></div>
      ${coinHtml(f.value)}
      ${sellable ? `<button type="button" class="secondary" data-sell="${f.uid}">Sell</button>` : ""}</li>`;
  }

  function renderMarket() {
    const inv = state.inventory;
    const total = inv.reduce((s, f) => s + f.value, 0);
    el.market.innerHTML = inv.length
      ? `<div class="list-head"><span>${inv.length} sellable fish · total ${coinHtml(total)}</span>
          <button type="button" class="primary" data-sell-all>Sell all</button></div>
        <ul class="fish-list">${inv.map(f => fishRow(f, { sellable: true })).join("")}</ul>
        <p class="meta">First catches of a species are kept on the wallboard and can't be sold.</p>`
      : `<p class="empty">No sellable fish yet. First catches go straight to the wallboard — later copies can be sold here.</p>`;
  }

  function statHtml(def, cur, next) {
    const a = def.get(cur), b = next ? def.get(next) : null;
    return `<span class="stat" title="${def.label}">${ICONS[def.icon]}<span>${a}</span>${b !== null && b !== a ? `<span class="arrow">→</span><b>${b}</b>` : ""}</span>`;
  }

  function renderGear() {
    const cards = GEAR_SLOTS.map(slot => {
      const tier = state.gear[slot], cur = GEAR[slot][tier], next = GEAR[slot][tier + 1];
      const pips = GEAR[slot].map((_, i) => `<i class="${i <= tier ? "on" : ""}"></i>`).join("");
      const stats = STAT_DEFS[slot].filter(d => !d.optional || d.get(cur) !== "—" || (next && d.get(next) !== "—")).map(d => statHtml(d, cur, next)).join("");
      const action = next
        ? `<button type="button" class="buy" data-buy-gear="${slot}" ${state.coins < next.price ? "disabled" : ""} aria-label="Buy ${next.name} for ${next.price} coins" title="Upgrade to ${next.name}">${coinHtml(next.price)}</button>`
        : `<span class="max-badge" title="Fully upgraded">MAX</span>`;
      return `<article class="gear-card" aria-label="${GEAR_LABELS[slot]}">
        <div class="gear-art" title="${GEAR_LABELS[slot]}">${ICONS[slot]}</div>
        <div class="gear-main"><div class="gear-title">${cur.name}<span class="pips" aria-label="Tier ${tier + 1} of ${GEAR[slot].length}">${pips}</span></div>
          <div class="stats">${stats}</div>${next ? `<div class="next-name">→ ${next.name}</div>` : ""}</div>
        ${action}</article>`;
    });
    {
      const tier = state.bag, cur = BAGS[tier], next = BAGS[tier + 1];
      const pips = BAGS.map((_, i) => `<i class="${i <= tier ? "on" : ""}"></i>`).join("");
      const stat = `<span class="stat" title="Bag slots">${ICONS.fish}<span>${cur.slots}</span>${next ? `<span class="arrow">→</span><b>${next.slots}</b>` : ""} slots</span>`;
      const action = next
        ? `<button type="button" class="buy" data-buy-bag ${state.coins < next.price ? "disabled" : ""} aria-label="Buy ${next.name} for ${next.price} coins">${coinHtml(next.price)}</button>`
        : `<span class="max-badge">MAX</span>`;
      cards.push(`<article class="gear-card" aria-label="Bag"><div class="gear-art" title="Bag">${ICONS.bag}</div>
        <div class="gear-main"><div class="gear-title">${cur.name}<span class="pips">${pips}</span></div><div class="stats">${stat}</div>${next ? `<div class="next-name">→ ${next.name}</div>` : ""}</div>${action}</article>`);
    }
    const tackle = TACKLE.map(t => {
      const owned = state.ownedTackle.includes(t.id), equipped = state.equippedTackle === t.id;
      const chips = TACKLE_CHIPS[t.id].map(c => `<span class="chip" title="${c.label}">${ICONS[c.icon]}${c.value}</span>`).join("");
      const action = equipped
        ? `<span class="equipped">${ICONS.check} On</span>`
        : owned
          ? `<button type="button" class="secondary small" data-equip-tackle="${t.id}">Equip</button>`
          : `<button type="button" class="buy small" data-buy-tackle="${t.id}" ${state.coins < t.price ? "disabled" : ""} aria-label="Buy ${t.name} for ${t.price} coins">${coinHtml(t.price)}</button>`;
      return `<article class="tackle-card ${equipped ? "is-on" : ""}" title="${t.effect}"><div class="gear-art small">${ICONS[TACKLE_ICON[t.id]]}</div>
        <div class="tackle-name">${t.name}</div><div class="chips">${chips}</div>${action}</article>`;
    }).join("");
    el.gear.innerHTML = `<div class="gear-grid">${cards.join("")}</div>
      <h3 class="section-title">Tackle <span class="muted">equip one</span></h3><div class="tackle-grid">${tackle}</div>`;
  }

  function renderBag() {
    const cap = BAGS[state.bag].slots, n = state.inventory.length;
    const slots = `<div class="bag-slots ${n >= cap ? "full" : ""}" title="${n} of ${cap} slots used">${Array.from({ length: cap }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;
    el.bagBody.innerHTML = `<div class="list-head"><span class="bag-count">${ICONS.bag} ${n} / ${cap}</span>${slots}<span>worth ${coinHtml(state.inventory.reduce((a, f) => a + f.value, 0))}</span></div>
      <p class="bag-note">${ICONS.board} First catches: you choose — mount them on the wallboard or keep them to sell.${n >= cap ? " <b>Bag full — sell at the shop.</b>" : ""}</p>
      ${n ? `<ul class="fish-list">${state.inventory.map(f => fishRow(f, { sellable: false })).join("")}</ul>` : `<p class="empty">Your bag is empty. Go fishing!</p>`}`;
  }

  function renderBoard() {
    el.boardCount.textContent = `${state.discovered.length} / 20`;
    el.boardBody.innerHTML = FISH.map(f => {
      const found = state.discovered.includes(f.id);
      const rec = state.records[f.id];
      return `<button type="button" class="board-slot ${found ? "found" : ""}" data-species="${f.id}" aria-label="${found ? f.name : "Undiscovered fish"}">
        ${rec ? `<span class="slot-rarity">${rarityHtml(rec.rarity, 20)}</span>` : ""}
        ${fishSvg(f, { silhouette: !found, size: 120 })}
        <span class="name">${found ? f.name : "???"}</span><span class="loc">${LOCATION_LABELS[f.location]}</span></button>`;
    }).join("");
  }

  function refreshOpenPanels() {
    if (el.shop.open) { el.shopCoins.textContent = state.coins; renderMarket(); renderGear(); }
    if (el.bag.open) renderBag();
    if (el.board.open) renderBoard();
  }

  function openShop(s) { state = s; el.shopCoins.textContent = s.coins; renderMarket(); renderGear(); selectTab("market"); showModal(el.shop); }
  function openBag() { renderBag(); showModal(el.bag); }
  function openBoard() { renderBoard(); showModal(el.board); }
  /** Generic confirm-purchase dialog: construction barriers, the boat at the dock. */
  function openPurchase(s, { title, art, text, price, confirmLabel, onConfirm, blocked }) {
    state = s;
    purchase = { onConfirm };
    el.unlockTitle.textContent = title;
    $("unlock-art").innerHTML = ICONS[art] ?? "";
    el.unlockText.textContent = text;
    el.unlockPrice.textContent = price;
    el.unlockHave.textContent = s.coins >= price ? `(you have ${s.coins})` : `(you have ${s.coins} — keep fishing!)`;
    el.unlockPay.innerHTML = `${confirmLabel} <span class="key">E</span>`;
    el.unlockPay.disabled = s.coins < price || !!blocked;
    if (blocked) el.unlockHave.textContent = blocked;
    last.dialogOpenedAt = performance.now();
    showModal(el.unlock);
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    el.toasts.append(t);
    setTimeout(() => t.remove(), 2900);
    while (el.toasts.children.length > 3) el.toasts.firstChild.remove();
  }

  const setText = (node, key, value) => { if (last[key] !== value) { last[key] = value; node.textContent = value; } };

  return {
    bind(s) { state = s; },
    anyDialogOpen: () => el.shop.open || el.bag.open || el.board.open || el.unlock.open || el.settings.open,
    openShop, openBag, openBoard, openPurchase, toast, refreshOpenPanels,

    updateHud(s, bucket, bucketProgress, region) {
      state = s;
      setText(el.coins, "coins", String(s.coins));
      setText(el.time, "time", TIME_LABELS[bucket]);
      if (last.bucket !== bucket) { last.bucket = bucket; el.timeChip.dataset.bucket = bucket; }
      el.timeBar.style.width = `${Math.round(bucketProgress * 100)}%`;
      setText(el.region, "region", region);
      setText(el.collection, "collection", `${s.discovered.length} / 20`);
      const cap = BAGS[s.bag].slots;
      setText(el.bagCount, "bag", `${s.inventory.length}/${cap}`);
      el.bagCount.classList.toggle("full", s.inventory.length >= cap);
    },

    setAction(label, locked = false) {
      if (!label) { el.action.hidden = true; last.action = null; return; }
      el.action.hidden = false;
      if (last.action !== label) { last.action = label; el.actionLabel.textContent = label; }
      el.action.classList.toggle("locked", locked);
    },

    updateFishing(session) {
      const show = !!session && session.phase !== "done";
      el.fishing.hidden = !show;
      document.body.classList.toggle("fishing", !!session);
      if (!show) return;
      const phase = session.phase;
      el.minigame.hidden = phase !== "fight";
      if (last.fishPhaseUi !== phase) {
        last.fishPhaseUi = phase;
        el.fishing.dataset.phase = phase;
        const [ico, text] = phase === "cast" ? ["rod", "Casting…"] : phase === "wait" ? ["bobber", "Waiting for a bite…"] : phase === "bite" ? ["alert", "Bite! Click or press Space!"] : [session.hookQuality === "perfect" ? "star" : "check", session.hookQuality === "perfect" ? "Perfect hook!" : "Hooked!"];
        el.statusIco.innerHTML = ICONS[ico];
        el.statusText.textContent = text;
      }
      if (phase !== "fight") return;
      const f = session.fight;
      if (last.behavior !== f.behavior) {
        last.behavior = f.behavior;
        el.mgBehavior.textContent = BEHAVIOR_HINTS[f.behavior];
        el.mgBehaviorIco.innerHTML = ICONS[BEHAVIOR_ICONS[f.behavior]];
        el.minigame.dataset.rarity = f.rarity;
      }
      if (last.mgPhase !== f.fishPhase) {
        last.mgPhase = f.fishPhase;
        el.mgPhase.hidden = f.fishPhase === "normal";
        el.mgPhase.innerHTML = f.fishPhase === "burst" ? `${ICONS.burst} Burst!` : `${ICONS.sleep} Tired`;
        el.mgPhase.className = `mg-phase ${f.fishPhase}`;
        el.laneFish.dataset.phase = f.fishPhase;
      }
      // Fish faces the way it swims.
      const dir = f.fishPos - (last.fishPos ?? f.fishPos);
      last.fishPos = f.fishPos;
      if (Math.abs(dir) > 0.0005) el.laneFish.classList.toggle("right", dir > 0);
      el.zone.style.width = `${f.zoneWidth * 100}%`;
      el.zone.style.left = `${(f.zonePos - f.zoneWidth / 2) * 100}%`;
      el.zone.classList.toggle("inside", f.inside);
      el.zone.classList.toggle("reeling", !!session.reelHeld);
      el.laneFish.style.left = `${f.fishPos * 100}%`;
      el.progress.style.width = `${f.progress * 100}%`;
      setText(el.progressVal, "progressVal", `${Math.round(f.progress * 100)}%`);
      const tf = Math.min(1, f.tension / f.tensionLimit);
      el.tension.style.width = `${tf * 100}%`;
      el.tension.style.setProperty("--hue", String(Math.round(110 - 110 * tf)));
      setText(el.tensionVal, "tensionVal", `${Math.round(tf * 100)}%`);
      el.minigame.classList.toggle("danger", tf > 0.78);
    },

    showCatchResult(session, result) {
      const species = FISH_BY_ID[session.encounter.speciesId];
      const enc = session.encounter;
      const outcomes = {
        caught: null,
        missed: ["It got away…", "You missed the hook window."],
        early: ["Reeled in", "Nothing on the line yet."],
        broke: ["Snap! The line broke", "Too much tension — the fish escaped."],
        escaped: ["The fish escaped", "It slipped off the hook."],
      };
      if (session.outcome !== "caught") {
        const [title, detail] = outcomes[session.outcome];
        el.catchArt.innerHTML = "";
        el.catchTitle.textContent = title;
        el.catchDetails.textContent = detail;
        el.catchNote.textContent = "";
        el.catchExtra.textContent = "";
      } else {
        el.catchArt.innerHTML = fishSvg(species, { size: 160 });
        el.catchTitle.innerHTML = `${rarityHtml(enc.rarity, 28)} ${species.name}`;
        el.catchDetails.innerHTML = `${RARITY_LABELS[enc.rarity]} · ${enc.sizeCm.toFixed(1)} cm · value ${coinHtml(enc.value)}`;
        const cap = BAGS[state.bag].slots;
        if (result.newSpecies) {
          el.catchNote.textContent = `First ${species.name} you've caught! Where should it go?`;
          el.catchExtra.textContent = "";
          const full = state.inventory.length >= cap;
          el.catchBag.dataset.full = String(full);
          el.catchBagSub.innerHTML = full ? `Bag full (${state.inventory.length}/${cap})` : `Sell later for ${coinHtml(enc.value)}`;
        } else {
          el.catchNote.textContent = result.released
            ? `Your bag is full (${state.inventory.length}/${cap}) — you let it go.`
            : `Added to your bag (${state.inventory.length}/${cap}).`;
          el.catchExtra.innerHTML = result.newRecord ? `${ICONS.star} New personal best for this species!` : "";
        }
        el.catchNote.classList.toggle("warn", !!result.released);
      }
      const choice = !!result?.newSpecies;
      el.catchCard.classList.toggle("golden", choice);
      el.catchChoice.hidden = !choice;
      el.catchOk.hidden = choice;
      el.catchCard.hidden = false;
      // Brief guard so a reeling tap/click can't land on a button by accident.
      const buttons = [el.catchOk, el.catchWall, el.catchBag];
      buttons.forEach(b => { b.disabled = true; });
      clearTimeout(last.catchGuard);
      last.catchGuard = setTimeout(() => {
        el.catchOk.disabled = el.catchWall.disabled = false;
        el.catchBag.disabled = el.catchBag.dataset.full === "true";
      }, 700);
    },
    hideCatchResult() { el.catchCard.hidden = true; },
    catchReady: () => !(el.catchChoice.hidden ? el.catchOk : el.catchWall).disabled,
    catchIsChoice: () => !el.catchCard.hidden && !el.catchChoice.hidden,
    bagChoiceAvailable: () => !el.catchBag.disabled,
    /** E inside a dialog: confirm a purchase (after a short guard), otherwise close the dialog. */
    dialogPrimary() {
      const open = [el.unlock, el.shop, el.bag, el.board, el.settings].find(d => d.open);
      if (!open) return;
      if (performance.now() - (last.dialogOpenedAt ?? 0) < 350) return;
      if (open === el.unlock && !el.unlockPay.disabled) el.unlockPay.click();
      else open.close();
    },
    catchVisible: () => !el.catchCard.hidden,

    fade(on) { el.fade.classList.toggle("on", on); },
  };
}
