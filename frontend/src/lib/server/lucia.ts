import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { dev } from "$app/environment";

const client = new PrismaClient()

// expect error (see next section)
export const auth = lucia({
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),
    adapter: prisma(client),

    getUserAttributes: data => {
        return {
            username: data.username,
        }
    }
});

export type Auth = typeof auth;
