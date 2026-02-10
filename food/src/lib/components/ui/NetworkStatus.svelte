<script lang="ts">
   import { onMount, onDestroy } from 'svelte';
   import { getPendingEvents } from '$lib/db';
   import { syncManager } from '$lib/sync-manager';
   import { base } from '$app/paths';
   import { goto } from '$app/navigation';
   
   // We can poll or listen to events. For now, simple polling for pending count + online API
   let isOnline = true;
   let pendingCount = 0;
   let isSyncing = false;
   let syncError: string | null = null;
   let interval: any;

   async function checkStatus() {
       isOnline = navigator.onLine;
       isSyncing = syncManager.isSyncing;
       syncError = syncManager.syncError;
       const pending = await getPendingEvents();
       pendingCount = pending.length;
   }

   onMount(() => {
       isOnline = navigator.onLine;
       window.addEventListener('online', checkStatus);
       window.addEventListener('offline', checkStatus);
       
       interval = setInterval(checkStatus, 2000); // Poll every 2s
       checkStatus();
   });

   onDestroy(() => {
    if (typeof window !== 'undefined') {
       window.removeEventListener('online', checkStatus);
       window.removeEventListener('offline', checkStatus);
       clearInterval(interval);
    }
   });

   function handleClick() {
       goto(`${base}/settings/network`);
   }
</script>

<button 
    class="network-status" 
    class:offline={!isOnline} 
    on:click={handleClick}
    aria-label="Network Status: {syncError ? 'Error' : (isOnline ? 'Online' : 'Offline')}, {pendingCount} pending items"
    data-status={!isOnline ? 'offline' : (syncError ? 'error' : (isSyncing ? 'syncing' : (pendingCount > 0 ? 'pending' : 'synced')))}
>
    <div class="icon-wrapper">
        {#if !isOnline}
            <!-- Cloud Off -->
            <img src="{base}/images/icon-status-offline.png" alt="Offline" width="24" height="24" class="neon-icon" />
        {:else if syncError}
             <!-- Error -->
             <img src="{base}/images/icon-status-error.png" alt="Sync Error" width="24" height="24" class="neon-icon error-glow" />
        {:else if isSyncing}
            <!-- Syncing (Layered for neon intensity) -->
            <div class="pulse-stack">
                <img src="{base}/images/icon-status-syncing.png" alt="Syncing" width="24" height="24" class="neon-icon base" />
                <img src="{base}/images/icon-status-syncing.png" alt="" width="24" height="24" class="neon-icon overlay" />
            </div>
        {:else if pendingCount > 0}
             <!-- Pending -->
             <img src="{base}/images/icon-status-pending.png" alt="Pending" width="24" height="24" class="neon-icon" />
             <span class="badge">{pendingCount}</span>
        {:else}
            <!-- Synced -->
            <img src="{base}/images/icon-status-synced.png" alt="Synced" width="24" height="24" class="neon-icon" />
        {/if}
    </div>
</button>

<style>
    .network-status {
        background: var(--bg-card-glass, rgba(28, 30, 36, 0.7));
        /* backdrop-filter: blur(12px); Removed: User said "too much" */
        /* border: 1px solid rgba(255, 255, 255, 0.05); Removed: User said "border" looked bad */
        border: none; /* Re-added to prevent default User Agent button border */
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border-radius: 50%; /* Rounded to mask background gradient mismatch */
        transition: transform 0.2s;
    }

    .network-status:active {
        transform: scale(0.95);
    }
    
    .icon-wrapper {
        display: flex;
        align-items: center;
        position: relative;
        /* Ensure the wrapper serves as a positioning context if needed, though stack handles it */
        justify-content: center;
    }

    /* Base class for all neon icons */
    .neon-icon {
        display: block;
        /* Revert to plus-lighter as user defended it and screen caused issues */
        mix-blend-mode: plus-lighter;
    }
    
    /* Stacking context for the pulse animation */
    .pulse-stack {
        position: relative;
        width: 24px;
        height: 24px;
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
        /* Use plus-lighter for the glowing overlay to add intense brightness */
        mix-blend-mode: plus-lighter;
        animation: neon-pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes neon-pulse {
        0%, 100% { 
            opacity: 0; 
        }
        50% { 
            opacity: 1; 
        }
    }

    .badge {
        position: absolute;
        top: -5px;
        right: -8px;
        font-size: 0.75rem;
        background: var(--primary-color, #3498db);
        color: white;
        padding: 0.1rem 0.3rem;
        border-radius: 4px;
        min-width: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
</style>
