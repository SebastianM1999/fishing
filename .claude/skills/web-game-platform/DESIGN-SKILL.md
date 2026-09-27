---
name: cozy-game-design
description: Visual design rules for a small AI-built cozy 2.5D game. Use for models, environments, maps, lighting, UI, VFX, and asset descriptions. Do not copy a named game's exact art style; express the reference as visual characteristics.
argument-hint: "[asset, scene, map, lighting, UI, or VFX task]"
---

# Cozy Game Design

## Direction

Build a cohesive, handcrafted-looking 2.5D world with very few assets. The game uses real 3D models, an orthographic or near-orthographic camera, simple geometry, strong composition, and atmospheric lighting.

Think: cozy, whimsical, handmade, slightly nostalgic, inviting.

Do not imitate a named game or artist literally. Translate references into properties such as:

> stylized low-poly 3D, orthographic village, chunky readable silhouettes, soft rounded shapes, muted natural palette, warm wood, earthy greens, cream and terracotta, matte materials, whimsical proportions, subtle imperfections, soft golden light.

## Models

- Low-poly, simple and readable.
- Chunky silhouettes and slightly exaggerated proportions.
- Few materials per asset.
- Matte/rough materials; avoid photorealism and excessive detail.
- Small imperfections are good.
- Reuse base shapes for variants.
- Prefer a small reusable kit over many unique assets.

Every asset description should cover: purpose, silhouette, proportions, materials/colors, one distinctive detail, and intended placement.

Characters use simple stylized proportions and a small shared animation set: idle, walk, interact/work, sleep.

## World

Use a small, composed world rather than a huge empty map.

Build with reusable families:

- ground/path
- trees/plants
- rocks
- fences
- buildings
- furniture/props
- water

Maps are structured data, not baked images. Store terrain, objects, buildings, spawn points, interaction points, and collision data separately from rendering.

Variation should come from placement, scale, rotation, color/tint, vegetation density, and lighting.

## Lighting

Lighting is a major part of the art direction.

Use a directional sun/moon with soft ambient fill. Make time of day visibly change the scene:

- dawn: cool shadows, warm horizon
- morning: soft warm light
- noon: clearer neutral light
- afternoon: warmer directional light
- sunset: orange/pink light and long shadows
- night: deep blue ambient light and warm windows/lamps

Use shadows, fog, emissive lights, water shimmer, and subtle particles for atmosphere.

## Motion and VFX

Keep motion gentle and readable: moving grass/leaves, water shimmer, dust/pollen, fireflies, smoke/steam, simple character idle motion, and restrained transitions.

Do not use spectacle to compensate for weak art direction.

## UI

The UI belongs to the same world:

- warm neutral surfaces
- soft rounded panels
- readable typography
- simple illustrated icons
- minimal chrome
- clear touch targets

Avoid generic SaaS/dashboard styling.

## Asset budget

Assume a tiny art budget. Reuse aggressively. A small starting library is preferable to hundreds of assets.

The goal is not maximum detail. The goal is that all generated assets look like they belong to the same game.

## AI rule

When an asset or scene is requested, inherit this visual direction automatically. Do not invent a new style per request.

Prefer one strong visual idea per asset. Generate simple first-pass assets and improve them through composition, lighting, materials, and reuse rather than adding geometry everywhere.

## Quality bar

The finished game should look deliberately art-directed, not like a pile of unrelated AI generations.

Prioritize:

1. consistency
2. silhouette and readability
3. composition
4. lighting and atmosphere
5. detail
