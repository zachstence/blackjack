<script lang="ts">
  import { T } from '@threlte/core';
  import type { IDealer } from 'blackjack-types';

  import Card from '../Card/Card.svelte';
  import { CARD_THICKNESS, CARD_WIDTH } from '../Card/Card.constants';

  export let dealer: IDealer;

  const cardSpacing = 10;
  const cardXOffset = CARD_WIDTH + cardSpacing;
</script>

<T.Group>
  {#each dealer.hand.cards as card, i}
    <T.Group position={[cardXOffset * i, CARD_THICKNESS * (i + 1), 0]}>
      <Card {card} />
    </T.Group>
  {/each}
</T.Group>
