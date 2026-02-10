<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  
  let text = $state('');

  function close() {
    dispatch('close');
  }

  function analyze() {
    if (!text.trim()) return;
    dispatch('analyze', text);
  }
</script>

<div class="modal-backdrop" onclick={close} role="presentation">
    <div class="modal-content glass-panel" onclick={(e) => e.stopPropagation()} role="dialog">
        <h2>What did you eat?</h2>
        
        <textarea 
            bind:value={text} 
            placeholder="e.g., A large iced latte with oat milk and a blueberry muffin"
            rows="4"
            class="text-input"
            autofocus
        ></textarea>

        <div class="actions">
            <button class="secondary-btn" onclick={close}>Cancel</button>
            <button class="primary-btn neon-gradient" onclick={analyze} disabled={!text.trim()}>
                Analyze
            </button>
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85); /* Darker backdrop */
        backdrop-filter: blur(8px);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        animation: fadeIn 0.2s forwards;
    }

    .modal-content {
        width: 100%;
        max-width: 500px;
        background: rgba(30, 30, 30, 0.95); /* Deep dark */
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 32px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        transform: scale(0.95);
        animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    h2 {
        margin: 0;
        font-size: 1.8rem;
        color: white;
        text-align: center;
        font-weight: 600;
    }

    .text-input {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        color: white;
        padding: 20px;
        font-size: 1.2rem;
        line-height: 1.5;
        width: 100%;
        resize: none;
        outline: none;
        transition: border-color 0.2s, background 0.2s;
    }

    .text-input:focus {
        border-color: #00C6FF; /* Highlight color */
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 4px rgba(0, 198, 255, 0.1);
    }

    .actions {
        display: flex;
        gap: 16px;
        justify-content: stretch;
    }

    button {
        padding: 16px;
        border-radius: 99px;
        font-weight: 600;
        font-size: 1.1rem;
        cursor: pointer;
        border: none;
        flex: 1;
        transition: transform 0.1s, opacity 0.2s, box-shadow 0.2s;
    }

    button:active {
        transform: scale(0.96);
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .secondary-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    
    .secondary-btn:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .primary-btn {
        color: white;
    }

    .neon-gradient {
        background: linear-gradient(135deg, #00C6FF, #0072FF);
        box-shadow: 0 4px 15px rgba(0, 198, 255, 0.3);
    }
    
    .neon-gradient:hover:not(:disabled) {
        box-shadow: 0 6px 20px rgba(0, 198, 255, 0.5);
        transform: translateY(-1px);
    }
    
    @keyframes fadeIn {
        to { opacity: 1; }
    }
    
    @keyframes popIn {
        to { transform: scale(1); }
    }
</style>
