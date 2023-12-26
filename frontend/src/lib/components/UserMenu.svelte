<script lang="ts">
  import type { User } from 'lucia';

  export let user: User;
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="avatar placeholder rounded-full outline-neutral-600 outline-1 hover:outline">
    <div class="w-8 bg-neutral text-neutral-content rounded-full">
      <span>{user.username[0].toUpperCase()}</span>
    </div>
  </div>
  <ul class="dropdown-content menu mt-1 w-40 z-[1] bg-base-200 rounded-box shadow">
    <li><a href="/{user.username}">Profile</a></li>
    <li>
      <form method="POST" action="/?/logout">
        <button type="submit">Sign Out</button>
      </form>
    </li>
  </ul>
</div>
