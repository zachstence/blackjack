import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/lucia';
import { nanoid } from 'nanoid';
import { faker } from '@faker-js/faker';
import type { Session } from 'lucia';
import { tableService } from '$lib/server';
import { zfd } from 'zod-form-data';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  let session = await locals.auth.validate();
  if (!session) {
    session = await createGuestUserAndSession();
    locals.auth.setSession(session);
  }

  const tables = await tableService.list();

  return {
    user: session.user,
    tables,
  };
};

const DeleteTableSchema = zfd.formData({
  tableId: zfd.text(),
});

export const actions: Actions = {
  createTable: async () => {
    const table = await tableService.create();
    throw redirect(303, `/play/${table.id}`);
  },
  deleteTable: async ({ request }) => {
    const formData = await request.formData();
    const { tableId } = DeleteTableSchema.parse(formData);
    await tableService.remove(tableId);
  },
};

const createGuestUserAndSession = async (): Promise<Session> => {
  const guestUser = await auth.createUser({
    key: {
      providerId: 'guest',
      providerUserId: nanoid(),
      password: null,
    },
    attributes: {
      username: generateGuestUsername(),
      is_guest: true,
    },
  });

  const session = await auth.createSession({
    userId: guestUser.userId,
    attributes: {},
  });

  return session;
};

const generateGuestUsername = (): string =>
  `${faker.word.adjective()}-${faker.word.noun()}-${faker.number.int({ min: 10, max: 99 })}`.toLowerCase();
