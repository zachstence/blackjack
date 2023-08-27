<script lang="ts">
  import { getGameStoreContext } from '$lib/game.context';
  import Player from './Player.svelte';

  const store = getGameStoreContext();
  $: playerId = $store.playerId;
  $: players = Object.values($store.game!.players);
</script>

<div class="flex flex-row gap-2">
  {#each players as player}
    <Player {player} isMe={player.id === playerId} />
  {/each}
</div>
