const clients: { [clientId: string]: ReadableStreamDefaultController } = {};

export const addClient = (id: string, controller: ReadableStreamDefaultController): void => {
  console.log(`[sse] Adding client with ID ${id}`);
  if (id in clients) {
    throw new Error(`[sse] Client with ID ${id} is already connected`);
  }
  clients[id] = controller;
};

export const removeClient = (id: string): void => {
  console.log(`[sse] Removing client with ID ${id}`);
  delete clients[id];
};

export const getClient = (id: string): ReadableStreamDefaultController | undefined => {
  return clients[id];
};

export const getClients = (): readonly [string, ReadableStreamDefaultController][] => {
  return Object.entries(clients);
};

export const send = (clientId: string, data: Record<string, unknown>): void => {
  const controller = clients[clientId];
  if (!controller) {
    console.debug(`Client ${clientId} not connected, can't send event`);
    return;
  }

  const encoder = new TextEncoder();
  const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  controller.enqueue(chunk);
};
