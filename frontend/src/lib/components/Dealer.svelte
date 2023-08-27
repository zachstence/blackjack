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
