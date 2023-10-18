<script lang="ts">
  import Dealer from './Dealer.svelte';
  import { getGameStoreContext } from '$lib/game.context';
  import Player from './Player.svelte';

  const store = getGameStoreContext();
  $: myPlayerId = $store.playerId;
  $: players = $store.game?.players ?? {};

  $: me = players[myPlayerId];
  $: others = Object.values(players).filter(({ id }) => id !== myPlayerId);

  const debug = new URLSearchParams(window.location.search).has('debug');
</script>

<div class="flex flex-col items-center gap-6 p-4">
  <Dealer />

  <div class="players-grid" class:with-others={others.length}>
    <div>
      {#if typeof me !== 'undefined'}
        <Player player={me} isMe />
      {/if}
    </div>

    {#if others.length}
      <div class="flex flex-row justify-end gap-2">
        {#each others as player}
          <Player {player} isMe={false} />
        {/each}
      </div>
    {/if}
  </div>

  {#if debug}
    <pre>{JSON.stringify($store.game, ['roundState'], 2)}</pre>
  {/if}
</div>

<style>
  .players-grid {
    @apply grid gap-6;
    grid-template-columns: min-content;
  }

  .players-grid.with-others {
    @apply w-full;
    grid-template-columns: 1fr 5fr;
  }
</style>
