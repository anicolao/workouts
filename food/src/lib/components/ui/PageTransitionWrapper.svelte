<script lang="ts">
    import type { Snippet } from 'svelte';
    import { transitionSnapshots } from '$lib/transitions';

    let { children, pageKey }: { children: Snippet, pageKey: string } = $props();

    // Generate a safe ID for snapshot targeting
    const wrapperId = 'ptw-' + pageKey.replace(/[^a-zA-Z0-9-]/g, '_');
</script>

<div id={wrapperId} style="display: contents">
    {#if $transitionSnapshots[pageKey]}
        <!-- Render the frozen snapshot if available (Exiting State) -->
        {@html $transitionSnapshots[pageKey]}
    {:else}
        <!-- Render the live content (Entering/Active State) -->
        {@render children()}
    {/if}
</div>
