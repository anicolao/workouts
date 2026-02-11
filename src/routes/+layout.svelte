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
    <a href="{base}/sync" class="sync-status-icon" aria-label="Sync Status">
        {#if syncStatus === 'syncing'}
            🔄
        {:else if syncStatus === 'error'}
            ❌
        {:else}
            ☁️
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
        font-size: 1.5rem;
        text-decoration: none;
        cursor: pointer;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .sync-status-icon:hover {
        background: rgba(255, 255, 255, 0.1);
    }
</style>
