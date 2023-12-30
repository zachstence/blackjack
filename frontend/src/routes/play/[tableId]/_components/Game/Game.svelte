<script lang="ts">
  import { getMeStoreContext } from '../../../me.store';
  import { getTableStoreContext } from '../../TableStore';
  import Dealer from './Dealer.svelte';
  import Player from './Player.svelte';
  import Shoe from './Shoe.svelte';
  import Hand from './Hand.svelte';

  let clazz = '';
  export { clazz as class };

  const me = getMeStoreContext();
  const table = getTableStoreContext();
  $: players = Object.values($table.players);
  $: playerHands = Object.values($table.playerHands);
  $: myHands = playerHands.filter((hand) => hand.playerId === $me.id);
  $: otherHands = playerHands.filter((hand) => hand.playerId !== $me.id);
</script>

<div class="{clazz} flex flex-row gap-4 p-4">
  <div class="2-fit flex flex-col gap-2 border border-base-content p-2">
    {#each players as player}
      <Player {player} />
    {/each}
  </div>

  <div class="relative flex-1 flex flex-col items-center gap-6 border border-base-content">
    <Dealer />

    <Shoe class="absolute top-2 right-2" height={80} />

    <div class="hands-grid" class:with-others={otherHands.length}>
      <div>
        {#each myHands as hand}
          <Hand {hand} />
        {/each}
      </div>

      {#if otherHands.length}
        <div class="flex flex-row justify-end gap-2">
          {#each otherHands as hand}
            <Hand {hand} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .hands-grid {
    @apply grid gap-6;
    grid-template-columns: min-content;
  }

  .hands-grid.with-others {
    @apply w-full;
    grid-template-columns: 1fr 5fr;
  }
</style>
