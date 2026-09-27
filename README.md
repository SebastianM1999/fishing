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
| Interact / cast / hook | `E` (or `Enter` / `Space`), or the action button | Action button |
| Reel (minigame) | Hold `Space` or hold the mouse button | Press & hold anywhere |
| Bag / Collection | `I` / `C` | Buttons (top right) |

## Layout

```text
js/game/        content data, state + save validation, time, world map/collision, fishing sim, economy
js/render/      Three.js scene built from world data; reads state each frame
js/input/       keyboard, pointer and joystick -> game actions
js/ui/          HUD, fishing panel, shop/bag/wallboard dialogs, procedural fish SVGs
js/persistence/ IndexedDB save slot
sw.js           hand-written service worker (versioned precache, cache-first)
tools/serve.mjs zero-dependency static dev server
```

## Offline / install

`sw.js` precaches the full app shell on first load; afterwards the game reloads and plays offline. The precache list is hand-maintained — add any new file to `PRECACHE` and bump `CACHE` when a precached file changes. During development, unregister the worker in DevTools → Application if cached files get in the way.

The web app manifest (`manifest.webmanifest`) is Baseline **limited** and is included as a progressive enhancement: browsers that ignore it still run the game normally.

Production hosting must use HTTPS (service workers require a secure context; `localhost` is exempt).
