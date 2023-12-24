<script lang="ts">
  import { page } from '$app/stores';
  import { TableStore } from '$lib/client/table.store';
  import { onMount } from 'svelte';

  const tableStore = new TableStore($page.params.tableId);
  onMount(() => {
    tableStore.connect();
    return () => {
      tableStore.disconnect();
    };
  });
</script>

<pre>{JSON.stringify($tableStore, null, 2)}</pre>
