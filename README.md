# Driftwood Cove — cozy fishing MVP

A small single-player 2.5D fishing game for the browser/PWA. Plain JavaScript ES modules, HTML, CSS, standard Web APIs and Three.js (vendored in `vendor/three/`). No build step, no dependencies to install.

## Run

```bash
node tools/serve.mjs 8080
```

Open http://localhost:8080/. Append `?debug` to expose a `window.cozy` test hook (state, clock, teleport) — used for automated browser verification only.

## Controls

| Action | Desktop | Touch |
|---|---|---|
| Move | WASD / arrow keys, or click the ground | Virtual joystick (bottom left) |
| Interact: cast, reel in, Continue, confirm/close dialogs | `E` (or `Enter`), or the action button | Action button |
| Hook on a bite | `Space` or mouse click | Tap |
| Reel (minigame) | Hold `Space` or hold the mouse button | Press & hold |
| Bag / Skills / close | `I` / `K` / `Esc` | Buttons (top right) |

## Progression

Start at the lake with 30 coins. Construction barriers close off the **river bank (250 coins)** and then the **beach & docks (750 coins, after the river)**; pay the builders at the barrier to open them for good. **Captain Olsen** on the sea dock sells the **boat (1000 coins)** for offshore fishing. **Mira** runs the tackle shop: sell fish, buy rod, reel, line and bag upgrades, and rethink your skills (refund all skill points for 25 coins × level).

**Coins buy equipment, XP buys technique.** Every landed fish earns XP (more for rare, legendary and big fish, +50 for a species' first catch, +5 for a perfect hook); lost fish earn nothing. Levels go up to 25 and each level gained gives one skill point. Press `K` for the skill tree: three branches — **Angler** (the fight), **Naturalist** (finding fish) and **Merchant** (money) — with three tiers each; tier II opens after 3 points in that branch, the capstone after 7.

**Catch streaks:** every fish landed in a row adds +2% sell value to the fish caught during the streak (up to +10% from the 5th fish on). A snapped line, an escape or a missed hook resets it; reeling in early doesn't.

The bag holds 8 sellable fish (upgrades: 15 for 200, 30 for 600); when it's full, other catches are released. The **first catch of a species** opens a golden card: mount it on the wallboard (no coins) or keep it in the bag to sell — the wallboard slot stays empty until you mount one. The collection board hangs **inside your house** (walk to the front door and press `E`): it remembers your best specimen per species (rarest, then biggest) — hover, focus or tap a slot to see it. Next to it, the **trophy shelf** holds your three proudest catches: mount any fish from your bag, swap it later, or take it down again (needs a free bag slot). Trophies can't be sold while they hang there.

## Audio

All sound is generated at runtime with the Web Audio API — no audio files. Generative music follows the time of day; nature ambience (birds, crickets, owls, gulls, river, wind, surf) follows where the player is; footsteps change with the ground surface. Audio starts on the first tap/key press (browser autoplay rules). Volumes for music, sounds and nature, plus mute, are in the settings (gear button, top right) and stored in `localStorage`.

## Layout

```text
js/game/        content data, state + save validation, time, world map/collision, fishing sim, economy
js/render/      Three.js scene built from world data; reads state each frame
js/input/       keyboard, pointer and joystick -> game actions
js/ui/          HUD, fishing panel, shop/bag/wallboard dialogs, procedural fish SVGs
js/persistence/ IndexedDB save slot
js/audio/       procedural music, ambience and sound effects
sw.js           hand-written service worker (versioned precache, cache-first)
tools/serve.mjs zero-dependency static dev server
```

## Offline / install

`sw.js` precaches the full app shell on first load; afterwards the game reloads and plays offline. The precache list is hand-maintained — add any new file to `PRECACHE` and bump `CACHE` when a precached file changes. During development, unregister the worker in DevTools → Application if cached files get in the way.

The web app manifest (`manifest.webmanifest`) is Baseline **limited** and is included as a progressive enhancement: browsers that ignore it still run the game normally.

Production hosting must use HTTPS (service workers require a secure context; `localhost` is exempt).
