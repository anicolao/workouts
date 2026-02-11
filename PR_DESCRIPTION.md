# Feature: Action Persistence & Sync Status UI

## Description
This PR introduces action logging to Google Sheets and a visible Sync Status UI. 

- **Action Log**: User actions (start workout, log set, etc.) are now appended to an `InternalEventLog` spreadsheet in the `Workouts` folder.
- **Sync Status**: Users can now see the current sync status (Synced, Syncing, Error) via an icon in the header.
- **Sync Page**: A dedicated page `/sync` details the last sync time and allows forcing a sync.
- **Config Sync**: Includes the foundation for syncing exercise configuration from a generic `Exercise Catalog` sheet.

## Implementation Details
- **Middleware**: `actionLogMiddleware` in Redux store intercepts actions.
- **Drive/Sheets API**: `drive-utils.ts` and `action-log.ts` handle API interactions.
- **State Management**: Redux state updated to track `syncStatus` and `lastSync`.
- **E2E Testing**: `tests/e2e/action-persistence.spec.ts` covers the full flow with mocked APIs.

## Verification
- Ran E2E tests successfully.
- Verified mocked API interactions for sheet creation and appending.
