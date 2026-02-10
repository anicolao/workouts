<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { store } from '$lib/store';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { cubicOut } from 'svelte/easing';
  import { getBusinessDate, groupLogs } from '$lib/activity-grouping';
  import { base } from '$app/paths';
  
  import StatsRing from '$lib/components/ui/StatsRing.svelte';
  import MacroBubble from '$lib/components/ui/MacroBubble.svelte';
  import ActivityCard from '$lib/components/ui/ActivityCard.svelte';
  import NetworkStatus from '$lib/components/ui/NetworkStatus.svelte';

  // Reactive State (Synced from Redux)
  let allLogs = $state<any[]>(store.getState().projections.log); 
  let settings = $state(store.getState().settings);
  
  // Folders are managed by Layout, but let's just make sure we pass context safely
  const folderId = $page.url.searchParams.get('folderId');

  // Current Business Date (4AM cutoff)
  const today = getBusinessDate(new Date());
  
  // Reactive selected date state from URL
  let selectedDate = $derived($page.url.searchParams.get('date') || today);

  // Helper to format Date to YYYY-MM-DD (Local)
  function toISOLocalDate(d: Date) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  }

  // Derived display title
  let dateTitle = $derived.by(() => {
      if (selectedDate === today) return 'Today';
      
      const sel = new Date(selectedDate + 'T00:00:00'); // Force local
      const now = new Date(today + 'T00:00:00'); // Force local
      const diffTime = now.getTime() - sel.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) return 'Yesterday';
      
      return sel.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  });

  // Manage collapsed state via URL
  let collapsedIds = $derived(($page.url.searchParams.get('collapsed') || '').split(',').filter(Boolean));

  function toggleGroup(id: string) {
      const newCollapsed = new Set(collapsedIds);
      if (newCollapsed.has(id)) {
          newCollapsed.delete(id);
      } else {
          newCollapsed.add(id);
      }
      
      const url = new URL($page.url);
      if (newCollapsed.size > 0) {
          url.searchParams.set('collapsed', Array.from(newCollapsed).join(','));
      } else {
          url.searchParams.delete('collapsed');
      }
      goto(url.toString(), { noScroll: true, keepFocus: true, replaceState: true });
  }

  function setDate(newDate: string) {
       const url = new URL($page.url);
       url.searchParams.set('date', newDate);
       url.searchParams.delete('collapsed'); 
       // Ensure folderId persists
       if (folderId) url.searchParams.set('folderId', folderId);
       
       goto(url.toString(), { noScroll: true, keepFocus: true });
  }

  function goToPrevDay() {
      const d = new Date(selectedDate + 'T12:00:00'); 
      d.setDate(d.getDate() - 1);
      setDate(toISOLocalDate(d));
  }

  function goToNextDay() {
      if (selectedDate === today) return;
      const d = new Date(selectedDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      setDate(toISOLocalDate(d));
  }
  
  function slideTransition(node: Element, { offset = 100, unit = '%', duration = 300, easing = cubicOut }) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;
    return {
        duration,
        easing,
        css: (t: number, u: number) => `transform: ${transform} translateX(${u * offset}${unit});`
    };
  }

  // Derived filtered logs
  let visibleLogs = $derived.by(() => {
      // Re-read logs from store explicitly?? 
      // Actually `allLogs` is reactive if updated in effect.
      return allLogs.filter(entry => {
           const dateObj = new Date(`${entry.date}T${entry.time}`);
           return getBusinessDate(dateObj) === selectedDate;
       });
  });

  // Derived groups
  let groupedEntries = $derived(groupLogs(visibleLogs));

  // Derived stats
  let stats = $derived.by(() => {
      const newStats = { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 };
      visibleLogs.forEach(entry => {
          newStats.totalCalories += Number(entry.calories || 0);
          newStats.totalProtein += Number(entry.protein || 0);
          newStats.totalFat += Number(entry.fat || 0);
          newStats.totalCarbs += Number(entry.carbs || 0);
      });
      return newStats;
  });

  // Derived goals from settings
  let goals = $derived.by(() => {
    const { targetCalories, macroRatios } = settings;
    return {
        calories: targetCalories,
        protein: Math.round((targetCalories * macroRatios.protein) / 4),
        fat: Math.round((targetCalories * macroRatios.fat) / 9),
        carbs: Math.round((targetCalories * macroRatios.carbs) / 4)
    };
  });

  onMount(() => {
    // We assume Layout handles Hydration and Auth.
    // We just listen to Store updates.
    
    // Check if store already has data (SSR/Client mismatch prevention)
    allLogs = store.getState().projections.log;
    settings = store.getState().settings;

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      allLogs = state.projections.log;
      settings = state.settings;
    });

    return () => {
        unsubscribe();
    };
  });

</script>

