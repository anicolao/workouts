# Implementation Plan - Macro Settings

This plan outlines the implementation of customizable daily calorie and macronutrient goals, including a specialized UI with cascading adjustment logic.

## User Review Required
> [!IMPORTANT]
> The "Priority Cascading" logic (Protein -> Fat -> Carbs) is hardcoded as per design. Changing one value automatically adjusts the others to maintain 100%.

## Proposed Changes

### Store
#### [MODIFY] [store.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/store.ts)
- Add `SettingsState` interface.
- Add `settingsSlice` with `targetCalories` and `macroRatios`.
- Add selectors: `selectSettings`, `selectMacroTargetsGrams`.

### UI Components
#### [NEW] [DonutChart.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/DonutChart.svelte)
- Renders an SVG donut chart with 3 segments (Protein, Fat, Carbs).
- Accepts `ratios` { protein, fat, carbs } and `colors`.
- Animated transitions for segment changes.

#### [MODIFY] [settings/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/settings/+page.svelte)
- Implement full settings form.
- **State**: Local state for `editValues` (preserving valid CSS types until save).
- **Logic**: Implement `adjustMacro(type, newValue)` with cascading overflow handling.
- **Visuals**: Use `glass-panel` class.
- **Interaction**: Sliders and numeric inputs synchronized.

### Testing
#### [NEW] [005-settings.spec.ts](file:///Users/anicolao/projects/antigravity/food/tests/e2e/005-settings/005-settings.spec.ts)
- Verify default values.
- Verify sliding one macro adjusts others correctly (Cascade logic).
- Verify "Save" updates the store (persisted via event log).
- Verify "Sign Out" still works.

## Verification Plan

### Automated Tests
Run the new E2E test suite:
```bash
npx playwright test tests/e2e/005-settings
```

### Manual Verification
1.  Navigate to `/settings`.
2.  Change default calories to 2500.
3.  Increase Protein %. Observe Fat/Carbs decreasing according to priority.
4.  Click Save.
5.  Reload page (verifying persistence if we were using a real backend, but for this session, verifying store update).
