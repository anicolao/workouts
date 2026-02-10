<script lang="ts">
    import { resolveDriveImage } from '$lib/images';
    import { base } from '$app/paths';
    import { formatLogDate } from '$lib/formatDate';

    interface Props {
        id: string;
        date: string;
        time: string;
        mealType: string;
        description: string;
        calories: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        imageDriveUrl?: string; // Comma separated
    }

    let {
        id,
        date,
        time,
        mealType,
        description,
        calories,
        protein,
        carbs, // unused but available
        fat,   // unused but available
        imageDriveUrl
    }: Props = $props();

    const imageUrls = $derived(imageDriveUrl ? imageDriveUrl.split(',').map(u => u.trim()) : []);
    const mainImage = $derived(imageUrls.length > 0 ? imageUrls[0] : null);

    // Smart Date Format
    const formattedDate = $derived(formatLogDate(`${date}T${time}`));
</script>

<a href="{base}/entry?id={id}" class="food-card glass-panel">
    <div class="card-content">
        <div class="image-area">
             {#if mainImage}
                {#await resolveDriveImage(mainImage)}
                    <div class="skel-img"></div>
                {:then src}
                    <img src={src} alt={description} class="thumb" />
                {:catch}
                     <div class="fallback-img">?</div>
                {/await}
                {#if imageUrls.length > 1}
                    <div class="badge">+{imageUrls.length - 1}</div>
                {/if}
             {:else}
                 <div class="fallback-img">{mealType[0]}</div>
             {/if}
        </div>
        
        <div class="info-area">
             <div class="top-row">
                 <span class="meal-type">{mealType}</span>
                 <span class="time">{formattedDate}</span>
             </div>
             <h3 class="description">{description}</h3>
             <div class="stats-row">
                 <span class="cals text-gradient-calories">{calories} kcal</span>
                 {#if protein}
                    <span class="macro">P: {protein}g</span>
                 {/if}
             </div>
        </div>
    </div>
</a>

<style>
    .food-card {
        display: block;
        padding: 12px;
        margin-bottom: 12px;
        transition: transform 0.2s, background-color 0.2s;
        border: 1px solid rgba(255,255,255,0.05);
    }

    .food-card:active {
        transform: scale(0.98);
        background-color: rgba(255,255,255,0.1);
    }

    .card-content {
        display: flex;
        gap: 16px;
        align-items: center;
    }

    .image-area {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: var(--radius-m);
        overflow: hidden;
        flex-shrink: 0;
        background: #2a2a2a;
    }

    .thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .skel-img {
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.05);
        animation: pulse 1.5s infinite;
    }

    .fallback-img {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: var(--text-muted);
        background: rgba(255,255,255,0.03);
    }

    .badge {
        position: absolute;
        bottom: 0;
        right: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        font-size: 0.6rem;
        padding: 2px 5px;
        border-top-left-radius: 6px;
    }

    .info-area {
        flex: 1;
        min-width: 0; /* text-overflow fix */
    }

    .top-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .meal-type {
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
    }

    .description {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-primary);
    }

    .stats-row {
        display: flex;
        gap: 12px;
        font-size: 0.9rem;
        align-items: center;
    }

    .cals {
        font-weight: 700;
    }
    
    .macro {
        color: var(--text-secondary);
        font-size: 0.8rem;
    }

    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
</style>
