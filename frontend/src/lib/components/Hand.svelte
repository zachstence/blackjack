<script lang="ts">
  import { HandState, type IPlayerHand, type ICard, RankValue } from 'blackjack-types';

  import { getGameStoreContext } from '$lib/game.context';
  import BetForm from './BetForm.svelte';
  import Card from './Card.svelte';

  let clazz: string = '';
  export { clazz as class };

  export let hand: IPlayerHand;
  export let showActions: boolean = false;
  export let maxBet: number | undefined = undefined;

  const store = getGameStoreContext();

  $: hasBet = typeof hand.bet !== 'undefined';

  // TODO server should provide available actions on IPlayerHand
  $: canStand = hand.state === HandState.Hitting;
  $: canHit = hand.state === HandState.Hitting;
  $: canDouble = canHit && hand.cards.length === 2;
  $: canSplit = canDouble && RankValue[(hand.cards[0] as ICard).rank] === RankValue[(hand.cards[1] as ICard).rank];

  console.log({ canStand, canHit, canDouble, canSplit });
</script>

<div class={clazz}>
  <dl class="mb-1">
    <dt>State</dt>
    <dd>{hand.state ?? '-'}</dd>

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
        {hand.value.hard}
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
      <dd>{hand.settleStatus}</dd>
    {/if}

    {#if typeof hand.winnings !== 'undefined'}
      <dt>Winnings</dt>
      <dd>{hand.winnings}</dd>
    {/if}
  </dl>

  {#if showActions}
    {#if hasBet}
      <div class="flex flex-row gap-1">
        <button class="flex-1" on:click={() => store.stand(hand.id)} disabled={!canStand}>Stand</button>
        <button class="flex-1" on:click={() => store.hit(hand.id)} disabled={!canHit}>Hit</button>
        <button class="flex-1" on:click={() => store.double(hand.id)} disabled={!canDouble}>Double</button>
        <button class="flex-1" on:click={() => store.split(hand.id)} disabled={!canSplit}>Split</button>
      </div>
    {:else}
      <BetForm onSubmit={(amount) => store.bet(hand.id, amount)} {maxBet} />
    {/if}
  {/if}
</div>
