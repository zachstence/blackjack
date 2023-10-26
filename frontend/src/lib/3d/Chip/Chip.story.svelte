<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import Chip from './Chip.svelte';
  import TestScene from '../TestScene.svelte';
  import ChipOBJ from './ChipOBJ.svelte';

  export let Hst: Hst;

  let color = 'red';
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.ColorSelect bind:value={color} title="color" />
  </svelte:fragment>

  <Hst.Variant title="Chip">
    <TestCanvas>
      <TestScene>
        <Chip {color} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>

  <Hst.Variant title="ChipOBJ">
    <TestCanvas>
      <TestScene>
        <ChipOBJ />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
