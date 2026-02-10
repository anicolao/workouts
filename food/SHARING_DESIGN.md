# Sharing Feature Design

## Goal
Enable users to share their food log with others via a simple link:
`https://anicolao.github.io/food/sharing?folderId=DRIVE_FOLDER_ID`

Recipients should see a read-only version of the food log, backed by the shared Google Drive folder data. The performance should equal the native app, leveraging local caching (IndexedDB) separated by folder ID to prevent data pollution.

## Core Requirements
1.  **Read-Only Access**: Viewers cannot modify the shared log.
2.  **Shared Data Source**: Data is sourced specifically from the `folderId` provided in the URL.
3.  **Data Isolation**: Shared data must be cached in a separate local store (IndexedDB) from the user's personal data.
4.  **Maximize Reuse**: Reuse existing UI components, `store`, `sync-manager`, and authentication logic.

## Architecture

### 1. Context-Aware Database (`src/lib/db.ts`)
The current `db.ts` uses a hardcoded `DB_NAME`. We will refactor this to support dynamic database namespaces.

*   **Change**: Introduces `setDatabaseContext(contextId: string)`.
*   **Mechanism**:
    *   `contextId` defaults to `'default'` (User's private log).
    *   For sharing, `contextId` will be the `folderId`.
    *   Updates `initDB` to open `events-db-${contextId}`.

### 2. Synchronization Context (`src/lib/sync-manager.ts`)
The `syncManager` needs to become context-aware to support syncing from a specific Shared Folder.

*   **Change**: `syncManager` must respect the active Data Context.
*   **Discovery**: Update discovery logic to look strictly within the provided `folderId` and *not* create new folders if missing (fail if not found).

### 3. Redux Store Adaptation (`src/lib/store.ts`)
The Redux store is a singleton. To support context switching without a full page reload, we need a mechanism to "reset" and "re-hydrate" the store when switching contexts.

*   **New Action**: `config/setContext`
    *   Payload: `{ isReadOnly: boolean, folderId: string | null }`
    *   Effect: Updates `config.isReadOnly` and `config.folderId`.
*   **New Action**: `global/resetState`
    *   Effect: Clears `events`, `log`, `stats`, `favourites` to initial empty state.
*   **Middleware**: Update `syncMiddleware` to block `eventLog/appendEvent` if `state.config.isReadOnly` is true.

### 4. Routing & Navigation Strategy

We will use a **Shadow Route** strategy to encapsulate the shared context while reusing components.

**Route Structure:**
*   `/sharing`
    *   `+layout.svelte`: **The Context Controller**
    *   `+page.svelte`: Reuses `LogPage`.
    *   `entry/`
        *   `[id]/`
            *   `+page.svelte`: Reuses `EntryPage`.

**Lifecycle (The Context Controller):**
The `src/routes/sharing/+layout.svelte` will manage the boundary between "My Data" and "Shared Data".
*   **Mount**:
    1.  Parse `folderId` from URL query params (or persist from Store if navigating within sub-routes).
    2.  **Auth Check**: Ensure user is authenticated.
    3.  **Context Engage**:
        *   Call `db.setDatabaseContext(folderId)`.
        *   Dispatch `global/resetState`.
        *   Dispatch `config/setContext({ isReadOnly: true, folderId })`.
    4.  **Hydration & Sync**:
        *   Load event stream from the context-scoped DB.
        *   Trigger sync against the shared folder.
*   **Destroy**:
    *   **Context Disengage**:
        *   Revert DB context to `'default'`.
        *   Reset & Restore user's personal store state from 'default' DB.
        *   Dispatch `config/setContext({ isReadOnly: false, folderId: null })`.

**Component Navigation Logic:**
Existing components (`src/routes/entry/+page.svelte`, etc.) contain internal navigation (e.g., "Back" button, clicking a list item). To ensure users stay within the `/sharing` context:

*   **Logic Update**: Key components will be updated to check `store.config.folderId`.
    *   **Back Links**: If `folderId` is set, the Back button in `EntryPage` will link to `/sharing?folderId=...` instead of `/`.
    *   **Deep Links**: If `folderId` is set, clicking a log item will link to `/sharing/entry/[id]?folderId=...` instead of `/entry/[id]`.
*   **Refactoring**: We will modify the components to compute `baseRoute` dynamically (e.g., `let baseRoute = $store.config.folderId ? '/sharing' : '';`).

### 5. UI Components
Components must respect the `readOnly` state.

*   **Selectors**: Use `$store.config.isReadOnly` in components.
*   **Modifications**:
    *   **Log Page**: Hide "Add" button.
    *   **Entry Detail**: Disable inputs, hide "Save/Delete" buttons.
    *   **Settings**: Hide/Disable network or goal settings (or make them local-only view preferences).

## Implementation Plan

1.  **Refactor DB**: Update `src/lib/db.ts` to support `setDatabaseContext`.
2.  **Update Store**: Add `resetState` reducer and `isReadOnly` config.
3.  **Update Middleware**: Block writes in `redux-sync-middleware.ts` when ReadOnly.
4.  **Implement Route Infrastructure**:
    *   Create `src/routes/sharing/+layout.svelte`.
    *   Create `src/routes/sharing/+page.svelte` (Shadow of Home).
    *   Create `src/routes/sharing/entry/[id]/+page.svelte` (Shadow of Entry Detail).
5.  **Component "Awareness"**: Update `LogPage` (extracted from home) and `entry/+page.svelte` to handle `isReadOnly` UI states and `folderId` based navigation paths.
6.  **Discovery Logic**: Update `sheets.ts` to support finding the DB file strictly inside a given `folderId`.

## Authentication & Privacy
The sharing model supports two modes:

1.  **Anonymous Access (Public Link)**:
    *   If the Drive Folder is shared with "Anyone with the link", the app uses a **Google API Key** to discover and read the database.
    *   **No Sign-In Required**: The viewer does not need to log in to Google to view the data.
    *   This ensures zero friction for viewing shared logs.

2.  **Authenticated Access (Private Share)**:
    *   If the folder is shared with specific email addresses, the viewer **must sign in** to access the data via their OAuth token.
    *   The app automatically fails over to this mode if the Anonymous check fails.

### Identity
*   Viewers *can* optionally sign in even on a public link.
*   If signed in, their Name and Avatar are fetched and displayed in the "Identity Header" and stored in the shared log's "Identity" sheet (if writable) or just displayed locally.
*   The system uses `userinfo.profile` scope to personalise the experience.
