<script lang="ts">
  import { GameState, type IPlayer } from 'blackjack-types';
  import { getGameStoreContext } from '$lib/game.context';
  import BetForm from './BetForm.svelte';

  export let player: IPlayer;
  export let isMe: boolean;

  const store = getGameStoreContext();

  $: placingBets = $store.game!.state === GameState.PlacingBets;
  $: playersPlaying = $store.game!.state === GameState.PlayersPlaying;
  $: hasBet = typeof player.bet !== 'undefined';
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
    {#if placingBets && !hasBet}
      <BetForm onSubmit={store.bet} maxBet={player.money} />
    {/if}

    {#if playersPlaying}
      <div>
        <button on:click={() => alert('Stand')}>Stand</button>
        <button on:click={() => alert('Split')}>Split</button>
        <button on:click={() => alert('Double')}>Double</button>
        <button on:click={() => alert('Hit')}>Hit</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  dl {
    display: grid;
    grid-template-columns: max-content max-content;

    border: 1px solid black;

    @apply p-2 gap-x-4;
  }

  dt {
    grid-column: 1;
    font-weight: bold;
  }

  dd {
    grid-column: 2;
  }
</style>
