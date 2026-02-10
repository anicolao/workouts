<script lang="ts">
    interface Props {
        calories?: number;
        width?: number; // Default 300
        ratios: {
            protein: number;
            fat: number;
            carbs: number;
        };
        onSegmentClick?: (key: 'protein' | 'fat' | 'carbs') => void;
        onCaloriesChange?: (cals: number) => void;
    }

    let { 
        calories = 2000, 
        width = 300,
        ratios,
        onSegmentClick,
        onCaloriesChange
    }: Props = $props();

    // --- Derived ---
    const center = $derived(width / 2);
    // strokeWidth 50 matches the design
    const strokeWidth = 50;
    const padding = 20; // Extra space for glow filter
    const radius = $derived((width - strokeWidth - (padding * 2)) / 2);
    
    // Top position for the "cap"
    const startCapPos = $derived({
        x: center + radius * Math.cos(-Math.PI / 2),
        y: center + radius * Math.sin(-Math.PI / 2)
    });
    
    // ... (segments calculation same as before) ...
    let segments = $derived.by(() => {
        // Start from top (-90deg)
        let currentAngle = -Math.PI / 2;
        
        // Order: Protein -> Fat -> Carbs
        const rawData = [
            { key: 'protein', val: ratios.protein, color: '#ff4d4d' },
            { key: 'fat', val: ratios.fat, color: '#ffca28' },
            { key: 'carbs', val: ratios.carbs, color: '#00e5ff' }
        ];

        return rawData.map(d => {
            const angle = d.val * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;
            const largeArc = angle > Math.PI ? 1 : 0;
            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);
            const dPath = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`].join(' ');
            return { 
                ...d, 
                d: dPath, 
                pct: Math.round(d.val * 100),
                start: { x: x1, y: y1 } // Expose start coord for cap
            };
        });
    });
</script>

<div class="donut-chart" style="width: {width}px; height: {width}px;">
    <svg {width} height={width} viewBox="0 0 {width} {width}">
        <defs>
            {#each segments as seg}
                <filter id="glow-{seg.key}" filterUnits="userSpaceOnUse" x="0" y="0" width={width} height={width}>
                    <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            {/each}
        </defs>

        <!-- Background Track -->
        <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            stroke-width={strokeWidth} 
        />
        
        <!-- Segments -->
        {#each segments as seg (seg.key)}
            <!-- 1. The Arc Path (Butt ends) -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <path
                id="path-{seg.key}"
                d={seg.d}
                fill="none"
                stroke={seg.color}
                stroke-width={strokeWidth}
                stroke-linecap="butt" 
                filter="url(#glow-{seg.key})"
                class="segment-path"
                role="button"
                tabindex="0"
                onclick={() => onSegmentClick?.(seg.key as any)}
                style="cursor: pointer;"
            />
            
            <!-- 2. The Start Cap (Circle) -->
            <!-- Mimics "Round Start" to overlap previous segment -->
            <circle 
                cx={seg.start.x} 
                cy={seg.start.y} 
                r={strokeWidth / 2} 
                fill={seg.color}
                filter="url(#glow-{seg.key})"
                style="pointer-events: none;"
            />

             <!-- Label on Path -->
             <!-- Only show if > 3% to visible text -->
            {#if seg.pct > 3}
                <text fill="rgba(0,0,0,0.8)" font-weight="900" font-size="14" dy="5" style="pointer-events: none;">
                    <textPath 
                        href="#path-{seg.key}" 
                        startOffset="50%" 
                        text-anchor="middle"
                    >
                        {seg.pct}%
                    </textPath>
                </text>
            {/if}
        {/each}

        <!-- Overlap Fix: Dark "Blocker" Circle under the Red Cap -->
        <!-- This hides any protruding glow from the Carbs segment end (flat end glow). -->
        <circle 
            cx={startCapPos.x} 
            cy={startCapPos.y} 
            r={(strokeWidth / 2) - 2} 
            fill="#1a1a1a"    
        />
        
        <!-- Start Cap (Red Ball) for Symmetry -->
        <!-- RE-DRAWN last to sit ON TOP of any overlapping segments (Carbs) -->
        <!-- This is technically redundant with the loop's Protein Start Cap, 
             but necessary for Z-Index (Top of Stack) -->
        <circle 
            cx={startCapPos.x} 
            cy={startCapPos.y} 
            r={strokeWidth / 2} 
            fill="#ff4d4d"
            style="pointer-events: none;"
            filter="url(#glow-protein)"
        />
    </svg>
    
    <!-- Central Input Interaction -->
    <div class="center-content">
        <input 
            type="number" 
            class="cals-input" 
            value={calories} 
            oninput={(e) => onCaloriesChange?.(Number(e.currentTarget.value))}
        />
        <span class="cals-label">KCAL</span>
    </div>
</div>

<style>
    .donut-chart {
        position: relative;
    }
    
    /* Center Overlay for Input */
    .center-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 120px;
        z-index: 10;
        pointer-events: none; /* Let clicks pass through container, but input needs auto */
    }
    
    .cals-input {
        pointer-events: auto; /* Re-enable for input */
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        font-size: 2.2rem;
        font-weight: 800;
        text-align: center;
        width: 100%;
        border-radius: 8px;
        padding: 0;
        margin-bottom: 5px;
        text-shadow: 0 0 20px rgba(255,255,255,0.3);
    }
    
    .cals-input:focus {
        background: rgba(255,255,255,0.15);
        outline: none;
    }

    /* Remove number spinners */
    .cals-input::-webkit-inner-spin-button, 
    .cals-input::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
    }

    .cals-label {
        color: rgba(255,255,255,0.5);
        font-size: 1rem;
        font-weight: 500;
        pointer-events: none;
    }

    .segment-path {
        /* No transitions to ensure stability and avoid artifacts */
        outline: none;
    }
</style>
