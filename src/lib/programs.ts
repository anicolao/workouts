
import { ensureWorkoutsFolder } from './drive-utils';

export const PROGRAMS_FOLDER_NAME = 'Programs';
export const STARTING_STRENGTH_FILE_NAME = 'Starting Strength';

const HEADERS = ['Day Name', 'Exercise Name', 'Load', 'Rep Range', 'RPE', 'Notes'];

// Helper to create week content
// Cycle A/B.
// Week 1: A, B, A
// Week 2: B, A, B
// ...
const WORKOUT_A = [
    ['Day A', 'Back Squat', '', '3x5', '8', ''],
    ['Day A', 'Overhead Press', '', '3x5', '8', ''],
    ['Day A', 'Deadlift', '', '1x5', '9', '']
];

const WORKOUT_B = [
    ['Day B', 'Back Squat', '', '3x5', '8', ''],
    ['Day B', 'Bench Press', '', '3x5', '8', ''],
    ['Day B', 'Power Clean', '', '5x3', '8', ''] // Using Power Clean for classic SS
];

const WEEK_1_CONTENT = [
    HEADERS,
    ...WORKOUT_A,
    ...WORKOUT_B,
    ...WORKOUT_A
];

const WEEK_2_CONTENT = [
    HEADERS,
    ...WORKOUT_B,
    ...WORKOUT_A,
    ...WORKOUT_B
];

// Reusing for 3 and 4
const WEEK_3_CONTENT = WEEK_1_CONTENT;
const WEEK_4_CONTENT = WEEK_2_CONTENT;

export async function ensureProgramsFolder(accessToken: string): Promise<string | null> {
    const workoutsFolderId = await ensureWorkoutsFolder(accessToken);
    if (!workoutsFolderId) return null;

    const q = `name='${PROGRAMS_FOLDER_NAME}' and '${workoutsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`;
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
    } else {
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: PROGRAMS_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [workoutsFolderId]
            })
        });
        const createData = await createRes.json();
        return createData.id;
    }
}

async function appendRows(accessToken: string, spreadsheetId: string, range: string, values: any[][]) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
    });
}

export async function ensureStartingStrength(accessToken: string): Promise<string | null> {
    const programsFolderId = await ensureProgramsFolder(accessToken);
    if (!programsFolderId) return null;

    // Search for file
    const q = `name='${STARTING_STRENGTH_FILE_NAME}' and '${programsFolderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`;
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
        // Exists
        return searchData.files[0].id;
    }

    // Create
    console.log('Creating Starting Strength program...');
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            properties: {
                title: STARTING_STRENGTH_FILE_NAME,
            },
            sheets: [
                { properties: { title: 'Week 1', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Week 2', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Week 3', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Week 4', gridProperties: { frozenRowCount: 1 } } },
            ]
        })
    });

    const createData = await createRes.json();
    const spreadsheetId = createData.spreadsheetId;

    // Move to folder
    await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${programsFolderId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            // Ensure no "My Drive" parent if needed, but usually addParents is enough
        })
    });

    // Populate Content
    await appendRows(accessToken, spreadsheetId, 'Week 1', WEEK_1_CONTENT);
    await appendRows(accessToken, spreadsheetId, 'Week 2', WEEK_2_CONTENT);
    await appendRows(accessToken, spreadsheetId, 'Week 3', WEEK_3_CONTENT);
    await appendRows(accessToken, spreadsheetId, 'Week 4', WEEK_4_CONTENT);

    return spreadsheetId;
}

// ----- Program Parsing -----

export interface ProgramDay {
    dayName: string;
    exercises: ProgramExercise[];
}

export interface ProgramExercise {
    name: string;
    load: string;
    reps: string;
    rpe: string;
    notes: string;
}

export interface ProgramWeek {
    name: string; // "Week 1"
    days: ProgramDay[];
}

export interface Program {
    id: string; // The drive file ID (spreadsheet ID)
    name: string; // "Starting Strength"
    weeks: ProgramWeek[];
}

export async function getPrograms(accessToken: string): Promise<Program[]> {
    const programsFolderId = await ensureProgramsFolder(accessToken);
    if (!programsFolderId) return [];

    // List all spreadsheets
    const q = `'${programsFolderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const searchData = await searchRes.json();
    const files = searchData.files || [];

    const programs: Program[] = [];

    for (const file of files) {
        try {
            const program = await parseProgramSpreadsheet(accessToken, file.id, file.name);
            programs.push(program);
        } catch (e) {
            console.error(`Failed to parse program ${file.name} (${file.id}):`, e);
        }
    }

    return programs;
}

async function parseProgramSpreadsheet(accessToken: string, spreadsheetId: string, name: string): Promise<Program> {
    // 1. Get spreadsheet metadata (specifically sheet titles)
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const metaData = await metaRes.json();
    const sheets = metaData.sheets || [];

    const program: Program = {
        id: spreadsheetId,
        name: name,
        weeks: []
    };

    // 2. Fetch data for each sheet (Week)
    for (const sheet of sheets) {
        const title = sheet.properties.title;
        // Skip hidden sheets or metadata sheets if any conventions arise
        if (title.startsWith('_')) continue;

        const range = `${title}!A2:F`; // A2 to F (skip header)
        const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
        const res = await fetch(fetchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        const rows = data.values || [];

        const week: ProgramWeek = {
            name: title,
            days: []
        };

        // Group rows by "Day Name"
        // Row Schema: [Day Name, Exercise Name, Load, Rep Range, RPE, Notes]
        // Implicit Order = Row Order

        // Map to keep track of current day being built
        let currentDay: ProgramDay | null = null;

        for (const row of rows) {
            const [dayName, exName, load, reps, rpe, notes] = row;
            if (!dayName || !exName) continue; // Skip incomplete

            if (!currentDay || currentDay.dayName !== dayName) {
                currentDay = {
                    dayName: dayName,
                    exercises: []
                };
                week.days.push(currentDay);
            }

            currentDay.exercises.push({
                name: exName,
                load: load || '',
                reps: reps || '',
                rpe: rpe || '',
                notes: notes || ''
            });
        }

        program.weeks.push(week);
    }
    return program;
}
