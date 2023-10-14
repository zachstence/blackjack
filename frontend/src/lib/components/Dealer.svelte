<script lang="ts">
  import { getGameStoreContext } from '$lib/game.context';
  import Card from './Card.svelte';

  const store = getGameStoreContext();

  $: dealer = $store.game!.dealer;

  const debug = new URLSearchParams(window.location.search).has('debug');
</script>

<div class="p-4 bg-gray-100 rounded-xl">
  <h2 class="text-lg text-center font-semibold mb-1">Dealer</h2>

  <dl class="w-fit">
    <dt>State</dt>
    <dd>{dealer.hand.state}</dd>

    <span class="h-3" />

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

    <dt>Value</dt>
    {#if dealer.hand?.value}
      <dd>
        {dealer.hand.value.hard}
        {#if dealer.hand.value.soft}
          {' '}/ {dealer.hand.value.soft}
        {/if}
      </dd>
    {:else}
      <dd>-</dd>
    {/if}
  </dl>

  {#if debug}
    <pre class="text-xs">{JSON.stringify(dealer, null, 2)}</pre>
  {/if}
</div>
