<script lang="ts">

	import '../app.css';

	import MobileNav from '$lib/components/ui/MobileNav.svelte';
	import DesktopSidebar from '$lib/components/ui/DesktopSidebar.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import PageTransitionWrapper from '$lib/components/ui/PageTransitionWrapper.svelte';
	import { page } from '$app/stores';
	import { getTransitionDirection, getTransitionParams } from '$lib/transitions';
	import { onMount } from 'svelte';
    import { initializeAuth, ensureValidToken, getUserInfo } from '$lib/auth';
    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import { getAllEvents } from '$lib/db';
    import { syncManager } from '$lib/sync-manager';
    import { store, batchHydrateEvents, setConfig } from '$lib/store';
    import { ensureDataStructures, saveIdentity } from '$lib/sheets';
    import DesktopHeader from '$lib/components/ui/DesktopHeader.svelte';

	let { children } = $props();

	let width = $state(0);
    // ... (rest of script)


	let height = $state(0);
	let reducedMotion = $state(false);
	let transitionsEnabled = $state(false);

	// Track navigation history for direction calculation
	let previousUrl: URL | null = null; 

    onMount(async () => {
        // Initialize previousUrl with current url so first navigation works
        previousUrl = new URL($page.url.href);
        initializeAuth(async () => { 
            console.log('[Auth] Initialized in Layout');
            
            // Skip default data initialization if we are in the sharing route
            // The Sharing Layout will handle its own initialization
            if ($page.url.pathname.startsWith('/sharing')) {
                console.log('[Layout] Skipping default data init (Sharing Mode)');
                return;
            }

            try {
                const { spreadsheetId, folderId } = await ensureDataStructures();
                store.dispatch(setConfig({ spreadsheetId, folderId }));
                
                // Kick off sync manager after config is loaded
                syncManager.sync();

                // Sync Identity (Name/Avatar) to Sheet
                getUserInfo().then(profile => {
                    if (profile) {
                         // We map UserProfile (name, picture) to IdentityProfile (name, avatar)
                         saveIdentity(spreadsheetId, { name: profile.name, avatar: profile.picture })
                            .catch(e => console.warn('[Layout] Failed to save identity', e));
                    }
                });

            } catch (e) {
                console.error('[Layout] Failed to init sheets config', e);
            }
        });
        
        // Offline Support Initialization
        try {
            console.log('[Layout] Hydrating from DB...');
            const events = await getAllEvents();
            console.log(`[Layout] Found ${events.length} events in DB.`);
            
            // Batch hydrate to avoid middleware performance warnings
            store.dispatch(batchHydrateEvents(events) as any);
            
            console.log('[Layout] Hydration complete.');
            
            // Offline Support Initialization done.
            // Sync is triggered in initializeAuth after config is ready.
            
        } catch (e) {
            console.error('[Layout] Failed to initialize offline support', e);
        }

		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = mediaQuery.matches;
		transitionsEnabled = true;
	});

    // Global click listener to ensure auth is fresh on user interaction
    // This solves the issue of stale tokens on return without requiring a full reload or sign-out
    $effect(() => {
        const handleInteraction = () => {
             ensureValidToken().catch(e => console.warn('[Auth] Background refresh failed', e));
        };
        document.addEventListener('click', handleInteraction, true); // Capture phase to likely happen first
        
        return () => {
             document.removeEventListener('click', handleInteraction, true);
        };
    });

    // Handle history updates for direction calculation    // Handle history updates for direction calculation
    import { transitionSnapshots } from '$lib/transitions';

    beforeNavigate((nav) => {
        // Skip snapshotting if we are staying on the same page (e.g. query param change)
        // This prevents the PageTransitionWrapper from swapping to a snapshot and destroying the component tree
        if (nav.to && nav.to.url.pathname === nav.from?.url.pathname) {
            return;
        }

        // Snapshot the current page content before it updates
        // Optimization: Skip snapshotting if transitions are disabled or reduced motion is on
        if (reducedMotion || !transitionsEnabled) return;

        const currentPath = $page.url.pathname;
        const wrapperId = 'ptw-' + currentPath.replace(/[^a-zA-Z0-9-]/g, '_');
        const element = document.getElementById(wrapperId);
        if (element) {
            transitionSnapshots.update(s => ({ ...s, [currentPath]: element.innerHTML }));
        }
    });

    afterNavigate((nav) => {
        if (nav.to) {
            previousUrl = new URL(nav.to.url.href);
            // Clear the snapshot for the NEW page so it renders live content
            const newPath = nav.to.url.pathname;
            transitionSnapshots.update(s => {
                const { [newPath]: _, ...rest } = s;
                return rest;
            });
        }
    });


</script>



<svelte:window bind:innerWidth={width} bind:innerHeight={height} />



<div class="app-shell">
	<div class="desktop-nav">
		<DesktopSidebar />
	</div>
	
	<div class="main-content">
        <DesktopHeader />
        <div class="content-area-grid">
            {#if reducedMotion || !transitionsEnabled}
                <div class="transition-wrapper">
                    {@render children()}
                </div>
            {:else}
                {#key $page.url.pathname}
                    {@const direction = previousUrl ? getTransitionDirection(previousUrl, $page.url) : 'crossfade'}
                    {@const config = getTransitionParams(direction, width, height)}

                    <div 
                        class="transition-wrapper"
                        in:config.in={config.inParams}
                        out:config.out={config.outParams}
                    >
                        <PageTransitionWrapper {children} pageKey={$page.url.pathname} />
                    </div>
                {/key}
            {/if}
        </div>
	</div>

	<div class="mobile-nav-wrapper">
		<MobileNav />
	</div>

    <ToastContainer />
</div>

<style>
	.app-shell {
		display: flex;
		min-height: 100vh;
	}

	.desktop-nav {
		display: none;
	}

	.mobile-nav-wrapper {
		display: block;
	}

	.main-content {
		flex: 1;
		padding-bottom: 100px; /* Space for mobile nav */
		width: 100%;
		max-width: 100%;
		
        /* Flex column to stack Header and Page Content */
        display: flex;
        flex-direction: column;
		overflow-x: hidden; 
	}
    
    /* Dedicated grid container for transitions */
    .content-area-grid {
        flex: 1;
        display: grid;
        grid-template-areas: "content";
        width: 100%;
        position: relative;
    }

	.transition-wrapper {
		grid-area: content;
		width: 100%;
		/* Ensure wrapper takes full height/width of the cell */
	}

	@media (min-width: 1024px) {
		.desktop-nav {
			display: block;
			width: 280px; /* Match sidebar width */
			flex-shrink: 0;
		}

		.mobile-nav-wrapper {
			display: none;
		}

		.main-content {
			padding-bottom: 0;
            /* On desktop, main-content is right side of flex row */
		}
	}
</style>
