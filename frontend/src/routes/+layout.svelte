<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import Header from './_components/Header.svelte';

  export let data: PageData;

  $: showHeader = $page.route.id !== '/play/[tableId]';
</script>

<svelte:head>
  <title>Blackjack</title>
  <meta name="keywords" content="blackjack, multiplayer, online, realtime, game, casino" />
  <meta name="description" content="Free online blackjack with no ads or interruptions" />
  <meta property="og:title" content="Blackjack" />
  <meta property="og:description" content="Free online blackjack with no ads or interruptions" />
</svelte:head>

{#if showHeader}
  <Header user={data.user} />
{/if}

<slot />
