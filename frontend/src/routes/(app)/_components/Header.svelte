<script lang="ts">
  import UserMenu from '$lib/components/UserMenu.svelte';
  import type { User } from 'lucia';

  export let user: User | undefined;
  $: console.log(user);
</script>

<header class="navbar min-h-0 gap-2">
  <a class="navbar-start gap-2" href="/">
    <img class="h-7" src="/favicon.svg" alt="" />
    <h1 class="font-bold font-mono hidden sm:block">blackjack.stence.dev</h1>
  </a>

  <div class="navbar-end gap-2">
    <a class="nav-link-primary" href="/play">Play</a>
    {#if user}
      <UserMenu {user} />
    {:else}
      <a class="nav-link" href="/sign-in">Sign In</a>
      <a class="nav-link" href="/sign-up">Sign Up</a>
    {/if}
  </div>
</header>

<style>
  .nav-link {
    @apply btn btn-sm btn-ghost leading-tight;
  }

  .nav-link-primary {
    @apply btn btn-sm btn-primary leading-tight;
  }
</style>
