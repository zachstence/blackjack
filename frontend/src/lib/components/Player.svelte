<script lang="ts">
  import { GameState, isPlayerInsured, type IPlayer } from 'blackjack-types';
  import { getGameStoreContext } from '$lib/game.context';
  import Hand from './Hand.svelte';

  export let player: IPlayer;
  export let isMe: boolean;

  const store = getGameStoreContext();

  $: readying = $store.game!.state === GameState.PlayersReadying;
  $: insuring = $store.game!.state === GameState.Insuring;

  const debug = new URLSearchParams(window.location.search).has('debug');
</script>

<div class="flex flex-col p-4 gap-2 bg-gray-100 rounded-xl">
  <h2 class="text-lg font-semibold text-center">{player.name}</h2>

  <dl>
    <dt>Money</dt>
    <dd>{player.money}</dd>
  </dl>

  {#if insuring || isPlayerInsured(player)}
    <dl>
      <dt>Insurance</dt>
      {#if typeof player.insurance === 'undefined'}
        <dd class="flex flex-row gap-1">
          <button type="button" on:click={store.buyInsurance}>Buy</button>
          <button type="button" on:click={store.declineInsurance}>Decline</button>
        </dd>
      {:else}
        <dd>{player.insurance.boughtInsurance ? '✅' : '❌'}</dd>

        {#if player.insurance.boughtInsurance}
          <dt>Bet</dt>
          <dd>{player.insurance.bet}</dd>

          {#if typeof player.insurance.won !== 'undefined'}
            <dt>Outcome</dt>
            <dd>{player.insurance.won ? 'Won' : 'Lost'}</dd>
          {/if}
        {/if}
      {/if}
    </dl>
  {/if}

  <div class="flex flex-row gap-4">
    {#each Object.values(player.hands) as hand}
      <Hand class="flex-1" {hand} maxBet={player.money} showActions={isMe} />
    {/each}
  </div>

  {#if readying}
    <button on:click={store.ready} disabled={!isMe || player.ready}>
      {#if player.ready}
        ✅
      {:else}
        Ready
      {/if}
    </button>
  {/if}

  {#if debug}
    <pre class="text-xs">{JSON.stringify(player, null, 2)}</pre>
  {/if}
</div>
