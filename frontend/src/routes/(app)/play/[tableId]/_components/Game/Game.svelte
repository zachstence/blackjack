<script lang="ts">
  import { getTableStoreContext } from '../../TableStore';

  let clazz = '';
  export { clazz as class };

  const tableStore = getTableStoreContext();
</script>

<div class={clazz}>Game</div>

<pre class="text-sm">{JSON.stringify($tableStore, null, 2)}</pre>
