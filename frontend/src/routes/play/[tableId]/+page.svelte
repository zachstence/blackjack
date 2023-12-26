<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import { Chat } from './Chat';
  import { TableStore } from './TableStore/table.store';
  import { setTableStoreContext } from './TableStore';

  const tableStore = new TableStore($page.params.tableId);
  setTableStoreContext(tableStore);

  onMount(() => {
    tableStore.connect();
    return () => {
      tableStore.disconnect();
    };
  });
</script>

<div class="w-full h-full flex flex-row gap-4">
  <pre class="flex-1">{JSON.stringify($tableStore, null, 2)}</pre>
  <Chat />
</div>
