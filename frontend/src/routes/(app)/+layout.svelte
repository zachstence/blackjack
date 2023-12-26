<script lang="ts">
  import type { PageData } from './$types';
  import Header from './_components/Header.svelte';

  export let data: PageData;
</script>

<Header user={data.user} />

<slot />

<footer>Footer</footer>
