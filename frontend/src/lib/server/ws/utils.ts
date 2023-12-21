import { parse } from 'url';
import { nanoid } from 'nanoid';
import WS, { WebSocketServer as WSWebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';

export const GlobalThisWSS = Symbol.for('sveltekit.wss');

export interface WebSocket extends WS.WebSocket {
  socketId: string;
  // userId: string;
}

export type WebSocketServer = WS.Server<WebSocket>

export type ExtendedGlobal = typeof globalThis & {
  [GlobalThisWSS]: WebSocketServer;
};

export const onHttpServerUpgrade = (req: IncomingMessage, sock: Duplex, head: Buffer) => {
  const pathname = req.url ? parse(req.url).pathname : null;
  if (pathname !== '/websocket') return;

  const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];

  wss.handleUpgrade(req, sock, head, (ws) => {
    console.log('[handleUpgrade] creating new connecttion');
    wss.emit('connection', ws, req);
  });
};

export const createWSSGlobalInstance = () => {
  const wss = new WSWebSocketServer({ noServer: true }) as WebSocketServer;

  (globalThis as ExtendedGlobal)[GlobalThisWSS] = wss;

  wss.on('connection', (ws) => {
    ws.socketId = nanoid();
    console.log(`[wss:global] client connected (${ws.socketId})`);

    ws.on('close', () => {
      console.log(`[wss:global] client disconnected (${ws.socketId})`);
    });
  });

  return wss;
};

let wssInitialized = false;
export const startupWebsocketServer = () => {
  if (wssInitialized) return;
  console.log('[wss:kit] setup');
  const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
  if (wss !== undefined) {
    wss.on('connection', (ws, _request) => {
      // This is where you can authenticate the client from the request
      // const session = await getSessionFromCookie(request.headers.cookie || '');
      // if (!session) ws.close(1008, 'User not authenticated');
      // ws.userId = session.userId;
      console.log(`[wss:kit] client connected (${ws.socketId})`);
      ws.send(`Hello from SvelteKit ${new Date().toLocaleString()} (${ws.socketId})]`);

      ws.on('close', () => {
        console.log(`[wss:kit] client disconnected (${ws.socketId})`);
      });
    });
    wssInitialized = true;
  }
};
