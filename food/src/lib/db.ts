import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { FoodEvent } from './store';

interface FoodTrackerDB extends DBSchema {
    events: {
        key: string;
        value: FoodEvent & {
            syncStatus: 'pending' | 'synced' | 'failed';
            syncedAt?: number;
        };
        indexes: { 'by-status': string; 'by-timestamp': string };
    };
}

const DB_VERSION = 1;

const BASE_DB_NAME = 'events-db';
let currentContextId = 'default';
let dbPromise: Promise<IDBPDatabase<FoodTrackerDB>> | null = null;

// Context Management
export function setDatabaseContext(contextId: string | null) {
    const newContext = contextId || 'default';
    if (currentContextId !== newContext) {
        console.log(`[DB] Switching context from ${currentContextId} to ${newContext}`);
        currentContextId = newContext;
        dbPromise = null; // Force reconnection
    }
}

export async function initDB() {
    if (!dbPromise) {
        const dbName = currentContextId === 'default' ? BASE_DB_NAME : `${BASE_DB_NAME}-${currentContextId}`;
        console.log(`[DB] Opening database: ${dbName}`);

        dbPromise = openDB<FoodTrackerDB>(dbName, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('events', {
                    keyPath: 'eventId',
                });
                store.createIndex('by-status', 'syncStatus');
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }
    return dbPromise;
}

export async function addEvent(event: FoodEvent) {
    const db = await initDB();
    return db.put('events', {
        ...event,
        syncStatus: 'pending',
    });
}

export async function getPendingEvents() {
    const db = await initDB();
    return db.getAllFromIndex('events', 'by-status', 'pending');
}

export async function markEventsSynced(eventIds: string[]) {
    const db = await initDB();
    const tx = db.transaction('events', 'readwrite');
    const store = tx.objectStore('events');

    await Promise.all(
        eventIds.map(async (id) => {
            const event = await store.get(id);
            if (event) {
                event.syncStatus = 'synced';
                event.syncedAt = Date.now();
                await store.put(event);
            }
        })
    );

    await tx.done;
}

export async function getAllEvents() {
    const db = await initDB();
    return db.getAllFromIndex('events', 'by-timestamp');
}

export async function addSyncedEvent(event: FoodEvent) {
    const db = await initDB();
    // Only add if it doesn't exist to prevent overwriting local pending state if any race condition
    // But usually this is used for hydration or incoming sync
    const existing = await db.get('events', event.eventId);
    if (!existing) {
        return db.put('events', {
            ...event,
            syncStatus: 'synced',
            syncedAt: Date.now(),
        });
    }
}

export async function clearAllSyncedEvents() {
    const db = await initDB();
    const tx = db.transaction('events', 'readwrite');
    // We only want to clear synced events? Or all events?
    // "Force a complete resync (should delete local caches entirely)" usually means EVERYTHING.
    // If we delete pending events, the user LOSES data if they were offline.
    // BUT the requirement says "delete local caches entirely and fetch the entire spreadsheet".
    // If I delete pending events that haven't synced, they are gone forever.
    // Safer: Delete only SYNCED events.
    // However, if the goal is "complete reset", maybe the user assumes spreadsheet has truth.
    // Let's hold pending events if possible. 
    // Actually, "delete local caches" implies cache of server data.
    // I will delete ONLY items where syncStatus === 'synced'.

    // Efficient way: iterate cursor
    const index = tx.store.index('by-status');
    // Use openCursor instead of openKeyCursor because 'delete' might not be supported on key cursors in some implementations
    let cursor = await index.openCursor('synced');

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    await tx.done;
}
