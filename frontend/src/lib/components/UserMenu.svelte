<script lang="ts">
  import { enhance } from '$app/forms';
  import type { User } from 'lucia';

  export let user: User;

  const LOGOUT_FORM_ID = 'LOGOUT_FORM_ID';
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="avatar placeholder rounded-full outline-neutral-600 outline-1 hover:outline">
    <div class="w-8 bg-neutral text-neutral-content rounded-full">
      <span>{user.username[0].toUpperCase()}</span>
    </div>
  </div>
  <ul class="dropdown-content menu mt-1 w-40 z-[1] bg-base-200 rounded-box shadow">
    <li><a href="/{user.username}">Profile</a></li>
    <li><button type="submit" form={LOGOUT_FORM_ID}>Sign Out</button></li>
  </ul>
</div>

<!-- <form /> inside <li /> wasn't working -->
<form id={LOGOUT_FORM_ID} method="POST" action="/?/logout" use:enhance class="hidden" />
