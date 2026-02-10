<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { toasts } from '$lib/toast';
  import { store, dispatchEvent } from '$lib/store';

  const dispatch = createEventDispatcher();
  
  let recognizing = $state(false);
  let transcript = $state('');
  let recognition: any;
  let silenceTimer: any;
  let canvas: HTMLCanvasElement;
  let audioContext: AudioContext;
  let analyser: AnalyserNode;
  let microphone: MediaStreamAudioSourceNode;
  let stream: MediaStream;
  let animationId: number;
  let startTime = 0;

  onMount(async () => {
    // 1. Initialize Speech Recognition
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        toasts.error('Voice input not supported in this browser.');
        dispatch('close');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        recognizing = true;
        startTime = Date.now();
        resetSilenceTimer();
    };

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
             toasts.error('Microphone access denied.');
             close();
        }
    };

    recognition.onend = () => {
        recognizing = false;
        if (transcript.trim()) {
            // Auto-submit on end if we have text? Or just stop?
            // Let's wait for user to hit stop or confirmed silence.
        }
    };

    recognition.onresult = (event: any) => {
        resetSilenceTimer();
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // Append final to existing if needed, but usually SpeechRecognition accumulates efficiently.
        // Actually, we should just accumulate.
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
             fullText += event.results[i][0].transcript;
        }
        transcript = fullText;
    };

    try {
        recognition.start();
        await startVisualizer();
    } catch (e) {
        console.error(e);
        close();
    }
  });

  onDestroy(() => {
    stop();
  });

  async function startVisualizer() {
      try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
          analyser.fftSize = 256;
          
          visualize();
      } catch (e) {
          console.warn('Visualizer setup failed', e);
      }
  }

  function visualize() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const draw = () => {
          if (!recognizing) return;
          animationId = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          
          // Calculate average volume for pulse
          let sum = 0;
          for(let i=0; i<bufferLength; i++) sum += dataArray[i];
          const average = sum / bufferLength;
          const pulse = (average / 255); // 0 to 1

          // 1. Glowing Orb Background
          const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 100);
          gradient.addColorStop(0, `rgba(0, 198, 255, ${0.1 + pulse * 0.4})`); // Core
          gradient.addColorStop(0.5, `rgba(0, 198, 255, ${0.05 + pulse * 0.1})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0,0, canvas.width, canvas.height);

          // 2. Multi-wave visualization (Siri-like)
          ctx.lineWidth = 2;
          
          // Wave 1: Cyan
          drawWave(ctx, dataArray, bufferLength, cx, cy, 1.0, '#00C6FF', 0);
          
          // Wave 2: Purple (Offset)
          drawWave(ctx, dataArray, bufferLength, cx, cy, 0.8, '#9D50BB', 50);
          
          // Wave 3: White (Highlight)
          drawWave(ctx, dataArray, bufferLength, cx, cy, 0.5, 'rgba(255,255,255,0.5)', 25);
      };
      draw();
  }

  function drawWave(ctx: CanvasRenderingContext2D, data: Uint8Array, bufferLen: number, cx: number, cy: number, scale: number, color: string, timeOffset: number) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      
      const time = Date.now() / 1000;
      const sliceWidth = canvas.width / bufferLen;
      let x = 0;

      for(let i = 0; i < bufferLen; i++) {
          // Sine wave modulation + FFT data modulation
          const v = data[i] / 128.0; 
          const sine = Math.sin((i * 0.1) + (time * 2) + timeOffset);
          
          // Combine FFT amplitude with sine wave motion
          const amplitude = (v * 40 * scale) * sine; 
          const y = cy + amplitude;

          if(i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
      }
      ctx.stroke();
  }

  function stop() {
      if (recognition) recognition.stop();
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioContext) audioContext.close();
      if (animationId) cancelAnimationFrame(animationId);
      recognizing = false;
  }

  function resetSilenceTimer() {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
          // Auto-stop after 4 seconds of silence? 
          // For now, let's keep it manual or just hint.
      }, 4000); 
  }

  function close() {
      stop();
      dispatch('close');
  }

  function done() {
      stop();
      if (transcript.trim()) {
          const duration = startTime ? (Date.now() - startTime) / 1000 : 0;
          store.dispatch(dispatchEvent('voice/captureCompleted', {
              traceId: crypto.randomUUID(),
              durationSeconds: duration,
              transcript: transcript
          }));
          dispatch('analyze', transcript);
      } else {
          close();
      }
  }
</script>

<div class="modal-backdrop" onclick={close} role="presentation">
    <div class="voice-modal glass-panel" onclick={(e) => e.stopPropagation()} role="dialog">
        <canvas bind:this={canvas} width="400" height="200" class="visualizer"></canvas>
        
        <div class="transcript-box">
            {#if transcript}
                <p class="scrolling-text">{transcript}</p>
            {:else}
                <p class="placeholder">Listening...</p>
            {/if}
        </div>

        <div class="controls">
            <button class="action-btn stop" onclick={done}>
                {#if recognizing}
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>
                   Stop & Analyze
                {:else}
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                   Analyze
                {/if}
            </button>
            <button class="action-btn cancel" onclick={close}>Cancel</button>
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
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(12px);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .voice-modal {
        width: 95%;
        max-width: 450px;
        background: rgba(20, 20, 20, 0.8);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 32px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }

    .visualizer {
        width: 100%;
        height: 200px;
        border-radius: 16px;
        background: rgba(0,0,0,0.3);
        box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
    }

    .transcript-box {
        width: 100%;
        min-height: 80px;
        max-height: 150px;
        overflow-y: auto;
        text-align: center;
        font-size: 1.3rem;
        line-height: 1.5;
        color: white;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        padding: 10px;
    }
    
    .scrolling-text {
        animation: fadeIn 0.3s ease-out;
    }

    .placeholder {
        color: rgba(255,255,255,0.4);
        font-style: italic;
        font-weight: 300;
        animation: pulse 2s infinite;
    }

    .controls {
        display: flex;
        gap: 16px;
        width: 100%;
    }

    .action-btn {
        flex: 1;
        padding: 16px;
        border-radius: 99px;
        font-size: 1.1rem;
        font-weight: 600;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .action-btn:active {
        transform: scale(0.96);
    }

    .stop {
        background: linear-gradient(135deg, #00C6FF, #0072FF);
        color: white;
        box-shadow: 0 4px 15px rgba(0, 198, 255, 0.3);
    }
    
    .cancel {
        background: rgba(255,255,255,0.1);
        color: white;
    }
    
    .icon {
        font-family: 'Material Symbols Outlined';
        font-size: 1.2rem;
    }

    @keyframes pulse {
        0% { opacity: 0.4; }
        50% { opacity: 0.8; }
        100% { opacity: 0.4; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>
