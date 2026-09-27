---
name: web-game-platform
description: Build small web-first games with plain Web APIs and Three.js. Use one browser/PWA codebase for web, Google Play, and Steam. Favor small, asset-light, AI-friendly 3D/2.5D games.
argument-hint: "[game feature, system, UI, asset, performance, PWA, Android, or Steam task]"
---

# Web Game Platform

Companion design skill: read `DESIGN-SKILL.md` before creating or reviewing models, environments, maps, lighting, VFX, UI, or other visual output. It is the source of truth for the game's visual language and asset description rules.
Companion game skill: read `GAME-SKILL.md` before implementing or reviewing gameplay, progression, fish data, the catch minigame, economy, collection board, locations, or scope. It is the source of truth for the fishing game mechanics and one-shot product requirements.

## Rules

- Use **JavaScript ES modules, HTML, CSS, standard Web APIs, and Three.js**.
- Follow platform-first web conventions: semantic HTML for non-canvas UI, accessible controls, visible focus states, keyboard operability, responsive CSS, CSS custom-property design tokens, and modern web standards over custom reimplementations.
- Prefer native browser UI primitives where they fit (`button`, `input`, `dialog`, `details`, etc.). The game itself is intentionally JavaScript-driven; do not force a no-JavaScript/progressive-enhancement requirement onto the game loop.
- Apply progressive-enhancement thinking to surrounding UI and shell features: a feature should fail locally and explicitly rather than taking down unrelated parts of the game.
- Use a conservative browser-support/Baseline policy for newer Web APIs; feature-detect APIs that are not broadly available instead of assuming support.
- No React, Vue, Svelte, Lit, Phaser, PixiJS, Unity, Godot, or other game frameworks/engines.
- Three.js is the only in-world renderer.
- Keep game state/rules in plain JavaScript; Three.js objects are views of that state.
- No backend for local single-player unless a real feature requires one.
- Keep dependencies few and explicit.
- Browser/PWA is the source of truth.
- Core gameplay must work offline.

## Stack

- **Three.js**: scene, camera, models, animation, lighting, shadows, materials, particles, picking.
- **HTML/CSS**: menus, dialogs, inventories, settings, HUD and other text-heavy UI.
- **Pointer Events**: mouse + touch.
- **Keyboard Events**: desktop controls.
- **Gamepad API**: optional controller support.
- **Web Audio API**: sound/music.
- **IndexedDB**: saves and structured local data.
- **localStorage**: tiny preferences only.
- **Service Worker + Cache API**: offline PWA.
- **Web App Manifest**: installation metadata.
- Use JSDoc when useful; do not add TypeScript just for types.

Use Three.js official ESM addons when needed, such as `GLTFLoader`.

## Architecture

Keep simulation independent from rendering.

```text
js/game/       state, rules, RNG, simulation
js/render/     Three.js scene, camera, lighting, assets
js/input/      input -> actions
js/ui/         HTML/CSS UI
js/persistence/ saves
assets/        models, textures, icons
art/           style.md, asset-manifest.json
world/         map data/generation
desktop/       Electron shell only
```

Do not create files just to match this example.

### Simulation

- Game state is plain data.
- Never use meshes, DOM nodes or CSS as game state.
- Keep randomness behind one seeded RNG.
- Keep content in data modules/JSON where practical.

### Rendering

Use Three.js for all world rendering.

For cozy top-down/Stardew-like games:

- Prefer an orthographic or constrained perspective camera.
- Treat the world as **2.5D** when that reduces complexity.
- Use real 3D models for characters, buildings, props and vegetation.
- Use `.glb`/`.gltf` through `GLTFLoader`.
- Use raycasting for picking.
- Keep collision shapes separate from meshes.
- Prefer simple circles/rectangles/capsules/grid collision before adding physics.

Do not put gameplay rules inside Three.js scene objects.

### Input

Convert physical input into game actions. The simulation must not care whether an action came from touch, mouse, keyboard or gamepad.

### Game loop

Use `requestAnimationFrame`. Do not use `setInterval` as the primary simulation clock.

## Art Direction

Read `DESIGN-SKILL.md` before generating a large asset set. It is the primary visual specification.

Every generated asset follows that specification. Do not create a competing style bible. A project-local `art/style.md` may only be a generated copy when a tooling workflow genuinely needs one.

Prefer a small reusable kit over many unique assets. Create variety through composition, materials, color variants, animation and procedural placement.

## AI Asset Pipeline

