import { store } from './store';
import { processEvent } from './reducer';
import type { Exercise } from './types';
import { ensureWorkoutsFolder } from './drive-utils';

const SHEET_TITLE = 'Exercise Catalog';
const INSTRUCTIONS_TITLE = 'Instructions';
const CONFIG_FILE_NAME = 'Exercise Catalog';

const HEADERS = ['Exercise Name', 'Muscle Group', 'Default RPE', 'Tags'];
const DEFAULT_EXERCISES = [
    // Push
    ['Incline Press', 'Push', 8, 'Chest, Shoulders, Barbell, Dumbbell'],
    ['Dips', 'Push', 9, 'Chest, Triceps, Bodyweight'],
    ['Tricep Overhead Extension', 'Push', 9, 'Triceps, Cable, Dumbbell'],
    // Pull
    ['Pull-Up', 'Pull', 9, 'Back, Lats, Bodyweight'],
    ['Barbell Row', 'Pull', 8, 'Back, Thickness, Barbell'],
    ['Face Pull', 'Pull', 9, 'Rear Delt, Rotator Cuff, Cable'],
    // Squat
    ['Back Squat', 'Squat', 6, 'Quads, Glutes, Barbell'],
    ['Front Squat', 'Squat', 6, 'Quads, Core, Barbell'],
    ['Leg Press', 'Squat', 7, 'Quads, Machine'],
    // Hinge
    ['Deadlift', 'Hinge', 6, 'Hamstrings, Posterior Chain, Barbell'],
    ['Romanian Deadlift', 'Hinge', 7, 'Hamstrings, Glutes, Barbell'],
    ['Good Morning', 'Hinge', 7, 'Hamstrings, Lower Back, Barbell'],
];

const INSTRUCTIONS_CONTENT = [
    ['Workouts App Configuration'],
    [''],
    ['Welcome to your configuration sheet! This is where you can customize the exercises available in the app.'],
    [''],
    ['How to use:'],
    ['1. Switch to the "Exercise Catalog" tab at the bottom.'],
    ['2. Add new exercises by typing them into a new row.'],
    ['3. Edit existing exercises by changing the text.'],
    ['4. "Tags" should be separated by commas.'],
    [''],
    ['IMPORTANT:'],
    ['- Do NOT rename the "Exercise Catalog" sheet.'],
    ['- Do NOT delete the header row (Row 1).'],
    ['- Changes here will be synced to the app the next time you open it.']
    // ... (instructions content)
];

// ensureWorkoutsFolder is imported from ./drive-utils

let ensureConfigPromise: Promise<string | null> | null = null;

export function ensureConfigSheet(accessToken: string): Promise<string | null> {
    if (!ensureConfigPromise) {
        ensureConfigPromise = _ensureConfigSheet(accessToken).catch(e => {
            ensureConfigPromise = null;
            throw e;
        });
    }
    return ensureConfigPromise;
}

