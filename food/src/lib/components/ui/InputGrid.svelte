<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LogEntry } from '$lib/store';

  export let contextEntry: LogEntry | null = null;

  const dispatch = createEventDispatcher();

  function selectMode(mode: 'CAMERA' | 'LIBRARY' | 'VOICE' | 'TEXT' | 'LOG_AGAIN' | 'FAVOURITES') {
    dispatch('select', mode);
  }
</script>

<div class="input-grid">
  <button class="grid-btn glass-panel" onclick={() => selectMode('CAMERA')}>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
    </div>
    <span>Camera</span>
  </button>
  
  <button class="grid-btn glass-panel" onclick={() => selectMode('LIBRARY')}>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    </div>
    <span>Library</span>
  </button>
  
  <button class="grid-btn glass-panel" onclick={() => selectMode('VOICE')}>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    </div>
    <span>Voice</span>
  </button>
  
  <button class="grid-btn glass-panel" onclick={() => selectMode('TEXT')}>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    </div>
    <span>Text</span>
  </button>

  <button class="grid-btn glass-panel" onclick={() => selectMode('FAVOURITES')}>
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    </div>
    <span>Favourites</span>
  </button>

  {#if contextEntry}
    <button class="grid-btn glass-panel" onclick={() => selectMode('LOG_AGAIN')}>
      <div class="icon">
         <!-- Reuse loop/repeat icon or similar -->
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
      </div>
      <span>Log Again</span>
      {#if contextEntry.imageDriveUrl}
         <!-- Optional: Thumbnail overlay or background if complex UI desired, sticking to icon for now as per simple update -->
      {/if}
    </button>
  {/if}
</div>

<style>
  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    width: 100%;
    max-width: 500px;
    padding: 20px;
  }

  .grid-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 160px;
    color: var(--text-primary, white);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08); /* Subtle border */
    border-radius: 24px; /* Larger radius */
    gap: 16px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  }

  /* Glass/Sheen effect on hover */
  .grid-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    transition: left 0.5s;
    pointer-events: none;
  }

  .grid-btn:hover::before {
    left: 100%;
  }

  .grid-btn:hover {
    transform: translateY(-4px) scale(1.02);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 255, 255, 0.05);
  }

  .grid-btn:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.12);
  }

  .icon {
    font-size: 3rem;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
    transition: transform 0.3s;
  }
  
  .grid-btn:hover .icon {
    transform: scale(1.1);
  }

  span {
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    opacity: 0.9;
  }
</style>
