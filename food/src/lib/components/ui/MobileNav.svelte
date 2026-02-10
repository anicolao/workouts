<script lang="ts">
    import { base } from '$app/paths';
    import NavItem from './NavItem.svelte';

    import { page } from '$app/stores';

    // Simple Icon component placeholders or inline svgs
    
    import { store } from '$lib/store';
    import { sharedUsers } from '$lib/shared-users';
    import { onMount } from 'svelte';

    let isReadOnly = $state(false);
    let currentFolderId = $state<string | null>(null);
    let users = $state<any[]>([]);

    onMount(() => {
        const updateConfig = () => {
            const state = store.getState();
            isReadOnly = state.config.isReadOnly;
            currentFolderId = state.config.folderId;
        };
        updateConfig();
        const unsubStore = store.subscribe(updateConfig);
        const unsubUsers = sharedUsers.subscribe(u => users = u);
        return () => {
            unsubStore();
            unsubUsers();
        };
    });

    let currentUser = $derived(users.find(u => u.folderId === currentFolderId));

    let logUrl = $derived.by(() => {
        if ($page.url.pathname.includes('/entry')) {
             const id = $page.url.searchParams.get('id');
             if (id) return `${base}/log?from_entry=${id}`;
        }
        return `${base}/log`;
    });
</script>

<nav class="mobile-nav glass-panel">
    <div class="nav-group">
        <NavItem href="{base}/" label="Home" active={true}>
            {#snippet icon()}
            <!-- Home Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            {/snippet}
        </NavItem>
    </div>

    <div class="fab-container">
        {#if isReadOnly}
            <a href="{base}/switcher" class="fab avatar-fab" aria-label="Switch User">
                {#if currentUser && currentUser.avatar}
                    <img src={currentUser.avatar} alt={currentUser.name} />
                {:else if currentUser}
                    <span class="initial">{currentUser.name[0]}</span>
                {:else}
                    <!-- Fallback User Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                {/if}
            </a>
        {:else}
            <a href="{logUrl}" class="fab" aria-label="Log new food entry">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </a>
        {/if}
    </div>

    <div class="nav-group">
        <NavItem href={isReadOnly ? `${base}/switcher` : `${base}/settings`} label={isReadOnly ? "Switch User" : "Settings"}>
            {#snippet icon()}
            <!-- Settings/User Icon -->
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            {/snippet}
        </NavItem>
    </div>
</nav>

<style>
    .mobile-nav {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        height: 70px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 40px;
        z-index: 100;
        /* Custom glass panel override */
        border-radius: 35px; /* Pill shape */
        border: 1px solid rgba(255,255,255,0.1);
    }

    .fab-container {
        position: relative;
        top: -25px; 
    }

    .fab {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--gradient-calories);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 10px 20px rgba(255, 94, 98, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        border: 4px solid var(--bg-app); /* visual gap */
    }

    .fab:active {
        transform: scale(0.95);
        box-shadow: 0 5px 10px rgba(255, 94, 98, 0.4);
    }

    .nav-group {
        display: flex;
        gap: 20px;
    }

    /* Avatar FAB Styles */
    .avatar-fab {
        background: #333; /* Fallback for transparency */
        overflow: hidden;
        border: 2px solid var(--accent, #43e97b); /* Green ring for shared */
        box-shadow: 0 10px 20px #43e97b44;
    }

    .avatar-fab img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .avatar-fab .initial {
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
    }
</style>
