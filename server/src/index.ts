import express from 'express';
import http from 'http';

import { SocketServer as SocketServer } from './socket-server';

const PORT = 3000;

const app = express();
const httpServer = http.createServer(app);

new SocketServer(httpServer)

httpServer.listen(PORT, () => {
  console.log(`blackjack-server listening on port ${PORT}`);
});
