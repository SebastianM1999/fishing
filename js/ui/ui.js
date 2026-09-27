// HTML/CSS UI: HUD, fishing panel, catch card, shop, bag, wallboard, skills. Reads state; calls handlers for actions.
import {
  FISH, FISH_BY_ID, TIME_LABELS, LOCATION_LABELS, RARITY_LABELS, GEAR, GEAR_SLOTS, GEAR_LABELS,
  BAGS, SKILLS, SKILLS_BY_ID, SKILL_BRANCHES, TIER_POINTS, STREAK, LEGENDARIES,
} from "../game/content.js";
import { priceOf, inventoryWorth, bagCapacity, bagFull, streakBonus } from "../game/economy.js";
import { orderText, matchingFish, canHandIn } from "../game/orders.js";
import { huntGear } from "../game/fishing.js";
import { levelInfo, pointsFree, pointsSpent, rankOf, tierOpen, canLearn, respecCost, skillEffects, branchOf } from "../game/skills.js";
import { fishSvg, rarityIcon } from "./fishArt.js";
import { ICONS } from "./icons.js";

const pct = v => `${Math.round(v * 100)}%`;
const mult = v => `${+v.toFixed(2)}×`;
const STAT_DEFS = {
  rod: [{ icon: "width", label: "Catch zone width", get: i => pct(i.zoneWidth) }],
  reel: [{ icon: "speed", label: "Reel speed", get: i => mult(i.speed) }, { icon: "recovery", label: "Tension recovery", get: i => mult(i.recovery) }],
  line: [{ icon: "tension", label: "Tension limit", get: i => String(i.tensionLimit) }],
};

