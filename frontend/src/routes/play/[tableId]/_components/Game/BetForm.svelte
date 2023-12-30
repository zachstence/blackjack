<script lang="ts">
  export let onSubmit: (amount: number) => void;
  export let maxBet: number | undefined = undefined;

  let bet = 10;

  const increment = (amount: number): void => {
    bet = Math.min(maxBet ?? Infinity, bet + amount);
  };

  const decrement = (amount: number): void => {
    bet = Math.max(0, bet - amount);
  };
</script>

<form on:submit={() => onSubmit(bet)}>
  <div class="flex flex-row items-center gap-1">
    <button type="button" class="flex-1" on:click={() => decrement(100)}><pre>-100</pre></button>
    <button type="button" class="flex-1" on:click={() => decrement(10)}><pre>-10</pre></button>
    <span class="flex-1 text-center px-2"><pre>{bet}</pre></span>
    <button type="button" class="flex-1" on:click={() => increment(10)}><pre>+10</pre></button>
    <button type="button" class="flex-1" on:click={() => increment(100)}><pre>+100</pre></button>
  </div>

  <button type="submit" class="w-full mt-1">Bet</button>
</form>

<style>
  button {
    @apply bg-gray-300 border border-black rounded-sm shadow-sm py-1 px-2;
  }

  button:disabled {
    @apply cursor-not-allowed text-gray-400;
  }
</style>
