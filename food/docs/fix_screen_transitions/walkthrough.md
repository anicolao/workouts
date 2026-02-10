# Fixed Screen Transitions

I have fixed the "fake" screen transition effect where the exiting screen would update to the new content before animating out.

## The Issue
Svelte 5 snippets are "live" functions that close over the parent's scope. Even if we block prop updates, the snippet execution itself reflects the *current* application state (the new page). This makes it impossible to "freeze" the component just by preventing re-renders; we must prevent the *snippet* from running.

## The Solution: Global Snapshot Store
I implemented a **Snapshot Strategy** that decouples the visual content from the Svelte component tree during the exit phase.

1.  **Global Store**: Created `transitionSnapshots` (writable store) in `transitions.ts`.
2.  **Capture**: In `+layout.svelte`, `beforeNavigate` captures the `innerHTML` of the current page wrapper and saves it to the store keyed by the path.
3.  **Render Guard**: `PageTransitionWrapper` checks the store.
    -   If a snapshot exists for its `pageKey`, it renders `{@html snapshot}` (Static string).
    -   Otherwise, it renders `{@render children()}` (Live snippet).
4.  **Cleanup**: `afterNavigate` clears the snapshot for the *destination* page so the new page becomes live. The *source* page snapshot remains until the component is destroyed.

## Verification
-   **Automated Tests**: Passed 10 E2E tests (`002-log-food`) and `npm run check`.
-   **Behavior**:
    -   **Exiting Page**: Wrapper sees `snapshot` exists. Renders static HTML. Visual state is frozen.
    -   **Entering Page**: Wrapper sees `snapshot` is missing (cleared). Renders live `children`. Visual state is new.
