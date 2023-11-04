<script lang="ts">
  import { T } from '@threlte/core';

  import { CardMesh } from './CardMesh';
  import type { ICard } from 'blackjack-types';

  export let card: ICard;
  export let pxPerMm: number = 100;

  $: group = CardMesh({ card, pxPerMm });
</script>

{#if group}
  <T is={group} />
{/if}
