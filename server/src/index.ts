import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const PORT = 3000;

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const wss = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

wss.on('connection', socket => {
  console.log(`connection ${socket.id}`);
});

httpServer.listen(PORT, () => {
  console.log(`blackjack-server listening on port ${PORT}`);
});
