const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { GameManager } = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const gameManager = new GameManager();
const clients = new Map();
let lastBroadcastTime = 0;
const BROADCAST_INTERVAL = 80; // Broadcast at most every 80ms (~12.5 updates/sec)

// Set up callback for when game state changes
gameManager.setStateChangeCallback(() => {
  const now = Date.now();
  if (now - lastBroadcastTime >= BROADCAST_INTERVAL) {
    broadcastGameState();
    lastBroadcastTime = now;
  }
});

// Start the game update loop
gameManager.startUpdateLoop();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client')));

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'joinGame') {
        // Create new tribe
        const tribe = gameManager.joinGame(data.playerName || null, data.teamCode || null);
        
        // Register client with this tribe
        clients.set(ws, tribe.id);
        console.log(`Client joined with tribe ID: ${tribe.id}, name: ${tribe.name}`);

        // Send confirmation with tribe data
        ws.send(JSON.stringify({
          type: 'gameJoined',
          tribe: tribe.toJSON()
        }));

        // Notify all clients about the new tribe
        broadcastGameState();
      } else if (data.type === 'updateTotem') {
        const tribeId = clients.get(ws);
        const tribe = gameManager.getTribe(tribeId);
        if (tribe) {
          tribe.totem.x = data.totem.x;
          tribe.totem.y = data.totem.y;
          tribe.updateDesiredPosition(data.totem.x, data.totem.y);
          // Don't broadcast on every totem update - let the regular update loop handle it
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    gameManager.tribes.delete(clients.get(ws)); // Remove tribe associated with this client
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast game state to all connected clients
function broadcastGameState() {
  const entities = gameManager.getAllEntities().map(entity => entity.toJSON());
  const message = JSON.stringify({
    type: 'gameState',
    entities: entities,
    updatesPerSecond: gameManager.updatesPerSecond
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Periodic server metrics log
setInterval(() => {
  console.log(`[Server Metrics] Updates/sec: ${gameManager.updatesPerSecond}, Active tribes: ${gameManager.tribes.size}, Connected clients: ${wss.clients.size}`);
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { gameManager };