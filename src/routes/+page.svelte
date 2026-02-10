<script lang="ts">
  import { store } from '$lib/store';
  import { processEvent } from '$lib/reducer';
  import { goto } from '$app/navigation';
  import { v4 as uuidv4 } from 'uuid';

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
  <button on:click={startWorkout} data-testid="start-workout-btn">
    Start Workout
  </button>
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
  }
</style>
