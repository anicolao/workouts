<script lang="ts">
  import { page } from '$app/stores';
</script>

<main>
  <h1>Active Workout</h1>
  <p>Workout ID: {$page.params.id}</p>
</main>

<style>
  main {
    padding: 2rem;
    background-color: #121212;
    color: white;
    min-height: 100vh;
  }
</style>
