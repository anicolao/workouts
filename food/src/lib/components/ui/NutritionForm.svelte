<script lang="ts">
  import { slide } from 'svelte/transition';
  import { base } from '$app/paths';
  import NutrientInput from './NutrientInput.svelte';

  interface Props {
      metrics: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          details?: {
            saturatedFat?: number;
            transFat?: number;
            cholesterol?: number;
            sodium?: number;
            potassium?: number;
            calcium?: number;
            iron?: number;
            fiber?: number;
            sugar?: number;
            addedSugar?: number;
            caffeine?: number;
            alcohol?: number;
          };
      };
      readOnly?: boolean;
  }

  let { metrics = $bindable(), readOnly = false }: Props = $props();

  let showDetails = $state(false);

  // Initialize details if missing
  if (!metrics.details) {
      metrics.details = {};
  }

  function updateDetail(macro: 'carbs' | 'fat' | null, field: keyof NonNullable<typeof metrics.details>, newVal: number) {
      if (readOnly) return;
      
      metrics.details![field] = newVal;
  }

  // Direct handlers for macros
  function updateMacro(macro: 'calories' | 'protein' | 'carbs' | 'fat', val: number) {
      if (readOnly) return;
      metrics[macro] = val;
  }
</script>

<div class="nutrition-form">
  <!-- Top Level: Calories & Protein -->
  <!-- User requested "refactor to be common". We use standard NutrientInput layout="horizontal" for consistency. -->
  <div class="primary-macros">
      <NutrientInput 
          layout="horizontal"
          label="Calories" 
          unit="kcals" 
          value={metrics.calories} 
          onupdate={(v) => updateMacro('calories', v)}
          readonly={readOnly}
      />
      
      <div class="divider-row">
          <div class="divider"></div>
          <button class="icon-toggle" onclick={() => showDetails = !showDetails}>
             <img src="{base}/images/icon-toggle-{showDetails ? 'collapse' : 'expand'}.png" alt="Toggle Details" width="24" height="24" />
          </button>
      </div>
  </div>

  <!-- Protein Section -->
  <div class="group-section">
      <div class="group-header">
        <NutrientInput 
            layout="horizontal"
            label="Protein" 
            value={metrics.protein} 
            onupdate={(v) => updateMacro('protein', v)}
            readonly={readOnly}
            class="group-total"
        />
      </div>
  </div>

  <!-- Carbs Section -->
  <div class="group-section">
      <div class="group-header">
           <!-- Using NutrientInput even for the header to maintain perfect column alignment -->
           <NutrientInput 
            layout="horizontal"
            label="Carbohydrates"
            value={metrics.carbs} 
            onupdate={(v) => updateMacro('carbs', v)}
            readonly={readOnly}
            class="group-total"
          />
      </div>
      
      {#if showDetails}
        <div class="detail-list" transition:slide>
            <NutrientInput 
                layout="horizontal"
                label="Fiber" 
                value={metrics.details?.fiber} 
                onupdate={(v) => updateDetail('carbs', 'fiber', v)}
                readonly={readOnly}
                indent={true}
            />
            <NutrientInput 
                layout="horizontal"
                label="Sugar" 
                value={metrics.details?.sugar} 
                onupdate={(v) => updateDetail('carbs', 'sugar', v)}
                readonly={readOnly}
                indent={true}
            />
            <NutrientInput 
                layout="horizontal"
                label="Added Sugar" 
                value={metrics.details?.addedSugar} 
                onupdate={(v) => updateDetail('carbs', 'addedSugar', v)}
                readonly={readOnly}
                class="double-indent"
                indent={true}
            />
        </div>
      {/if}
  </div>

  <!-- Fat Section -->
  <div class="group-section">
      <div class="group-header">
          <NutrientInput 
            layout="horizontal"
            label="Fats"
            value={metrics.fat} 
            onupdate={(v) => updateMacro('fat', v)}
            readonly={readOnly}
            class="group-total"
          />
      </div>
      
      {#if showDetails}
        <div class="detail-list" transition:slide>
            <NutrientInput 
                layout="horizontal"
                label="Saturated" 
                value={metrics.details?.saturatedFat} 
                onupdate={(v) => updateDetail('fat', 'saturatedFat', v)}
                readonly={readOnly}
                indent={true}
            />
            <NutrientInput 
                layout="horizontal"
                label="Trans" 
                value={metrics.details?.transFat} 
                onupdate={(v) => updateDetail('fat', 'transFat', v)}
                readonly={readOnly}
                indent={true}
            />
            <NutrientInput 
                layout="horizontal"
                label="Cholesterol" 
                unit="mg"
                value={metrics.details?.cholesterol} 
                onupdate={(v) => updateDetail(null, 'cholesterol', v)}
                readonly={readOnly}
                indent={true}
            />
        </div>
      {/if}
  </div>

  {#if showDetails}
      <div class="other-section" transition:slide>
          <div class="section-label">Micros & Other</div>
          <div class="detail-list">
             <NutrientInput 
                layout="horizontal"
                label="Sodium" 
                unit="mg"
                value={metrics.details?.sodium} 
                onupdate={(v) => updateDetail(null, 'sodium', v)}
                readonly={readOnly}
            />
            <NutrientInput 
                layout="horizontal"
                label="Potassium" 
                unit="mg"
                value={metrics.details?.potassium} 
                onupdate={(v) => updateDetail(null, 'potassium', v)}
                readonly={readOnly}
            />
             <NutrientInput 
                layout="horizontal"
                label="Calcium" 
                unit="mg"
                value={metrics.details?.calcium} 
                onupdate={(v) => updateDetail(null, 'calcium', v)}
                readonly={readOnly}
            />
             <NutrientInput 
                layout="horizontal"
                label="Iron" 
                unit="mg"
                value={metrics.details?.iron} 
                onupdate={(v) => updateDetail(null, 'iron', v)}
                readonly={readOnly}
            />
            <NutrientInput 
                layout="horizontal"
                label="Caffeine" 
                unit="mg"
                value={metrics.details?.caffeine} 
                onupdate={(v) => updateDetail(null, 'caffeine', v)}
                readonly={readOnly}
            />
             <NutrientInput 
                layout="horizontal"
                label="Alcohol" 
                value={metrics.details?.alcohol} 
                onupdate={(v) => updateDetail(null, 'alcohol', v)}
                readonly={readOnly}
            />
          </div>
      </div>
  {/if}

</div>

<style>
  .nutrition-form {
      display: flex;
      flex-direction: column;
      gap: 12px; /* Reduced gap */
      padding: 10px;
      padding-bottom: 20px;
      background: rgba(0,0,0,0.2);
      border-radius: 16px;
  }

  .primary-macros {
      display: flex;
      flex-direction: column;
      gap: 0px; /* Seamless stack */
  }

  .divider-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 4px 0;
  }

  .divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      flex-grow: 1;
  }
  
  .icon-toggle {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Workaround: Crop corners to hide black box artifact */
      border-radius: 50%;
      overflow: hidden;
  }
  
  .icon-toggle img {
      mix-blend-mode: plus-lighter;
      transition: transform 0.2s ease;
  }
  
  .icon-toggle:hover img {
      transform: scale(1.1);
  }

  .group-section {
      display: flex;
      flex-direction: column;
  }

  .group-header {
      /* No extra styling needed, NutrientInput handles it */
  }

  .detail-list {
      display: flex;
      flex-direction: column;
      /* Remove background/padding to make it seamless "refactor to be common" */
  }

  .details-toggle {
      background: none;
      border: none;
      color: var(--color-primary, #4caf50);
      font-size: 0.85rem;
      cursor: pointer;
      align-self: center;
      padding: 8px;
      opacity: 0.9;
  }

  .other-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
  }

  .section-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
      padding-left: 0; 
      margin-bottom: 4px;
      text-transform: uppercase;
  }
  
  :global(.double-indent) {
      padding-left: 32px !important; /* Extra indentation for added sugar */
  }

  /* Make group headers slightly more prominent */
  :global(.group-total .input-label) {
      color: rgba(255,255,255,0.9) !important;
      font-weight: 600 !important;
  }
</style>
