<script lang="ts">
  import { store } from '$lib/store';
  import { processEvent } from '$lib/reducer';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { v4 as uuidv4 } from 'uuid';
  import { onMount, onDestroy } from 'svelte';
  import { initializeAuth, signIn as googleSignIn, authState, getUserInfo } from '$lib/auth';

  let isAuthenticated = $state(false);
  let userName = $state('User');

  const unsubscribeStore = store.subscribe(() => {
    const state = store.getState();
    isAuthenticated = state.workout.isAuthenticated;
    if (state.workout.user) {
        userName = state.workout.user.name;
    }
  });

  onMount(() => {
      const unsubscribeAuth = authState.subscribe(async (state) => {
          if (state.token) {
              const user = await getUserInfo();
              if (user) {
                  store.dispatch(processEvent({
                      type: 'auth/login',
                      payload: {
                          user: {
                              id: user.id || user.email, // Fallback if sub missing
                              name: user.name,
                              email: user.email
                          },
                          timestamp: new Date().toISOString()
                      }
                  }));
              }
          }
      });

      initializeAuth((token) => {
          console.log('Auth Initialized', token);
      });

      return () => {
          unsubscribeAuth();
      };
  });

  onDestroy(() => {
    unsubscribeStore();
  });

  function signIn() {
    googleSignIn();
  }

  function startWorkout() {
    // Deterministic UUID for E2E tests, Real UUID for Production/Preview
    const workoutId = (window as any).__TEST_MODE__ ? 'test-workout-id' : uuidv4();
    
    store.dispatch(processEvent({
      type: 'workout/start',
      payload: {
        workoutId,
        timestamp: new Date().toISOString()
      }
    }));
    goto(`${base}/workout/${workoutId}`);
  }
</script>

<svelte:head>
  <title>Workouts</title>
</svelte:head>

<main>
  <h1>Workouts</h1>
  
  {#if !isAuthenticated}
    <div class="auth-container">
      <button on:click={signIn} data-testid="sign-in-btn">
        Sign In with Google
      </button>
    </div>
  {:else}
    <div class="dashboard-container">
      <p>Welcome, {userName}</p>
      <button on:click={startWorkout} data-testid="start-workout-btn">
        Start Workout
      </button>
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #121212;
    color: white;
  }

  button {
    padding: 1rem 2rem;
    font-size: 1.5rem;
    background-color: #00ff00;
    color: black;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 1rem;
  }
</style>
