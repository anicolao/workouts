<script lang="ts">
    interface Props {
        href: string;
        label: string;
        active?: boolean;
        icon: any; // Snippet/Renderable
    }

    let { href, label, active = false, icon }: Props = $props();
</script>

<a {href} class="nav-item" class:active>
    <div class="icon-container">
        {@render icon()}
    </div>
    <span class="label">{label}</span>
</a>

<style>
    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        color: var(--text-muted);
        transition: color 0.2s;
        padding: 8px;
    }

    .nav-item.active {
        color: var(--text-primary);
    }
    
    .nav-item.active .icon-container {
        color: var(--color-primary);
    }

    .label {
        font-size: 0.7rem;
        font-weight: 500;
    }
    
    .icon-container {
        font-size: 1.5rem;
    }
</style>
