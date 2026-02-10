# Offline Support Implementation Plan

## Goal Description
Implement offline support for the Food Tracker application using IndexedDB as the primary source of truth and Google Sheets as the upstream durable storage. The app should function fully without a network connection and synchronize when connectivity is restored.

## User Review Required
> [!IMPORTANT]
> This change introduces `idb` as a dependency and shifts the "Source of Truth" from the API to the local IndexedDB. All events will be stored locally first.
> The "Sync Status" will be a new UI element providing visibility into the state of data synchronization.

## Proposed Changes

### Core Infrastructure

#### [NEW] [db.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/db.ts)
- Implement `initDB()` to open `idb` database 'events-db' version 1.
- Implement `addEvent(event)` to store events with `syncStatus: 'pending'`.
- Implement `getPendingEvents()` to retrieve events needing sync.
- Implement `markEventsSynced(ids)` to update status to 'synced'.
- Implement `getAllEvents()` for hydration.
- Implement `addSyncedEvent(event)` for incoming events from upstream.

#### [NEW] [redux-sync-middleware.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/redux-sync-middleware.ts)
- Create Redux middleware to intercept `eventLog/appendEvent` actions.
- Write events to `db` immediately.
- Trigger `syncManager.sync()` (debounced).

#### [NEW] [sync-manager.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/sync-manager.ts)
- `sync()` function:
    - Check if online.
    - Get pending events from DB.
    - If pending:
        - Batch upload to Sheets (using modified `sheets.ts`).
        - On success, mark synced in DB.
    - If online, fetch new rows from Sheets.
    - Reconciliation: Add new events to DB and valid Redux store.

### API Layer

#### [MODIFY] [sheets.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/sheets.ts)
- Update `appendRow` to support batch appending (if not already supported efficiently, though `appendRow` in `sheets.ts` takes `values: any[]` but wraps it in `[values]` - need to check if it supports multiple rows).
- Current `appendRow` does `values: [values]` implying single row. Will need `appendRows` for batch.

### State Management

#### [MODIFY] [store.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/store.ts)
- Apply `syncMiddleware`.
- Remove direct side-effect calls to `sheets.appendRow` in `dispatchEvent` thunk.
- Add `hydrateEvents` action/reducer to load initial state.

### UI Components

#### [MODIFY] [+layout.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/+layout.svelte)
- Initialize DB on mount.
- Load all events from DB and hydrate Redux store.
- Initialize Sync Manager (start listeners for online/offline).

#### [NEW] [NetworkStatus.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/NetworkStatus.svelte)
- Component to display online/offline status and sync state (cloud icons).
- To be added to `DesktopSidebar.svelte` and `MobileNav.svelte` (or a simplified header).

#### [NEW] [settings/network/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/settings/network/+page.svelte)
- Page to view connection status, pending items count, and force sync button.

#### [MODIFY] [DesktopSidebar.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/DesktopSidebar.svelte)
- Add `NetworkStatus` component.

#### [MODIFY] [MobileNav.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/MobileNav.svelte)
- Add `NetworkStatus` indicator (maybe small icon).

## Verification Plan

### Automated Tests
- **New E2E Test**: `tests/e2e/010-offline-sync.spec.ts`
    - **Scenario 1: Offline Logging**
        - Go offline: `await context.setOffline(true)`.
        - Log a food item.
        - Verify Item appears in Log UI (Optimistic UI).
        - Verify Network Status shows "Offline / Pending".
        - Go online: `await context.setOffline(false)`.
        - Wait for sync.
        - Verify Network Status shows "Synced".
    - **Scenario 2: Refresh/Persistence**
        - Log item.
        - Reload page.
        - Verify item is still there (loaded from IDB).

- **Unit/Integration Tests**:
    - Test `db.ts` methods if possible (requires browser environment or mock).
    - Test `sync-manager` logic mocking `sheets` and `db`.

### Manual Verification
1.  **Offline Use**:
    - Turn off WiFi.
    - Open App (should load if PWA/cached, or if already open).
    - Log a "Test Banana".
    - Check UI updates immediately.
    - Check Network Status icon is "Cloud Off".
    - Turn on WiFi.
    - Watch icon turn to "Syncing" then "Synced".
    - Check Google Sheet to see "Test Banana".
2.  **Hydration**:
    - Close Tab.
    - Open new Tab.
    - Ensure all history loads instantly from IDB.
