# Offline Support & Synchronization Design

## Overview
This document outlines the architecture for introducing Offline Support to the Food Tracker application. The goal is to ensure the application remains functional without a network connection and reliably synchronizes data with the Google Sheets backend when connectivity is restored.

We will strictly adhere to the **Redux Event Sourcing** pattern, using **IndexedDB** as a local write-through cache. The Google Sheet acts as the durable, upstream event log.

## Core Architecture

### 1. IndexedDB as Single Source of Truth (Local)
Instead of treating the API (Google Sheets) as the primary data source during a session, the application will treat a local **IndexedDB** as the immediate system of record.
- **Library**: `idb` (lightweight wrapper around IndexedDB).
- **Store Name**: `events`
- **Schema**:
  ```typescript
  interface PersistedEvent {
    id: string;          // UUID, Primary Key
    type: string;        // Redux action type (e.g., 'LOG_FOOD')
    payload: any;        // Action payload
    timestamp: number;   // Unix timestamp of occurrence
    syncStatus: 'pending' | 'synced' | 'failed';
    syncedAt?: number;   // Timestamp when confirmed on server
  }
  ```

### 2. Synchronization Workflow

The synchronization logic is bidirectional but "Local-First".

#### A. Write Path (User Action)
1.  **User acts**: (e.g., Logs food).
2.  **Redux Action**: A Redux action is dispatched with a client-generated UUID.
3.  **Persistence**: A custom **Redux Middleware** intercepts the action.
    -   Writes the event to IndexedDB with `syncStatus: 'pending'`.
    -   *Passes* the action to the reducer to update the UI immediately (Optimistic UI).
4.  **Background Sync**: The middleware triggers the Sync Manager.

#### B. Outbound Sync (Upload)
1.  **Trigger**: Triggered by new pending events or network online event.
2.  **Process**:
    -   Query IndexedDB for all events where `syncStatus === 'pending'`.
    -   Sort by `timestamp`.
    -   **Batch Append**:
        -   Collect all pending event payloads into a single array.
        -   Call `sheets.appendRow` (or a new `appendRows`) with the batch of values.
        -   *Note*: The Google Sheets API `append` endpoint accepts multiple rows in a single request body (`values: [[row1], [row2], ...]`). This reduces N network calls to 1.
    -   **On Success**: Update all synced events in IndexedDB to `syncStatus: 'synced'`.
    -   **On Failure**: Leave as `pending`. Update global "Sync Health" state.

#### C. Inbound Sync (Hydration & Replay)
1.  **App Start**:
    -   Load *all* events from IndexedDB.
    -   Dispatch to Redux Store to hydrate state (Instant Load).
2.  **Fetch Upstream**:
    -   Call `sheets.fetchRows`.
    -   Parse rows into Event objects.
3.  **Reconciliation**:
    -   Filter out events that already exist in the Redux state (deduplication via UUID).
    -   Identify *new* events from other clients.
    -   Dispatch new events to Redux Store.
    -   Persist new events to IndexedDB with `syncStatus: 'synced'`.

## Idempotency & Conflict Resolution

### Idempotency
To prevent double-counting, we strictly enforce **UUIDs** for all events.
-   **Client**: Generates a UUID for every action.
-   **Redux Reducer**: Maintains a `seenEventIds: Set<string>` state.
    -   If an action comes in with a known ID, **ignore it**.
    -   This allows us to aggressively "replay" the Sheet or IndexedDB without fear of corruption.

### Deletion & Order Independence (Soft Deletes)
It is **not possible** to delete an event from the log (Sheet). Deletion is modeled as a new event type (e.g., `log/entryDeleted`).

-   **State Management**: The Redux Reducer must **never** destructively remove an event from its internal source list based on a delete event.
-   **Mark Not Delete**: Instead, the reducer tracks the state of entities. When a `log/entryDeleted` event is processed, the target entity is marked `{ deleted: true }` in the state.
-   **Order Independence**: This ensures that even if events arrive out of order (e.g. via sync), the final state typically converges.
    -   *Example*: If `log/entryUpdated` arrives *after* `log/entryDeleted` (but with an earlier timestamp), the logic can respect the timestamp or simply treat "Deleted" as a terminal state for that ID.
    -   By keeping the record in state (marked deleted), we prevent "zombie" recreation if an old update arrives late.

## Simplicity: No Sharding
We will **not** implement sharding or annual partitioning.
-   **Capacity**: A single Google Sheet can hold up to 10 million cells (approx 1M rows with typical 10 cols), which is sufficient for decades of personal food logging.
-   **Loading**: On startup, we fetch the full event history. This simplifies logic significantly.

## UI Considerations

### Status Indicator (Tappable)
A strict "No Toasts" policy for network state. Instead, a discreet status indicator in the header:
-   **Icons**:
    -   Cloud Check (Synced)
    -   Cloud Up Arrow (Syncing)
    -   Cloud Off (Offline / Pending Changes)
-   **Interaction**: Tapping the icon opens the **Network Settings** screen.

### Network Settings Screen
A new dedicated view (`/settings/network`) containing:
1.  **Connection Status**: Online/Offline boolean.
2.  **Sync Health**: "All caught up" vs "3 items pending upload".
3.  **Configuration**:
    -   **Sheet Name**: Input field to rename the target Google Sheet (default: `TheFoodTrackerEventLog`).
    -   **Force Sync**: A button to manually trigger a full re-sync/re-fetch.

## Implementation Steps

1.  **Install `idb`**: `npm install idb`.
2.  **Create `src/lib/db.ts`**: Encapsulate all IndexedDB logic.
3.  **Create Middleware `src/lib/redux-sync-middleware.ts`**:
    -   Intercept actions, persist to DB.
    -   Trigger sync manager.
4.  **Update `src/lib/sheets.ts`**:
    -   Simplify to single sheet usage.
5.  **Refactor `App.svelte` / `Layout`**:
    -   Init DB on mount.
    -   Implement "Load All" strategy.
6.  **Build Network Settings UI**:
    -   New route `src/routes/settings/network/+page.svelte`.
    -   Status Component for Header.
