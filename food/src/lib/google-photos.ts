import { ensureValidToken } from './auth';

export interface PickerSession {
    id: string;
    pickerUri: string;
    mediaItemsSet: boolean;
    pollingPolicy?: {
        pollInterval: string; // e.g., "5s"
        pollDuration: string;
    }
}

export interface MediaItem {
    id: string;
    baseUrl: string;
    mimeType: string;
    filename: string;
    creationTime?: string;
}

interface PickerMediaItemResponse {
    id: string;
    mediaFile?: {
        baseUrl?: string;
        mimeType?: string;
        filename?: string;
        mediaMetadata?: {
            creationTime?: string;
        };
    };
}

interface LibraryMediaItemResponse {
    id: string;
    baseUrl?: string;
    mimeType?: string;
    filename?: string;
    mediaMetadata?: {
        creationTime?: string;
    };
}

export async function createPickerSession(): Promise<PickerSession> {
    const token = await ensureValidToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
        `https://photospicker.googleapis.com/v1/sessions`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        },
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[GooglePhotos] Session creation failed:', response.status, errorText);
        throw new Error(`Failed to create picker session: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
}

export async function pollPickerSession(sessionId: string): Promise<PickerSession> {
    const token = await ensureValidToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
        `https://photospicker.googleapis.com/v1/sessions/${sessionId}`,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        },
    );

    if (!response.ok) {
        // Keep error logs for failures
        console.error('[GooglePhotos] Poll failed:', response.status);
        throw new Error(`Failed to poll session: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

export async function listSessionMediaItems(sessionId: string): Promise<MediaItem[]> {
    const token = await ensureValidToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(
        `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=100`,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        },
    );

    if (!response.ok) {
        throw new Error(`Failed to list media items: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.mediaItems) return [];

    // Map to simplified structure
    return data.mediaItems.map((item: PickerMediaItemResponse) => ({
        id: item.id,
        baseUrl: item.mediaFile?.baseUrl || "",
        mimeType: item.mediaFile?.mimeType || "",
        filename: item.mediaFile?.filename || "",
        creationTime: item.mediaFile?.mediaMetadata?.creationTime,
    }));
}

export async function listLibraryItems(pageToken?: string): Promise<{ items: MediaItem[], nextPageToken?: string }> {
    const token = await ensureValidToken();
    if (!token) throw new Error("Not authenticated");

    const params = new URLSearchParams({
        pageSize: '100',
    });
    if (pageToken) params.append('pageToken', pageToken);

    const response = await fetch(
        `https://photoslibrary.googleapis.com/v1/mediaItems?${params.toString()}`,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        },
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Library API Error:', response.status, errorText);
        throw new Error(`Failed to list library items: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const items = (data.mediaItems || []).map((item: LibraryMediaItemResponse) => ({
        id: item.id,
        baseUrl: item.baseUrl || "",
        mimeType: item.mimeType || "",
        filename: item.filename || "",
        creationTime: item.mediaMetadata?.creationTime,
    }));

    return { items, nextPageToken: data.nextPageToken };
}
