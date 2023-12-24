<script lang="ts">
  import type { PageData } from '../$types';

  export let data: PageData;
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