const $ = id => document.getElementById(id);
const BEHAVIOR_ICONS = { calm: "smooth", darting: "speed", zigzag: "zigzag", heavy: "weight", frenzy: "flame", boss: "star" };
const BEHAVIOR_HINTS = { calm: "Calm fish", darting: "Darting fish", zigzag: "Zigzagging fish", heavy: "Heavy fish", frenzy: "Frenzied fish", boss: "Legendary giant" };

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
    catchExtra: $("catch-extra"), catchXp: $("catch-xp"),
    settings: $("settings-dialog"),
    level: $("hud-level"), levelChip: $("hud-level-chip"), xpBar: $("hud-xp-bar"), skillPoints: $("skill-points"), finder: $("finder"), whisper: $("fishing-whisper"),
    skills: $("skills-dialog"), skillsBody: $("skills-body"), skillsLevel: $("skills-level"), skillsXpFill: $("skills-xp-fill"), skillsXpText: $("skills-xp-text"),
    skillsPoints: $("skills-points"), skillsDetail: $("skills-detail"),
    trophy: $("trophy-dialog"), trophyBody: $("trophy-body"),
    orders: $("orders-dialog"), ordersBody: $("orders-body"), ordersDay: $("orders-day"),
    legendBanner: $("legend-banner"), mgBoss: $("mg-boss"),
    streak: $("hud-streak"), streakText: $("hud-streak-text"), catchStreak: $("catch-streak"),
  };
  let trophyPick = null; // shelf slot whose bag-fish picker is open
  let purchase = null;
  const last = {};
  let state = null;

  // --- Dialog wiring ------------------------------------------------------
  for (const d of [el.shop, el.bag, el.board, el.unlock, el.settings, el.skills, el.trophy, el.orders]) {
    d.addEventListener("click", e => {
      if (e.target === d || e.target.closest("[data-close]")) d.close();
    });
    d.addEventListener("close", () => handlers.onDialogClosed?.());
  }
  document.querySelectorAll(".tabs [data-tab]").forEach(tab => tab.addEventListener("click", () => selectTab(tab.dataset.tab)));
  $("tab-market").insertAdjacentHTML("afterbegin", ICONS.fish);
  $("tab-gear").insertAdjacentHTML("afterbegin", ICONS.rod);
  $("btn-bag").insertAdjacentHTML("afterbegin", ICONS.bag);
  $("btn-skills").insertAdjacentHTML("afterbegin", ICONS.sprout);
  $("hud-streak-ico").innerHTML = ICONS.flame;
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
  el.bagBody.addEventListener("click", e => {
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
    if (b.dataset.respec !== undefined) handlers.respec();
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
      const worth = coinHtml(priceOf(state, { ...rec, speciesId: f.id }));
      const fate = rec.sold ? `Sold for ${coinHtml(rec.soldFor ?? rec.value)}` : rec.released ? `Released (bag was full) · worth ${worth}` : rec.mounted ? `Mounted on the wallboard · worth ${worth}` : `In your bag · worth ${worth}`;
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
  el.laneFish.innerHTML = `<svg viewBox="0 0 64 32" aria-hidden="true"><path d="M4 16c8-11 30-13 42-4l12-9v26l-12-9C34 29 12 27 4 16Z" fill="currentColor"/><path d="M22 8c4-5 12-6 16-3-5 1-9 3-11 6Z" fill="currentColor"/><circle cx="13" cy="14" r="2.2" fill="#fff" opacity="0.9"/></svg><span class="fish-zzz">z</span><span class="fish-crown" aria-hidden="true">${rarityIcon("legendary", 18)}</span>`;
  $("btn-bag").addEventListener("click", () => openBag());
  el.ordersBody.addEventListener("click", e => { const b = e.target.closest("[data-hand-in]"); if (b && !b.disabled) handlers.handIn(b.dataset.handIn); });
  el.trophyBody.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.dataset.pick !== undefined) { trophyPick = trophyPick === Number(b.dataset.pick) ? null : Number(b.dataset.pick); renderTrophies(); }
    if (b.dataset.mount) { handlers.mountTrophy(Number(b.dataset.mount), trophyPick); trophyPick = null; }
    if (b.dataset.unmount !== undefined) handlers.unmountTrophy(Number(b.dataset.unmount));
  });
  $("btn-skills").addEventListener("click", () => openSkills());

  // Skill tree: click learns a rank; hover / focus explains the node.
  const SKILL_HINT = "Hover or focus a skill to see what it does · click to learn a rank (1 point)";
  el.skillsBody.addEventListener("click", e => { const n = e.target.closest("[data-learn]"); if (n) handlers.learnSkill(n.dataset.learn); });
  const onNode = e => { const n = e.target.closest("[data-learn]"); if (n) showSkillDetail(n.dataset.learn); };
  el.skillsBody.addEventListener("pointerover", onNode);
  el.skillsBody.addEventListener("focusin", onNode);
  el.skillsBody.addEventListener("pointerleave", () => { if (!el.skillsBody.contains(document.activeElement)) el.skillsDetail.textContent = SKILL_HINT; });
  function showSkillDetail(id) {
    const s = SKILLS_BY_ID[id], r = rankOf(state, id), b = branchOf(s.branch);
    const now = r ? s.text(r) : "Not learned";
    const change = r >= s.max ? `<span class="detail-max">Maxed</span>` : `<span class="arrow">→</span> <b>${s.text(r + 1)}</b>`;
    const lock = tierOpen(state, s.branch, s.tier) ? "" : `<span class="detail-lock">${ICONS.lock} Opens after ${TIER_POINTS[s.tier]} points in ${b.name}</span>`;
    el.skillsDetail.innerHTML = `<strong>${ICONS[s.icon]} ${s.name} <span class="muted">${r} / ${s.max}</span></strong><span class="detail-text">${now} ${change}</span>${lock}`;
  }

  // --- Rendering helpers -----------------------------------------------
  function fishRow(f, { sellable }) {
    const s = FISH_BY_ID[f.speciesId];
    return `<li class="fish-row">${fishSvg(s, { size: 64 })}
      <div><div class="name">${rarityHtml(f.rarity, 20)} ${s.name}</div><div class="meta">${f.sizeCm.toFixed(1)} cm · ${LOCATION_LABELS[s.location]}</div></div>
      ${coinHtml(priceOf(state, f))}
      ${sellable ? `<button type="button" class="secondary" data-sell="${f.uid}">Sell</button>` : ""}</li>`;
  }

  function renderMarket() {
    const inv = state.inventory;
    const total = inventoryWorth(state);
    el.market.innerHTML = inv.length
      ? `<div class="list-head"><span>${inv.length} sellable fish · total ${coinHtml(total)}</span>
          <button type="button" class="primary" data-sell-all>Sell all</button></div>
        <ul class="fish-list">${inv.map(f => fishRow(f, { sellable: true })).join("")}</ul>`
      : `<p class="empty">No fish to sell yet. Go fishing!</p>`;
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
      const tier = state.bag, cur = BAGS[tier], next = BAGS[tier + 1], bonus = skillEffects(state).bagBonus;
      const pips = BAGS.map((_, i) => `<i class="${i <= tier ? "on" : ""}"></i>`).join("");
      const stat = `<span class="stat" title="Bag slots${bonus ? ` (+${bonus} from Extra Pockets)` : ""}">${ICONS.fish}<span>${cur.slots + bonus}</span>${next ? `<span class="arrow">→</span><b>${next.slots + bonus}</b>` : ""} slots</span>`;
      const action = next
        ? `<button type="button" class="buy" data-buy-bag ${state.coins < next.price ? "disabled" : ""} aria-label="Buy ${next.name} for ${next.price} coins">${coinHtml(next.price)}</button>`
        : `<span class="max-badge">MAX</span>`;
      cards.push(`<article class="gear-card" aria-label="Bag"><div class="gear-art" title="Bag">${ICONS.bag}</div>
        <div class="gear-main"><div class="gear-title">${cur.name}<span class="pips">${pips}</span></div><div class="stats">${stat}</div>${next ? `<div class="next-name">→ ${next.name}</div>` : ""}</div>${action}</article>`);
    }
    const spent = pointsSpent(state), cost = respecCost(state);
    const respec = `<article class="gear-card respec-card" aria-label="Rethink skills"><div class="gear-art" title="Skills">${ICONS.sprout}</div>
      <div class="gear-main"><div class="gear-title">Rethink skills</div>
        <div class="next-name">${spent ? `Refund all ${spent} skill point${spent === 1 ? "" : "s"} to spend them again` : "No skill points spent yet"}</div></div>
      <button type="button" class="buy" data-respec ${!spent || state.coins < cost ? "disabled" : ""} aria-label="Refund skill points for ${cost} coins">${coinHtml(cost)}</button></article>`;
    el.gear.innerHTML = `<div class="gear-grid">${cards.join("")}</div>
      <h3 class="section-title">Skills <span class="muted">coins buy gear, XP buys technique</span></h3>${respec}`;
  }

  function renderBag() {
    const cap = bagCapacity(state), n = state.inventory.length, courier = skillEffects(state).fishCourier;
    const slots = `<div class="bag-slots ${n >= cap ? "full" : ""}" title="${n} of ${cap} slots used">${Array.from({ length: cap }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;
    el.bagBody.innerHTML = `<div class="list-head"><span class="bag-count">${ICONS.bag} ${n} / ${cap}</span>${slots}<span>worth ${coinHtml(inventoryWorth(state))}</span>
        ${courier && n ? `<button type="button" class="primary small" data-sell-all title="Fish Courier">${ICONS.crate} Sell all</button>` : ""}</div>
      ${n >= cap ? `<p class="bag-note"><b>Bag full — ${courier ? "sell some fish here" : "sell at the shop"}.</b></p>` : ""}
      ${n ? `<ul class="fish-list">${state.inventory.map(f => fishRow(f, { sellable: courier })).join("")}</ul>` : `<p class="empty">Your bag is empty. Go fishing!</p>`}`;
  }

  function renderBoard() {
    el.boardCount.textContent = `${state.discovered.length} / ${FISH.length}`;
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
    if (el.skills.open) renderSkills();
    if (el.trophy.open) renderTrophies();
    if (el.orders.open) renderOrders();
  }

  function orderArt(o) {
    const n = o.need;
    if (n.speciesId) return fishSvg(FISH_BY_ID[n.speciesId], { silhouette: !state.discovered.includes(n.speciesId), size: 84 });
    if (n.bucket) return `<span class="order-glyph time-chip" data-bucket="${n.bucket}"><span class="time-icon"></span></span>`;
    return `<span class="order-glyph">${n.rarity ? ICONS.gem : ICONS.fish}</span>`;
  }

  function renderOrders() {
    el.ordersDay.textContent = `Day ${state.day + 1}`;
    el.ordersBody.innerHTML = `<div class="orders-list">${state.orders.list.map(o => {
      const fish = o.kind === "deliver" && !o.done ? matchingFish(state, o) : null;
      const status = o.done ? `<span class="order-done">${ICONS.check} Done</span>`
        : `<button type="button" class="primary small" data-hand-in="${o.id}" ${canHandIn(state, o) ? "" : "disabled"}>${o.kind === "catch" ? "Claim" : "Hand in"}</button>`;
      const hint = o.done ? "Thank you!" : o.kind === "catch" ? `${o.progress} / ${o.count} caught` : fish ? `Uses ${fish.map(f => `${rarityHtml(f.rarity, 16)} ${FISH_BY_ID[f.speciesId].name} ${f.sizeCm.toFixed(0)} cm`).join(", ")}` : "Not in your bag yet";
      return `<article class="order-card ${o.done ? "done" : ""} ${canHandIn(state, o) ? "ready" : ""}">
        <div class="order-art">${orderArt(o)}</div>
        <div class="order-main"><strong>${orderText(o)}</strong>
          ${o.kind === "catch" ? `<div class="order-progress"><i style="width:${Math.min(100, (o.progress / o.count) * 100)}%"></i></div>` : ""}
          <span class="meta">${hint}</span></div>
        <div class="order-reward">${coinHtml(o.coins)}<span class="order-xp">+${o.xp} XP</span></div>
        ${status}</article>`;
    }).join("")}</div>${rumorsHtml()}`;
  }

  // Legendary hunts: clues, place and the gear each giant demands (✓ / ✗ against what you own).
  function rumorsHtml() {
    const rows = LEGENDARIES.map(f => {
      const caught = !!state.records[f.id];
      const gear = Object.entries(huntGear(state, f)).map(([slot, [need, has]]) =>
        `<span class="rumor-gear ${has >= need ? "ok" : ""}" title="${GEAR[slot][need].name}${has >= need ? " — you have it" : ""}">${ICONS[slot]} ${GEAR[slot][need].name} ${has >= need ? ICONS.check : "✗"}</span>`).join("");
      return `<article class="rumor ${caught ? "caught" : ""}"><div class="rumor-art">${fishSvg(f, { silhouette: !caught, size: 96 })}</div>
        <div class="rumor-main"><strong>${caught ? `${rarityHtml("legendary", 18)} ${f.name}` : "???"} <span class="muted">· ${LOCATION_LABELS[f.location]}</span></strong>
          <span class="rumor-clue">“${f.hunt.clue}”</span><div class="rumor-gears">${gear}</div></div></article>`;
    }).join("");
    return `<h3 class="section-title">${ICONS.whisper} Rumours <span class="muted">legendary fish, for the patient and well equipped</span></h3><div class="rumors">${rows}</div>`;
  }

  function renderTrophies() {
    const full = bagFull(state);
    const plaques = state.trophies.map((t, i) => {
      if (!t) {
        return `<article class="trophy-plaque empty"><div class="trophy-art">${ICONS.star}</div><strong>Empty spot</strong>
          <button type="button" class="primary small" data-pick="${i}" ${state.inventory.length ? "" : "disabled"}>Mount a fish</button></article>`;
      }
      const f = FISH_BY_ID[t.speciesId];
      return `<article class="trophy-plaque ${t.rarity}"><div class="trophy-art">${fishSvg(f, { size: 120 })}</div>
        <strong>${rarityHtml(t.rarity, 20)} ${f.name}</strong><span class="meta">${t.sizeCm.toFixed(1)} cm · worth ${coinHtml(priceOf(state, t))}</span>
        <div class="trophy-actions">
          <button type="button" class="secondary small" data-pick="${i}" ${state.inventory.length ? "" : "disabled"}>Swap</button>
          <button type="button" class="secondary small" data-unmount="${i}" ${full ? "disabled title=\"Your bag is full\"" : ""}>Take down</button>
        </div></article>`;
    }).join("");
    const pick = trophyPick === null ? "" : state.inventory.length
      ? `<h3 class="section-title">Pick a fish from your bag <span class="muted">for spot ${trophyPick + 1}</span></h3>
        <ul class="fish-list trophy-pick">${state.inventory.map(f => `<li class="fish-row">${fishSvg(FISH_BY_ID[f.speciesId], { size: 64 })}
          <div><div class="name">${rarityHtml(f.rarity, 20)} ${FISH_BY_ID[f.speciesId].name}</div><div class="meta">${f.sizeCm.toFixed(1)} cm</div></div>
          ${coinHtml(priceOf(state, f))}<button type="button" class="primary small" data-mount="${f.uid}">Mount</button></li>`).join("")}</ul>`
      : "";
    const note = full ? `<p class="bag-note"><b>Your bag is full</b> — make room before taking a trophy down.</p>` : !state.inventory.length ? `<p class="bag-note">Catch some fish first: trophies come from your bag.</p>` : "";
    el.trophyBody.innerHTML = `<div class="trophy-shelf">${plaques}</div>${note}${pick}`;
  }

  function renderSkills() {
    const info = levelInfo(state.xp), free = pointsFree(state);
    el.skillsLevel.textContent = `Level ${info.level}${info.maxed ? " · max" : ""}`;
    el.skillsXpFill.style.width = info.maxed ? "100%" : pct(info.into / info.needed);
    el.skillsXpText.textContent = info.maxed ? `${state.xp} XP` : `${info.into} / ${info.needed} XP`;
    el.skillsPoints.innerHTML = `<b>${free}</b> skill point${free === 1 ? "" : "s"} to spend`;
    el.skillsPoints.classList.toggle("has", free > 0);
    const focused = el.skillsBody.contains(document.activeElement) ? document.activeElement.dataset.learn : null;
    el.skillsBody.innerHTML = SKILL_BRANCHES.map(b => {
      const tiers = TIER_POINTS.map((need, tier) => {
        const open = tierOpen(state, b.id, tier);
        const nodes = SKILLS.filter(s => s.branch === b.id && s.tier === tier).map(s => skillNode(s, open)).join("");
        const label = open ? `<span class="tier-label">${["Tier I", "Tier II", "Capstone"][tier]}</span>` : `<span class="tier-label lock">${ICONS.lock} ${need} points in ${b.name}</span>`;
        return `<div class="skill-tier ${open ? "open" : "locked"}">${label}<div class="skill-nodes">${nodes}</div></div>`;
      }).join("");
      return `<section class="skill-branch" style="--branch: ${b.color}" aria-label="${b.name}">
        <header class="branch-head"><span class="branch-ico">${ICONS[b.icon]}</span><span class="branch-name"><b>${b.name}</b><small>${b.about}</small></span>
          <span class="branch-spent" title="Points spent in ${b.name}">${pointsSpent(state, b.id)}</span></header>${tiers}</section>`;
    }).join("");
    if (focused) {
      el.skillsBody.querySelector(`[data-learn="${focused}"]`)?.focus();
      showSkillDetail(focused);
    }
  }

  function skillNode(s, open) {
    const r = rankOf(state, s.id), can = canLearn(state, s.id);
    const st = !open ? "locked" : r >= s.max ? "maxed" : can ? "can" : "idle";
    const pips = Array.from({ length: s.max }, (_, i) => `<i class="${i < r ? "on" : ""}"></i>`).join("");
    return `<button type="button" class="skill-node ${st} ${r ? "learned" : ""}" data-learn="${s.id}" aria-disabled="${!can}" aria-label="${s.name}, rank ${r} of ${s.max}">
      <span class="node-ico">${ICONS[s.icon]}</span><span class="node-name">${s.name}</span><span class="node-pips" aria-hidden="true">${pips}</span></button>`;
  }

  function openShop(s) { state = s; el.shopCoins.textContent = s.coins; renderMarket(); renderGear(); selectTab("market"); showModal(el.shop); }
  function openBag() { renderBag(); showModal(el.bag); }
  function openBoard() { renderBoard(); showModal(el.board); }
  function openOrders() { renderOrders(); showModal(el.orders); }
  function openTrophies() { trophyPick = null; renderTrophies(); showModal(el.trophy); }
  function openSkills() { renderSkills(); el.skillsDetail.textContent = SKILL_HINT; showModal(el.skills); }
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
    anyDialogOpen: () => el.shop.open || el.bag.open || el.board.open || el.unlock.open || el.settings.open || el.skills.open || el.trophy.open || el.orders.open,
    openShop, openBag, openBoard, openSkills, openTrophies, openOrders, openPurchase, toast, refreshOpenPanels,

    updateHud(s, bucket, bucketProgress, region) {
      state = s;
      setText(el.coins, "coins", String(s.coins));
      setText(el.time, "time", TIME_LABELS[bucket]);
      if (last.bucket !== bucket) { last.bucket = bucket; el.timeChip.dataset.bucket = bucket; }
      el.timeBar.style.width = `${Math.round(bucketProgress * 100)}%`;
      setText(el.region, "region", region);
      setText(el.collection, "collection", `${s.discovered.length} / ${FISH.length}`);
      const cap = bagCapacity(s);
      setText(el.bagCount, "bag", `${s.inventory.length}/${cap}`);
      el.bagCount.classList.toggle("full", s.inventory.length >= cap);
      el.streak.hidden = s.streak < 1;
      setText(el.streakText, "streak", `×${s.streak} · +${Math.round(streakBonus(s.streak) * 100)}%`);
      el.streak.classList.toggle("max", s.streak >= STREAK.maxFish);
      const info = levelInfo(s.xp), free = pointsFree(s);
      setText(el.level, "level", `Lv ${info.level}`);
      el.xpBar.style.width = info.maxed ? "100%" : pct(info.into / info.needed);
      el.levelChip.title = info.maxed ? `Level ${info.level} (max)` : `Level ${info.level} · ${info.into} / ${info.needed} XP`;
      setText(el.skillPoints, "points", String(free));
      el.skillPoints.hidden = free <= 0;
    },

    levelUp() {
      el.levelChip.classList.remove("glow");
      void el.levelChip.offsetWidth; // restart the animation
      el.levelChip.classList.add("glow");
    },

    /** Fish Finder strip above the action button: species that can bite here right now. */
    setFinder(species, discovered, hunt = null) {
      const key = species ? species.map(f => f.id + (discovered.includes(f.id) ? "+" : "")).join() + (hunt ? `|${hunt.id}` : "") : "";
      if (last.finder === key) return;
      last.finder = key;
      el.finder.hidden = !species;
      if (!species) return;
      el.finder.innerHTML = `<span class="finder-label">${ICONS.eye}</span>` + species.map(f => {
        const found = discovered.includes(f.id);
        return `<span class="finder-fish ${found ? "found" : ""}" title="${found ? f.name : "Undiscovered"}">${fishSvg(f, { silhouette: !found, size: 44 })}<span>${found ? f.name : "?"}</span></span>`;
      }).join("") + (hunt ? `<span class="finder-fish legend" title="Something legendary is about">${fishSvg(hunt, { silhouette: true, size: 44 })}<span>?</span></span>` : "");
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
      const legend = show && FISH_BY_ID[session.encounter.speciesId].legendary && (session.phase === "bite" || session.phase === "fight");
      if (last.legend !== legend) {
        last.legend = legend;
        el.fishing.classList.toggle("boss", legend);
        el.legendBanner.hidden = !legend;
        document.body.classList.toggle("boss-fight", legend);
      }
      if (!show) return;
      const phase = session.phase;
      el.minigame.hidden = phase !== "fight";
      if (last.fishPhaseUi !== phase) {
        last.fishPhaseUi = phase;
        el.fishing.dataset.phase = phase;
        el.whisper.hidden = !(phase === "bite" && session.whisper);
        if (phase === "bite" && session.whisper) {
          const enc = session.encounter;
          el.whisper.innerHTML = `${fishSvg(FISH_BY_ID[enc.speciesId], { silhouette: true, size: 64 })}${rarityHtml(enc.rarity, 22)}`;
          el.whisper.title = RARITY_LABELS[enc.rarity];
        }
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
      if (f.boss) setText(el.mgBoss, "mgBoss", `${FISH_BY_ID[session.encounter.speciesId].name} · round ${f.rage + 1} / 3`);
      el.mgBoss.hidden = !f.boss;
      const label = f.secondWindAt !== undefined && f.elapsed - f.secondWindAt < 1.6 ? "secondwind" : f.enraged ? "rage" : f.fishPhase;
      if (last.mgPhase !== label) {
        last.mgPhase = label;
        el.mgPhase.hidden = label === "normal";
        el.mgPhase.innerHTML = label === "secondwind" ? `${ICONS.recovery} Second wind!` : label === "rage" ? `${ICONS.flame} Enraged!` : label === "burst" ? `${ICONS.burst} Burst!` : `${ICONS.sleep} Tired`;
        el.mgPhase.className = `mg-phase ${label}`;
        el.laneFish.dataset.phase = f.enraged ? "burst" : f.fishPhase;
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

    showCatchResult(session, result, xp = 0) {
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
        el.catchXp.textContent = "";
        el.catchStreak.textContent = "";
      } else {
        el.catchArt.innerHTML = fishSvg(species, { size: 160 });
        el.catchTitle.innerHTML = `${rarityHtml(enc.rarity, 28)} ${species.name}`;
        const price = priceOf(state, enc);
        el.catchDetails.innerHTML = `${RARITY_LABELS[enc.rarity]} · ${enc.sizeCm.toFixed(1)} cm · value ${coinHtml(price)}`;
        el.catchXp.textContent = xp ? `+${xp} XP` : "";
        el.catchStreak.innerHTML = enc.streakBonus ? `${ICONS.flame} Streak ${state.streak} · +${Math.round(enc.streakBonus * 100)}% value` : "";
        const cap = bagCapacity(state);
        if (result.newSpecies) {
          el.catchNote.textContent = `First ${species.name} you've caught! Where should it go?`;
          el.catchExtra.textContent = "";
          const full = state.inventory.length >= cap;
          el.catchBag.dataset.full = String(full);
          el.catchBagSub.innerHTML = full ? `Bag full (${state.inventory.length}/${cap})` : `Sell later for ${coinHtml(price)}`;
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
      const open = [el.unlock, el.shop, el.bag, el.board, el.settings, el.skills, el.trophy, el.orders].find(d => d.open);
      if (!open) return;
      if (performance.now() - (last.dialogOpenedAt ?? 0) < 350) return;
      if (open === el.unlock && !el.unlockPay.disabled) el.unlockPay.click();
      else open.close();
    },
    catchVisible: () => !el.catchCard.hidden,

    fade(on) { el.fade.classList.toggle("on", on); },
  };
}
