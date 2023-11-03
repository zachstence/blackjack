<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';
  import Chip from './Chip.svelte';

  export let Hst: Hst;

  let color = '#982C29';
  let radialSegments = 64;
  let pathSegments = 64;
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <h2>Mesh</h2>
    <Hst.ColorSelect title="color" bind:value={color} />
    <Hst.Slider title="radialSegments" bind:value={radialSegments} min={1} max={128} />
    <Hst.Slider title="pathSegments" bind:value={pathSegments} min={1} max={128} />
  </svelte:fragment>

  <Hst.Variant title="Chip">
    <TestCanvas>
      <TestScene>
        <Chip {color} {radialSegments} {pathSegments} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
