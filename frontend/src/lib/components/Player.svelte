<script lang="ts">
  import { GameState, type IPlayer } from 'blackjack-types';
  import { getGameStoreContext } from '$lib/game.context';
  import BetForm from './BetForm.svelte';
  import Card from './Card.svelte';
  import { HandState } from 'blackjack-types/src/hand';

  export let player: IPlayer;
  export let isMe: boolean;

  const store = getGameStoreContext();

  $: readying = $store.game!.state === GameState.PlayersReadying;
  $: placingBets = $store.game!.state === GameState.PlacingBets;
  $: playersPlaying = $store.game!.state === GameState.PlayersPlaying;
  $: hasBet = typeof player.bet !== 'undefined';
</script>

<div>
  <dl>
    <dt>Name</dt>
    <dd>{player.name}</dd>

    <dt>State</dt>
    <dd>{player.hand.state}</dd>

    <dt>Hand</dt>
    {#if player.hand.cards.length}
      <dd>
        {#each player.hand.cards as card}
          <Card {card} />
        {/each}
      </dd>
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
        <button on:click={store.stand} disabled={player.hand.state !== HandState.Hitting}>Stand</button>
        <button on:click={store.hit} disabled={player.hand.state !== HandState.Hitting}>Hit</button>
      </div>
    {/if}

    {#if readying}
      <button on:click={store.ready}>Ready</button>
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
