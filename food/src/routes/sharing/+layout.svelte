<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { store, setContext } from '$lib/store';
    import { setDatabaseContext, getAllEvents } from '$lib/db';
    import { syncManager } from '$lib/sync-manager';
    import { initializeAuth } from '$lib/auth';
    import { ensureValidToken } from '$lib/auth';

    import { ensureConnectedToSharedFolder, fetchIdentity } from '$lib/sheets';
    import { sharedUsers } from '$lib/shared-users';
    import { batchHydrateEvents } from '$lib/store';
    import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
    import DesktopSidebar from '$lib/components/ui/DesktopSidebar.svelte';

    let { children } = $props();

    let isLoading = $state(true);
    let error = $state<string | null>(null);

    const folderId = $page.url.searchParams.get('folderId') || store.getState().config.folderId;

    // Immediately set context during initialization so children can access it
    if (folderId) {
        console.log('[SharingLayout] Setting Shared Context (Init). Folder:', folderId);
        store.dispatch({ type: 'global/resetState' });
        setDatabaseContext(folderId);
        store.dispatch(setContext({ isReadOnly: true, folderId }));
    }

    onMount(async () => {
        if (!folderId) {
            error = 'No folder ID provided for sharing.';
            isLoading = false;
            return;
        }

        console.log('[SharingLayout] Mounting Shared Context. Folder:', folderId);

        // 1. Try Anonymous / Fast Path first (for "Anyone with the link")
        try {
            console.log('[SharingLayout] Attempting Anonymous Discovery...');
            const { spreadsheetId } = await ensureConnectedToSharedFolder(folderId);
            await connect(spreadsheetId);
            return; // Success! Skip Auth initialization block for discovery.
        } catch (e: any) {
             console.warn('[SharingLayout] Anonymous discovery failed, falling back to Authenticated...', e);
        }

        // 2. Failover to Authenticated Path (if user has specific permissions)
        initializeAuth(async () => {
            try {
                // Verify we can access the folder/DB
                const { spreadsheetId } = await ensureConnectedToSharedFolder(folderId);
                
                await connect(spreadsheetId);

            } catch (e: any) {
                console.error('[SharingLayout] Initialization Failed', e);
                // If the error is about not finding the file, previously we offered manual picker.
                // Now we just fail gracefully with a message instructing the user to check permissions.
                error = `Failed to load shared log: ${e.message}`;
                isLoading = false;
            }
        });
    });

    async function connect(spreadsheetId: string) {
        // Update Config with explicit spreadsheetId found in that folder
        store.dispatch({ 
            type: 'config/setConfig', 
            payload: { spreadsheetId, folderId, isReadOnly: true } 
        });

        // 3. Hydrate from Context-Scoped DB
        console.log('[SharingLayout] Hydrating from keyspace...');
        const events = await getAllEvents();
        if (events.length > 0) {
                store.dispatch(batchHydrateEvents(events) as any);
        }

        // 4. Trigger Sync (Read Only)
        await syncManager.sync();

        // 5. Fetch Identity & Cache User
        fetchIdentity(spreadsheetId).then(profile => {
             console.log('[SharingLayout] Identity:', profile);
             if (profile.name) {
                 sharedUsers.addOrUpdateUser({
                     folderId,
                     name: profile.name,
                     avatar: profile.avatar || ''
                 });
             }
        }).catch(e => console.warn('[SharingLayout] Failed to fetch identity', e));

        isLoading = false;
    }
    
    onDestroy(() => {
        console.log('[SharingLayout] Destroying Shared Context.');
        // Revert to default
        setDatabaseContext('default'); // Switch DB back
        store.dispatch({ type: 'global/resetState' }); // Clear Shared Data
        store.dispatch(setContext({ isReadOnly: false, folderId: null })); // Reset Config
        
        restoreDefaultContext();
    });

    async function restoreDefaultContext() {
        try {
             const events = await getAllEvents(); // Now querying 'default'
             if (events.length > 0) {
                 store.dispatch(batchHydrateEvents(events) as any);
             }
             syncManager.sync();
        } catch (e) {
            console.warn('[SharingLayout] Failed to restore default context on exit', e);
        }
    }

</script>

<div class="sharing-shell">
    {#if error}
        <div class="error-container">
            <h1>Unable to load shared log</h1>
            <p>{error}</p>
            <p class="subtext">Please ensure the link is correct and the shared folder allows "Anyone with the link".</p>
            <a href="/">Return Home</a>
        </div>
    {:else if isLoading}
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading Shared Data...</p>
        </div>
    {:else}
        <!-- Render the route content (LogPage, EntryPage) -->
         {@render children()}
    {/if}
    
    <ToastContainer />
</div>

<style>
    .sharing-shell {
        min-height: 100vh;
        background: black;
        color: white;
    }
    .error-container, .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        gap: 20px;
        text-align: center;
    }
    .subtext {
        font-size: 0.9rem;
        color: #888;
        max-width: 400px;
    }
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255,255,255,0.1);
        border-radius: 50%;
        border-top-color: var(--color-primary, cyan);
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>
