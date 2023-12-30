<script lang="ts">
  import { RoundState, type PlayerHand, HandAction } from '$lib/types/realtime';
  import { getMeStoreContext } from '../../../me.store';
  import { getTableStoreContext } from '../../TableStore';
  import BetForm from './BetForm.svelte';
  import Card from './Card.svelte';
  import InsureForm from './InsureForm.svelte';

  let clazz: string = '';
  export { clazz as class };

  export let hand: PlayerHand;
  export let maxBet: number | undefined = undefined;

  const me = getMeStoreContext();
  const table = getTableStoreContext();

  $: player = $table.players[hand.userId];
  $: showActions = hand.userId === $me.id;

  $: playing = $table.roundState === RoundState.PlayersPlaying;

  $: canBet = hand.actions.includes(HandAction.Bet);
  $: canStand = hand.actions.includes(HandAction.Stand);
  $: canHit = hand.actions.includes(HandAction.Hit);
  $: canDouble = hand.actions.includes(HandAction.Double);
  $: canSplit = hand.actions.includes(HandAction.Split);
</script>

<div class="flex flex-col p-4 gap-2 bg-gray-100 rounded-xl {clazz}">
  <dl>
    <dt>Player</dt>
    <dd>{player?.name}</dd>

    <span class="h-3" />

    <dt>State</dt>
    <dd>{hand.status ?? '-'}</dd>

    <dt>Bet</dt>
    {#if typeof hand.bet !== 'undefined'}
      <dd>{hand.bet}</dd>
    {:else}
      <dd>-</dd>
    {/if}

    <span class="h-3" />

    <dt>Hand</dt>
    {#if hand.cards.length}
      <dd>
        {#each hand.cards as card}
          <Card class="flex-shrink-0" {card} />
        {/each}
      </dd>
    {:else}
      <dd>-</dd>
    {/if}

    <dt>Value</dt>
    {#if hand.value}
      <dd>
        {hand.value.hard || '-'}
        {#if hand.value.soft}
          {' '}/ {hand.value.soft}
        {/if}
      </dd>
    {:else}
      <dd>-</dd>
    {/if}

    {#if typeof hand.settleStatus !== 'undefined'}
      <span class="h-3" />
      <dt>Outcome</dt>
      <dd>{hand.settleStatus ?? '-'}</dd>
    {/if}

    {#if typeof hand.winnings !== 'undefined'}
      <dt>Winnings</dt>
      <dd>{hand.winnings ?? '-'}</dd>
    {/if}
  </dl>

  {#if showActions}
    {#if canBet}
      <BetForm onSubmit={(amount) => alert(`bet ${amount}`)} {maxBet} />
    {/if}

    {#if hand.insurance}
      <InsureForm
        insurance={hand.insurance}
        onBuyInsurance={() => alert(`buyInsurance ${hand.id}`)}
        onDeclineInsurance={() => alert(`declineInsurance ${hand.id}`)}
      />
    {/if}

    {#if playing}
      <div class="flex flex-row gap-1">
        <button class="flex-1" on:click={() => alert(`stand ${hand.id}`)} disabled={!canStand}>Stand</button>
        <button class="flex-1" on:click={() => alert(`hit ${hand.id}`)} disabled={!canHit}>Hit</button>
        <button class="flex-1" on:click={() => alert(`double ${hand.id}`)} disabled={!canDouble}>Double</button>
        <button class="flex-1" on:click={() => alert(`split ${hand.id}`)} disabled={!canSplit}>Split</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  button {
    @apply bg-gray-300 border border-black rounded-sm shadow-sm py-1 px-2;
  }

  button:disabled {
    @apply cursor-not-allowed text-gray-400;
  }
</style>
