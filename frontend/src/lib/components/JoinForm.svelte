<script lang="ts">
  export let onSubmit: (name: string) => void;

  let name = '';
</script>

<form on:submit={() => onSubmit(name)}>
  <label>
    Name
    <input type="text" bind:value={name} />
  </label>

  <button type="submit">Join</button>
</form>
