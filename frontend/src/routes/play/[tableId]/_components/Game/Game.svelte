<script lang="ts">
  import { getTableStoreContext } from '../../TableStore';
  import Player from './Player.svelte';

  let clazz = '';
  export { clazz as class };

  const tableStore = getTableStoreContext();

  $: players = Object.values($tableStore.players);
</script>

<div class="{clazz} flex flex-row gap-4 p-4">
  <div class="2-fit flex flex-col gap-2 border border-black p-2">
    {#each players as player}
      <Player {player} />
    {/each}
  </div>
</div>
