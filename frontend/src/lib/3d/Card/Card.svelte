<script lang="ts">
  import { T } from '@threlte/core';

  import { CardMesh } from './Card.three';
  import type { ICard } from 'blackjack-types';

  export let card: ICard;

  $: group = CardMesh({ card });
</script>

<T is={group} />
