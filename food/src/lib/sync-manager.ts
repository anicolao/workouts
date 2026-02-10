import { getPendingEvents, markEventsSynced, addSyncedEvent, clearAllSyncedEvents } from './db';
import { appendRow, fetchRows, appendRows } from './sheets'; // We'll need to update sheets.ts to support batch append if we want true batching, or just loop for now
import { store, processEvent, appendEvent, ingestSyncedEvent, type FoodEvent } from './store';
import { get } from 'svelte/store';

// We need a way to check online status.
// For now, we'll rely on navigator.onLine and window events in the UI/Layout to trigger this.

export const syncManager = {
    isSyncing: false,
    syncError: null as string | null,

    async sync() {
        if (this.isSyncing) return;
        if (!navigator.onLine) return;



        this.isSyncing = true;
        this.syncError = null; // Clear previous errors


        try {
            // 1. Outbound Sync
            const pendingEvents = await getPendingEvents();
            if (pendingEvents.length > 0) {


                // Sort by timestamp to preserve order
                pendingEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                const state = store.getState();
                const { spreadsheetId } = state.config;

                if (spreadsheetId) {
                    // Prepare batch data
                    const rows = pendingEvents.map(e => [
                        e.eventId,
                        e.timestamp,
                        e.type,
                        JSON.stringify(e.payload)
                    ]);

                    await appendRows(spreadsheetId, 'Events', rows);

                    // Mark synced
                    await markEventsSynced(pendingEvents.map(e => e.eventId));

                }
            }

            // 2. Inbound Sync
            // Fetch starting from the last synced row to verify overlap (unless it's row 0/1)
            const state = store.getState();
            const { spreadsheetId } = state.config;

            if (spreadsheetId) {
                const { lastSyncedRow, lastSyncedEventId } = getSyncPointers(spreadsheetId);

                // If we have synced data (row > 0), we fetch overlapping to verify.
                // If row is 0, we fetch from 1.
                const startRow = lastSyncedRow > 0 ? lastSyncedRow : 1;


                const rows = await fetchRows(spreadsheetId, 'Events', startRow);

                if (rows && rows.length > 0) {
                    let newRows = rows;

                    // Verification Logic
                    if (lastSyncedRow > 0) {
                        const overlappingRow = rows[0];
                        const overlappingEventId = overlappingRow[0];

                        // If lastSyncedEventId exists (for safety), verify it matches
                        if (lastSyncedEventId && overlappingEventId !== lastSyncedEventId) {
                            console.warn(`[SyncManager] Sync Mismatch! Expected ${lastSyncedEventId}, got ${overlappingEventId}. Resetting sync pointer.`);
                            clearSyncPointers(spreadsheetId);
                            return; // Next sync will start from 1
                        }

                        // Verification Passed: Discard overlapping row
                        newRows = rows.slice(1);
                    }

                    if (newRows.length > 0) {

                        let lastEventIdProcessed = lastSyncedEventId;

                        for (const row of newRows) {
                            const [eventId, timestamp, type, payloadStr] = row;
                            if (!eventId || !type) continue;

                            lastEventIdProcessed = eventId;

                            // Check if we already have this event (deduplication still good safety net)
                            const existingEvent = state.events.find((e: FoodEvent) => e.eventId === eventId);

                            if (!existingEvent) {
                                let payload = {};
                                try {
                                    payload = JSON.parse(payloadStr);
                                } catch (e) {
                                    console.error('Failed to parse payload for event', eventId, e);
                                }

                                const event = { eventId, timestamp, type, payload };

                                // 1. Add to DB as synced
                                // await addSyncedEvent(event); // Optimization: batch add in future?
                                await addSyncedEvent(event);

                                // 2. Ingest into Redux
                                store.dispatch(ingestSyncedEvent(event));
                            }
                        }

                        // Update Pointer
                        const finalRowIndex = lastSyncedRow + newRows.length;

                        setSyncPointers(spreadsheetId, finalRowIndex, lastEventIdProcessed);

                    } else {

                    }
                } else {
                    // If we asked for startRow and got [], it means it's empty or truncated.
                    // If lastSyncedRow > 0, we expected at least overlap.
                    if (lastSyncedRow > 0) {
                        console.warn('[SyncManager] Last synced row missing. Sheet truncated? Resetting.');
                        clearSyncPointers(spreadsheetId);
                    }
                }
            }

        } catch (e: any) {
            console.error('[SyncManager] Sync failed:', e);

            // Extract error message for UI
            let errorMessage = e.message || 'Unknown error occurred.';

            // Handle JSON Error Message from sheets.ts wrapper
            try {
                const errObj = JSON.parse(e.message);
                if (errObj.message) errorMessage = errObj.message;
                // Add Status Code Context
                if (errObj.status) errorMessage = `${errObj.status}: ${errorMessage}`;

                if (errObj.status === 400) {
                    console.warn('[SyncManager] 400 Error on fetch. Pointer invalid. Resetting.');
                    const { spreadsheetId } = store.getState().config;
                    if (spreadsheetId) {
                        clearSyncPointers(spreadsheetId);
                    }
                    // We successfully handled it by resetting, so maybe don't show user error?
                    // Actually, let's show it so they know *why* it might re-sync next time or if it persists.
                    // But if we reset, the next sync (poll) might succeed.
                    // Let's set the error anyway for visibility.
                }

                // 403 / 401 usually mean Auth, which might need re-login.
                if (errObj.status === 401 || errObj.status === 403) {
                    errorMessage = "Authentication Failed. Please sign in again.";
                }

            } catch (jsonErr) {
                // Not JSON, keep raw message
            }

            this.syncError = errorMessage;

        } finally {
            this.isSyncing = false;
        }
    },

    async hardResync() {
        console.warn('[SyncManager] Hard Reset Initiated.');
        this.syncError = null;

        // 1. Reset Pointer
        const { spreadsheetId } = store.getState().config;
        if (spreadsheetId) {
            clearSyncPointers(spreadsheetId);
        } else {
            clearLegacySyncPointers();
        }

        // 2. Clear Local Cache (Synced Items Only - preserve pending!)
        await clearAllSyncedEvents();

        // 3. Reload
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }
};

