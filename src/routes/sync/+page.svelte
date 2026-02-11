<script lang="ts">
    import { store } from '$lib/store';
    import { initializeAndSync } from '$lib/config-sync';
    import { onDestroy, onMount } from 'svelte';
    import { base } from '$app/paths';

    // --- Versioning Logic ---
    // @ts-ignore
    const version = `v${import.meta.env.VITE_APP_VERSION}`;
    // @ts-ignore
    const buildInfo = `${new Date(import.meta.env.VITE_APP_BUILD_DATE).toLocaleDateString()} ${import.meta.env.VITE_APP_DIRTY_FLAG ? "⚠ " : ""}(${import.meta.env.VITE_APP_COMMIT_HASH})`;

    let syncStatus = $state('idle');
    let lastSync = $state<string | null>(null);
    let accessToken = $state<string | null>(null);
    let isOnline = $state(true);

    const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        syncStatus = state.workout.syncStatus;
        lastSync = state.workout.lastSync;
        accessToken = state.workout.accessToken;
    });

    function updateOnlineStatus() {
        isOnline = navigator.onLine;
    }

    onMount(() => {
        updateOnlineStatus();
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    });

    onDestroy(() => {
        unsubscribe();
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        }
    });

    async function handleSync() {
        if (accessToken) {
            await initializeAndSync(accessToken);
        }
    }
</script>

<div class="sync-page">
    <header>
        <a href="{base}/" class="back-link">← Back</a>
        <h1>Network & Sync</h1>
    </header>

    <section class="card glass-panel">
        <h2>Connection</h2>
        <div class="status-row">
            <span class="label">Status</span>
            <span class="value {isOnline ? 'online' : 'offline'}">
                {isOnline ? "Online" : "Offline"}
            </span>
        </div>
        <div class="status-row">
            <span class="label">Sync Activity</span>
            <span class="value {syncStatus}">
                {syncStatus === 'syncing' ? "Syncing..." : syncStatus.toUpperCase()}
            </span>
        </div>
        <div class="status-row">
            <span class="label">Last Sync</span>
            <span class="value">
                {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
            </span>
        </div>
    </section>

    <section class="card glass-panel">
        <h2>Actions</h2>
        <button class="primary-btn neon-gradient" onclick={handleSync} disabled={syncStatus === 'syncing' || !accessToken || !isOnline}>
            {syncStatus === 'syncing' ? 'Syncing...' : 'Force Sync Now'}
        </button>
        {#if !accessToken}
            <p class="help warning">Sign in required to sync.</p>
        {/if}
    </section>

    <section class="card glass-panel">
        <h2>Application Info</h2>
        <div class="status-row">
            <span class="label">Version</span>
            <div class="version-info">
                <span class="value mono">{version}</span>
                <span class="value mono small">{buildInfo}</span>
            </div>
        </div>
    </section>

    <section class="card glass-panel">
        <h2>Privacy</h2>
        <p class="mb-4 text-sm text-secondary">
            Data is stored on your device and in your Google Spreadsheet. We do not have access to it.
        </p>
    </section>
</div>

<style>
    :global(body) {
        background-color: #111;
        margin: 0;
    }

    .sync-page {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
        font-family: 'Inter', system-ui, sans-serif;
        color: white;
    }

    header {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;
    }

    .back-link {
        color: #888;
        text-decoration: none;
        margin-right: 1rem;
        font-size: 1.2rem;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: white;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    h2 {
        font-size: 1.1rem;
        font-weight: 500;
        margin-top: 0;
        margin-bottom: 1rem;
        color: #fff;
    }

    .card {
        background: rgba(28, 30, 36, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .status-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        font-size: 1rem;
    }

    .status-row:last-child {
        margin-bottom: 0;
    }

    .label {
        color: #a0a0a0;
    }

    .value {
        font-weight: 500;
        text-align: right;
    }

    .value.online { color: #2ecc71; }
    .value.offline { color: #e74c3c; }
    .value.idle { color: #2ecc71; }
    .value.syncing { color: #f1c40f; }
    .value.error { color: #e74c3c; }

    .primary-btn {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        font-weight: 600;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .primary-btn:hover:not(:disabled) {
        background-color: #2980b9;
        transform: translateY(-1px);
    }

    .primary-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #333;
    }

    .help {
        font-size: 0.85rem;
        color: #666;
        margin-top: 0.5rem;
        text-align: center;
    }

    .help.warning {
        color: #e74c3c;
    }

    .version-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }

    .mono {
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', monospace;
    }

    .small {
        font-size: 0.8rem;
        color: #666;
    }

    .text-sm {
        font-size: 0.85rem;
        line-height: 1.5;
    }

    .text-secondary {
        color: #a0a0a0;
    }

    .mb-4 {
        margin-bottom: 0; 
    }
</style>
