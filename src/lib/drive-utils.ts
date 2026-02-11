export const WORKOUTS_FOLDER_NAME = 'Workouts';

export async function ensureWorkoutsFolder(accessToken: string): Promise<string | null> {
    const q = `name='${WORKOUTS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
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
                name: WORKOUTS_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            })
        });
        const createData = await createRes.json();
        return createData.id;
    }
}
