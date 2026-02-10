# Calorie Rings UI Refinement Walkthrough

## Changes

### 1. StatsRing Label & Glow
- **Label**: Changed default label from "Tokens" to "kcal". Positioned "kcal" below the value.
- **Layout**: "Value / Max" are now on the same line.
- **Visuals**: Added SVG glow filter `glow-shadow` and increased `strokeWidth` to 20px (Fatter rings).

### 2. MacroBubble Enhancements
- **Icons**: Generated 3D neon icons (Protein/Chicken, Carbs/Bread, Fat/Avocado) using `generate_image`, saved to `static/images/`, and integrated via `<img>` tags.
- **Icon Transparency**: Applied `mix-blend-mode: screen` to remove black backgrounds from the generated icons.
- **Blending Fix**: Added `background-color: var(--bg-card)` and `border-radius: 50%` to the inner content container to establish a correct stacking context for the blend mode to work against.
- **Layout**: Complete overhaul. Stats (Label + Value/Max) are now inside the ring along with the icon. 
- **Typography on Path**: Implemented SVG `<textPath>` to rotate the percentage text (e.g., "83%") so it follows the curvature of the ring progress.
- **Visuals**: Increased `strokeWidth` to 14px (Fatter rings) and added specific glow filters.

### 3. Component Integration
- Updated `src/routes/+page.svelte` to use the new `StatsRing` props and pass image paths to `MacroBubble`.

## Verification Results

### Automated Tests
- **E2E Tests**: Ran `npx playwright test`.
- **Visual Regression**: Updated snapshots (`--update-snapshots`) to reflect the new UI structure.
- **Functional Tests**: Updated `003-stats.spec.ts` to assert the new text format "20 / 180 g".

### Test Execution Summary
All tests passed after assertion updates and snapshot regeneration.

```
Running 6 tests using 1 worker
...
15 passed (2m)
```
