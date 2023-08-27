<script lang="ts">
  import { getGameStoreContext } from '$lib/game.context';

  const store = getGameStoreContext();

  $: dealer = $store.game!.dealer;
</script>

<dl>
  <dt>Name</dt>
  <dd>Dealer</dd>

  <dt>Hand</dt>
  {#if dealer.hand.length}
    <dd>{dealer.hand[0]} {dealer.hand[1]}</dd>
  {:else}
    <dd>-</dd>
  {/if}
</dl>

<style>
  dl {
    display: grid;
    grid-template-columns: max-content max-content;

    border: 1px solid black;

    @apply p-2 gap-x-4;
  }

  dt {
    grid-column: 1;
    font-weight: bold;
  }

  dd {
    grid-column: 2;
  }
</style>
