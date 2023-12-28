<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import Header from './_components/Header.svelte';

  export let data: PageData;

  $: showHeader = $page.route.id !== '/(app)/play/[tableId]';
</script>

{#if showHeader}
  <Header user={data.user} />
{/if}

<slot />
