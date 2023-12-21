<script lang="ts">
  import { onMount } from 'svelte';

  let webSocketEstablished = false;
  let ws: WebSocket | null = null;
  let log: string[] = [];

  const logEvent = (str: string) => {
    log = [...log, str];
  };

  const establishWebSocket = () => {
    if (webSocketEstablished) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/websocket`);
    ws.addEventListener('open', (event) => {
      webSocketEstablished = true;
      console.log('[websocket] connection open', event);
      logEvent('[websocket] connection open');
    });
    ws.addEventListener('close', (event) => {
      console.log('[websocket] connection closed', event);
      logEvent('[websocket] connection closed');
    });
    ws.addEventListener('message', (event) => {
      console.log('[websocket] message received', event);
      logEvent(`[websocket] message received: ${event.data}`);
    });
  };

  onMount(establishWebSocket);
</script>
