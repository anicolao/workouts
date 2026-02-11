<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
    import { store } from '$lib/store';
    import { onDestroy } from 'svelte';
    import { base } from '$app/paths';

	let { children } = $props();

    let syncStatus = $state('idle');
    let isAuthenticated = $state(false);

    const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        syncStatus = state.workout.syncStatus || 'idle';
        isAuthenticated = state.workout.isAuthenticated;
    });

    onDestroy(() => {
        unsubscribe();
    });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if isAuthenticated}
    <a href="{base}/sync" class="sync-status-icon neon-icon" aria-label="Sync Status">
        {#if syncStatus === 'syncing'}
            <div class="pulse-stack">
                <img src="{base}/images/icon-status-syncing.png" alt="Syncing" class="status-icon neon-icon base" />
                <img src="{base}/images/icon-status-syncing.png" alt="" class="status-icon neon-icon overlay" />
            </div>
        {:else if syncStatus === 'error'}
             <img src="{base}/images/icon-status-error.png" alt="Error" class="status-icon neon-icon error-glow" />
        {:else}
            <img src="{base}/images/icon-status-synced.png" alt="Synced" class="status-icon neon-icon" />
        {/if}
    </a>
{/if}

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #121212;
		color: white;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		font-family: 'Inter', sans-serif;
	}

    .sync-status-icon {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        text-decoration: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    }

    .sync-status-icon:active {
        transform: scale(0.95);
    }

    .status-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }

    /* Neon Icon Styling */
    .neon-icon {
        display: block;
        mix-blend-mode: plus-lighter;
    }

    .pulse-stack {
        position: relative;
        width: 32px;
        height: 32px;
    }

    .pulse-stack .base {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0.8;
    }

    .pulse-stack .overlay {
        position: absolute;
        top: 0;
        left: 0;
        mix-blend-mode: plus-lighter;
        animation: neon-pulse 1.5s ease-in-out infinite;
    }

    @keyframes neon-pulse {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
    }
</style>
