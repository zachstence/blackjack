<script lang="ts">
  import type { IPlayer } from 'blackjack-types';

  import Player from './Player.svelte';

  export let players: IPlayer[];
  export let playerId: string;
</script>

<div>
  {#each players as player}
    <Player {player} isMe={player.id === playerId} />
  {/each}
</div>
