let clients: { [clientId: string]: ReadableStreamDefaultController };

export const initialize = () => {
  console.log('[sse] Initializing SSE');
  clients = {};
};

export const addClient = (id: string, controller: ReadableStreamDefaultController): void => {
  console.log(`[sse] Adding client with ID ${id}`);
  if (id in clients) {
    throw new Error(`[sse] Client with ID ${id} is already connected`);
  }
  clients[id] = controller;

  setInterval(() => {
    const data = {
      now: new Date().getTime(),
    };
    sendDataToController(data, controller);
  }, 1000);
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

const sendDataToController = (data: Record<string, unknown>, controller: ReadableStreamDefaultController): void => {
  console.log('sending data', data);

  const encoder = new TextEncoder();
  const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  controller.enqueue(chunk);
};
