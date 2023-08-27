<script lang="ts">
  import type { IPlayer } from 'blackjack-types';

  export let player: IPlayer;
  export let isMe: boolean;
</script>

<div>
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

  {#if isMe}
    <div>
      <button on:click={() => alert('Stand')}>Stand</button>
      <button on:click={() => alert('Split')}>Split</button>
      <button on:click={() => alert('Double')}>Double</button>
      <button on:click={() => alert('Hit')}>Hit</button>
    </div>
  {/if}
</div>
