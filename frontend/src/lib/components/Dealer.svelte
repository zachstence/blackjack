<script lang="ts">
  import type { IDealer } from 'blackjack-types';

  export let dealer: IDealer;
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
