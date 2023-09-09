<script lang="ts">
  import JoinForm from '$lib/components/JoinForm.svelte';
  import Game from '$lib/components/Game.svelte';
  import { GameStore } from '$lib/game.store';
  import { onMount } from 'svelte';
  import { setGameStoreContext } from '$lib/game.context';

  const store = new GameStore();
  setGameStoreContext(store);

  let debug = false;

  onMount(() => {
    store.connect();
    debug = new URLSearchParams(window.location.search).has('debug');
  });
</script>

{#if typeof $store.game === 'undefined'}
  <div class="w-screen h-screen flex flex-col items-center justify-center gap-8">
    <h1><pre>blackjack.stence.dev</pre></h1>
    <JoinForm onSubmit={store.join} />
  </div>
{:else}
  <Game />
{/if}

{#if debug}
  <button class="fixed bottom-2 right-2" type="button" on:click={store.reset}>Reset Game</button>
{/if}

<!-- <pre>{JSON.stringify($store.game, null, 2)}</pre> -->
