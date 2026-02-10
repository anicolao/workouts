# Walkthrough - Offline Support

I have implemented full offline support for the Food Tracker application. This ensures that users can log food entries even when they don't have an active internet connection. The data is stored locally first and then synchronized with Google Sheets when the connection is restored.

## Changes

### Core Infrastructure

-   **IndexedDB (`src/lib/db.ts`)**: Added a local database layer using `idb` to store events persistently in the browser.
-   **Redux Sync Middleware (`src/lib/redux-sync-middleware.ts`)**: Created a middleware that intercepts logging actions, saves them to IndexedDB, and triggers the sync manager.
-   **Sync Manager (`src/lib/sync-manager.ts`)**: Implemented the logic to handle background synchronization, network status monitoring, and batch uploading to Google Sheets.

### UI Components

-   **Network Status**: Added a visual indicator (`src/lib/components/ui/NetworkStatus.svelte`) to the sidebar and mobile nav, showing the current connection state (Online, Offline, Syncing) and the number of pending items.
-   **Optimistic UI**: The dashboard and log views now update immediately based on local state, without waiting for server confirmation.
-   **Settings Page**: Added a network settings page (`src/routes/settings/network/+page.svelte`) for detailed status.

### Testing

-   **E2E Test (`tests/e2e/010-offline-sync.spec.ts`)**: Added a comprehensive test scenario that:
    1.  Preloads the application.
    2.  Simulates offline mode.
    3.  Logs a food item via the "Sheet Open" flow (simulated image upload failure handled gracefully).
    4.  Verifies the item appears on the dashboard immediately.
    5.  Verifies the "Offline" status indicator.
    6.  Simulates coming back online.
    7.  Verifies the status changes to "Synced".
    8.  Reloads the page to ensure data persistence.

## Verification Results

### Automated Tests

The new E2E test passes successfully, confirming the end-to-end offline flow.

```bash
npx playwright test tests/e2e/010-offline-sync.spec.ts
```

### Manual Verification Steps

1.  **Go Offline**: Disable your internet connection or use the browser's "Offline" mode in DevTools.
2.  **Log Food**: Take a photo (or select one). The upload will fail (warn in console), but you can proceed to "Save Entry".
3.  **Check Dashboard**: The new entry will appear immediately on your dashboard.
4.  **Check Status**: The network icon in the sidebar/nav should show a "Cloud Off" icon with a pending count badge.
5.  **Go Online**: Re-enable internet.
6.  **Watch Sync**: The icon should spin (Syncing) and then return to "Cloud Check" (Synced).
7.  **Verify Data**: Check your Google Sheet; the new row should be appended.
