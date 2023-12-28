<script lang="ts">
  import { formatDistanceToNow } from 'date-fns';
  import { onMount } from 'svelte';

  import type { ChatMessage } from '$lib/types/realtime/chat-message.types';

  let clazz = '';
  export { clazz as class };
  export let message: ChatMessage;
  export let me: boolean;

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

<div class="{clazz} chat {me ? 'chat-end' : 'chat-start'}">
  <!-- TODO add avatars? -->
  <div class="chat-header">
    {message.name}
  </div>

  <div class="chat-bubble">
    {message.content}
  </div>

  <div class="chat-footer">
    <time class="text-xs italic" datetime={date.toTimeString()} title={date.toLocaleTimeString()}>{relativeTime}</time>
  </div>
</div>
