<script lang="ts">
  export let onSubmit: (amount: number) => void;
  export let maxBet: number;

  let bet = 10;

  const increment = (amount: number): void => {
    bet = Math.min(maxBet, bet + amount);
  };

  const decrement = (amount: number): void => {
    bet = Math.max(0, bet - amount);
  };
</script>

<form on:submit={() => onSubmit(bet)}>
  <div>
    <button type="button" on:click={() => decrement(100)}>-100</button>
    <button type="button" on:click={() => decrement(10)}>-10</button>
    {bet}
    <button type="button" on:click={() => increment(10)}>+10</button>
    <button type="button" on:click={() => increment(100)}>+100</button>
  </div>

  <button type="submit">Bet</button>
</form>
