<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';
  import Hand from './PlayerHand.svelte';
  import { Suit, Rank, HandStatus, type IPlayerHand, HandAction } from 'blackjack-types';

  export let Hst: Hst;

  let bet = 123;

  const onBet = (amount: number) => console.log(`onBet(${amount})`);
  const onStand = () => console.log('onStand()');
  const onHit = () => console.log('onHit()');
  const onDouble = () => console.log('onDouble()');
  const onSplit = () => console.log('onSplit()');

  let hand: IPlayerHand;
  $: hand = {
    id: 'id',
    playerId: 'playerId',
    bet,
    insurance: null,
    actions: Object.values(HandAction),
    settleStatus: null,
    winnings: null,

    cards: [
      { hidden: false, suit: Suit.Spades, rank: Rank.Ten },
      { hidden: false, suit: Suit.Hearts, rank: Rank.Ten },
    ],
    status: HandStatus.Hitting,
    value: { soft: null, hard: 20 },
  };
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.Number title="bet" bind:value={bet} />
  </svelte:fragment>

  <Hst.Variant title="PlayerHand">
    <TestCanvas>
      <TestScene>
        <Hand {hand} {onBet} {onStand} {onHit} {onDouble} {onSplit} showActions />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
