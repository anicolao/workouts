import { writable } from 'svelte/store';
import { base } from '$app/paths';
import { replaceState } from '$app/navigation';

// @ts-ignore
export const GOOGLE_CLIENT_ID = (import.meta.env && import.meta.env.VITE_GOOGLE_OAUTH_ID) || undefined;

export const SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.file'
].join(' ');

export interface UserProfile {
    name: string;
    email: string;
    picture: string;
    id: string;
}

export const authState = writable<{ token: string | null, ready: boolean }>({ token: null, ready: false });
export const userProfile = writable<UserProfile | null>(null);

let tokenClient: any;
let accessToken: string | null = null;
let refreshTimeoutId: any = null;

const TOKEN_KEY = 'workouts_access_token';
const EXPIRY_KEY = 'workouts_token_expiry';
const REFRESH_BUFFER_SECONDS = 300;

let refreshPromise: Promise<string | null> | null = null;
let refreshResolver: ((token: string | null) => void) | null = null;

export function initializeAuth(onSuccess: (token: string) => void) {
    if (handleRedirectCallback(onSuccess)) {
        return;
    }

    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedExpiry = localStorage.getItem(EXPIRY_KEY);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkAndRefreshIfNeeded(onSuccess);
        }
    });

    if (storedToken && storedExpiry) {
        const expiryTime = parseInt(storedExpiry);
        const now = Date.now();
        const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

        if (now < expiryTime) {
            accessToken = storedToken;
            authState.update(s => ({ ...s, token: storedToken }));
            onSuccess(accessToken);
            (window as any)._authReady = true;
            authState.update(s => ({ ...s, ready: true }));
            const remainingSeconds = (expiryTime - now) / 1000;
            scheduleRefresh(remainingSeconds, onSuccess);
        } else if (now < expiryTime + FORTY_EIGHT_HOURS_MS) {
            (window as any)._authReady = true;
            authState.update(s => ({ ...s, ready: true }));
            refreshAuth();
        } else {
            signOut();
            (window as any)._authReady = true;
            authState.update(s => ({ ...s, ready: true }));
        }
    }

    let attempts = 0;
    const interval = setInterval(() => {
        const g = (window as any).google;
        if (typeof g !== 'undefined' && g.accounts) {
            clearInterval(interval);
            initClient(onSuccess);
        } else {
            attempts++;
            if (attempts > 50) {
                clearInterval(interval);
                console.error('Google Identity Services script failed to load.');
            }
        }
    }, 100);
}

function initClient(onSuccess: (token: string) => void) {
    const g = (window as any).google;
    try {
        tokenClient = g.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
                handleTokenResponse(response, onSuccess);
            },
        });
    } catch (e) {
        console.error('[Auth] initTokenClient failed', e);
    }
    (window as any)._authReady = true;
    authState.update(s => ({ ...s, ready: true }));
}

function handleTokenResponse(response: any, onSuccess: (token: string) => void) {
    if (response.error) {
        console.error('[Auth] Token request failed:', response.error);
        signOut();
        window.location.href = `${base}/`;
        return;
    }

    accessToken = response.access_token as string;
    const expiresInSeconds = response.expires_in || 3599;
    const expiryTime = Date.now() + (expiresInSeconds * 1000);

    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

    authState.update(s => ({ ...s, token: accessToken }));

    if (refreshResolver) {
        refreshResolver(accessToken);
        refreshResolver = null;
        refreshPromise = null;
    }

    onSuccess(accessToken);
    scheduleRefresh(expiresInSeconds, onSuccess);
}

function scheduleRefresh(expiresInSeconds: number, onSuccess: (token: string) => void) {
    if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
    }

    const timeTillRefresh = (expiresInSeconds - REFRESH_BUFFER_SECONDS) * 1000;

    if (timeTillRefresh <= 0) {
        refreshAuth();
    } else {
        refreshTimeoutId = setTimeout(() => {
            refreshAuth();
        }, timeTillRefresh);
    }
}

function checkAndRefreshIfNeeded(onSuccess: (token: string) => void) {
    const storedExpiry = localStorage.getItem(EXPIRY_KEY);
    if (!storedExpiry) return;

    const expiryTime = parseInt(storedExpiry);
    const remainingSeconds = (expiryTime - Date.now()) / 1000;

    if (remainingSeconds < REFRESH_BUFFER_SECONDS) {
        refreshAuth();
    } else {
        scheduleRefresh(remainingSeconds, onSuccess);
    }
}

export function refreshAuth(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;

    if (tokenClient) {
        refreshPromise = new Promise((resolve) => {
            refreshResolver = resolve;
        });
        tokenClient.requestAccessToken({ prompt: '', scope: SCOPES });
        return refreshPromise;
    }
    return Promise.resolve(null);
}

export function signIn() {
    const redirectUri = window.location.origin + base;
    const returnPath = window.location.pathname + window.location.search;

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: SCOPES,
        include_granted_scopes: 'true',
        state: returnPath
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = authUrl;
}

function handleRedirectCallback(onSuccess: (token: string) => void): boolean {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return false;

    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const state = params.get('state');

    if (token) {
        accessToken = token;
        const expiresInSeconds = expiresIn ? parseInt(expiresIn) : 3599;
        const expiryTime = Date.now() + (expiresInSeconds * 1000);

        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

        authState.update(s => ({ ...s, token: accessToken, ready: true }));
        (window as any)._authReady = true;

        onSuccess(accessToken);
        scheduleRefresh(expiresInSeconds, onSuccess);

        if (state && state.startsWith('/') && state !== 'pass-through-value') {
            replaceState(state, {});
        } else {
            replaceState(window.location.pathname + window.location.search, {});
        }
        return true;
    }
    return false;
}

export function signOut() {
    const tokenToRevoke = accessToken;
    accessToken = null;
    if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    authState.update(s => ({ ...s, token: null }));
    const g = (window as any).google;
    if (typeof g !== 'undefined' && g.accounts && tokenToRevoke) {
        g.accounts.oauth2.revoke(tokenToRevoke, () => { });
    }
}

export async function getUserInfo(): Promise<UserProfile | null> {
    if (!accessToken) return null;
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            userProfile.set({
                name: data.name,
                email: data.email,
                picture: data.picture,
                id: data.sub // Map sub to id
            });
            return {
                name: data.name,
                email: data.email,
                picture: data.picture,
                id: data.sub
            };
        }
    } catch (e) {
        console.error('Failed to fetch user info', e);
    }
    return null;
}
