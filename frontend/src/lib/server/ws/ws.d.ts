import ws from 'ws';

declare module 'ws' {
    export class WebSocket extends ws.WebSocket {
        socketId: string
    }

    export type WebSocketServer = ws.Server<WebSocket>
}