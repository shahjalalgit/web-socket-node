// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 5000;

// __dirname simulation for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Create an HTTP server
const server = http.createServer(app);

// Set up Socket.IO with CORS support
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (update this in production for security)
    methods: ['GET', 'POST'],
  },
});

// Handle WebSocket connections for different purposes

// Chat namespace
const chatNamespace = io.of('/chat');
chatNamespace.on('connection', (socket) => {
  console.log(`Client connected to chat: ${socket.id}`);

  // Handle incoming chat messages
  socket.on('chatMessage', (data) => {
    console.log(`Received Chat message from ${socket.id}:`, data);
    // Broadcast the message to other connected clients
    chatNamespace.emit('chatMessage', data);
  });

  // Handle typing event
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', `${username} is typing...`);
  });

  // Handle stop typing event
  socket.on('stopTyping', () => {
    socket.broadcast.emit('stopTyping');
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected from chat: ${socket.id}`);
  });
});

// Notifications namespace
const notificationsNamespace = io.of('/notifications');
notificationsNamespace.on('connection', (socket) => {
  console.log(`Client connected to notifications: ${socket.id}`);

  // Handle sending notifications
  socket.on('notify', (data) => {
    console.log(`Notification from ${socket.id}:`, data);
    notificationsNamespace.emit('notify', data);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected from notifications: ${socket.id}`);
  });
});

// General namespace for custom API listening
io.on('connection', (socket) => {
  console.log(`Client connected to general namespace: ${socket.id}`);

  // Handle custom events
  socket.on('customEvent', (data) => {
    console.log(`Custom event from ${socket.id}:`, data);
    socket.emit('customResponse', `Handled custom event with data: ${data}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected from general namespace: ${socket.id}`);
  });
});


// Fallback to serve the React app for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
