# Macro Bubble Animation & Rendering Fix

## Changes Implemented

### 1. Robust Animation Logic
- **File**: `src/lib/components/ui/MacroBubble.svelte`
- **Change**: Replaced derived state with `tweened` store from `svelte/motion`.
- **Reason**: CSS transitions on the `d` attribute of SVG paths can cause visual artifacts (deformation) as control points shift. JS-based interpolation of the underlying value (`displayedValue`) ensures the path is recalculated smoothly frame-by-frame (`$derived.by`), resulting in a stable radial animation.

### 2. High-Fidelity Rendering (0% - >100%)
- **File**: `src/lib/components/ui/MacroBubble.svelte`
- **Change**: Implemented clamping logic for the *visual* progress.
  ```typescript
  // Clamp visual progress to 0.9999 to avoid "full circle" arc reset or inversion
  const progress = $derived.by(() => {
        const p = $displayedValue / max;
        return Math.min(Math.max(p, 0.0001), 0.9999);
  });
  ```
- **Reason**: SVG `A` (Arc) commands behave unpredictably when start and end points coincide (0% or 100%). Clamping to `0.9999` ensures a "visually full" circle without breaking the path definition.
- **Feature**: The displayed text (`{percent}%`) and value (`{Math.round($displayedValue)}`) are NOT clamped, allowing for >100% representation (e.g. "120%") while keeping the ring elegantly full.

### 3. Fixed Clipping on Small Arcs
- **File**: `src/lib/components/ui/MacroBubble.svelte`
- **Change**: Updated SVG filter to use `filterUnits="userSpaceOnUse"` instead of the default `objectBoundingBox`.
  ```html
  <filter id="glow-{label}" filterUnits="userSpaceOnUse" x="0" y="0" width={size} height={size}>
  ```
- **Reason**: When the arc is very small (e.g. 6%), its bounding box is tiny. The default `x="-50%"` padding (relative to the small bounding box) implies a pixel region too small to contain the `stdDeviation="3"` blur, resulting in a hard rectangular "clip" around the glow. Using `userSpaceOnUse` defines the filter region relative to the entire SVG canvas, ensuring the glow is never truncated.

## Verification
- **Animation**: The bubble now smooth-scrolls the number and grows/shrinks the ring without deformation.
- **Edge Cases**:
  - **Low Values (<10%)**: Glow is fully rendered, no rectangular clipping.
  - **0%**: Draws a tiny dot (0.0001) to prevent path collapse.
  - **100%**: Draws a nearly full circle (0.9999) without disappearing.
  - **>100%**: Draws a full circle, text shows >100%.

## Previous Work (Retained)
- **Settings Persistence**: Google Sheets wiring remains intact.
- **Dashboard Integration**: Real store data usage remains intact.
