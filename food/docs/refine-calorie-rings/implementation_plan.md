# Calorie Rings UI Refinement Plan

## Goal Description
Refine the Visual design of the calorie and macro rings to match the provided mockups/screenshots. Key changes include updating labels, enhancing glow effects, and adjusting the layout of percentages and icons.

## User Review Required
- [ ] Confirm if "kcal" is the exact desired label for the main ring (implied by screenshot).

## Proposed Changes

### UI Components (Round 2)
#### [MODIFY] [StatsRing.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/StatsRing.svelte)
- Increase `strokeWidth` (e.g., from 8 to 16 or 20) to make it "fatter".

#### [MODIFY] [MacroBubble.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/MacroBubble.svelte)
- Increase `strokeWidth`.
- **Text Rotation**: Use SVG `<textPath>` referencing the progress arc (or a defined path) to make the percentage text follow the curve. Position it near the end of the path.
- **Layout**: Move label and value *inside* the ring (absolute positioning or SVG foreignObject/text).
- **Icons**: Replace `snippet` usage with `<img>` tags pointing to generated assets.

#### [MODIFY] [routes/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+page.svelte)
- Remove SVG snippets.
- Pass paths to new generated icons (e.g., `/images/icon-protein.png`) to `MacroBubble`.

### Asset Generation
- Use `generate_image` to create:
    - `icon_protein_chicken.png`: "Small minimal simple 3d render icon of a chicken leg, glowy neon purple style on black background"
    - `icon_carbs_bread.png`: "Small minimal simple 3d render icon of a loaf of bread, glowy neon blue style on black background"
    - `icon_fat_avocado.png`: "Small minimal simple 3d render icon of an avocado half, glowy neon yellow/gold style on black background"
    - Note: User said "nanobanana" (generate_image). I will try to match the "glowy" aesthetic.

## Verification Plan

## Verification Plan
### Automated Tests
- Run `npx playwright test` to ensure no regressions.
- Check if visual snapshots need updating (users command `npx playwright test --update-snapshots` suggests this is standard procedure).

### Manual Verification
- Since I cannot see the rendered UI, I will rely on code structure matching the requirements and potential screenshot comparisons if the tool allows, or just careful code review.