const SYNC_POINTER_PREFIX = 'syncPointer';
const LEGACY_ROW_KEY = 'lastSyncedRow';
const LEGACY_EVENT_KEY = 'lastSyncedEventId';

const getScopedKey = (spreadsheetId: string, key: string) =>
    `${SYNC_POINTER_PREFIX}:${spreadsheetId}:${key}`;

const getSyncPointers = (spreadsheetId: string) => {
    const rowKey = getScopedKey(spreadsheetId, 'row');
    const eventKey = getScopedKey(spreadsheetId, 'eventId');

    const storedRow = localStorage.getItem(rowKey);
    const storedEventId = localStorage.getItem(eventKey);

    if (storedRow !== null || storedEventId !== null) {
        return {
            lastSyncedRow: parseInt(storedRow || '0', 10),
            lastSyncedEventId: storedEventId || ''
        };
    }

    const legacyRow = localStorage.getItem(LEGACY_ROW_KEY);
    const legacyEventId = localStorage.getItem(LEGACY_EVENT_KEY);

    if (legacyRow !== null || legacyEventId !== null) {
        const lastSyncedRow = parseInt(legacyRow || '0', 10);
        const lastSyncedEventId = legacyEventId || '';
        setSyncPointers(spreadsheetId, lastSyncedRow, lastSyncedEventId);
        clearLegacySyncPointers();
        return { lastSyncedRow, lastSyncedEventId };
    }

    return { lastSyncedRow: 0, lastSyncedEventId: '' };
};

const setSyncPointers = (spreadsheetId: string, row: number, eventId: string) => {
    localStorage.setItem(getScopedKey(spreadsheetId, 'row'), row.toString());
    if (eventId) {
        localStorage.setItem(getScopedKey(spreadsheetId, 'eventId'), eventId);
    } else {
        localStorage.removeItem(getScopedKey(spreadsheetId, 'eventId'));
    }
};

const clearSyncPointers = (spreadsheetId: string) => {
    localStorage.setItem(getScopedKey(spreadsheetId, 'row'), '0');
    localStorage.removeItem(getScopedKey(spreadsheetId, 'eventId'));
};

const clearLegacySyncPointers = () => {
    localStorage.setItem(LEGACY_ROW_KEY, '0');
    localStorage.removeItem(LEGACY_EVENT_KEY);
};
