<script lang="ts">
  import { SocketStore } from '$lib/socket.store';
  import { ClientEvent } from 'blackjack-types';
  import { onMount } from 'svelte';

  const socket = new SocketStore();

  onMount(() => {
    socket.connect();
  });
</script>

<button on:click={() => socket.emitClientEvent(ClientEvent.TestEvent, { data: 'client data' })}>Send TestEvent</button>
