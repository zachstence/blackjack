<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import Chip from './Chip.svelte';

  export let Hst: Hst;
</script>

<Hst.Story>
  <TestCanvas><Chip /></TestCanvas>
</Hst.Story>
