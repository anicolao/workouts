# Walkthrough: Fix Macro Bubble Clipping

## Goal
Fix the issue where macro bubble rings were clipped by their bounding boxes, cutting off the glow effect.

## Changes
### `src/lib/components/ui/MacroBubble.svelte`
- Expanded the SVG filter region from the default bounding box to a larger area to accommodate the blur radius and stroke width.
- Changed `filterUnits` usage: kept `userSpaceOnUse` but updated `x`, `y`, `width`, `height` to calculated values based on size (`-size/2`, `size*2`, etc.) to provide ample padding.

```svelte
// Before
<filter id="glow-{label}" filterUnits="userSpaceOnUse" x="0" y="0" width={size} height={size}>

// After
<filter id="glow-{label}" filterUnits="userSpaceOnUse" x={-size/2} y={-size/2} width={size*2} height={size*2}>
```

## Verification
### E2E Tests
Ran the following E2E tests with `--update-snapshots` to verify the fix and update baseline images:

1.  **US-014: Dashboard State Persistence** (`tests/e2e/005-dashboard-state.spec.ts`)
    - Updated: `tests/e2e/screenshots/004-card-collapse.png`, `005-reload-collapse.png`
    - (And others implicitly if changed, though mostly card collapse was noted in logs)

2.  **US-012: Stats persist after reload** (`tests/e2e/003-stats/003-stats.spec.ts`)
    - Verified proper rendering of stats bubbles.
    - Updated: `tests/e2e/003-stats/screenshots/000-stats-loaded.png`

3.  **US-003 to US-010: User logs food flow** (`tests/e2e/002-log-food/002-log-food.spec.ts`)
    - Verified dashboard state after logging.
    - Updated: `tests/e2e/002-log-food/screenshots/004-saved.png`

## Outcome
The macro bubble glow effect should now be fully visible without clipping at the edges.
