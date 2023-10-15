<script lang="ts">
  import type { IInsurance } from 'blackjack-types';

  export let insurance: IInsurance | undefined;
  export let onBuyInsurance: () => void;
  export let onDeclineInsurance: () => void;

  console.log('InsureForm', insurance);
</script>

<dl>
  <dt>Insurance</dt>
  {#if typeof insurance === 'undefined'}
    <dd class="flex flex-row gap-1">
      <button type="button" on:click={onBuyInsurance}>Buy</button>
      <button type="button" on:click={onDeclineInsurance}>Decline</button>
    </dd>
  {:else}
    <dd>{insurance.boughtInsurance ? '✅' : '❌'}</dd>

    {#if insurance.boughtInsurance}
      <dt>Bet</dt>
      <dd>{insurance.bet}</dd>

      {#if typeof insurance.settleStatus !== 'undefined'}
        <span class="h-3" />
        <dt>Outcome</dt>
        <dd>{insurance.settleStatus}</dd>
      {/if}

      {#if typeof insurance.winnings !== 'undefined'}
        <dt>Winnings</dt>
        <dd>{insurance.winnings}</dd>
      {/if}
    {/if}
  {/if}
</dl>
