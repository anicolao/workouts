/**
 * Searches for an image URL based on the query using Wikimedia Commons.
 * This is a public, CORS-friendly API that requires no authentication.
 * @param query The food description or search term
 * @returns A promise that resolves to a direct image URL, or null if not found.
 */
export async function searchFoodImage(query: string): Promise<string | null> {
    console.log(`[ImageSearch] Searching Wikimedia for: "${query}"`);

    try {
        // Wikimedia Commons API
        // action=query: Query the API
        // generator=search: Use search generator
        // gsrnamespace=6: Search in 'File' namespace only (images/media)
        // gsrlimit=1: Return only 1 result
        // prop=imageinfo: Get image info
        // iiprop=url: specifically the URL
        // origin=*: CORS header
        const endpoint = 'https://commons.wikimedia.org/w/api.php';
        const params = new URLSearchParams({
            action: 'query',
            generator: 'search',
            gsrnamespace: '6', // File namespace
            gsrsearch: query,
            gsrlimit: '1',
            prop: 'imageinfo',
            iiprop: 'url',
            format: 'json',
            origin: '*'
        });

        const res = await fetch(`${endpoint}?${params.toString()}`);
        if (!res.ok) {
            console.warn('[ImageSearch] API request failed', res.status);
            return null;
        }

        const data = await res.json();
        const pages = data.query?.pages;

        if (!pages) {
            console.warn('[ImageSearch] No results found');
            return null;
        }

        // extract first page
        const firstPageId = Object.keys(pages)[0];
        if (!firstPageId || firstPageId === '-1') return null;

        const imageInfo = pages[firstPageId]?.imageinfo?.[0];
        const imageUrl = imageInfo?.url;

        if (imageUrl) {
            console.log('[ImageSearch] Found:', imageUrl);
            return imageUrl;
        }

    } catch (e) {
        console.warn('[ImageSearch] Error searching Wikimedia', e);
    }

    return null;
}
