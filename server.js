import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

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

// Set up a route to verify MFA code
app.post('/verify-mfa', async (req, res) => {
  const { uid, mfaVerificationCode } = req.body;

  if (!uid || !mfaVerificationCode) {
    return res.status(400).send('UID and MFA verification code are required');
  }

  try {
    // Call the verifyMfaCode function
    await verifyMfaCode(uid, mfaVerificationCode);
    res.status(200).send('MFA verification successful');
  } catch (error) {
    console.error('MFA verification failed:', error);
    res.status(400).send('MFA verification failed');
  }
});

// MFA Verification Function
const verifyMfaCode = async (uid, mfaVerificationCode) => {
  try {
    // Retrieve the user's ID token and get their MFA enrollment
    const user = await admin.auth().getUser(uid);
    const enrolledFactors = user.mfa.enrolledFactors;

    if (enrolledFactors.length === 0) {
      throw new Error('User has not enrolled any MFA factors.');
    }

    // Assuming the second factor is SMS, verify the MFA code
    const verification = await admin.auth().verifyPhoneNumberCode(mfaVerificationCode);
    console.log('MFA verification successful:', verification);
    return verification;
  } catch (error) {
    console.error('MFA verification failed:', error);
    throw new Error('MFA verification failed');
  }
};

// Listen on a port (example: 3000)
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
