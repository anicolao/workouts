import { ensureValidToken, GOOGLE_API_KEY } from './auth';

export interface GoogleDriveFile {
    id: string;
    name: string;
    webViewLink: string;
    thumbnailLink?: string;
}

// Helper: List files using API Key (Public/Anonymous access)
async function listPublicFiles(q: string) {
    if (!GOOGLE_API_KEY) {
        console.warn('[Sheets] No API Key available for public search');
        return [];
    }

    // supportsAllDrives & includeItemsFromAllDrives are needed to see files in some shared contexts,
    // even if not strictly "Shared Drives" (e.g. widely shared folders).
    const params = new URLSearchParams({
        q: q,
        orderBy: 'modifiedTime desc',
        key: GOOGLE_API_KEY,
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        fields: 'files(id, name, mimeType, parents)' // Request specific fields for clarity
    });

    const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
    console.log(`[Sheets] Public Search Query: ${q}`);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error('[Sheets] Public search failed:', response.status, response.statusText, await response.text());
            return [];
        }

        const data = await response.json();
        console.log(`[Sheets] Public search found ${data.files?.length || 0} files`);
        return data.files || [];
    } catch (e) {
        console.error('[Sheets] Public search exception:', e);
        return [];
    }
}

// Helper: Search or create folder
async function findOrCreateFolder(name: string): Promise<string> {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    // 1. Search
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`;
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!searchRes.ok) throw new Error('Drive Search Failed');
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id; // Return existing
    }

    // 2. Create
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            mimeType: 'application/vnd.google-apps.folder'
        })
    });
    if (!createRes.ok) throw new Error('Folder Creation Failed');
    const createData = await createRes.json();
    return createData.id;
}

// Helper: Search or create file inside folder
async function findOrCreateFile(name: string, parentId: string, mimeType: string): Promise<string> {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    // 1. Search
    const q = `name='${name}' and '${parentId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`;
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!searchRes.ok) throw new Error('File Search Failed');
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
    }

    // 2. Create
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            mimeType,
            parents: [parentId]
        })
    });
    if (!createRes.ok) throw new Error('File Creation Failed');
    const createData = await createRes.json();
    return createData.id;
}

// Robust Discovery Implementation

// 1. Tag a file with app properties
async function tagDatabaseFile(fileId: string) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appProperties: { type: 'food_tracker_db' }
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to tag file: ${response.statusText}`);
    }
}

// 2. Find all database files by tag, sorted by time
export async function findDatabaseFiles(parentId?: string) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    let q = "appProperties has { key='type' and value='food_tracker_db' } and trashed=false";
    if (parentId) {
        q += ` and '${parentId}' in parents`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,createdTime)`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to list database files');
    const data = await response.json();
    return data.files || [];
}

// 3. New Creation Logic with Tagging
async function createDatabaseFile(name: string, parentId: string) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    const url = 'https://www.googleapis.com/drive/v3/files';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [parentId],
            appProperties: { type: 'food_tracker_db' }
        })
    });

    if (!response.ok) throw new Error('File Creation Failed');
    const data = await response.json();
    return data.id;
}

// Modified Discovery Logic
export async function ensureDataStructures() {
    const folderId = await findOrCreateFolder('FoodLog');
    const dbFiles = await findDatabaseFiles(folderId);

    let spreadsheetId;

    if (dbFiles.length > 0) {
        spreadsheetId = dbFiles[0].id;
    } else {
        // Fallback
        const legacyName = 'TheFoodTrackerEventLog';
        const token = await ensureValidToken();
        const q = `name='${legacyName}' and '${folderId}' in parents and trashed=false`;
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const searchData = await searchRes.json();

        if (searchData.files && searchData.files.length > 0) {
            spreadsheetId = searchData.files[0].id;
            await tagDatabaseFile(spreadsheetId);
        } else {
            spreadsheetId = await createDatabaseFile('TheFoodTrackerEventLog', folderId);
        }
    }

    await ensureSheetExists(spreadsheetId, 'Events');

    return { folderId, spreadsheetId };
}

export async function ensureConnectedToSharedFolder(folderId: string) {
    // Strategy: Try Public/Anonymous Access First (via API Key)
    // This supports "Anyone with the link" folders without user having to "Add to Drive".

    // 1. Try finding tagged DB in Public Folder
    const publicQ = `appProperties has { key='type' and value='food_tracker_db' } and '${folderId}' in parents and trashed=false`;
    let files = await listPublicFiles(publicQ);

    if (files.length > 0) {
        return { folderId, spreadsheetId: files[0].id };
    }

    // 2. Try Fallback Legacy Name in Public Folder
    const legacyName = 'TheFoodTrackerEventLog';
    files = await listPublicFiles(`name='${legacyName}' and '${folderId}' in parents and trashed=false`);
    if (files.length > 0) {
        return { folderId, spreadsheetId: files[0].id };
    }

    // 3. Try "Any Spreadsheet" in Public Folder
    files = await listPublicFiles(`mimeType='application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed=false`);
    if (files.length > 0) {
        console.log('[Sheets] Found public spreadsheet:', files[0].name);
        return { folderId, spreadsheetId: files[0].id };
    }

    // --- If Public Access Failed, Try Authenticated Access ---

    const token = await ensureValidToken();
    if (!token) {
        throw new Error('Shared Log not found (Public access failed, and not signed in)');
    }

    // 4. Verify Folder Access (Authenticated)
    const dbFiles = await findDatabaseFiles(folderId);
    if (dbFiles.length > 0) {
        return { folderId, spreadsheetId: dbFiles[0].id };
    }

    // 5. Authenticated Fallback Name
    const search = async (q: string) => {
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const searchData = await searchRes.json();
        return searchData.files || [];
    };

    const legacyFiles = await search(`name='${legacyName}' and '${folderId}' in parents and trashed=false`);
    if (legacyFiles.length > 0) {
        return { folderId, spreadsheetId: legacyFiles[0].id };
    }

    // 6. Authenticated Fallback Any Spreadsheet
    const anySheetFiles = await search(`mimeType='application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed=false`);
    if (anySheetFiles.length > 0) {
        return { folderId, spreadsheetId: anySheetFiles[0].id };
    }

    throw new Error('Shared Log not found in this folder.');
}

