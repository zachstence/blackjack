<script lang="ts">
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';

  import { Chat, Game } from './_components';
  import { TableStore } from './TableStore/table.store';
  import { setTableStoreContext } from './TableStore';
  import type { PageData } from './$types';

  export let data: PageData;

  const tableStore = new TableStore(data.table);
  setTableStoreContext(tableStore);

  $: {
    if (dev && typeof window !== 'undefined') {
      (window as any).table = $tableStore;
    }
  }

  onMount(() => {
    tableStore.connect();
    return () => {
      tableStore.disconnect();
    };
  });
</script>

<div class="w-full h-full flex flex-row gap-4">
  <Game class="flex-1" />
  <Chat class="flex-shrink-0" />
</div>
