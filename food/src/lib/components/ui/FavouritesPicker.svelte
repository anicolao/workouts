<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FavouriteItem } from '$lib/store';
  import { fade, fly } from 'svelte/transition';

  export let favourites: FavouriteItem[] = [];

  const dispatch = createEventDispatcher();

  function handleSelect(item: FavouriteItem) {
    dispatch('select', item);
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="overlay" transition:fade onclick={handleClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && handleClose()}>
  <div class="modal glass-panel" transition:fly={{ y: 50, duration: 300 }} onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <div class="header">
      <h2>Favourites</h2>
      <button class="close-btn" onclick={handleClose}>&times;</button>
    </div>

    <div class="grid">
      {#each [...favourites].sort((a, b) => b.usageCount - a.usageCount) as item}
        <button class="fav-item glass-panel" onclick={() => handleSelect(item)}>
          <div class="icon">⭐</div>
          <div class="details">
            <span class="name">{item.description}</span>
            <span class="count">{item.usageCount} logs</span>
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: flex-end; /* Slide up from bottom on mobile */
    justify-content: center;
  }

  .modal {
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    background: #1a1a1a; /* Fallback */
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 20px;
    overflow: hidden;
  }

  /* Desktop center modal */
  @media (min-width: 600px) {
    .overlay {
      align-items: center;
    }
    .modal {
        border-radius: 24px;
        height: auto;
        min-height: 400px;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
    overflow-y: auto;
    padding-bottom: 20px; /* Safe space */
  }

  .fav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px;
    gap: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .icon {
    font-size: 2rem;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .name {
    font-weight: 500;
    font-size: 1rem;
    line-height: 1.2;
  }

  .count {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }
</style>
