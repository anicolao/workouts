<script lang="ts">
    interface Props {
        value: number;
        max: number;
        size?: number;
        strokeWidth?: number;
        color?: string; // Hex or CSS variable
        gradientId?: string; // ID of a gradient defined elsewhere or inline
        label?: string; // e.g. "kcal"
        suffix?: string;
    }

    let {
        value,
        max,
        size = 120,
        strokeWidth = 20,
        color = '#ff6b6b',
        gradientId,
        label = 'kcal',
        suffix = ''
    }: Props = $props();

    const radius = $derived((size - strokeWidth) / 2);
    const circumference = $derived(2 * Math.PI * radius);
    const progress = $derived(Math.min(Math.max(value / max, 0), 1));
    const dashOffset = $derived(circumference * (1 - progress));
</script>

<div class="stats-ring-container" style="width: {size}px; height: {size}px;">
    <svg width={size} height={size} viewBox="0 0 {size} {size}" class="stats-ring-svg">
        <defs>
            <filter id="glow-shadow" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
               <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
               </feMerge>
            </filter>
            
             <!-- Default gradient if specific one requested -->
            {#if gradientId === 'calories-ring'}
                <linearGradient id="calories-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FF9966"/>
                    <stop offset="100%" stop-color="#FF5E62"/>
                </linearGradient>
            {/if}
        </defs>

        <!-- Background Circle -->
        <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            stroke-width={strokeWidth}
        />
        
        <!-- Progress Circle with Glow -->
        <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={gradientId ? `url(#${gradientId})` : color}
            stroke-width={strokeWidth}
            stroke-dasharray={circumference}
            stroke-dashoffset={dashOffset}
            stroke-linecap="round"
            class="progress-circle"
            transform="rotate(-90 {size/2} {size/2})"
            filter="url(#glow-shadow)"
        />
    </svg>

    <div class="content">
        <div class="main-value-row">
            <span class="value-text">{Math.round(value)}{suffix}</span>
            <span class="max-text">/ {max}</span>
        </div>
        {#if label}
            <span class="label">{label}</span>
        {/if}
    </div>
</div>

<style>
    .stats-ring-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .stats-ring-svg {
        position: absolute;
        top: 0;
        left: 0;
        overflow: visible; /* Allow glow to spill out */
    }

    .progress-circle {
        transition: stroke-dashoffset 1s ease-out;
    }

    .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .main-value-row {
        display: flex;
        align-items: baseline;
        gap: 4px;
        line-height: 1;
    }

    .value-text {
        font-size: 2.5rem; /* Larger as per screenshot */
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.02em;
    }

    .max-text {
        font-size: 1.2rem;
        color: var(--text-muted);
        font-weight: 500;
    }

    .label {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-top: 4px;
        font-weight: 500;
    }
</style>
