import { fail, redirect } from "@sveltejs/kit";
import { LuciaError } from "lucia";

import { auth } from "$lib/server/lucia";
import type { Actions } from "./$types";

export const actions: Actions = {
    default: async ({ request, locals }) => {
        const formData = await request.formData()
        const username = formData.get('username')
        const password = formData.get('password')

        if (typeof username !== 'string' || typeof password !== 'string') {
            return fail(400)
        }

        try {
            const key = await auth.useKey("username", username, password)
            const session = await auth.createSession({
                userId: key.userId,
                attributes: {},
            })
            locals.auth.setSession(session)
        } catch (e) {
            if (e instanceof LuciaError && (e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')) {
                return fail(400)
            }
            return fail(500)
        }

        throw redirect(302, "/me")
    }
};
