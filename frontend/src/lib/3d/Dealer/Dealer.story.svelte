<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';
  import { Suit, type IDealer, Rank, HandStatus } from 'blackjack-types';

  import Dealer from './Dealer.svelte';

  export let Hst: Hst;

  let dealer: IDealer;

  $: dealer = {
    hand: {
      cards: [{ hidden: true }, { hidden: false, suit: Suit.Hearts, rank: Rank.Ten }],
      status: HandStatus.Hitting,
      value: { soft: null, hard: 10 },
    },
  };
</script>

<Hst.Story>
  <svelte:fragment slot="controls" />

  <Hst.Variant title="PlayerHand">
    <TestCanvas>
      <TestScene>
        <Dealer {dealer} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
