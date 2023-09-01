<script lang="ts">
  export let onSubmit: (name: string) => void;

  let name = '';
</script>

<form on:submit={() => onSubmit(name)}>
  <input type="text" bind:value={name} placeholder="Name" aria-label="Name" />
  <button type="submit">Join</button>
</form>
