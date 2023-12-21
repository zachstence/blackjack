<script lang="ts">
  import ReconnectingEventSource from 'reconnecting-eventsource';
  import { onMount } from 'svelte';

  let eventSource: ReconnectingEventSource;
  let messages: unknown[] = [];

  const start = (): void => {
    eventSource = new ReconnectingEventSource('/sse');
    eventSource.onmessage = (event) => {
      console.log('Received server-sent event', event);
      messages = [...messages, event.data];
    };
  };

  const stop = (): void => {
    eventSource.close();
  };
</script>

<button on:click={start}>Start</button>
<button on:click={stop}>Stop</button>

<pre>{JSON.stringify(messages, null, 2)}</pre>
