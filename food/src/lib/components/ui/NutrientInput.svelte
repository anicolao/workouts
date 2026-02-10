<script lang="ts">
  interface Props {
      value: number | undefined;
      unit?: string;
      label?: string;
      placeholder?: string;
      step?: string | number;
      class?: string;
      readonly?: boolean;
      onupdate?: (val: number, oldVal?: number) => void;
      layout?: 'vertical' | 'horizontal';
      indent?: boolean; // New prop for visual hierarchy
      [key: string]: any;
  }

  let { 
      value = undefined, 
      unit = 'g', 
      label = '', 
      placeholder = '--', 
      step = 1,
      class: className = '',
      readonly = false,
      onupdate,
      layout = 'vertical',
      indent = false,
      ...rest
  }: Props = $props();

  let internalValue = $state(value);

  // Sync prop updates to internal state
  $effect(() => {
     internalValue = value;
  });

  function handleInput(e: Event) {
      const target = e.target as HTMLInputElement;
      const val = target.value === '' ? undefined : Number(target.value);
      const oldVal = internalValue;
      internalValue = val;
      if (onupdate && val !== undefined) onupdate(val, oldVal);
  }
</script>

<label class={`nutrient-input-wrapper ${layout} ${className} ${indent ? 'indented' : ''}`}>
  {#if label}
    <span class="input-label">{label}</span>
  {/if}
  {#if layout === 'horizontal'}
     <!-- Flex spacer for horizontal layout to push input to right -->
     <div class="spacer"></div>
  {/if}
  <div class="input-container">
      <input 
        type="number" 
        value={internalValue} 
        class="gram-input" 
        {placeholder}
        {step} 
        {readonly}
        {...rest}
        oninput={handleInput}
      />
      <!-- Fixed width suffix container for specific unit alignment -->
      <span class="suffix-container">
          {#if unit}
            <span class="suffix">{unit}</span>
          {/if}
      </span>
  </div>
</label>

<style>
  .nutrient-input-wrapper {
      display: flex;
      gap: 4px;
      align-items: center;
      min-height: 28px;
  }

  .nutrient-input-wrapper.vertical {
      flex-direction: column;
      align-items: flex-start;
  }
  
  .nutrient-input-wrapper.horizontal {
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      padding: 2px 0;
  }

  .nutrient-input-wrapper.indented {
      padding-left: 16px; /* Visual indentation */
  }

  /* Spacer line logic */
  .spacer {
      flex-grow: 1;
      border-bottom: 1px dotted rgba(255,255,255,0.1);
      margin: 0 8px;
      align-self: center;
      transform: translateY(2px);
  }

  .input-label {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.7);
      text-transform: capitalize; /* Changed from uppercase to match Settings mostly OR User preference? User said "fields same as macros". Macros has Capitalized "Protein". NutritionForm had UPPERCASE. Settings uses "Protein". Changing to capitalize. */
      font-weight: 500;
  }
  
  /* Override for header-like items if needed, but default is standard text */

  .input-container {
      display: flex;
      align-items: center;
      gap: 4px;
      padding-right: 2px;
  }

  .gram-input {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.9);
      background: rgba(255,255,255,0.1);
      padding: 2px 4px;
      border-radius: 4px;
      width: 5ch;
      text-align: center;
      border: 1px solid transparent;
      transition: all 0.2s;
  }
  
  .gram-input:focus {
      outline: none;
      background: rgba(255,255,255,0.15);
      border-color: var(--color-primary, #4caf50);
  }
  
  .gram-input:read-only {
      opacity: 0.7;
      background: rgba(255,255,255,0.05);
  }

  .suffix-container {
      width: 3ch; /* Fixed width to accommodate 'mg', 'g' without shifting input */
      display: flex;
      justify-content: flex-start; /* Strings align left near the number */
  }

  .suffix {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
  }

  /* Remove spinners */
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
  }
</style>
