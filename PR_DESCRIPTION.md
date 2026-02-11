## Feature: Configuration Sheet Sync

This PR implements the bidirectional synchronization between the App and the `Exercise Catalog` Google Sheet.

### Changes
-   **Auth**: Added `drive.file` and `spreadsheets` scopes to `auth.ts`.
-   **Config Sync**: Created `src/lib/config-sync.ts` which:
    -   Creates the `Exercise Catalog` sheet if it doesn't exist, using defaults from `CONFIG_SHEET_DESIGN.md`.
    -   Reads the sheet and dispatches `exercise/upsert` actions.
    -   Is triggered on login and token refresh.
-   **State**: Updated `reducer.ts` and `types.ts` to handle `exercise/upsert` and store exercises in `state.workout.exercises`.
-   **Tests**: Added `tests/e2e/config-sync.spec.ts` to verify the sync flow using mocked Drive/Sheets APIs.

### Verification
-   Run `npx playwright test tests/e2e/config-sync.spec.ts` to verify the logic.
-   Manual verification: Log into the app, check Google Drive for "Workouts Data" sheet, and verify "Exercise Catalog" is populated.
