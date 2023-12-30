<script lang="ts">
  import type { LayoutServerData } from './$types';
  import { createMeStore, setMeStoreContext } from './me.store';

  export let data: LayoutServerData;

  const meStore = createMeStore(data.user);
  setMeStoreContext(meStore);
</script>

<slot />
