<script lang="ts">
    import { onMount } from 'svelte';
    import { signOut } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { toasts } from '$lib/toast';
    import { store, dispatchEvent, selectSettings, updateGoals, type SettingsState, type MacroRatios } from '$lib/store';
    import DonutChart from '$lib/components/ui/DonutChart.svelte';

    // State
    const defaultSettings: SettingsState = {
        targetCalories: 2000,
        macroRatios: { protein: 0.3, fat: 0.35, carbs: 0.35 }
    };
    
    // "Draft" state (User edits)
    let settings = $state<SettingsState>(JSON.parse(JSON.stringify(store.getState()?.settings || defaultSettings)));

    // "Persisted" state (From Store)
    let savedSettings = $state<SettingsState>(JSON.parse(JSON.stringify(store.getState()?.settings || defaultSettings)));
    
    // Derived dirty state
    let dirty = $derived.by(() => {
        const s = settings;
        const o = savedSettings;
        return s.targetCalories != o.targetCalories ||
               Math.abs(s.macroRatios.protein - o.macroRatios.protein) > 0.001 ||
               Math.abs(s.macroRatios.fat - o.macroRatios.fat) > 0.001 ||
               Math.abs(s.macroRatios.carbs - o.macroRatios.carbs) > 0.001;
    });

    // Subscribe to store
    onMount(() => {
        const unsubscribe = store.subscribe(() => {
            const state = store.getState();
            // Always update saved reference
            savedSettings = JSON.parse(JSON.stringify(state.settings));
        });
        return unsubscribe;
    });

    function handleSignOut() {
        signOut();
        goto(`${base}/`);
    }

    // --- Logic ---
    
    function toPct(val: number) { return Math.round(val * 100); }
    
    function getGrams(ratio: number, calsPerGram: number) {
        return Math.round((settings.targetCalories * ratio) / calsPerGram);
    }

    // Cascading Adjustment Logic
    function adjustMacro(type: 'protein' | 'fat' | 'carbs', newValPct: number) {
        const newVal = Math.max(0, Math.min(100, newValPct)) / 100;
        const oldVal = settings.macroRatios[type];
        const delta = newVal - oldVal;
        
        // Constants for precision
        const PRECISION = 10000;

        if (delta === 0) return;

        // Clone ratios
        const next = { ...settings.macroRatios };
        next[type] = newVal;

        // Order of adjustment based on type
        // P -> F -> C
        let chain: ('protein' | 'fat' | 'carbs')[];
        if (type === 'protein') chain = ['fat', 'carbs'];
        else if (type === 'fat') chain = ['carbs', 'protein']; // F -> C -> P
        else chain = ['protein', 'fat']; // C -> P -> F

        let remainder = -delta; // Amount we need to distribute

        // Pass 1: Primary Target
        const target1 = chain[0];
        const val1 = next[target1];
        let change1 = remainder;
        let nextVal1 = val1 + change1;
        let carryOver = 0;
        
        if (nextVal1 < 0) {
            carryOver = nextVal1; // Negative amount
            nextVal1 = 0;
        } 
        
        next[target1] = Math.max(0, nextVal1); 
        
        if (carryOver !== 0) {
            // Underflow -> Distribute to target2
            const target2 = chain[1];
            next[target2] = Math.max(0, next[target2] + carryOver);
        }
        
        // Final normalization to ensure exact 1.0 sum
        const currentSum = next.protein + next.fat + next.carbs;
        if (Math.abs(currentSum - 1) > 0.001) {
             // Fix T2
             next[chain[1]] = Math.max(0, 1 - next[type] - next[target1]);
        }

        settings.macroRatios = next;
    }
    
    // Adjust based on grams
    function adjustGrams(type: 'protein' | 'fat' | 'carbs', grams: number) {
        const calsPerGram = type === 'fat' ? 9 : 4;
        const cals = grams * calsPerGram;
        const pct = (cals / settings.targetCalories) * 100;
        adjustMacro(type, pct);
    }

    // Chart Interaction
    function handleChartClick(type: 'protein' | 'fat' | 'carbs') {
        const currentPct = Math.round(settings.macroRatios[type] * 100);
        
        // If multiple of 5, add 5. Else add 1.
        let delta = 1;
        if (currentPct % 5 === 0) {
            delta = 5;
        }
        
        const newPct = Math.min(100, currentPct + delta);
        adjustMacro(type, newPct);
    }
    
    function handleUpdateCalories(cals: number) {
        settings.targetCalories = cals;
    }

    function save() {
        // Optimistically update saved state
        const snap = JSON.parse(JSON.stringify(settings));
        savedSettings = snap;

        try {
            // Pass plain object to Redux to avoid Svelte proxy conflicts
            store.dispatch(dispatchEvent('settings/goalsUpdated', snap));
            goto(`${base}/`);
        } catch (e) {
            console.error(e);
            toasts.error('Failed to save settings.');
        }
    }
</script>

