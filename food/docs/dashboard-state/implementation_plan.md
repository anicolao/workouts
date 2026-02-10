# Implementation Plan - UI Tidy Up & Log State Management

The goal is to refine the dashboard UI by removing redundant elements, ensuring state (date, scroll) is reflected in the URL for deep linking and restoration, and adding polished transitions for date navigation.

## User Review Required

> [!NOTE]
> The "Log New" link removal on the dashboard is a requested change.
> Behavior change: The Dashboard URL will now update to `/?date=YYYY-MM-DD` when navigating dates.

## Proposed Changes

### Dashboard (`src/routes/+page.svelte`)

#### [MODIFY] [src/routes/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+page.svelte)
-   **Remove "Log New" Link**: Delete `div.log-action` containing the "Log New" text link.
-   **URL State Synchronization**:
    -   Initialize `selectedDate` from `$page.url.searchParams.get('date')`.
    -   Update `goToPrevDay`, `goToNextDay`, and `selectedDate` updates to modify the URL params using `goto` (with `noscroll: true` to prevent jumping, though usually `replaceState` is preferred for soft updates, we want history entries for back button).
    -   Actually, for date navigation, pushing to history is good so "Back" works.
-   **Transitions**:
    -   Wrap the `.feed-list` content in a `{#key selectedDate}` block.
    -   Apply a transition (slide/fly) based on direction.
    -   Determine direction by comparing new date vs old date.

### Transitions Library (`src/lib/transitions.ts`)

#### [MODIFY] [src/lib/transitions.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/transitions.ts)
-   Expose reusable slide parameters if needed, otherwise define locally in `+page.svelte` for specific feed behavior.

### Activity Card (`src/lib/components/ui/ActivityCard.svelte`)

#### [MODIFY] [src/lib/components/ui/ActivityCard.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/ActivityCard.svelte)
-   User mentioned: "if I collapse a card, scroll, drill down, and then return, I expect to wind up where i started".
-   If `ActivityCard` has expanded/collapsed state, we should hoist that state or sync it.
-   I need to check `ActivityCard` content first.

## Verification Plan

### Automated Tests
-   **E2E Test**: Update or create a test in `tests/e2e/005-dashboard-state.spec.ts` (new file?).
    -   Verify "Log New" is gone.
    -   Verify URL updates when clicking Previous/Next day.
    -   Verify reloading page with `?date=...` loads correct date.
    -   Verify "Back" button works for date navigation.

### Manual Verification
-   **Browser Verification**:
    -   Open Dashboard.
    -   Click Next/Prev day. Watch URL.
    -   Reload page. Verify date persists.
    -   Scroll down, click an item (if navigable), go back. Verify scroll position (SvelteKit default behavior should handle this if we use standard navigation).
    -   Verify transitions slide in correct direction.

