<script lang="ts">
  import { enhance } from '$app/forms';
  import { RoundState, type Player } from '$lib/types/realtime';
  import { getMeStoreContext } from '../../../me.store';
  import { getTableStoreContext } from '../../TableStore';

  export let player: Player;

  const me = getMeStoreContext();
  $: isMe = player.id === $me.id;

  const table = getTableStoreContext();
</script>

<div class="flex flex-col gap-2 px-4 py-2 bg-gray-100 rounded-xl">
  <div class="flex flex-row gap-2 justify-between">
    <span class="font-semibold">{player.name}</span>
    <span>{player.money}</span>
  </div>

  {#if $table.roundState === RoundState.PlayersReadying}
    <form method="post" action="?/ready" use:enhance>
      <button class="w-full" type="submit" disabled={!isMe || player.ready}>
        {#if player.ready}
          ✅
        {:else}
          Ready
        {/if}
      </button>
    </form>
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
