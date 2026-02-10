import { ensureValidToken, GOOGLE_API_KEY } from './auth';

const imageCache = new Map<string, string>();

export async function resolveDriveImage(url: string): Promise<string> {
    if (!url) return '';
    if (imageCache.has(url)) return imageCache.get(url)!;

    // Check if it's a Drive URL we need to fetch authenticated
    // Pattern 1: constructed thumbnail link
    let fileId = '';
    const match1 = url.match(/id=([^&]+)/);
    if (match1) fileId = match1[1];

    // Pattern 2: direct file link (if we ever use that)
    // const match2 = url.match(/\/file\/d\/([^/]+)/);

    if (fileId) {
        const token = await ensureValidToken();
        const headers: any = {};
        let fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        } else if (GOOGLE_API_KEY) {
            fetchUrl += `&key=${GOOGLE_API_KEY}`;
        } else {
            // No token and no API Key, and url is not a public uc link? 
            // If we are here, we probably need one of them.
        }

        if (token || GOOGLE_API_KEY) {
            try {
                const res = await fetch(fetchUrl, { headers });
                if (res.ok) {
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    imageCache.set(url, blobUrl);
                    return blobUrl;
                }
            } catch (e) {
                console.error('Failed to fetch image', e);
            }
        }
    }

    // Fallback: return original (might work if public or cached) or failure
    return url;
}
