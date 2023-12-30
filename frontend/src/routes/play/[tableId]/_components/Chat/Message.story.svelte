<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import { faker } from '@faker-js/faker';

  import Message from './Message.svelte';
  export let Hst: Hst;

  let name = faker.internet.userName();
  let content = faker.lorem.sentence() + faker.internet.emoji();
  let timestamp = faker.date.recent({ days: 0.001 }).toISOString();

  $: message = { name, content, timestamp };
</script>

<Hst.Story title="Chat/Message">
  <svelte:fragment slot="controls">
    <Hst.Text title="name" bind:value={name} />
    <Hst.Text title="content" bind:value={content} />
  </svelte:fragment>

  <Message class="w-64" {message} />
</Hst.Story>
