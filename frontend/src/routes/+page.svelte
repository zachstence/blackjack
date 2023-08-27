<script lang="ts">
  import JoinForm from '$lib/components/JoinForm.svelte';
  import Game from '$lib/components/Game.svelte';
  import { SocketStore } from '$lib/socket.store';
  import { onMount } from 'svelte';

  const socket = new SocketStore();

  onMount(() => {
    socket.connect();
  });
</script>

{#if typeof $socket.game === 'undefined'}
  <JoinForm onSubmit={socket.join} />
{:else}
  <Game game={$socket.game} playerId={socket.playerId} />
{/if}

<pre>
  {JSON.stringify($socket.game, null, 2)}
</pre>
