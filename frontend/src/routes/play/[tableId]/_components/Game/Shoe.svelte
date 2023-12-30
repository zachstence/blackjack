<script lang="ts">
  import { getTableStoreContext } from '../../TableStore';

  export let height: number;
  let clazz: string | undefined = undefined;
  export { clazz as class };

  const numFakeCards = 5;
  const fakeCardXPosInc = 5;
  const fakeCardPositions = Array.from({ length: numFakeCards - 1 }).map((_, i) => i * fakeCardXPosInc);

  const cardWidth = (height * 5) / 7;
  const width = cardWidth + (numFakeCards - 1) * fakeCardXPosInc;

  const table = getTableStoreContext();
  $: shoe = $table.shoe;
</script>

{#if shoe}
  <div class={clazz} style="width: {width}px; height: {height}px;">
    <div class="w-full h-full relative">
      {#each fakeCardPositions as right}
        <div class="fake-card" style="right: {right}px" />
      {/each}
    </div>

    <div class="fake-card left-0 flex flex-col items-center justify-center">
      <span class="text-sm">{shoe.length}</span>
    </div>
  </div>
{/if}

<style>
  .fake-card {
    position: absolute;
    top: 0;

    height: 100%;
    aspect-ratio: 5/7;

    background: white;
    border: 1px solid black;
    border-radius: 4px;
  }
</style>
