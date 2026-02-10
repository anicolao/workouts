# Walkthrough - Favourites and Log Again

Implemented the "Log Again" and "Favourites" features to streamline food logging for repeat items.

## Changes

### 1. Store & Reducer Logic (`src/lib/store.ts`)
- Added `favourites` slice to `AppState` and `projections`.
- Added `FavouriteItem` interface (id, description, defaultNutrition, usageCount, lastUsed).
- Implemented `log/logAgain` event handling:
    - Finds source entry (if reusing existing) or just description.
    - Creates or Updates item in `favourites` list (increments count, updates timestamp).

### 2. UI Components
- **`InputGrid.svelte`**:
    - Added "Log Again" button (visible when viewing an entry).
    - Added "Favourites" button (always visible).
    - Updated to use `onclick` handlers (Svelte 5 ready).
- **`MobileNav.svelte`**:
    - Updated FAB to include `?from_entry={id}` query param when on an entry detail page, enabling "Log Again" context.
- **`FavouritesPicker.svelte`** (New):
    - Modal component to select from frequently used items.
    - Sorts by usage count.
- **`log/+page.svelte`**:
    - Added `LOG_AGAIN` and `FAVOURITES` modes.
    - Implemented logic to pre-fill form from:
        - `contextEntry` (Log Again).
        - Selected `FavouriteItem`.
    - Dispatches `log/logAgain` event on use.

### 3. Verification
- **E2E Test**: `tests/e2e/014-log-again/014-log-again.spec.ts`
    - Verifies "Log Again" button visibility and pre-fill functionality.
    - Verifies "Favourites" picker population and selection.
    - Verifies event dispatching (`log/logAgain`) tracking usage.
    - Verifies correct handling of "Today" vs "Yesterday" logic during testing.

## E2E Results
`npx playwright test tests/e2e/014-log-again/014-log-again.spec.ts` passed.

![Log Again Flow](/tests/e2e/014-log-again/screenshots/000-check-log-again.png)
![Pre-filled Form](/tests/e2e/014-log-again/screenshots/001-verify-prefill.png)
![Favourites Picker](/tests/e2e/014-log-again/screenshots/002-verify-favourites.png)
