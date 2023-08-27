<script lang="ts">
  import type { IGame } from 'blackjack-types';
  import Players from './Players.svelte';
  import Dealer from './Dealer.svelte';

  export let game: IGame;
  export let playerId: string;
</script>

<Dealer dealer={game.dealer} />

<Players players={Object.values(game.players)} {playerId} />
