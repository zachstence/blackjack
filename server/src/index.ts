import express from 'express';
import http from 'http';

import { GameServer } from './game-server';

const app = express();
const httpServer = http.createServer(app);

new GameServer(httpServer);

httpServer.listen(process.env.PORT, () => {
  console.log(`blackjack-server listening on port ${process.env.PORT}`);
});
