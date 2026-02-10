# Implementation Plan - Fix Screen Transitions

The current screen transitions are exhibiting a "fakery" effect where the exiting screen updates to the new content before flying out, resulting in the new screen animating out AND the new screen animating in. This is caused by Svelte 5's reactivity updating the `children` snippet in `+layout.svelte` before the `#key` block destroys the old wrapper.

To fix this, we will introduce a `PageTransitionWrapper` component that captures the `children` snippet as a prop. When the route key changes, the parent layout creates a **new** wrapper instance for the new route, while the **old** wrapper instance (which is transitioning out) retains its original `children` prop, effectively freezing the old content.

## User Review Required

> [!NOTE]
> This change introduces a new component `src/lib/components/ui/PageTransitionWrapper.svelte`. It is purely structural and shouldn't affect the visual styling other than fixing the transition content.

## Proposed Changes

### UI Components

#### [NEW] [PageTransitionWrapper.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/PageTransitionWrapper.svelte)
- A component that accepts `children: Snippet` and `pageKey: string`.
- **Snapshot Logic**: 
    - Subscribes to a global `transitionSnapshots` store.
    - If a snapshot string exists for the current `pageKey`:
        - Renders the snapshot via `{@html snapshot}`.
        - This effectively freezes the DOM for the "Exit" transition.
    - Else:
        - Renders `{@render children()}` (Live content).
    - Wraps content in a `div` with `display: contents` to serve as the snapshot source without affecting layout.

#### [MODIFY] [transitions.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/transitions.ts)
- Add `transitionSnapshots` writable store (Record<string, string>).

#### [MODIFY] [+layout.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+layout.svelte)
- Import `beforeNavigate`, `afterNavigate`.
- `beforeNavigate`: Capture `innerHTML` of the current wrapper into `transitionSnapshots`.
- `afterNavigate`: Clear the snapshot for the *destination* path (so the new page renders live). The *source* path snapshot remains for the exit animation.

### Routes

#### [MODIFY] [+layout.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+layout.svelte)
- Import `PageTransitionWrapper`.
- Replace the direct `{@render children()}` inside the `#key` block with `<PageTransitionWrapper {children} pageKey={$page.url.pathname} />`.

## Verification Plan

### Automated Tests
- Run existing E2E tests to ensure no regressions in navigation or layout.
- `src/routes/+layout.svelte` changes are fundamental, so `001-auth.spec.ts` and `002-log-food.spec.ts` are good regression targets.

### Manual Verification
1.  **Serve** the app locally (`npm run dev`).
2.  **Navigate** from Home (`/`) to Settings (`/settings`).
    -   **Expected**: The Home screen (List) should slide OUT to the LEFT. The Settings screen should slide IN from the RIGHT.
    -   **Failure**: If the Home screen turns into the Settings screen *before* sliding out.
3.  **Navigate** from Settings back to Home.
    -   **Expected**: The Settings screen should slide OUT to the RIGHT. The Home screen should slide IN from the LEFT.
4.  **Navigate** to a Detail view (e.g., Log or Entry).
    -   Check the same "old content exits, new content enters" behavior.
