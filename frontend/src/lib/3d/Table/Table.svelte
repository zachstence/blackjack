<script lang="ts">
  import { T } from '@threlte/core';
  import { Table } from './Table.three';

  export let color: string = '#207100';
  export let resolution: number = 2;

  const table = Table({ color, resolution });
</script>

<T is={table} />
