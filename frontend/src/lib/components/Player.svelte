<script lang="ts">
  import { RoundState, type IPlayer } from 'blackjack-types';
  import { getGameStoreContext } from '$lib/game.context';

  export let player: IPlayer;

  const store = getGameStoreContext();

  $: isMe = player.id === $store.myPlayerId;
</script>

<div class="flex flex-col gap-2 px-4 py-2 bg-gray-100 rounded-xl">
  <div class="flex flex-row gap-2 justify-between">
    <span class="font-semibold">{player.name}</span>
    <span>{player.money}</span>
  </div>

  {#if $store.game?.roundState === RoundState.PlayersReadying}
    <button on:click={() => store.ready()} disabled={!isMe || player.ready}>
      {#if player.ready}
        ✅
      {:else}
        Ready
      {/if}
    </button>
  {/if}
</div>
