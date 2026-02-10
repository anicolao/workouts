<script lang="ts">
    import { toasts, type Toast } from '$lib/toast';
    import { flip } from 'svelte/animate';
    import { fly } from 'svelte/transition';

    // Simple auto-subscription to store
    let items = $state<Toast[]>([]);
    
    $effect(() => {
        const unsub = toasts.subscribe(v => items = v);
        return unsub;
    });
</script>

<div class="toast-container">
    {#each items as toast (toast.id)}
        <div 
            class="toast glass-panel {toast.type}"
            animate:flip={{ duration: 300 }}
            in:fly={{ y: 50, duration: 300 }}
            out:fly={{ y: 50, duration: 300, opacity: 0 }}
        >
            <div class="icon">
                {#if toast.type === 'success'}✅
                {:else if toast.type === 'error'}❌
                {:else if toast.type === 'warning'}⚠️
                {:else}ℹ️
                {/if}
            </div>
            <div class="message">{toast.message}</div>
            <button class="close" onclick={() => toasts.dismiss(toast.id)}>×</button>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        bottom: 100px; /* Above mobile nav */
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
        width: 90%;
        max-width: 400px;
        pointer-events: none;
    }

    .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--radius-m);
        background: rgba(30, 30, 35, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        pointer-events: auto;
    }

    .toast.success { border-left: 4px solid #4caf50; }
    .toast.error { border-left: 4px solid #f44336; }
    .toast.warning { border-left: 4px solid #ff9800; }
    .toast.info { border-left: 4px solid #2196f3; }

    .message {
        flex: 1;
        font-size: 0.95rem;
        line-height: 1.4;
    }

    .close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
    }
    
    .close:hover {
        color: white;
    }

    @media (min-width: 1024px) {
        .toast-container {
            bottom: 40px;
            right: 40px;
            left: auto;
            transform: none;
        }
    }
</style>
