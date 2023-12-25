<script lang="ts">
  import { enhance } from '$app/forms';

  import { getTableStoreContext } from '../TableStore';
  import Message from './Message.svelte';

  let clazz: string = '';
  export { clazz as class };

  const tableStore = getTableStoreContext();

  let scrollElement: HTMLDivElement | undefined;

  $: {
    if ($tableStore.chatMessages && scrollElement) {
      scrollElement.scroll({ top: scrollElement.scrollHeight, behavior: 'smooth' });
    }
  }
</script>

<div bind:this={scrollElement} class="max-h-full flex flex-col border border-black {clazz}">
  <div class="flex-1 flex flex-col-reverse overflow-y-auto">
    {#each $tableStore.chatMessages as message, i}
      <Message class="{i !== 0 && 'border-t'} {i % 2 === 0 ? 'bg-slate-200' : 'bg-slate-300'} border-black" {message} />
    {/each}
  </div>

  <form
    class="sticky bottom-0 bg-slate-200 flex flex-row gap-2 p-2 border-t border-black"
    method="POST"
    action="?/sendChat"
    use:enhance
  >
    <textarea name="message" aria-label="Message" class="flex-1" />
    <button type="submit" class="border border-black px-2 py-1">Send</button>
  </form>
</div>
