<script lang="ts">
  import { T } from '@threlte/core';
  import type { IPlayerHand } from 'blackjack-types';

  import Card from '../Card/Card.svelte';
  import { CARD_HEIGHT, CARD_THICKNESS, CARD_WIDTH } from '../Card/Card.constants';
  import { TABLE_BET_BOX_HEIGHT, TABLE_BET_BOX_PADDING, TABLE_OUTLINE_WIDTH } from '../Table/Table.constants';
  import Chip from '../Chip/Chip.svelte';
  import { reduceBetToChipDenominations } from './reduceBetToChipDenominations';
  import { DIAMETER, THICKNESS } from '../Chip/Chip.constants';

  export let hand: IPlayerHand;

  const cardsX = -CARD_WIDTH / 2;
  const cardsZ = -(CARD_HEIGHT + TABLE_BET_BOX_HEIGHT / 2 + TABLE_BET_BOX_PADDING);
  const cardXOffset = (1 / 4) * CARD_WIDTH;
  const cardZOffset = -(1 / 4) * CARD_HEIGHT;

  $: chipDenominations = reduceBetToChipDenominations(hand.bet ?? 0);
</script>

<T.Group>
  {#each chipDenominations as denomination, i}
    <T.Group position={[0, THICKNESS * i, 0]}>
      <Chip {denomination} />
    </T.Group>
  {/each}

  <T.Group position={[cardsX, 0, cardsZ]}>
    {#each hand.cards as card, i}
      <T.Group position={[cardXOffset * i, CARD_THICKNESS * (i + 1), cardZOffset * i]}>
        <Card {card} />
      </T.Group>
    {/each}
  </T.Group>
</T.Group>
