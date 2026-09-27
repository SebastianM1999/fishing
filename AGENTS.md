# Agent guide — Driftwood Cove

Cozy 2.5D fishing game for the browser/PWA. Plain JavaScript ES modules, HTML, CSS, Web APIs and Three.js (vendored in `vendor/three/`, loaded via an import map). **No build step, no npm dependencies, no frameworks.** See `README.md` for controls, progression and layout.

## Skills (read before working)

Project skills live in `.claude/skills/`:

- `cozy-fishing-game` — **canonical game spec** (fish, rarity, pricing, minigame, gear, boat, wallboard, definition of done). Supersedes the legacy `web-game-platform/GAME-SKILL.md`.
- `cozy-game-design` — visual direction (low-poly, warm palette, lighting per time of day, cozy UI). Same content as `web-game-platform/DESIGN-SKILL.md`.
- `web-game-platform` — tech rules: allowed stack, architecture (simulation separate from rendering), persistence, PWA, verification loop.
- `web-pwa` — hand-written service worker and manifest rules.

**The user's explicit requests override the skills.** The game has intentionally diverged from `cozy-fishing-game` in these ways:
- bag capacity 8/15/30 with bag upgrades;
- per-species best-catch records shown on wallboard hover;
- a golden first-catch card where the player chooses the wallboard (0 coins) or the bag;
- construction barriers: river 250 coins, then sea 750;
- the boat is sold by an NPC at the sea dock;
- shopkeeper, boat-seller and notice-board (Nell) NPCs;
- leveling + skill tree (coins buy gear, XP buys technique), no hooks or tackle;
- an enterable house with the collection board and a 3-spot trophy shelf;
- daily village orders, catch streaks and 4 named legendary fish (collection 24).

Don't "fix" these back to the spec.

## Run & test

- Dev server: `node tools/serve.mjs 8080` (also in `.claude/launch.json`), then open http://localhost:8080/.
- `?debug` exposes `window.cozy`: state, game, rng, content, fishing, economy, `saveNow`, `setTime`, `teleport`, audio, `renderInfo`. `?debug&reset` deletes the save.
- **Test in an isolated browser (Playwright).** Never reset, teleport or edit state in the user's own browser tab; it holds their real save.
- The service worker is cache-first, so dev edits can be served stale. Before testing: unregister the worker and clear caches (for example from an off-app URL like `/icons/icon-192.png`), then reload.
- Before calling work done, check for:
  - no console errors;
  - desktop layouts at 1280×720 and 1440×900;
  - save/reload still working;
  - an offline reload.

## Rules that are easy to miss

- **Service worker:** when you add a file, add it to `PRECACHE` in `sw.js`. On **every** change to a precached file, bump the `CACHE` version in `sw.js`.
- **Saves:** they are versioned (`SAVE_VERSION` in `js/game/state.js`). When the state shape changes, bump the version, migrate older saves in `deserialize()`, and keep it defensive: it must never throw and must drop invalid data.
- **Code placement:**
  - Game rules and content stay in `js/game/` as plain data with no DOM or Three.js. Content (fish, gear, prices, tuning) lives in `js/game/content.js`.
  - Rendering (`js/render/`) only reads state.
  - UI (`js/ui/`) calls handlers wired in `js/main.js`.
- **Art:**
  - All art is procedural: low-poly meshes (`js/render/models.js`, `kit.js`), SVG fish portraits (`js/ui/fishArt.js`), SVG icons (`js/ui/icons.js`) and Web Audio sound (`js/audio/audio.js`). There are no asset files, with one exception: the music is composed MIDI in `assets/music/*.mid`, converted by `tools/midi2js.mjs` into `js/audio/tracks.js` (checked-in note data played by the Web Audio synth). After changing a `.mid` file, re-run `node tools/midi2js.mjs` and bump `CACHE` in `sw.js`.
  - Static scenery is batched by material.
  - Custom shaders need a unique `customProgramCacheKey`.
- **Controls the user asked for:**
  - `E` interacts everywhere, including Continue and confirming or closing dialogs.
  - `Space` or mouse click hooks and reels. Catching inputs must never close the catch card.
  - `B` keeps a first catch in the bag.
  - `I` opens the bag, `K` the skill tree, and `Esc` closes. There is no collection hotkey: the collection board and trophy shelf only open inside the house.
- The user prefers icons over text in the UI and a warm, cozy look over generic styling.

## Git

- Commit after big changes, with a clear message ending in `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Never push** unless the user asks.
- `.gitignore` covers node_modules, dist, .env and Playwright output.
