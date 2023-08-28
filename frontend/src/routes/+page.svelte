<script lang="ts">
  import JoinForm from '$lib/components/JoinForm.svelte';
  import Game from '$lib/components/Game.svelte';
  import { GameStore } from '$lib/game.store';
  import { onMount } from 'svelte';
  import { setGameStoreContext } from '$lib/game.context';
  import Card from '$lib/components/Card.svelte';
  import { Rank, Suit } from 'blackjack-types';

  const store = new GameStore();
  setGameStoreContext(store);

  onMount(() => {
    store.connect();
  });
</script>

<Card rank={Rank.Ace} suit={Suit.Spades} />

{#if typeof $store.game === 'undefined'}
  <JoinForm onSubmit={store.join} />
{:else}
  <Game />
{/if}

<pre>{JSON.stringify($store.game, null, 2)}</pre>
