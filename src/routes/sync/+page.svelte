<script lang="ts">
    import { store } from '$lib/store';
    import { initializeAndSync } from '$lib/config-sync';
    import { onDestroy } from 'svelte';
    import { base } from '$app/paths';

    let syncStatus = $state('idle');
    let lastSync = $state<string | null>(null);
    let accessToken = $state<string | null>(null);

    const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        syncStatus = state.workout.syncStatus;
        lastSync = state.workout.lastSync;
        accessToken = state.workout.accessToken;
    });

    onDestroy(() => {
        unsubscribe();
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
        <h1>Sync Status</h1>
    </header>

    <div class="status-card">
        <div class="status-row">
            <span class="label">Status:</span>
            <span class="value {syncStatus}">{syncStatus.toUpperCase()}</span>
        </div>
        <div class="status-row">
            <span class="label">Last Sync:</span>
            <span class="value">{lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</span>
        </div>
    </div>

    <button class="sync-btn" on:click={handleSync} disabled={syncStatus === 'syncing' || !accessToken}>
        {syncStatus === 'syncing' ? 'Syncing...' : 'Force Sync'}
    </button>
</div>

<style>
    .sync-page {
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
        font-family: 'Inter', sans-serif;
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
    }

    h1 {
        margin: 0;
        font-size: 2rem;
    }

    .status-card {
        background: #1e1e1e;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    .status-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }

    .status-row:last-child {
        margin-bottom: 0;
    }

    .label {
        color: #aaa;
    }

    .value {
        font-weight: bold;
    }

    .value.idle { color: #00ff00; }
    .value.syncing { color: #ffff00; }
    .value.error { color: #ff0000; }

    .sync-btn {
        width: 100%;
        padding: 1rem;
        font-size: 1.2rem;
        background-color: #333;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .sync-btn:hover:not(:disabled) {
        background-color: #444;
    }

    .sync-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
