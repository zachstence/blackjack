<script lang="ts">
  import type { Player } from '$lib/types/realtime';

  export let player: Player;
</script>

<div class="flex flex-col gap-2 px-4 py-2 bg-base-200 rounded-xl">
  <span class="font-semibold">{player.name}</span>
</div>
