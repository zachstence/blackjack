<script lang="ts">
  import { T } from '@threlte/core';
  import type { IGame } from 'blackjack-types';

  import Table from '../Table/Table.svelte';
  import PlayerHand from '../PlayerHand/PlayerHand.svelte';
  import { BET_BOXES } from '../Table/Table.constants';

  export let game: IGame;
</script>

<Table />

{#each BET_BOXES as betBox, i}
  <T.Group position={[betBox.position.x, betBox.position.y, betBox.position.z]} rotation={[0, -betBox.rotationY, 0]}>
    {@const playerHand = Object.values(game.playerHands)[i]}
    {#if playerHand}
      <PlayerHand hand={playerHand} />
    {/if}
  </T.Group>
{/each}
