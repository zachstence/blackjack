<script lang="ts">
  import { getGameStoreContext } from '$lib/game.context';
  import Card from './Card.svelte';

  const store = getGameStoreContext();

  $: dealer = $store.game!.dealer;
</script>

<dl>
  <dt>Name</dt>
  <dd>Dealer</dd>

  <dt>State</dt>
  <dd>{dealer.hand.state}</dd>

  <br />

  <dt>Hand</dt>
  {#if dealer.hand.cards.length}
    <dd>
      {#each dealer.hand.cards as card}
        <Card {card} />
      {/each}
    </dd>
  {:else}
    <dd>-</dd>
  {/if}

  <dt>Total</dt>
  {#if dealer.hand?.total}
    <dd>
      {dealer.hand.total.hard}
      {#if dealer.hand.total.soft}
        {' '}/ {dealer.hand.total.soft}
      {/if}
    </dd>
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