async function ensureSheetExists(spreadsheetId: string, title: string) {
    const token = await ensureValidToken();
    if (!token) return;

    try {
        const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!metaRes.ok) return;
        const meta = await metaRes.json();

        if (meta.sheets?.some((s: any) => s.properties.title === title)) {
            return;
        }

        const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{ addSheet: { properties: { title } } }]
            })
        });
        if (!updateRes.ok) console.error('Failed to create sheet', await updateRes.text());

    } catch (e) {
        console.error('Error ensuring sheet exists', e);
    }
}

export async function appendRow(spreadsheetId: string, sheetName: string, values: any[]) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    const range = `${sheetName}!A1`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [values]
        })
    });

    if (!response.ok) {
        throw new Error(`Sheets API Error: ${response.statusText}`);
    }

    return await response.json();
}

export async function appendRows(spreadsheetId: string, sheetName: string, rows: any[][]) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    const range = `${sheetName}!A1`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: rows
        })
    });

    if (!response.ok) {
        throw new Error(`Sheets API Error: ${response.statusText}`);
    }

    return await response.json();
}

export async function fetchRows(spreadsheetId: string, sheetName: string, startRow?: number): Promise<any[]> {
    const token = await ensureValidToken();

    const range = startRow ? `${sheetName}!A${startRow}:Z` : `${sheetName}!A:Z`;
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    if (GOOGLE_API_KEY) {
        url += `?key=${GOOGLE_API_KEY}`;
    }

    const headers: any = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    } else if (!GOOGLE_API_KEY) {
        throw new Error('Not authenticated and no API Key');
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        // If 403/401 OR 404 (hidden by scope) and we used Token, maybe retry with ONLY API Key (Anonymous)?
        if ((response.status === 403 || response.status === 401 || response.status === 404) && token && GOOGLE_API_KEY) {
            console.warn(`[Sheets] Token access failed (${response.status}), retrying with API Key only (Anonymous access)...`);
            const retryUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${GOOGLE_API_KEY}`;
            // Important: Do NOT send Authorization header
            const retryRes = await fetch(retryUrl);
            if (retryRes.ok) {
                const data = await retryRes.json();
                return data.values || [];
            } else {
                console.warn('[Sheets] Anonymous retry failed:', retryRes.status);
            }
        }

        throw new Error(JSON.stringify({
            status: response.status,
            message: response.statusText,
            body: await response.text()
        }));
    }

    const data = await response.json();
    return data.values || [];
}

// --- Drive API ---

export async function uploadImage(file: Blob, filename: string, folderId?: string): Promise<GoogleDriveFile> {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    const metadata: any = {
        name: filename,
        mimeType: file.type
    };
    if (folderId) {
        metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: form
    });

    if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
    }

    return await response.json();
}

export async function getFileMetadata(fileId: string) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
    }

    return await response.json();
}

export async function renameFile(fileId: string, newName: string) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Not authenticated');

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
    });

    if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
    }

    return await response.json();
}

// --- Identity Management ---

export interface IdentityProfile {
    name?: string;
    avatar?: string;
}

export async function fetchIdentity(spreadsheetId: string): Promise<IdentityProfile> {
    try {
        const rows = await fetchRows(spreadsheetId, 'Identity');
        const profile: IdentityProfile = {};
        for (const row of rows) {
            if (row[0] === 'Name') profile.name = row[1];
            if (row[0] === 'Avatar') profile.avatar = row[1];
        }
        return profile;
    } catch (e) {
        // Tab might not exist or empty
        return {};
    }
}

export async function saveIdentity(spreadsheetId: string, profile: IdentityProfile) {
    // We overwrite the entire Identity tab contents logically, 
    // but Sheets API is append-heavy.
    // Better to use batchUpdate to clear/write or just update specific cells.
    // For simplicity: Update A1:B2 directly.

    // First ensure tab exists
    await ensureSheetExists(spreadsheetId, 'Identity');

    const token = await ensureValidToken();
    if (!token) return;

    const values = [
        ['Name', profile.name || ''],
        ['Avatar', profile.avatar || '']
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Identity!A1:B2?valueInputOption=USER_ENTERED`;
    await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ values })
    });
}
