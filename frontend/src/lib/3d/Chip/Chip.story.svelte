<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';
  import Chip from './Chip.svelte';

  export let Hst: Hst;

  let color = 'red';
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.ColorSelect bind:value={color} title="color" />
  </svelte:fragment>

  <TestCanvas>
    <TestScene>
      <Chip />
    </TestScene>
  </TestCanvas>
</Hst.Story>
