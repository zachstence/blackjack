<script lang="ts">
  import { formatDistanceToNow } from 'date-fns';
  import { onMount } from 'svelte';

  import type { ChatMessage } from '$lib/types/realtime/chat-message.types';

  let clazz = '';
  export { clazz as class };
  export let message: ChatMessage;

  $: date = new Date(message.timestamp);
  $: relativeTime = formatDistanceToNow(date, { addSuffix: true });
  onMount(() => {
    const interval = setInterval(() => {
      relativeTime = formatDistanceToNow(date, { addSuffix: true });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="{clazz} max-w-full flex flex-col gap-1 px-4 py-2">
  <div class="flex flex-row items-end justify-between gap-1">
    <div
      class="flex-1 min-w-0 font-semibold leading-tight overflow-hidden whitespace-nowrap text-ellipsis"
      title={message.name}
    >
      {message.name}
    </div>
    <time class="text-xs italic" datetime={date.toTimeString()} title={date.toLocaleTimeString()}>{relativeTime}</time>
  </div>
  <div class="text-xs">{message.content}</div>
</div>
