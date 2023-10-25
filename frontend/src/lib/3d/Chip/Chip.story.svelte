<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import Chip from './Chip.svelte';
  import TestScene from '../TestScene.svelte';

  export let Hst: Hst;

  let color = 'red';
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.ColorSelect bind:value={color} title="color" />
  </svelte:fragment>

  <TestCanvas>
    <TestScene>
      <Chip {color} />
    </TestScene>
  </TestCanvas>
</Hst.Story>
