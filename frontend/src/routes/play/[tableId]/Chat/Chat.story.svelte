<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import { faker } from '@faker-js/faker';
  import { subSeconds } from 'date-fns';

  import type { ChatMessage } from '$lib/types/realtime/chat-message.types';

  import { setMockTableStoreContext } from '../TableStore';
  import Chat from './Chat.svelte';

  export let Hst: Hst;

  const numMessages = faker.number.int({ min: 10, max: 20 });
  const chatMessages: ChatMessage[] = Array.from({ length: numMessages }).map((_, i) => ({
    name: faker.internet.userName(),
    content: faker.lorem.sentence() + faker.internet.emoji(),
    timestamp: subSeconds(Date.now(), i * 30).toISOString(),
  }));

  setMockTableStoreContext({ chatMessages });
</script>

<Hst.Story title="Chat/Chat">
  <svelte:fragment slot="controls" />

  <Chat class="w-64" />
</Hst.Story>
