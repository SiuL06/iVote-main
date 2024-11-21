import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the Vue.js app
app.use(express.static(path.join(__dirname, 'dist')));  // Ensure this points to your build directory

// Test route to check server status
app.get('/', (req, res) => {
  res.send('Server is running on http://localhost:3000');
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html')); // Serve index.html for all other routes
});

// Store nominees on the backend
let nominees = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send initial nominees list when a client connects
  socket.emit('nomineeUpdate', nominees);

  // Add nominee
  socket.on('addNominee', (nominee) => {
    nominees.push(nominee);
    io.emit('nomineeUpdate', nominees);  // Broadcast the updated nominees list to all clients
  });

  // Rename nominee
  socket.on('renameNominee', (updatedNominee) => {
    const index = nominees.findIndex(n => n.id === updatedNominee.id);
    if (index !== -1) {
      nominees[index] = updatedNominee;
      io.emit('nomineeUpdate', nominees);  // Broadcast the updated nominees list
    }
  });

  // Reset nominee score
  socket.on('resetNomineeScore', (nomineeId) => {
    const nominee = nominees.find(n => n.id === nomineeId);
    if (nominee) {
      nominee.score = 0;
      io.emit('nomineeUpdate', nominees);  // Broadcast the updated nominees list
    }
  });

  // Adjust nominee score
  socket.on('adjustScore', (nomineeId, change) => {
    const nominee = nominees.find(n => n.id === nomineeId);
    if (nominee) {
      nominee.score += change;
      io.emit('nomineeUpdate', nominees);  // Broadcast the updated nominees list
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
