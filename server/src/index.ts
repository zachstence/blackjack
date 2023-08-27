import express from 'express';
import http from 'http';
import cors from 'cors';

import { SocketServer as SocketServer } from './socket-server';

const PORT = 3000;

const app = express();
app.use(cors());
const httpServer = http.createServer(app);

new SocketServer(httpServer)

httpServer.listen(PORT, () => {
  console.log(`blackjack-server listening on port ${PORT}`);
});
