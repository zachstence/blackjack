<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="text-2xl font-bold">{data.user.username}{data.user.isGuest ? ' (Guest)' : ''}</div>

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
          <a href={`/play/${table.id}`}>Join</a>
        </td>
        <td>
          <form method="POST" action="?/deleteTable" use:enhance>
            <input name="tableId" value={table.id} class="hidden" />
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<form method="POST" use:enhance action="?/createTable">
  <!-- TODO form fields to create a table -->
  <button type="submit">Create Table</button>
</form>
