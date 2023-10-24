<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import Chip from './Chip.svelte';
  import TestScene from '../TestScene.svelte';

  export let Hst: Hst;
</script>

<Hst.Story>
  <TestCanvas>
    <TestScene>
      <Chip />
    </TestScene>
  </TestCanvas>
</Hst.Story>
