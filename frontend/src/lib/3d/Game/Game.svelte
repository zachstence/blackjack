<script lang="ts">
  import { T } from '@threlte/core';
  import type { IGame } from 'blackjack-types';

  import Table from '../Table/Table.svelte';
  import PlayerHand from '../PlayerHand/PlayerHand.svelte';
  import { BET_BOXES, TABLE_ARC_INNER_RADIUS } from '../Table/Table.constants';
  import Dealer from '../Dealer/Dealer.svelte';

  export let game: IGame;
</script>

<Table />

<T.Group position={[0, 0, TABLE_ARC_INNER_RADIUS / 5]}>
  <Dealer dealer={game.dealer} />
</T.Group>

{#each BET_BOXES as betBox, i}
  <T.Group position={[betBox.position.x, betBox.position.y, betBox.position.z]} rotation={[0, -betBox.rotationY, 0]}>
    {@const playerHand = Object.values(game.playerHands)[i]}
    {#if playerHand}
      <PlayerHand hand={playerHand} />
    {/if}
  </T.Group>
{/each}
