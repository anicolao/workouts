<script lang="ts">
  import { store } from '$lib/store';
  import { processEvent } from '$lib/reducer';
  import { goto } from '$app/navigation';
  import { v4 as uuidv4 } from 'uuid';

  let isAuthenticated = false;

  store.subscribe(state => {
    isAuthenticated = state.workout.isAuthenticated;
  });

  function signIn() {
    // Mock Sign In
    store.dispatch(processEvent({
      type: 'auth/login',
      payload: {
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com'
        },
        timestamp: new Date().toISOString()
      }
    }));
  }

  function startWorkout() {
    const workoutId = uuidv4();
    store.dispatch(processEvent({
      type: 'workout/start',
      payload: {
        workoutId,
        timestamp: new Date().toISOString()
      }
    }));
    goto(`/workout/${workoutId}`);
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
      <p>Welcome, Test User</p>
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