Use AI to generate **development assets**, not runtime assets.

```text
style.md
   -> concept/reference
   -> text-to-3D or image-to-3D
   -> GLB
   -> simplify/scale/validate
   -> asset-manifest.json
   -> Three.js
```

### Models

- A text prompt is enough for a first-pass simple prop.
- Use a **reference image** when consistency matters.
- For recurring characters/hero assets, prefer image or multi-view -> 3D over unrelated text prompts.
- Reuse a small set of base assets and generate variants rather than inventing every object independently.
- Keep generated geometry and textures at game/web scale; do not ship maximum AI output by default.
- AI 3D services may be used during development through CLI/API. They are not runtime dependencies. Never expose their keys in the browser.

### Sprites

This project is 3D/2.5D. Do not make sprites the primary world representation.

Use 2D images mainly for UI icons, portraits, decals, simple VFX or backgrounds when cheaper than geometry.

### Maps

Do not make an AI-generated image the final map.

Represent maps as structured data and build them deterministically. Example categories: terrain, roads, water, spawn points, buildings and prop placements.

Use AI to propose layout ideas and constraints; convert them into validated JSON/data that the game can regenerate.

### Asset manifest

Track source metadata so assets can be replaced consistently:

```json
{
  "id": "oak_tree_01",
  "file": "assets/models/oak_tree_01.glb",
  "style": "cozy-low-poly",
  "source": "image-to-3d",
  "prompt": "...",
  "reference": "..."
}
```

## Lighting

Make lighting a first-class system because it provides cheap visual polish.

For cozy 2.5D games:

- one main directional sun light
- restrained ambient/fill light
- selective shadows
- a small number of warm local lights at night
- sky/background/fog changes driven by game time

Drive the entire day/night presentation from one deterministic `timeOfDay` value.

## Persistence

Use IndexedDB for saves. Use localStorage only for tiny preferences.

Version saves and handle missing, corrupt and old data safely. Save after meaningful state changes, not every frame.

## PWA

- Production must use HTTPS.
- Use a root `sw.js`.
- Cache the app shell with the Cache API.
- Version cache names and delete old caches on activation.
- Test cold launch with the network disabled.
- Manifest must define name, start URL, standalone display, theme/background colors and icons.
- Do not use Workbox unless a concrete need appears.

## Google Play

Use a **Trusted Web Activity (TWA)** around the PWA.

- Keep Android packaging outside the game.
- Launch the owned HTTPS PWA fullscreen.
- Configure Digital Asset Links.
- Produce an Android App Bundle.
- Do not add Android-specific gameplay code.

## Steam

Use **Electron** as the thin desktop shell.

- Keep Electron code under `desktop/`.
- Game code must not import Electron APIs.
- Load the packaged local web build.
- Disable `nodeIntegration` and enable `contextIsolation`.
- Keep Steam-specific features behind tiny adapters.
- Steam integration must not be required for the first playable build.

The same web build must run in a normal browser.

## Performance

- Keep initial assets small.
- Reuse geometry/materials for repeated objects.
- Avoid unnecessary per-frame allocations.
- Limit dynamic shadows/lights.
- Pause/reduce work when hidden.
- Dispose of unused Three.js geometries, materials and textures.
- Measure real browser performance before optimizing; for the game, inspect frame time, long main-thread tasks, draw calls, triangle/texture counts, asset transfer size, and memory growth in addition to normal browser performance signals.



## Goal and Verification Loop

When a `/goal` is provided, treat the companion game and design skills as fixed constraints. Convert the goal into concrete acceptance criteria before coding.

Do not stop after writing code. Use this loop:

```text
read goal -> inspect implementation -> implement -> run -> verify -> fix -> verify again
```

At minimum verify:

- no uncaught browser console errors
- the changed gameplay path is playable from a clean launch
- saves load correctly when persistence is affected
- required assets load without 404s or missing-model errors
- the production build still launches
- PWA/offline behavior is not broken by the change
- Three.js frame-time problems are not introduced by obviously unnecessary per-frame work

A goal is complete only when its acceptance criteria pass.

## AI Development Rules

- Keep modules small enough to understand in one context window.
- Prefer explicit code over abstractions.
- Keep content separate from algorithms.
- Never add another renderer/framework.
- Before generating visual assets, read `DESIGN-SKILL.md` and update `asset-manifest.json`.
- Preserve style, scale, naming and material conventions when changing assets.
- Prefer deterministic map generation, object placement and simulation.
