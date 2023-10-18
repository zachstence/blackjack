<script lang="ts">
  import { InsuranceStatus, type IInsurance } from 'blackjack-types';

  export let insurance: IInsurance;
  export let onBuyInsurance: () => void;
  export let onDeclineInsurance: () => void;
</script>

<dl>
  <dt>Insurance</dt>
  {#if insurance.status === InsuranceStatus.Offered}
    <dd class="flex flex-row gap-1">
      <button type="button" on:click={onBuyInsurance}>Buy</button>
      <button type="button" on:click={onDeclineInsurance}>Decline</button>
    </dd>
  {:else}
    <dd>{insurance.status === InsuranceStatus.Bought || insurance.status === InsuranceStatus.Settled ? '✅' : '❌'}</dd>

    {#if insurance.status === InsuranceStatus.Bought || insurance.status === InsuranceStatus.Settled}
      <dt>Bet</dt>
      <dd>{insurance.bet}</dd>
    {/if}

    {#if insurance.status === InsuranceStatus.Settled}
      <span class="h-3" />
      <dt>Outcome</dt>
      <dd>{insurance.settleStatus}</dd>

      <dt>Winnings</dt>
      <dd>{insurance.winnings}</dd>
    {/if}
  {/if}
</dl>
