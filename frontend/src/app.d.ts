// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      auth: import('lucia').AuthRequest;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

/// <reference types="lucia" />
declare global {
  namespace Lucia {
    type Auth = import('$lib/server/lucia').Auth;
    type DatabaseUserAttributes = {
      username: string;
      is_guest: boolean;
    };
    // eslint-disable-next-line @typescript-eslint/ban-types
    type DatabaseSessionAttributes = {};
  }
}

export {};
