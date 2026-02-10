# Macro Settings Feature Walkthrough

This document outlines the implementation and verification of the new Macro Settings feature for the Food Tracker application.

## Overview
The feature allows users to set daily calorie targets and macronutrient ratios (Protein, Fat, Carbs) via a dedicated settings page. The UI provides real-time visualization and ensures that macro ratios always sum to 100% using cascading adjustment logic.

## Changes Implemented

### 1. Macro Settings UI (`src/routes/settings/+page.svelte`)
- **Visual Donut Chart**: Implemented `DonutChart.svelte` to visualize macro breakdown with glowing segments.
- **Calorie Input**: Direct input for daily calorie target.
- **Interactive Sliders**: Custom range sliders for adjusting Protein, Fat, and Carbs.
- **Cascading Logic**: Implemented `adjustMacro` function to automatically balance other macros when one is adjusted (Priority: Target -> Next -> Next), ensuring 100% total.
- **Persisted State**: UI syncs with Redux store. "Save Changes" button is enabled only when changes are made (Dirty state detection).

### 2. State Management (`src/lib/store.ts`)
- **Settings Slice**: Added `settingsSlice` to Redux store to manage `targetCalories` and `macroRatios`.
- **Selectors**: Added `selectSettings` and `selectMacroTargetsGrams` for consuming data.
- **Persistence**: `save()` action dispatches `settings/goalsUpdated` event to update the store.

### 3. E2E Verification (`tests/e2e/005-settings/005-settings.spec.ts`)
- **Cascading Logic Test**: Verified that adjusting Protein slider automatically adjusts Fat and Carbs to maintain 100%.
- **Persistence Test**: Verified that settings are saved to the store and the "Save" button state updates correctly.
- **Visual Regression**: Verified that Donut chart and UI elements render correctly.

### 4. UI Polish (Feedback Round 2)
- **Editable Inputs**: Replaced static text with editable inputs for macro percentages and grams.
    - Implemented `adjustGrams` logic to convert gram input to percentage and trigger cascading adjustment.
- **Chart Improvements**: 
    - Fixed glow clipping by increasing internal padding.
    - Fixed animation artifacts by removing unstable transitions.
    - Added curved label text using `textPath`.
    - Improved slider thumb alignment.
- **Input Refinement**: Widened gram input fields by ~40% (3.5ch -> 5ch) to prevent clipping of 3-digit values.

### 5. Interaction & Layout (Feedback Round 3)
- **Visual Symmetry**: Added a "Red Ball" cap at the start of the Protein segment (on top of Carbs) to ensure consistent overlap styling.
- **Interactivity**: Added click handlers to chart segments.
    - Logic: Adds 5% if current value is multiple of 5, otherwise adds 1%.
- **Compact Layout**: Reduced vertical padding/margins by ~15% to better fit content on standard screens.

### 6. Final Polish (Feedback Round 4)
- **Styling Fixes**: Restored missing styles for "Sign Out" button and input fields.
- **Center Input**: 
    - Removed the separate "Daily Target" row.
    - Converted the center text "2000" into a fully editable input field.
    - Added a `z-index` fix to ensure interactivity.
- **Glow Blocker**: Added a dark "Blocker Circle" behind the Red Cap to hide the underlying Carbs segment glow, ensuring a clean, symmetrical look.

### 7. Glow & Height Refinement (Feedback Round 5)
- **Cyan Glow Fix**: Implemented a "Butt-Cap + Start-Circle" strategy. 
    - All path segments use `stroke-linecap="butt"` (flat ends).
    - Manually drawing a "Start Circle" for each segment creates the "Round Start" look.
    - Since the "End" is now flat, the Cyan glow doesn't protrude past the overlap point, solving the visual artifact.
- **Height Reduction**: Removed the redundant "Macro Split" title to further compact the UI.

### 8. Edge Artifact Fix (Feedback Round 6)
- **Blocker Sizing**: Shrunk the dark "Blocker Circle" radius by 2px (from 25px to 23px).
    - This ensures it stays fully contained within the opaque center of the Red Ball, preventing any dark edge/stroke artifacts caused by anti-aliasing or blur bleed-through.

### 9. Focus Outline Fix (Feedback Round 7)
- **Artifact Removal**: Disabled the default browser focus outline on interactive chart segments (`.segment-path { outline: none; }`).
    - This removes the unsightly yellow/blue border box that appeared when clicking on segments to edit them.

### 10. UX Improvement (Feedback Round 8)
- **Save Action**: Replaced the interstitial `alert('Goals saved!')` with an automatic redirection to the dashboard (`/`).
    - This streamlines the flow, allowing users to immediately see their new goals in context.

## Verification Results

### Automated E2E Tests
The Playwright test suite `tests/e2e/005-settings/005-settings.spec.ts` passes successfully.

```bash
Running 1 test using 1 worker
[chromium] › tests/e2e/005-settings/005-settings.spec.ts:4:1 › User configures macro settings      
Debug State: Dirty: false
            DiffCals: 0
            DiffP: 0
  1 passed (1.9s)
```

### Key Logic Verification
- **Redux Proxy Handling**: Fixed a critical issue where passing Svelte 5 `$state` proxies to Redux caused a crash (`state_descriptors_fixed` error). Implemented payload sanitization (sending plain objects) to resolve this.
- **Robust State Sync**: Implemented optimistic local state update to ensure UI responsiveness while dispatching to store.

## Next Steps
- Integrate the macro targets into the main Dashboard (`+page.svelte`) to show progress against these goals.
- Sync these settings to Google Sheets in the `syncToSheets` middleware (future task).
