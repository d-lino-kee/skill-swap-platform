const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const matchesRoutes = require('./routes/matches');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  clientTracking: true
});

function heartbeat() {
  this.isAlive = true;
}

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Set up heartbeat
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  // Send immediate confirmation
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to WebSocket server'
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Echo back to confirm receipt
      ws.send(JSON.stringify({
        type: 'acknowledgment',
        message: 'Message received',
        data: data
      }));
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing message'
      }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Heartbeat interval to check connection status
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// Express middleware
app.use(express.json());

// Routes
app.use('/api/matches', matchesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 