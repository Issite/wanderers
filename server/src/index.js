import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './gameLogic.js';
import { setGameManager } from './utils.js';
import { type } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
const wss = new WebSocketServer({ server });

const gameManager = new GameManager();
setGameManager(gameManager); // Set gameManager for utils.js
gameManager.createWorld(); // Initialize meadows at server start
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
      } else if (data.type === 'targetMushroom') {
        const tribeId = clients.get(ws);
        if (gameManager.tryTargetMushroom(tribeId, data.mushroomId)) {
          ws.send(JSON.stringify({
            type: 'mushroomTargeted',
            mushroomId: data.mushroomId,
            success: true
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'mushroomTargeted',
            mushroomId: data.mushroomId,
            success: false
          }));
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    gameManager.entities.delete(clients.get(ws)); // Remove tribe associated with this client
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast game state to all connected clients
function broadcastGameState() {
  const entities = gameManager.getAllEntities().map(entity => (entity && typeof entity.toJSON === 'function') ? entity.toJSON() : null).filter(Boolean);
  const message = JSON.stringify({
    type: 'gameState',
    entities: entities,
    updatesPerSecond: gameManager.updatesPerSecond
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 is OPEN state
      client.send(message);
    }
  });
}

// Periodic server metrics log
setInterval(() => {
  console.log(`[Server Metrics] Updates/sec: ${gameManager.updatesPerSecond}, Connected clients: ${wss.clients.size}`);
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { gameManager };