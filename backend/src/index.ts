import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import connectDB from './config/db';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './socket/socketHandlers';

const PORT = process.env.PORT || 5000;

const server = createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Setup socket handlers
setupSocketHandlers(io);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    console.log('Socket.IO server initialized');
  });
});

export { io };