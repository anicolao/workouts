<script lang="ts">
  import { page } from '$app/stores';
  import { store, dispatchEvent, type LogEntry } from '$lib/store';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount, tick } from 'svelte';

  import { formatLogDate } from '$lib/formatDate';
  import { resolveDriveImage } from '$lib/images';
  import NutritionForm from '$lib/components/ui/NutritionForm.svelte';

  // Support both Path Param (new) and Query Param (legacy)
  const id = $page.params.id || $page.url.searchParams.get('id');
  
  let entry = $state<any>(null);
  let form = $state<any>({
      mealType: 'Snack',
      description: '',
      rationale: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      details: {}
  });
  
  let imageUrls = $state<string[]>([]);
  let entryDateTimeStr = $state('');
  let backUrl = $state(`${base}/`);
  // @ts-ignore
  let galleryContainer: HTMLElement;

  let baseRoute = $state(`${base}/`);
  let isReadOnlyInput = $state(false);

  onMount(() => {
      // Logic for Shadow Route:
      // If we are in "Read Only" / "Shared" mode, we need to respect that context.
      
      const unsub = store.subscribe(() => {
          const s = store.getState();
          isReadOnlyInput = s.config.isReadOnly;
          const fid = s.config.folderId;
          
          if (fid && isReadOnlyInput) {
              baseRoute = `${base}/sharing`;
          } else {
              baseRoute = `${base}`;
          }

          if (s.config.folderId && entry) {
             // Update back link dynamically if folderId changes
             const params = new URLSearchParams();
             if (entry.date) params.set('date', entry.date);
             params.set('folderId', s.config.folderId);
             backUrl = `${baseRoute}/?${params.toString()}`;
          }
      });
      
      // Initialize Logic (runs once)
      const state = store.getState();
      isReadOnlyInput = state.config.isReadOnly;
      const folderId = state.config.folderId;

      // Set initial baseRoute based on current state before potential goto
      if (folderId && isReadOnlyInput) {
          baseRoute = `${base}/sharing`;
      } else {
          baseRoute = `${base}`;
      }

      // Async Initialization
      (async () => {
        if (!id) {
            goto(`${baseRoute}/?${folderId ? `folderId=${folderId}` : ''}`);
            return;
        }
        await tick();
        
        // Deep clone to ensure we have a mutable object (Redux state is frozen)
        const rawEntry = state.projections.log.find((e: LogEntry) => e.id === id);
        entry = rawEntry ? JSON.parse(JSON.stringify(rawEntry)) : null;
        
        if (!entry) {
            goto(`${baseRoute}/?${folderId ? `folderId=${folderId}` : ''}`);
            return;
        }

        if (entry.date) {
            const params = new URLSearchParams();
            params.set('date', entry.date);
            if (folderId) params.set('folderId', folderId);
            backUrl = `${baseRoute}/?${params.toString()}`;
        } else {
            const params = new URLSearchParams();
            if (folderId) params.set('folderId', folderId);
            backUrl = `${baseRoute}/?${params.toString()}`;
        }

        Object.assign(form, {
            mealType: entry.mealType,
            description: entry.description,
            rationale: entry.rationale || '',
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            details: entry.details || {}
        });

        if (entry.imageDriveUrl) {
            imageUrls = entry.imageDriveUrl.split(',').map((u: string) => u.trim());
        }
        
        entryDateTimeStr = formatLogDate(entry.date + 'T' + entry.time);
      })();

      return unsub;
  });

  async function handleSave() {
     if (!entry || !id) return;

     const changes = {
         mealType: form.mealType,
         description: form.description,
         rationale: form.rationale,
         calories: Number(form.calories),
         protein: Number(form.protein),
         carbs: Number(form.carbs),
         fat: Number(form.fat),
         details: JSON.parse(JSON.stringify(form.details || {}))
     };

     store.dispatch(dispatchEvent('log/entryUpdated', { entryId: id, changes: JSON.parse(JSON.stringify(changes)) }));
     
     goto(backUrl);
  }

  async function handleDelete() {
      if (!confirm('Are you sure you want to delete this entry?')) return;
      if (!id) return;
      
      store.dispatch(dispatchEvent('log/entryDeleted', { entryId: id }));

      goto(backUrl);
  }
  
  function handleGalleryClick(e: MouseEvent) {
      if (!galleryContainer) return;

      const rect = galleryContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const center = rect.width / 2;
      const scrollAmount = rect.width * 0.85; 

      if (x > center) {
          galleryContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else {
          galleryContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
  }

</script>

<div class="page-container">
  <div class="nav-header">
      <a href="{backUrl}" class="text-link">&larr; Back</a>
      <h2 class="page-title">{entryDateTimeStr}</h2>
      {#if !isReadOnlyInput}
        <button class="delete-link" onclick={handleDelete}>Delete</button>
      {/if}
  </div>

  {#if imageUrls.length > 0}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="gallery" bind:this={galleryContainer} onclick={handleGalleryClick}>
          {#each imageUrls as url}
               {#await resolveDriveImage(url)}
                   <div class="loading-placeholder glass-panel">Loading...</div>
               {:then src}
                   <img src={src} class="hero-image" alt="Food" />
               {:catch}
                   <div class="error-placeholder glass-panel">Image Error</div>
               {/await}
          {/each}
      </div>
  {/if}

  <div class="glass-panel form-section">
      <div class="field">
          <label>Item Name
            <input type="text" class="bg-input big-text" bind:value={form.description} disabled={isReadOnlyInput} />
          </label>
      </div>
      
      <div class="field">
          <label>Meal Type
            <select class="bg-input" bind:value={form.mealType} disabled={isReadOnlyInput}>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
            </select>
          </label>
      </div>

      <div class="macros-grid">
         <NutritionForm bind:metrics={form} readOnly={isReadOnlyInput} />
      </div>

      <div class="field">
          <label>Rationale / Notes
            <textarea class="bg-input fixed-height" bind:value={form.rationale} disabled={isReadOnlyInput}></textarea>
          </label>
      </div>

      {#if !isReadOnlyInput}
        <button class="save-btn" onclick={handleSave}>Save Changes</button>
      {/if}
  </div>
</div>

<style>
  .page-container {
      padding: 20px;
      padding-bottom: 120px;
      max-width: 600px;
      margin: 0 auto;
  }
  
  .nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
  }
  
  .text-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
  }
  
  .page-title {
      font-size: 1.1rem;
      font-weight: 600;
  }
  
  .delete-link {
      background: none;
      border: none;
      color: #ff4d4d;
      font-size: 0.9rem;
      cursor: pointer;
  }
  
  .gallery {
      display: flex;
      overflow-x: auto;
      gap: 1rem;
      margin-bottom: 1.5rem;
      scroll-snap-type: x mandatory;
      padding-bottom: 10px;
  }
  
  .hero-image {
      width: 85%;
      height: 300px;
      object-fit: cover;
      border-radius: var(--radius-m);
      flex-shrink: 0;
      scroll-snap-align: center;
      border: 1px solid rgba(255,255,255,0.1);
  }
  
  .loading-placeholder, .error-placeholder {
      width: 85%;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-m);
      flex-shrink: 0;
  }
  
  .form-section {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
  }
  
  .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
  }
  
  label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
  }
  
  .bg-input {
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      color: white;
      padding: 12px;
      border-radius: var(--radius-m);
      font-size: 1rem;
      width: 100%;
      box-sizing: border-box;
  }
  
  .bg-input:focus {
      outline: none;
      border-color: var(--color-primary);
      background: rgba(0,0,0,0.3);
  }
  
  .big-text {
      font-size: 1.2rem;
      font-weight: 600;
  }
  
  .macros-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
  }
  
  .save-btn {
      margin-top: 10px;
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: 16px;
      border-radius: 30px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
  }

  .fixed-height {
      height: 100px; /* Enforce consistency between OS/Browsers for regression testing */
      resize: vertical;
  }
</style>
