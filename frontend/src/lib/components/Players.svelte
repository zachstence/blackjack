<script lang="ts">
  import type { IPlayer } from 'blackjack-types';

  export let players: IPlayer[];
</script>

<div>
  {#each players as player}
    <dl>
      <dt>Name</dt>
      <dd>{player.name}</dd>

      <dt>Hand</dt>
      {#if player.hand.length}
        <dd>{player.hand[0]} {player.hand[1]}</dd>
      {:else}
        <dd>-</dd>
      {/if}

      <dt>Bet</dt>
      <dd>{player.bet ?? '-'}</dd>

      <dt>Money</dt>
      <dd>{player.money}</dd>
    </dl>
  {/each}
</div>
