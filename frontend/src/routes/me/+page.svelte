<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<pre>{JSON.stringify(data, null, 2)}</pre>

<form method="post" action="/?/logout">
  <button type="submit">Logout</button>
</form>