async function _ensureConfigSheet(accessToken: string): Promise<string | null> {
    try {
        const folderId = await ensureWorkoutsFolder(accessToken);
        if (!folderId) return null;

        // 1. Search for existing spreadsheet in the folder (by name OR by metadata)
        // Note: 'name' check is for legacy/manual creates, 'appProperties' is for robustness
        const searchQuery = `mimeType='application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed=false and (name='${CONFIG_FILE_NAME}' or appProperties has { key='type' and value='exercises_config' })`;
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}`;
        const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const searchData = await searchRes.json();

        let spreadsheetId: string;
        let existingSheets: any[] = [];

        if (searchData.files && searchData.files.length > 0) {
            spreadsheetId = searchData.files[0].id;
            console.log(`Found existing config sheet: ${spreadsheetId}`);

            // Get spreadsheet details to check for tabs
            const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const getData = await getRes.json();
            existingSheets = getData.sheets || [];
        } else {
            console.log('Creating new config sheet...');
            const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    properties: {
                        title: CONFIG_FILE_NAME,
                    },
                    sheets: [
                        { properties: { title: INSTRUCTIONS_TITLE } },
                        { properties: { title: SHEET_TITLE, gridProperties: { frozenRowCount: 1 } } }
                    ]
                })
            });
            const createData = await createRes.json();
            spreadsheetId = createData.spreadsheetId;
            existingSheets = createData.sheets;

            // Add metadata (appProperties) and move to folder
            // We do this in a separate patch to ensure it's set on the file
            await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appProperties: { type: 'exercises_config' }
                })
            });

            // Populate Instructions
            await appendRows(accessToken, spreadsheetId, INSTRUCTIONS_TITLE, INSTRUCTIONS_CONTENT);

            // Populate Defaults
            await appendRows(accessToken, spreadsheetId, SHEET_TITLE, [HEADERS, ...DEFAULT_EXERCISES]);

            // Return early since we just created everything
            return spreadsheetId;
        }

        // Check if "Exercise Catalog" tab exists
        const catalogSheet = existingSheets.find((s: any) => s.properties.title === SHEET_TITLE);
        if (!catalogSheet) {
            console.log('Exercise Catalog tab missing, recreating...');
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [
                        {
                            addSheet: {
                                properties: { title: SHEET_TITLE, gridProperties: { frozenRowCount: 1 } }
                            }
                        }
                    ]
                })
            });
            // Populate Defaults
            await appendRows(accessToken, spreadsheetId, SHEET_TITLE, [HEADERS, ...DEFAULT_EXERCISES]);
        }

        return spreadsheetId;

    } catch (e) {
        console.error('Error ensuring config sheet:', e);
        return null;
    }
}

async function appendRows(accessToken: string, spreadsheetId: string, range: string, values: any[][]) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
    });
}

export async function syncConfig(accessToken: string) {
    console.log('Starting config sync...');
    store.dispatch(processEvent({ type: 'sync/start', payload: { timestamp: new Date().toISOString() } }));

    // ... (rest of the function)

    try {
        const spreadsheetId = await ensureConfigSheet(accessToken);
        if (!spreadsheetId) {
            throw new Error('Could not ensure config sheet');
        }

        // Read Sheet Data
        const readRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TITLE}!A2:D`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const readData = await readRes.json();
        const rows = readData.values || [];

        // Parse Sheet Data
        const sheetExercises: Record<string, any> = {};
        rows.forEach((row: string[]) => {
            const [name, muscleGroup, defaultRpe, tags] = row;
            if (name) {
                sheetExercises[name] = {
                    name,
                    muscleGroup: muscleGroup || 'Other',
                    defaultRpe: parseInt(defaultRpe) || 8,
                    tags: tags ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : []
                };
            }
        });

        // Sync Sheet -> App (Dispatch Actions)
        const state = store.getState();
        // @ts-ignore
        const currentExercises = state.workout.exercises || {};

        for (const [name, data] of Object.entries(sheetExercises)) {
            const current = currentExercises[name];
            let isDifferent = true;

            if (current) {
                const sheetTags = [...data.tags].sort();
                const currentTags = [...current.tags].sort();

                const tagsMatch = currentTags.length === sheetTags.length &&
                    currentTags.every((t: string, i: number) => t === sheetTags[i]);

                if (current.muscleGroup === data.muscleGroup &&
                    current.defaultRpe === data.defaultRpe &&
                    tagsMatch) {
                    isDifferent = false;
                } else {
                    console.log(`Diff for ${name}:`);
                    if (current.muscleGroup !== data.muscleGroup) console.log(`  Muscle: ${current.muscleGroup} != ${data.muscleGroup}`);
                    if (current.defaultRpe !== data.defaultRpe) console.log(`  RPE: ${current.defaultRpe} != ${data.defaultRpe}`);
                    if (!tagsMatch) console.log(`  Tags: ${JSON.stringify(currentTags)} != ${JSON.stringify(sheetTags)}`);
                }
            } else {
                console.log(`New exercise found: ${name}`);
            }

            if (isDifferent) {
                store.dispatch(processEvent({
                    type: 'exercise/upsert',
                    payload: {
                        ...data,
                        timestamp: new Date().toISOString()
                    }
                }));
            }
        }

        console.log('Config sync complete');
        store.dispatch(processEvent({ type: 'sync/success', payload: { timestamp: new Date().toISOString() } }));

    } catch (e) {
        console.error('Error syncing config:', e);
        store.dispatch(processEvent({ type: 'sync/error', payload: { error: String(e), timestamp: new Date().toISOString() } }));
    }
}
