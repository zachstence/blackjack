import express from 'express';
import http from 'http';

import { GameServer } from './game-server';

const PORT = 3000;

const app = express();
const httpServer = http.createServer(app);

new GameServer(httpServer)

httpServer.listen(PORT, () => {
  console.log(`blackjack-server listening on port ${PORT}`);
});