<div class="page-container" data-testid="sharing-page">
    <div class="header-bar">
        <h1>Shared Food Log</h1>
        <!-- Potentially show "Viewing X's Log" if we have metadata -->
    </div>

    <div class="dashboard-grid">
        <div class="left-col">
            <section class="stats-section glass-panel">
             <div class="status-positioner">
                 <NetworkStatus />
             </div>
             <div class="hero-ring">
                 <StatsRing 
                    value={stats.totalCalories} 
                    max={goals.calories}  
                    size={260} 
                    gradientId="calories-ring-share"
                    label="kcal"
                 />
             </div>
             
             <div class="macros-row">
                 <MacroBubble 
                    label="Protein" 
                    value={stats.totalProtein} 
                    max={goals.protein} 
                    color="#c471ed"
                    gradientId="protein-grad-share" 
                    iconSrc="/images/icon-protein.png" 
                />
                 <MacroBubble 
                    label="Carbs" 
                    value={stats.totalCarbs} 
                    max={goals.carbs} 
                    color="#24c6dc"
                    gradientId="carbs-grad-share" 
                    iconSrc="/images/icon-carbs.png" 
                />
                 <MacroBubble 
                    label="Fat" 
                    value={stats.totalFat} 
                    max={goals.fat} 
                    color="#D1913C" 
                    gradientId="fat-grad-share" 
                    iconSrc="/images/icon-fat.png" 
                />
             </div>
             
             <!-- SVG Gradients for Macros (Duplicate ID prevention with suffixes) -->
             <svg width="0" height="0" class="visually-hidden">
                <defs>
                    <linearGradient id="calories-ring-share" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#43e97b"/>
                        <stop offset="100%" stop-color="#38f9d7"/>
                    </linearGradient>
                    <linearGradient id="protein-grad-share" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#c471ed"/>
                        <stop offset="100%" stop-color="#f64f59"/>
                    </linearGradient>
                    <linearGradient id="carbs-grad-share" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#24c6dc"/>
                        <stop offset="100%" stop-color="#514a9d"/>
                    </linearGradient>
                    <linearGradient id="fat-grad-share" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FFD194"/>
                        <stop offset="100%" stop-color="#D1913C"/>
                    </linearGradient>
                </defs>
             </svg>
        </section>
        </div>

        <!-- Right Col / Bottom Section: Feed -->
        <section class="feed-section">
            <div class="feed-header">
                <button class="nav-btn prev" onclick={() => goToPrevDay()} aria-label="Previous Day">
                    &lt;
                </button>
                <div class="title-container">
                    {#key selectedDate}
                        <h2>
                            {dateTitle}
                        </h2>
                    {/key}
                </div>
                <button class="nav-btn next" onclick={() => goToNextDay()} disabled={selectedDate === today} aria-label="Next Day">
                    &gt;
                </button>
            </div>
            
            <div class="feed-list">
                {#key selectedDate}
                    <div class="slide-wrapper">
                        {#if groupedEntries.length === 0}
                            <div class="empty-state">
                                <p>No food logged for this day.</p>
                            </div>
                        {:else}
                            {#each groupedEntries as group (group.id)}
                                <ActivityCard 
                                    {group} 
                                    expanded={!collapsedIds.includes(group.id)}
                                    on:toggle={() => toggleGroup(group.id)} 
                                />
                            {/each}
                        {/if}
                    </div>
                {/key}
            </div>
        </section>
    </div>
</div>

<style>
    .page-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
        padding-bottom: 40px;
    }

    .header-bar {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }
    
    .header-bar h1 {
        font-size: 1.5rem;
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }

    /* Reuse dashboard styles mostly */
    .dashboard-grid {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .stats-section {
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        position: relative;
    }

    .status-positioner {
        position: absolute;
        top: 12px;
        right: 12px;
    }

    .hero-ring {
        margin-bottom: 30px;
    }

    .macros-row {
        display: flex;
        justify-content: space-around;
        width: 100%;
        max-width: 400px;
    }

    .feed-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        padding: 8px 16px;
        border-radius: 12px;
    }

    .title-container {
        flex: 1;
        text-align: center;
    }

    .feed-header h2 {
        font-size: 1.1rem;
        margin: 0;
        font-weight: 600;
    }

    .nav-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 4px 12px;
    }

    .nav-btn:hover:not(:disabled) {
        color: white;
    }

    .nav-btn:disabled {
         opacity: 0.3;
         cursor: not-allowed;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--text-muted);
        background: rgba(255,255,255,0.03);
        border-radius: var(--radius-m);
    }

    /* Desktop Layout */
    @media (min-width: 1024px) {
        .dashboard-grid {
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 40px;
            align-items: start;
        }
        
        .stats-section {
            position: sticky;
            top: 40px;
        }
    }
</style>
