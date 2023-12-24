<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: if (form?.table) {
    goto(`/tables/${form?.table.id}`);
  }
</script>

<table>
  <thead>
    <tr>
      <th>Table ID</th>
      <th>Num Players</th>
    </tr>
  </thead>
  <tbody>
    {#each data.tables as table}
      <tr>
        <td>{table.id}</td>
        <td>{table.players.length}</td>
        <td>
          <a href={`/tables/${table.id}`}>Join</a>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<form method="POST" use:enhance action="?/createTable">
  <!-- TODO form fields to create a table -->
  <button type="submit">Create Table</button>
</form>
