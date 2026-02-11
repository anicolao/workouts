import { store } from './store';
import { processEvent } from './reducer';
import type { Exercise } from './types';

const SHEET_TITLE = 'Exercise Catalog';
const INSTRUCTIONS_TITLE = 'Instructions';
const CONFIG_FILE_NAME = 'Workouts Data';

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
];

export async function ensureConfigSheet(accessToken: string): Promise<string | null> {
    try {
        // 1. Search for existing spreadsheet
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${CONFIG_FILE_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
        const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const searchData = await searchRes.json();

        let spreadsheetId: string;

        if (searchData.files && searchData.files.length > 0) {
            spreadsheetId = searchData.files[0].id;
            console.log(`Found existing config sheet: ${spreadsheetId}`);
        } else {
            console.log('Creating new config sheet...');
            const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    properties: { title: CONFIG_FILE_NAME },
                    sheets: [
                        { properties: { title: INSTRUCTIONS_TITLE } },
                        { properties: { title: SHEET_TITLE, gridProperties: { frozenRowCount: 1 } } }
                    ]
                })
            });
            const createData = await createRes.json();
            spreadsheetId = createData.spreadsheetId;

            // Populate Instructions
            await appendRows(accessToken, spreadsheetId, INSTRUCTIONS_TITLE, INSTRUCTIONS_CONTENT);

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
    const spreadsheetId = await ensureConfigSheet(accessToken);
    if (!spreadsheetId) return;

    try {
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
            // Simplified check: if name doesn't exist or data is different, dispatch update
            // Ideally we'd have a more robust diff, but this is MVP
            // We use a specific action to update/upsert
            store.dispatch(processEvent({
                type: 'exercise/upsert', // We need to handle this in reducer
                payload: {
                    ...data,
                    timestamp: new Date().toISOString()
                }
            }));
        }

        // Sync App -> Sheet (New items only for now to avoid loops)
        // Note: For now, we are prioritizing Sheet as source of truth for *edits*
        // But if the App has an exercise not in the sheet (e.g. created offline?), we should add it.
        // Implementation note: This part is tricky without strict ID matching.
        // We will assume for MVP that the sheet is the master for configuration.

        console.log('Config sync complete');

    } catch (e) {
        console.error('Error syncing config:', e);
    }
}
