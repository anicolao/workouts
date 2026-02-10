<script lang="ts">
    export let protein: number;
    export let carbs: number;
    export let fat: number;
    export let size: 'sm' | 'xs' = 'sm';
</script>

<div class="macro-summary {size}">
    <span class="macro p">{Math.round(protein)}p</span>
    <span class="macro c">{Math.round(carbs)}c</span>
    <span class="macro f">{Math.round(fat)}f</span>
</div>

<style>
    .macro-summary {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        opacity: 0.8;
    }

    .macro-summary.sm {
        font-size: 0.75rem; 
    }

    .macro-summary.xs {
        font-size: 0.7rem; /* ~2pt smaller roughly */
    }
  
    .macro.p { color: #c471ed; }
    .macro.c { color: #24c6dc; }
    .macro.f { color: #D1913C; }
</style>
