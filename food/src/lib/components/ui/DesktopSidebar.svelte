<script lang="ts">
    import { base } from '$app/paths';
    import NavItem from './NavItem.svelte';

    import { page } from '$app/stores';

    import { store } from '$lib/store';
    import { onMount } from 'svelte';

    let isReadOnly = $state(false);

    onMount(() => {
        const update = () => {
            isReadOnly = store.getState().config.isReadOnly;
        };
        update();
        return store.subscribe(update);
    });

    let logUrl = $derived.by(() => {
        if ($page.url.pathname.includes('/entry')) {
             const id = $page.url.searchParams.get('id');
             if (id) return `${base}/log?from_entry=${id}`;
        }
        return `${base}/log`;
    });
</script>

<aside class="desktop-sidebar glass-panel">
    <div class="logo-area">
        <h1>Food Log</h1>
    </div>

    <nav class="nav-vertical">
         <NavItem href="{base}/" label="Dashboard" active={true}>
            {#snippet icon()}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>
            {/snippet}
        </NavItem>
        
        {#if !isReadOnly}
        <NavItem href="{logUrl}" label="Log Food">
            {#snippet icon()}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            {/snippet}
        </NavItem>
        {/if}

        <NavItem href={isReadOnly ? `${base}/switcher` : `${base}/settings`} label={isReadOnly ? "Switch User" : "Settings"}>
            {#snippet icon()}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            {/snippet}
        </NavItem>
    </nav>
    
    <div class="spacer"></div>
</aside>

<style>
    .desktop-sidebar {
        width: 280px;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        padding: 30px;
        display: flex;
        flex-direction: column;
        border-radius: 0;
        border-right: 1px solid rgba(255,255,255,0.1);
        border-top: none;
        border-bottom: none;
        border-left: none;
    }

    .logo-area {
        margin-bottom: 50px;
        color: var(--text-primary);
    }
    
    .nav-vertical {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: flex-start;
        gap: 20px;
        align-items: flex-start;
        flex: 1;
    }
    
    .spacer {
        flex: 1;
    }

    /* Override NavItem default styles slightly for sidebar if needed via :global or more props. 
       Actually NavItem is generic enough. But we might want row layout here instead of column. */
    
    /* Just for now, we rely on NavItem.svelte, but it's flex-col.
       Let's assume we want row for desktop. 
       Maybe NavItem needs a 'layout' prop or we just style it here?
       Svelte 5 scoped styles don't leak down unless :global.
    */
    
    :global(.desktop-sidebar .nav-item) {
        flex-direction: row !important;
        gap: 16px !important;
        font-size: 1rem !important;
    }
    
    :global(.desktop-sidebar .nav-item .label) {
        font-size: 1rem !important;
    }
</style>
