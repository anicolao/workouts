# Log Again and Favourites Implementation Plan

## Goal Description
Implement "Log Again" and "Favourites" features to streamline logging for repeat items. "Log Again" allows duplicating an entry from its detail view, while "Favourites" offers quick access to frequently used "Log Again" items.

## User Review Required
> [!IMPORTANT]
> Image generation for UI mockups failed due to API limits. Please rely on the descriptions in `docs/FAVOURITES_DESIGN.md`.

## Proposed Changes

### State Management
#### [MODIFY] [store.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/store.ts)
- Add `log/logAgain` to event handling logic.
- Add `favourites` slice (or field within `projections`) to track frequently logged items.
- Define `FavouriteItem` interface.
- Implement reducer logic to upsert favourites upon `log/logAgain` events.

### UI Components

#### [MODIFY] [InputGrid.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/InputGrid.svelte)
- Add props to control "Log Again" visibility (`contextEntry: LogEntry | null`).
- Render "Log Again" button if `contextEntry` is present.
- Render "Favourites" button always.
- Emit events for `logAgain` and `favourites` selection.
- Update grid layout styles.

#### [MODIFY] [LogSheet.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/LogSheet.svelte)
- Ensure it can be opened programmatically with pre-filled data without triggering AI analysis.

#### [NEW] [FavouritesPicker.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/FavouritesPicker.svelte)
- Create a modal/sheet component to display the list of favourites.
- Handle empty state with the specified educational message.
- Emit selection event with `FavouriteItem` data.

#### [MODIFY] [log/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/log/+page.svelte)
- In `onMount`, check for `?from_entry=<id>` query parameter.
- Fetch source entry if parameter exists.
- Pass source entry to `InputGrid`.
- Implement handler for `logAgain`:
    - Dispatch `log/logAgain`.
    - Populate local state (`itemName`, `nutrition`, etc.) from source entry.
    - Set `sheetOpen = true`.
- Implement handler for `favourites`:
    - Open `FavouritesPicker`.
    - On selection: Populate local state and open sheet.

#### [MODIFY] [MobileNav.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/MobileNav.svelte)
- Update FAB link logic to append `?from_entry=<id>` if currently on an entry page (`$page.route.id` check).

## Verification Plan

### Automated Tests
#### [NEW] [tests/e2e/014-log-again/014-log-again.spec.ts](file:///Users/anicolao/projects/antigravity/food/tests/e2e/014-log-again/014-log-again.spec.ts)
- **Scenario 1: Log Again**
    1.  Seed an existing log entry.
    2.  Navigate to entry details.
    3.  Click FAB (+).
    4.  Verify "Log Again" button is visible and shows correct title/image.
    5.  Click "Log Again".
    6.  Verify Log Sheet opens with pre-filled data.
    7.  Save and verify new entry created.
- **Scenario 2: Favourites**
    1.  Verify "Favourites" button is visible on Log page.
    2.  Click "Favourites" (initially empty).
    3.  Verify empty state message.
    4.  Perform "Log Again" flow (triggers addition to favourites).
    5.  Go back to Log page -> Favourites.
    6.  Verify item is now in favourites list.
    7.  Select it and verify Log Sheet populates.
