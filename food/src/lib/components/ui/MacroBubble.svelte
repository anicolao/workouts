<script lang="ts">
    import { base } from '$app/paths';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    interface Props {
        label: string;
        value: number;
        max: number;
        color?: string; // Hex for glow/stroke
        unit?: string;
        iconSrc?: string; // Path to image
        gradientId?: string; // If using gradient stroke
    }

    let { 
        label, 
        value, 
        max, 
        color = '#ffffff', 
        unit = 'g', 
        iconSrc,
        gradientId
    }: Props = $props();
    
    // Fatter ring
    const size = 100;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    // const circumference = 2 * Math.PI * radius; // Not needed for path method

    // Tweened store for smooth animation logic
    const displayedValue = tweened(value, {
        duration: 800,
        easing: cubicOut
    });

    // Reactively update tween when props change
    $effect(() => {
        displayedValue.set(value);
    });

    // Computed Progress from tweened value
    // Clamp visual progress to 0.9999 to avoid "full circle" arc reset or inversion
    // allowing > 1 for text but visually capping at full ring.
    // Also handle 0 properly.
    const progress = $derived.by(() => {
        const p = $displayedValue / max;
        return Math.min(Math.max(p, 0.0001), 0.9999);
    });

    // Calculate arc path
    // Start at -90deg (top)
    const startAngle = -Math.PI / 2;
    // End angle based on visual progress
    const endAngle = $derived(startAngle + (progress * 2 * Math.PI));
    
    // Helper to get coordinates
    const getCoords = (a: number) => ({
        x: size/2 + radius * Math.cos(a),
        y: size/2 + radius * Math.sin(a)
    });

    const start = getCoords(startAngle);
    const end = $derived(getCoords(endAngle));
    const largeArc = $derived(progress > 0.5 ? 1 : 0);
    
    // Path for the progress arc
    const arcPath = $derived(`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`);
    
    // Display Percentage (can go over 100%)
    const percent = $derived(Math.round(($displayedValue/max) * 100));
</script>

<div class="macro-bubble">
    <div class="ring-wrapper" style="width: {size}px; height: {size}px;">
        <svg width={size} height={size} viewBox="0 0 {size} {size}" class="ring-svg">
            <defs>
                 <filter id="glow-{label}" filterUnits="userSpaceOnUse" x={-size/2} y={-size/2} width={size*2} height={size*2}>
                   <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                   <feMerge>
                       <feMergeNode in="coloredBlur"/>
                       <feMergeNode in="SourceGraphic"/>
                   </feMerge>
                </filter>
                 <!-- Path definition for text alignment if needed separately -->
                 <path id="path-{label}" d={arcPath} />
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
            
             <!-- Progress Path -->
             <path
                d={arcPath}
                fill="none"
                stroke={gradientId ? `url(#${gradientId})` : color}
                stroke-width={strokeWidth}
                stroke-linecap="round"
                filter="url(#glow-{label})"
                class="progress-path"
            />
            
            <!-- Percentage at Tip (Rotated along path) -->
            <text dy="3" fill="#000" font-size="9" font-weight="900" style="pointer-events: none;">
                <textPath 
                    href="#path-{label}" 
                    startOffset="100%" 
                    text-anchor="end"
                    spacing="auto"
                >
                    {percent}%&nbsp;
                </textPath>
            </text>
        </svg>
        
        <!-- Internal Content: Icon, Label, Value -->
        <div class="inner-content">
            {#if iconSrc}
                <img src="{base}{iconSrc}" alt={label} class="macro-icon" />
            {/if}
            <div class="stats">
                <span class="bubble-label">{label}</span>
                <span class="bubble-value">{Math.round($displayedValue)}/{max}</span>
            </div>
        </div>
    </div>
</div>

<style>
    .macro-bubble {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .ring-wrapper {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .ring-svg {
        position: absolute;
        top: 0; 
        left: 0;
        overflow: visible;
    }

    .progress-path {
        /* transition: d 0.5s ease-out; Removed to prevent arc deformation artifacts */
    }
    
    .inner-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        width: 70%; 
        height: 70%;
        gap: 2px;
        background-color: var(--bg-card); /* Provides backdrop for mix-blend-mode */
        border-radius: 50%; /* Fits inside the ring */
    }
    
    .macro-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
        margin-bottom: 2px;
        mix-blend-mode: screen; /* Removes black background */
    }
    
    .stats {
        display: flex;
        flex-direction: column;
        line-height: 1;
    }
    
    .bubble-label {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
    }
    
    .bubble-value {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary);
    }
</style>
