<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';

  import Chip from './Chip.svelte';
  import { DENOMINATIONS, type Denomination } from './Chip.types';

  export let Hst: Hst;

  let denominationStr = '1';
  $: denomination = parseInt(denominationStr) as Denomination;
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.Select title="denomination" options={DENOMINATIONS.map((d) => d.toFixed(0))} bind:value={denominationStr} />
  </svelte:fragment>

  <Hst.Variant title="Chip">
    <TestCanvas>
      <TestScene>
        <Chip {denomination} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
