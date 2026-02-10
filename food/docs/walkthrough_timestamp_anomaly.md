# Timestamp Anomaly and Entry Update Logic Fix

## Overview
Investigated an issue where `log/entryConfirmed` events in the Google Sheet had `EventID` matching the `EntryID` and timestamps that seemed to be simple offsets of the user's local time (e.g., `11:51` -> `19:51:00.000Z`).

## Findings
1.  **Legacy Code Cause**: Historical analysis of `src/routes/log/+page.svelte` revealed that a previous version of the `handleSubmit` function manually appended rows to the sheet.
    ```typescript
    // Legacy Code (Commit 8c905be3...)
    await appendRow(spreadsheetId, 'Events', [
        entry.id,              // Used Entry ID as Event ID
        isoDateTime,           // Used constructed ISO string from local form inputs
        'log/entryConfirmed',
        ...
    ]);
    ```
    This explains the exact data signature found in the user's sheet. This code was already removed in recent versions, so **no new "weird" entries should be created** for new confirmations.

2.  **Related "Double Write" Bug**: While auditing `src/routes/entry/+page.svelte` (used for Editing and Deleting entries), we found a similar pattern where the code was **both**:
    - Dispatching the event to Redux (which triggers the Sync Manager to write to the sheet).
    - **AND** Manually appending the row to the sheet via `appendRow`.
    
    This results in **Duplicate Events** for every edit or delete action (one with a random ID from Redux, and another manual one).

## Changes
- **Refactored `src/routes/entry/+page.svelte`**: Removed the manual `appendRow` blocks in `handleSave` and `handleDelete`.
    - Updates and Deletes now rely solely on `store.dispatch(dispatchEvent(...))`, which flows through `redux-sync-middleware` -> `syncManager`, ensuring a single, correctly formed event with a unique ID and accurate server-side (or generated) timestamp.

## Verification
### Manual Verification
1.  **Edit an Entry**:
    - Open an existing entry.
    - Change a value (e.g., calories).
    - Click "Save Changes".
    - **Verify**: Only ONE `log/entryUpdated` event is added to the "Events" sheet.
2.  **Delete an Entry**:
    - Open an entry.
    - Click "Delete".
    - **Verify**: Only ONE `log/entryDeleted` event is added to the "Events" sheet.
3.  **Confirm Entry** (Re-verify):
    - Create a new entry.
    - **Verify**: The Event ID in the sheet is a completely new UUID, distinct from the `entry.id` in the JSON payload.
