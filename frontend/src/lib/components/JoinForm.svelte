<script lang="ts">
  export let onSubmit: (name: string) => void;

  let name = '';
</script>

<form on:submit|preventDefault={() => onSubmit(name)}>
  <input type="text" bind:value={name} placeholder="Name" aria-label="Name" />
  <button type="submit">Join</button>
</form>

<style>
  button {
    @apply bg-gray-300 border border-black rounded-sm shadow-sm py-1 px-2;
  }

  button:disabled {
    @apply cursor-not-allowed text-gray-400;
  }
</style>
