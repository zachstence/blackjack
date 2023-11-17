<script lang="ts">
  import { HandAction } from 'blackjack-types';

  export let onBet: (amount: number) => void;
  export let onStand: () => void;
  export let onHit: () => void;
  export let onDouble: () => void;
  export let onSplit: () => void;
  export let actions: HandAction[];

  let bet = 10;

  const incBet = (amount: number): void => {
    bet += amount;
  };

  const decBet = (amount: number): void => {
    bet = Math.max(0, bet - amount);
  };

  $: canBet = actions.includes(HandAction.Bet);
  $: canStand = actions.includes(HandAction.Stand);
  $: canHit = actions.includes(HandAction.Hit);
  $: canDouble = actions.includes(HandAction.Double);
  $: canSplit = actions.includes(HandAction.Split);
</script>

<div class="flex flex-col gap-16 text-[200px]">
  {#if canBet}
    <form on:submit|preventDefault={() => onBet(bet)}>
      <div class="flex flex-row items-center gap-12">
        <button type="button" class="flex-1" on:click={() => decBet(100)}><pre>-100</pre></button>
        <button type="button" class="flex-1" on:click={() => decBet(10)}><pre>-10</pre></button>
        <span class="flex-1 text-center px-2"><pre>{bet}</pre></span>
        <button type="button" class="flex-1" on:click={() => incBet(10)}><pre>+10</pre></button>
        <button type="button" class="flex-1" on:click={() => incBet(100)}><pre>+100</pre></button>
      </div>

      <button type="submit" class="w-full mt-8">Bet</button>
    </form>
  {/if}

  <div class="flex flex-row gap-12">
    <button class="flex-1" on:click={onStand} disabled={!canStand}>Stand</button>
    <button class="flex-1" on:click={onHit} disabled={!canHit}>Hit</button>
    <button class="flex-1" on:click={onDouble} disabled={!canDouble}>Double</button>
    <button class="flex-1" on:click={onSplit} disabled={!canSplit}>Split</button>
  </div>
</div>

<style>
  button {
    @apply bg-gray-300 border-4 border-black rounded-xl shadow-xl py-4 px-16;
  }

  button:disabled {
    @apply cursor-not-allowed text-gray-400;
  }
</style>
