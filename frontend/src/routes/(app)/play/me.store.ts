import type { User } from '@prisma/client';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const ME_STORE_CONTEXT = 'ME_STORE_CONTEXT';

export const createMeStore = (me: User): Writable<User> => {
  return writable(me);
};

export const setMeStoreContext = (store: Writable<User>): Writable<User> => setContext(ME_STORE_CONTEXT, store);

export const getMeStoreContext = (): Writable<User> => getContext(ME_STORE_CONTEXT);
