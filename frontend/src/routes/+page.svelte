<script lang="ts">
  import JoinForm from '$lib/components/JoinForm.svelte';
  import Players from '$lib/components/Players.svelte';
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
  <Players players={Object.values($socket.game.players)} />
{/if}

<pre>
  {JSON.stringify($socket.game, null, 2)}
</pre>
