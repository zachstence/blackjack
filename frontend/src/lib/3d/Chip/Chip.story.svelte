<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';

  import Chip from './Chip.svelte';
  import { DEFAULT_PROPS } from './Chip.constants';

  export let Hst: Hst;

  let color = DEFAULT_PROPS.color;
  let radialSegments = DEFAULT_PROPS.radialSegments;
  let pathSegments = DEFAULT_PROPS.pathSegments;
  let slotInnerRadius = DEFAULT_PROPS.slotInnerRadius;
  let slotWidth = DEFAULT_PROPS.slotWidth;
  let slotDepth = DEFAULT_PROPS.slotDepth;
  let filletRadius = DEFAULT_PROPS.filletRadius;
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <h2>Mesh</h2>
    <Hst.ColorSelect title="color" bind:value={color} />
    <Hst.Slider title="radialSegments" bind:value={radialSegments} min={1} max={256} />
    <Hst.Slider title="pathSegments" bind:value={pathSegments} min={2} max={1024} />

    <Hst.Slider title="slotInnerRadius" bind:value={slotInnerRadius} min={0} max={15} />
    <Hst.Slider title="slotWidth" bind:value={slotWidth} min={0} max={10} />
    <Hst.Slider title="slotDepth" bind:value={slotDepth} min={0} max={1} step={0.1} />
    <Hst.Slider title="filletRadius" bind:value={filletRadius} min={0} max={2} step={0.1} />
  </svelte:fragment>

  <Hst.Variant title="Chip">
    <TestCanvas>
      <TestScene>
        <Chip {color} {radialSegments} {pathSegments} {slotInnerRadius} {slotWidth} {slotDepth} {filletRadius} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
