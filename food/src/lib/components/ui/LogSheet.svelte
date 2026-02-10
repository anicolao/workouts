<script lang="ts">
    import { fly } from 'svelte/transition';

    interface Props {
        open: boolean;
        onClose: () => void;
        children?: any;
    }

    let { open, onClose, children }: Props = $props();
</script>

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="backdrop" onclick={onClose} transition:fly={{ duration: 200, opacity: 0 }}>
        <!-- Stop propagation on content click to prevent closing -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="sheet glass-panel" onclick={(e) => e.stopPropagation()} transition:fly={{ y: 300, duration: 300 }}>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="handle-bar" onclick={onClose}>
                <div class="handle"></div>
            </div>
            <div class="content">
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 200;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }

    .sheet {
        width: 100%;
        max-height: 90vh; /* Adjust as needed */
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        padding-bottom: env(safe-area-inset-bottom);
        display: flex;
        flex-direction: column;
        background: #1c1e24; /* More solid for content readability */
    }
    
    .handle-bar {
        width: 100%;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }
    
    .handle {
        width: 40px;
        height: 5px;
        background: rgba(255,255,255,0.2);
        border-radius: 10px;
    }
    
    .content {
        padding: 20px;
        overflow-y: auto;
    }
</style>