<div class="settings-page">
    <header class="header">
        <button class="icon-btn back-btn" onclick={() => goto(`${base}/`)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1>Macro Goals</h1>
        <div class="actions-right">
            <button class="ghost-btn icon-only" onclick={() => goto(`${base}/switcher`)} aria-label="Switch User">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </button>
            <button class="ghost-btn" onclick={handleSignOut}>Sign Out</button>
        </div>
    </header>

    <div class="content-grid">
        <!-- Visualizer -->
        <div class="chart-section glass-panel">
            <div class="chart-wrapper">
                <DonutChart 
                    calories={settings.targetCalories} 
                    ratios={settings.macroRatios}
                    onSegmentClick={handleChartClick}
                    onCaloriesChange={handleUpdateCalories}
                />
            </div>
            
            <!-- Removed redundant daily target input row -->
        </div>


        <!-- Sliders -->
        <div class="sliders-section">
            <!-- Protein -->
            <div class="macro-card glass-panel" style="--accent: #ff4d4d;">
                <div class="macro-header">
                    <div class="icon-badge">P</div>
                    <div class="label-group">
                        <span class="macro-name">Protein</span>
                        <span class="macro-desc">1.5g per kg of body weight</span>
                    </div>
                    <div class="values">
                         <div class="input-group">
                            <input 
                                type="number" 
                                class="bare-input pct-input" 
                                value={toPct(settings.macroRatios.protein)} 
                                oninput={(e) => adjustMacro('protein', Number(e.currentTarget.value))}
                            />
                            <span class="suffix">%</span>
                        </div>
                        <div class="input-group">
                            <input 
                                type="number" 
                                class="bare-input gram-input" 
                                value={getGrams(settings.macroRatios.protein, 4)}
                                onchange={(e) => adjustGrams('protein', Number(e.currentTarget.value))}
                            />
                            <span class="suffix-sm">g</span>
                        </div>
                    </div>
                </div>
                <div class="slider-container">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={toPct(settings.macroRatios.protein)} 
                        oninput={(e) => adjustMacro('protein', Number(e.currentTarget.value))}
                        class="custom-slider protein-slider"
                    />
                </div>
            </div>

            <!-- Fat -->
            <div class="macro-card glass-panel" style="--accent: #ffca28;">
                <div class="macro-header">
                    <div class="icon-badge">F</div>
                    <div class="label-group">
                        <span class="macro-name">Fats</span>
                        <span class="macro-desc">Essential for hormone production</span>
                    </div>
                    <div class="values">
                         <div class="input-group">
                            <input 
                                type="number" 
                                class="bare-input pct-input" 
                                value={toPct(settings.macroRatios.fat)} 
                                oninput={(e) => adjustMacro('fat', Number(e.currentTarget.value))}
                            />
                            <span class="suffix">%</span>
                        </div>
                        <div class="input-group">
                            <input 
                                type="number" 
                                class="bare-input gram-input" 
                                value={getGrams(settings.macroRatios.fat, 9)}
                                onchange={(e) => adjustGrams('fat', Number(e.currentTarget.value))}
                            />
                            <span class="suffix-sm">g</span>
                        </div>
                    </div>
                </div>
                 <div class="slider-container">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={toPct(settings.macroRatios.fat)} 
                        oninput={(e) => adjustMacro('fat', Number(e.currentTarget.value))}
                         class="custom-slider fat-slider"
                    />
                </div>
            </div>

            <!-- Carbs -->
            <div class="macro-card glass-panel" style="--accent: #00e5ff;">
                <div class="macro-header">
                    <div class="icon-badge">C</div>
                    <div class="label-group">
                        <span class="macro-name">Carbs</span>
                        <span class="macro-desc">Primary energy source</span>
                    </div>
                    <div class="values">
                         <div class="input-group">
                            <input 
                                type="number" 
                                class="bare-input pct-input" 
                                value={toPct(settings.macroRatios.carbs)} 
                                oninput={(e) => adjustMacro('carbs', Number(e.currentTarget.value))}
                            />
                            <span class="suffix">%</span>
                        </div>
                        <div class="input-group">
                            <input 
                                type="number" 
                                class="bare-input gram-input" 
                                value={getGrams(settings.macroRatios.carbs, 4)}
                                onchange={(e) => adjustGrams('carbs', Number(e.currentTarget.value))}
                            />
                            <span class="suffix-sm">g</span>
                        </div>
                    </div>
                </div>
                 <div class="slider-container">
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={toPct(settings.macroRatios.carbs)} 
                        oninput={(e) => adjustMacro('carbs', Number(e.currentTarget.value))}
                        class="custom-slider carbs-slider"
                    />
                </div>
            </div>
        </div>
    </div>
    
    <div class="actions-footer">
        <button class="save-btn" disabled={!dirty} onclick={save}>
            Save Changes
        </button>
        <div style="display:none;" data-testid="debug-state">
            Dirty: {dirty}
            DiffCals: {settings.targetCalories - (savedSettings?.targetCalories || 0)}
            DiffP: {settings.macroRatios.protein - (savedSettings?.macroRatios.protein || 0)}
        </div>
    </div>
</div>

<style>
    .settings-page {
        padding: 10px; /* Reduced from 20px */
        max-width: 800px;
        margin: 0 auto;
        color: white;
        padding-bottom: 80px; /* Reduced from 100px */
        min-height: 100vh;
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px; /* Reduced from 30px */
    }
    
    .header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
    }
    
    .actions-right {
        display: flex;
        gap: 8px;
    }

    .icon-only {
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .icon-btn {
        background: none;
        border: none;
        color: white;
        padding: 8px;
        cursor: pointer;
    }
    
    .ghost-btn {
        background: none;
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.8);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
    }
    
    .content-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 15px; /* Reduced from 20px */
    }

    /* ... media query unchanged ... */

    .glass-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 15px; /* Reduced from 20px */
    }

    .chart-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px; /* Reduced from 20px */
    }
    
    /* Sliders Section */
    .sliders-section {
        display: flex;
        flex-direction: column;
        gap: 12px; /* Reduced from 16px */
    }
    
    .macro-card {
        display: flex;
        flex-direction: column;
        gap: 10px; /* Reduced from 15px */
    }
    
    .macro-header {
        display: flex;
        align-items: center;
        gap: 10px; /* Reduced from 12px */
    }
    
    .icon-badge {
        width: 32px; /* Reduced from 40px */
        height: 32px;
        font-size: 1rem;
    }
    
    .label-group {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .macro-name {
        font-weight: 700;
        font-size: 1.1rem;
    }
    
    .macro-desc {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
    }
    
    .values {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
    }
    
    .input-group {
        display: flex;
        align-items: baseline;
        gap: 2px;
    }

    .bare-input {
        background: transparent;
        border: none;
        color: white;
        font-weight: 700;
        text-align: right;
        padding: 0;
        width: 3ch;
        /* -moz-appearance: textfield; */
    }
    
    .bare-input:focus {
        outline: none;
        border-bottom: 1px solid var(--accent);
    }

    .pct-input {
        font-size: 1.2rem;
        color: var(--accent);
        font-weight: 800;
    }
    
    .gram-input {
        font-size: 0.85rem;
        color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.1);
        padding: 2px 4px;
        border-radius: 4px;
        width: 5ch;
        text-align: center;
    }
    
    .gram-input:focus {
        background: rgba(255,255,255,0.2);
    }
    
    .suffix {
        font-size: 1.2rem;
        color: var(--accent);
        font-weight: 800;
    }
    
    .suffix-sm {
        font-size: 0.85rem;
        color: rgba(255,255,255,0.6);
    }

    /* Remove number spinners */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
    }

    /* Custom Range Slider */
    .slider-container {
        padding: 5px 0;
        display: flex;
        align-items: center;
        height: 30px; /* Ensure space for thumb */
    }
    
    .custom-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        background: transparent; /* Track handles background */
        outline: none;
        cursor: pointer;
    }
    
    /* Track Styling */
    .custom-slider::-webkit-slider-runnable-track {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: rgba(255,255,255,0.1);
    }
    
    .protein-slider::-webkit-slider-runnable-track {
        background: linear-gradient(90deg, #ff4d4d 0%, rgba(255,77,77,0.2) 100%);
    }
    .fat-slider::-webkit-slider-runnable-track {
        background: linear-gradient(90deg, #ffca28 0%, rgba(255,202,40,0.2) 100%);
    }
    .carbs-slider::-webkit-slider-runnable-track {
        background: linear-gradient(90deg, #00e5ff 0%, rgba(0,229,255,0.2) 100%);
    }
    
    /* Thumb Styling */
    .custom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 0 10px var(--accent);
        margin-top: -8px; /* (8px track - 24px thumb) / 2 = -8px */
        border: 2px solid var(--accent);
        background-clip: padding-box;
    }
    
    /* Firefox Support */
    .custom-slider::-moz-range-track {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: rgba(255,255,255,0.1);
    }
    .protein-slider::-moz-range-track { background: linear-gradient(90deg, #ff4d4d 0%, rgba(255,77,77,0.2) 100%); }
    .fat-slider::-moz-range-track { background: linear-gradient(90deg, #ffca28 0%, rgba(255,202,40,0.2) 100%); }
    .carbs-slider::-moz-range-track { background: linear-gradient(90deg, #00e5ff 0%, rgba(0,229,255,0.2) 100%); }

    .custom-slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 2px solid var(--accent);
        cursor: pointer;
    }
    
    /* Save Footer */
    .actions-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        padding: 20px;
        display: flex;
        justify-content: center;
        background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
        pointer-events: none; /* Let clicks pass through transparent top */
        z-index: 1000;
    }
    
    .save-btn {
        pointer-events: auto;
        padding: 16px 40px;
        border-radius: 30px;
        border: none;
        background: white;
        color: black;
        font-weight: 700;
        font-size: 1.1rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        transition: all 0.2s;
        opacity: 0.5;
        transform: translateY(10px);
    }
    
    .save-btn:not(:disabled) {
        opacity: 1;
        transform: translateY(0);
        background: var(--color-primary, #ff4d4d);
        color: white;
        box-shadow: 0 0 20px rgba(255, 77, 77, 0.4);
    }
    .save-btn:disabled {
        cursor: default;
    }
</style>
