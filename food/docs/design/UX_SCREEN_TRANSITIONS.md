# User Experience: Screen Transitions

## Goal
Replace the instantaneous "pop" of screen changes with smooth, physical sliding transitions that convey spatial relationships between screens. The interface should feel like a cohesive physical space where users slide deeper into details and slide back out to the high-level view.

## Navigation Topology

We define a hybrid **Spatial + Contextual** system.

### 1. Horizontal Axis (Main <-> Settings)
*   **Visual Logic**: Home is **Left**, Settings is **Right**.
*   **Routes**: `/` (Left) <---> `/settings` (Right).
*   **Transition**:
    *   **To Settings**: Always slides in from **Right** (pushing current Left).
    *   **To Home**: Always slides in from **Left** (pushing current Right).

### 2. Vertical Axis (The "Log" Modal)
*   **Visual Logic**: The Log screen lives "below" the viewport, acting like a full-screen sheet.
*   **Routes**: To/From `/log`.
*   **Transition**:
    *   **Open Log**: Log slides **UP** from bottom. The underlying screen is pushed **UP** off the top.
    *   **Close Log**: Log slides **DOWN** off the bottom. The destination screen slides **DOWN** from the top.

### 3. Drill Down (Contextual Items)
*   **Visual Logic**: Detail view is "inside" or "to the right" of the parent list item.
*   **Routes**: `/` -> `/entry/[id]`.
*   **Transition**:
    *   **View Entry**: Entry slides in from **Right** (pushing Home Left).
    *   **Back to Feed**: Treated as "To Home" (Home slides in from Left).

## Implementation Specification

### 1. Direction Calculation
We will use a priority-based resolver helper `getTransitionParams(from, to)`.

```typescript
type Direction = 'left' | 'right' | 'up' | 'down' | 'crossfade';

// Priority Heuristic
function getTransition(from: string, to: string) {
    // 1. Vertical overrides (Logging) - HIGHEST PRIORITY
    // Going TO Log -> Always Slide UP (Enter Bottom)
    if (to.includes('/log')) return { enter: 'bottom', exit: 'top' }; 
    // Leaving Log -> Always Slide DOWN (Enter Top)
    if (from.includes('/log')) return { enter: 'top', exit: 'bottom' };

    // 2. Global Target Rules
    // To Settings -> Always Enter Right
    if (to === '/settings') return { enter: 'right', exit: 'left' };
    
    // To Main -> Always Enter Left
    if (to === '/') return { enter: 'left', exit: 'right' };

    // To Entry -> Drill Down (Enter Right)
    if (to.includes('/entry')) return { enter: 'right', exit: 'left' };

    // Default: Crossfade
    return { enter: 'crossfade', exit: 'crossfade' }; 
}
```

### 2. Layout Transitions
We will use Svelte's `fly` and `fade` transitions dynamically.

*   **View Management**: CSS Grid stacking (`grid-area: 1/1/2/2`) to allow overlap.
*   **Params**:
    *   `enter: 'bottom'` -> `in: fly={{ y: 100% }}`, `out: fly={{ y: -100% }}`
    *   `enter: 'top'` -> `in: fly={{ y: -100% }}`, `out: fly={{ y: 100% }}`
    *   `enter: 'right'` -> `in: fly={{ x: 100% }}`, `out: fly={{ x: -100% }}`
    *   `enter: 'left'` -> `in: fly={{ x: -100% }}`, `out: fly={{ x: 100% }}`
    *   `enter: 'crossfade'` -> `in: fade, out: fade`

### 3. Edge Cases
*   **Browser Back Button**: Handled naturally by the target-based logic (e.g., hitting Back from Settings to Home triggers `to: /` logic).
*   **Lateral Moves**: Direct navigation between siblings (if added later) relies on the target rule or falls back to crossfade.

## Verification
*   **Manual**: Open Settings -> Slide Left. Click Back -> Slide Right.
*   **Manual**: Open Log -> Slide Up. Close Log -> Slide Down.
*   **Manual**: Tap Entry -> Slide Left. Back -> Slide Right.
