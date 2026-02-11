import { ensureWorkoutsFolder } from './drive-utils';

const LOG_FILE_NAME = 'InternalEventLog';
const SHEET_TITLE = 'Log';
const HEADERS = ['EventID', 'Timestamp', 'ActionType', 'Payload'];

export interface ActionLogEntry {
    eventId: string;
    timestamp: string;
    actionType: string;
    payload: any;
}

let ensureLogPromise: Promise<string | null> | null = null;

export function ensureActionLogSheet(accessToken: string): Promise<string | null> {
    if (!ensureLogPromise) {
        ensureLogPromise = _ensureActionLogSheet(accessToken).catch(e => {
            ensureLogPromise = null;
            throw e;
        });
    }
    return ensureLogPromise;
}

async function _ensureActionLogSheet(accessToken: string): Promise<string | null> {
    try {
        const folderId = await ensureWorkoutsFolder(accessToken);
        if (!folderId) return null;

        // Search for existing log sheet (by name OR metadata)
        const searchQuery = `mimeType='application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed=false and (name='${LOG_FILE_NAME}' or appProperties has { key='type' and value='event_log' })`;
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}`;
        const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const searchData = await searchRes.json();

        let spreadsheetId: string;

        if (searchData.files && searchData.files.length > 0) {
            spreadsheetId = searchData.files[0].id;
            console.log(`Found existing action log: ${spreadsheetId}`);
        } else {
            console.log('Creating new action log...');
            const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    properties: { title: LOG_FILE_NAME },
                    sheets: [
                        { properties: { title: SHEET_TITLE, gridProperties: { frozenRowCount: 1 } } }
                    ]
                })
            });
            const createData = await createRes.json();
            spreadsheetId = createData.spreadsheetId;

            // Add metadata and move to folder
            await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appProperties: { type: 'event_log' }
                })
            });

            // Populate Headers
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TITLE}!A1:D1:append?valueInputOption=USER_ENTERED`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: [HEADERS] })
            });
        }

        return spreadsheetId;
    } catch (e) {
        console.error('Error ensuring action log sheet:', e);
        return null;
    }
}

// Queue for serializing append operations
let appendQueue: Promise<void> = Promise.resolve();

export function appendAction(accessToken: string, entry: ActionLogEntry): Promise<void> {
    // Chain the new operation to the end of the queue
    appendQueue = appendQueue.then(async () => {
        try {
            await _appendAction(accessToken, entry);
        } catch (e) {
            console.error('Error in append queue:', e);
        }
    });
    return appendQueue;
}

async function _appendAction(accessToken: string, entry: ActionLogEntry) {
    const spreadsheetId = await ensureActionLogSheet(accessToken);
    if (!spreadsheetId) return;

    try {
        const values = [[
            entry.eventId,
            entry.timestamp,
            entry.actionType,
            JSON.stringify(entry.payload) // Serialize payload
        ]];

        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TITLE}!A:D:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values })
        });
        const data = await res.json();
        console.log(`Appended action ${entry.actionType} to log at range:`, data.updates?.updatedRange);
    } catch (e) {
        console.error('Error appending action to log:', e);
    }
}
