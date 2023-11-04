<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';

  import Chip from './Chip.svelte';

  export let Hst: Hst;
</script>

<Hst.Story>
  <Hst.Variant title="Chip">
    <TestCanvas>
      <TestScene>
        <Chip />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
