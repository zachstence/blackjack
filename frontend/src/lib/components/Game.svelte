<script lang="ts">
  import Dealer from './Dealer.svelte';
  import { getGameStoreContext } from '$lib/game.context';
  import Hand from './Hand.svelte';
  import Player from './Player.svelte';

  const store = getGameStoreContext();
</script>

<div class="w-full flex flex-row gap-4 p-4">
  <div class="w-fit flex flex-col gap-2 border border-black p-2">
    {#each Object.values($store.game?.players ?? {}) as player}
      <Player {player} />
    {/each}
  </div>

  <div class="flex-1 flex flex-col items-center gap-6 border border-black p-2">
    <Dealer />

    <div class="hands-grid" class:with-others={$store.otherHands.length}>
      <div>
        {#each $store.myHands as hand}
          <Hand {hand} />
        {/each}
      </div>

      {#if $store.otherHands.length}
        <div class="flex flex-row justify-end gap-2">
          {#each $store.otherHands as hand}
            <Hand {hand} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

{#if $store.debug}
  <pre>{JSON.stringify($store.game, null, 2)}</pre>
{/if}

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
