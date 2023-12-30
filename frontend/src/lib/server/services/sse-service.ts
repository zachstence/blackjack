import type { ServerEvent } from '$lib/types/realtime';
import { nanoid } from 'nanoid';

export type AddClientArgs = {
  onConnect: (clientId: string) => void | Promise<void>;
  onDisconnect: (clientId: string) => void | Promise<void>;
};

export type AddClientResult = {
  clientId: string;
  response: Response;
};

export class SSEService {
  private clients: { [clientId: string]: ReadableStreamDefaultController } = {};

  addClient = (args: AddClientArgs): AddClientResult => {
    const clientId = nanoid();
    console.log(`[sse] Adding client with ID ${clientId}`);

    if (clientId in this.clients) {
      throw new Error(`[sse] Client with ID ${clientId} is already connected`);
    }

    const body = new ReadableStream({
      start: async (controller) => {
        this.clients[clientId] = controller;
        await args.onConnect(clientId);
      },
      cancel: async () => {
        delete this.clients[clientId];
        await args.onDisconnect(clientId);
      },
    });

    const headers = {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    };

    const response = new Response(body, { headers });
    return { clientId, response };
  };

  send = (clientId: string, data: ServerEvent): void => {
    const controller = this.clients[clientId];
    if (!controller) {
      console.debug(`Client ${clientId} not connected, can't send event`);
      return;
    }

    const encoder = new TextEncoder();
    const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

    controller.enqueue(chunk);
  };
}
