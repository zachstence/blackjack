<script lang="ts">
  import { GameState, type IPlayer } from 'blackjack-types';
  import { getGameStoreContext } from '$lib/game.context';
  import BetForm from './BetForm.svelte';
  import Card from './Card.svelte';
  import { HandState } from 'blackjack-types';

  export let player: IPlayer;
  export let isMe: boolean;

  const store = getGameStoreContext();

  $: readying = $store.game!.state === GameState.PlayersReadying;
  $: placingBets = $store.game!.state === GameState.PlacingBets;
  $: playersPlaying = $store.game!.state === GameState.PlayersPlaying;
  $: hasBet = typeof player.hand?.bet !== 'undefined';
</script>

<div>
  <dl>
    <dt>Name</dt>
    <dd>{player.name}</dd>

    <dt>Money</dt>
    <dd>{player.money}</dd>

    <dt>State</dt>
    <dd>{player.hand?.state ?? '-'}</dd>

    <br />

    <dt>Bet</dt>
    {#if typeof player.hand?.bet !== 'undefined'}
      <dd>{player.hand.bet}</dd>
    {:else}
      <dd>-</dd>
    {/if}

    <dt>Hand</dt>
    {#if player.hand?.cards.length}
      <dd>
        {#each player.hand.cards as card}
          <Card {card} />
        {/each}
      </dd>
    {:else}
      <dd>-</dd>
    {/if}

    <dt>Total</dt>
    {#if player.hand?.total}
      <dd>
        {player.hand.total.hard}
        {#if player.hand.total.soft}
          {' '}/ {player.hand.total.soft}
        {/if}
      </dd>
    {:else}
      <dd>-</dd>
    {/if}

    <br />

    <dt>Outcome</dt>
    {#if player.hand?.settleStatus}
      <dd>{player.hand.settleStatus}</dd>
    {:else}
      <dd>-</dd>
    {/if}

    <dt>Winnings</dt>
    {#if player.hand?.winnings}
      <dd>{player.hand.winnings}</dd>
    {:else}
      <dd>-</dd>
    {/if}
  </dl>

  {#if isMe}
    {#if typeof player.hand !== 'undefined'}
      {#if playersPlaying}
        <div>
          <button on:click={store.stand} disabled={player.hand.state !== HandState.Hitting}>Stand</button>
          <button on:click={store.hit} disabled={player.hand.state !== HandState.Hitting}>Hit</button>
        </div>
      {:else if placingBets && !hasBet}
        <BetForm onSubmit={store.bet} maxBet={player.money} />
      {/if}
    {/if}
  {/if}

  {#if readying}
    {#if player.ready}
      ✅
    {:else if isMe}
      <button on:click={store.ready}>Ready</button>
    {/if}
  {/if}

  <pre>{JSON.stringify(player, null, 2)}</pre>
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
