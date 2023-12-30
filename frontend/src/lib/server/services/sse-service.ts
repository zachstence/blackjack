export class SSEService {
  private clients: { [clientId: string]: ReadableStreamDefaultController } = {};

  addClient = (id: string, controller: ReadableStreamDefaultController): void => {
    console.log(`[sse] Adding client with ID ${id}`);
    if (id in this.clients) {
      throw new Error(`[sse] Client with ID ${id} is already connected`);
    }
    this.clients[id] = controller;
  };

  removeClient = (id: string): void => {
    console.log(`[sse] Removing client with ID ${id}`);
    delete this.clients[id];
  };

  getClient = (id: string): ReadableStreamDefaultController | undefined => {
    return this.clients[id];
  };

  getClients = (): readonly [string, ReadableStreamDefaultController][] => {
    return Object.entries(this.clients);
  };

  send = (clientId: string, data: Record<string, unknown>): void => {
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
