// HTML/CSS UI: HUD, fishing panel, catch card, shop, bag, wallboard. Reads state; calls handlers for actions.
import {
  FISH, FISH_BY_ID, TIME_LABELS, LOCATION_LABELS, RARITY_LABELS, GEAR, GEAR_SLOTS, GEAR_LABELS,
  TACKLE, BOAT_PRICE, gearEffectText,
} from "../game/content.js";
import { fishSvg } from "./fishArt.js";

const $ = id => document.getElementById(id);
const BEHAVIOR_HINTS = {
  calm: "A calm fish drifts on the line",
  darting: "A darting fish makes sudden dashes!",
  zigzag: "A zigzagging fish keeps changing course!",
  heavy: "A heavy fish is pulling hard!",
  frenzy: "A fish in a frenzy thrashes wildly!",
};

const coinHtml = n => `<span class="value"><span class="coin-icon" aria-hidden="true"></span>${n}</span>`;
const rarityHtml = r => `<span class="rarity ${r}">${RARITY_LABELS[r]}</span>`;

export function createUI(handlers) {
  const el = {
    coins: $("hud-coins"), time: $("hud-time"), timeChip: $("hud-time-chip"), timeBar: $("hud-time-bar"),
    region: $("hud-region"), collection: $("hud-collection"), bagCount: $("bag-count"),
    action: $("action-btn"), actionLabel: $("action-label"),
    fishing: $("fishing"), status: $("fishing-status"), minigame: $("minigame"),
    mgBehavior: $("mg-behavior"), mgPhase: $("mg-phase"), zone: $("mg-zone"), laneFish: $("mg-fish"),
    progress: $("mg-progress"), tension: $("mg-tension"),
    catchCard: $("catch-card"), catchArt: $("catch-art"), catchTitle: $("catch-title"), catchDetails: $("catch-details"), catchNote: $("catch-note"),
    toasts: $("toasts"), fade: $("fade"),
    shop: $("shop-dialog"), shopCoins: $("shop-coins"), market: $("shop-market"), gear: $("shop-gear"),
    bag: $("bag-dialog"), bagBody: $("bag-body"),
    board: $("board-dialog"), boardBody: $("board-body"), boardCount: $("board-count"),
  };
  const last = {};
  let state = null;

  // --- Dialog wiring ------------------------------------------------------
  for (const d of [el.shop, el.bag, el.board]) {
    d.addEventListener("click", e => {
      if (e.target === d || e.target.closest("[data-close]")) d.close();
    });
    d.addEventListener("close", () => handlers.onDialogClosed?.());
  }
  document.querySelectorAll(".tabs [data-tab]").forEach(tab => tab.addEventListener("click", () => selectTab(tab.dataset.tab)));
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
    if (b.dataset.buyTackle) handlers.buyTackle(b.dataset.buyTackle);
    if (b.dataset.equipTackle) handlers.equipTackle(b.dataset.equipTackle);
    if (b.dataset.buyBoat !== undefined) handlers.buyBoat();
  });
  el.action.addEventListener("click", () => handlers.onAction());
  $("catch-ok").addEventListener("click", () => handlers.onAction());
  $("btn-bag").addEventListener("click", () => openBag());
  $("btn-board").addEventListener("click", () => openBoard());

  // --- Rendering helpers -----------------------------------------------
  function fishRow(f, { sellable }) {
    const s = FISH_BY_ID[f.speciesId];
    return `<li class="fish-row">${fishSvg(s, { size: 64 })}
      <div><div class="name">${s.name} ${rarityHtml(f.rarity)}</div><div class="meta">${f.sizeCm.toFixed(1)} cm · ${LOCATION_LABELS[s.location]}</div></div>
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

  function renderGear() {
    const rows = GEAR_SLOTS.map(slot => {
      const cur = GEAR[slot][state.gear[slot]];
      const next = GEAR[slot][state.gear[slot] + 1];
      const info = next
        ? `<b>${cur.name}</b> <span class="arrow">→ ${next.name}</span><br>
           <span class="muted">${gearEffectText(slot, cur)}</span> <span class="arrow">→ ${gearEffectText(slot, next)}</span>`
        : `<b>${cur.name}</b> <span class="muted">(max)</span><br><span class="muted">${gearEffectText(slot, cur)}</span>`;
      const btn = next
        ? `<button type="button" class="primary" data-buy-gear="${slot}" ${state.coins < next.price ? "disabled" : ""}>Buy ${coinHtml(next.price)}</button>`
        : `<span class="muted">Owned</span>`;
      return `<div class="gear-row"><span class="gear-slot">${GEAR_LABELS[slot]}</span><div class="gear-info">${info}</div>${btn}</div>`;
    });
    const eq = TACKLE.find(t => t.id === state.equippedTackle);
    const tackleButtons = TACKLE.map(t => {
      const owned = state.ownedTackle.includes(t.id);
      return owned
        ? `<button type="button" class="secondary" data-equip-tackle="${t.id}" aria-pressed="${state.equippedTackle === t.id}" title="${t.effect}">${t.name}${state.equippedTackle === t.id ? " ✓" : ""}</button>`
        : `<button type="button" class="secondary" data-buy-tackle="${t.id}" ${state.coins < t.price ? "disabled" : ""} title="${t.effect}">${t.name} · ${coinHtml(t.price)}</button>`;
    }).join("");
    rows.push(`<div class="gear-row"><span class="gear-slot">Tackle</span><div class="gear-info">
      <b>${eq ? eq.name : "None equipped"}</b> <span class="muted">${eq ? eq.effect : "Buy one, equip one"}</span>
      <div class="tackle-options">${tackleButtons}</div>
      <div class="muted">${TACKLE.map(t => `${t.name}: ${t.effect}`).join(" · ")}</div></div><span></span></div>`);
    rows.push(`<div class="gear-row boat-row"><span class="gear-slot">Boat</span><div class="gear-info">
      <b>Small Fishing Boat</b><br><span class="muted">${state.boatOwned ? "Moored at the dock — sail offshore anytime." : "One-time purchase. Unlocks offshore fishing from the dock."}</span></div>
      ${state.boatOwned ? `<span class="muted">Owned</span>` : `<button type="button" class="primary" data-buy-boat ${state.coins < BOAT_PRICE ? "disabled" : ""}>Buy ${coinHtml(BOAT_PRICE)}</button>`}</div>`);
    el.gear.innerHTML = `<div class="gear-list">${rows.join("")}</div>`;
  }

  function renderBag() {
    el.bagBody.innerHTML = state.inventory.length
      ? `<div class="list-head"><span>${state.inventory.length} fish · worth ${coinHtml(state.inventory.reduce((s, f) => s + f.value, 0))}</span><span class="meta">Sell at the shop</span></div>
        <ul class="fish-list">${state.inventory.map(f => fishRow(f, { sellable: false })).join("")}</ul>`
      : `<p class="empty">Your bag is empty. Go fishing!</p>`;
  }

  function renderBoard() {
    el.boardCount.textContent = `${state.discovered.length} / 20`;
    el.boardBody.innerHTML = FISH.map(f => {
      const found = state.discovered.includes(f.id);
      return `<div class="board-slot ${found ? "found" : ""}">${fishSvg(f, { silhouette: !found, size: 110 })}
        <span class="name">${found ? f.name : "???"}</span><span class="loc">${LOCATION_LABELS[f.location]}</span></div>`;
    }).join("");
  }

  function refreshOpenPanels() {
    if (el.shop.open) { el.shopCoins.textContent = state.coins; renderMarket(); renderGear(); }
    if (el.bag.open) renderBag();
    if (el.board.open) renderBoard();
  }

  function openShop(s) { state = s; el.shopCoins.textContent = s.coins; renderMarket(); renderGear(); selectTab("market"); el.shop.showModal(); }
  function openBag() { renderBag(); el.bag.showModal(); }
  function openBoard() { renderBoard(); el.board.showModal(); }

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
    anyDialogOpen: () => el.shop.open || el.bag.open || el.board.open,
    openShop, openBag, openBoard, toast, refreshOpenPanels,

    updateHud(s, bucket, bucketProgress, region) {
      state = s;
      setText(el.coins, "coins", String(s.coins));
      setText(el.time, "time", TIME_LABELS[bucket]);
      if (last.bucket !== bucket) { last.bucket = bucket; el.timeChip.dataset.bucket = bucket; }
      el.timeBar.style.width = `${Math.round(bucketProgress * 100)}%`;
      setText(el.region, "region", region);
      setText(el.collection, "collection", `${s.discovered.length} / 20`);
      setText(el.bagCount, "bag", String(s.inventory.length));
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
      el.status.classList.toggle("bite", phase === "bite");
      if (phase === "cast") setText(el.status, "status", "Casting…");
      else if (phase === "wait") setText(el.status, "status", "Waiting for a bite…");
      else if (phase === "bite") setText(el.status, "status", "! BITE — hook it now!");
      else if (phase === "fight") {
        const f = session.fight;
        setText(el.status, "status", session.hookQuality === "perfect" ? "Perfect hook!" : "Hooked!");
        setText(el.mgBehavior, "behavior", BEHAVIOR_HINTS[f.behavior]);
        const phaseLabel = f.fishPhase === "burst" ? "Burst!" : f.fishPhase === "exhausted" ? "Tired…" : "";
        if (last.mgPhase !== f.fishPhase) {
          last.mgPhase = f.fishPhase;
          el.mgPhase.textContent = phaseLabel;
          el.mgPhase.className = `mg-phase ${f.fishPhase}`;
          el.laneFish.classList.toggle("burst", f.fishPhase === "burst");
        }
        el.zone.style.width = `${f.zoneWidth * 100}%`;
        el.zone.style.left = `${(f.zonePos - f.zoneWidth / 2) * 100}%`;
        el.zone.classList.toggle("inside", f.inside);
        el.laneFish.style.left = `${f.fishPos * 100}%`;
        el.progress.style.width = `${f.progress * 100}%`;
        const tf = f.tension / f.tensionLimit;
        el.tension.style.width = `${Math.min(100, tf * 100)}%`;
        el.tension.classList.toggle("high", tf > 0.75);
      }
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
      } else {
        el.catchArt.innerHTML = fishSvg(species, { size: 160 });
        el.catchTitle.textContent = `${species.name}`;
        el.catchDetails.innerHTML = `${rarityHtml(enc.rarity)} · ${enc.sizeCm.toFixed(1)} cm · value ${coinHtml(enc.value)}`;
        el.catchNote.textContent = result.discovered
          ? `New discovery! Added to the wallboard (${state.discovered.length} / 20).`
          : "Added to your bag.";
      }
      el.catchCard.hidden = false;
    },
    hideCatchResult() { el.catchCard.hidden = true; },
    catchVisible: () => !el.catchCard.hidden,

    fade(on) { el.fade.classList.toggle("on", on); },
  };
}
