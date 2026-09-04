export function getNewId(gameManager) {
  let id = 0;
  while (gameManager.entities.has(id)) {
    id = Math.floor(Math.random() * 10000);
  }
  gameManager.entities.set(id, null); // Reserve the ID
  return id;
}

export function releaseId(gameManager, id) {
  gameManager.entities.delete(id);
}

let gameManager;

export function setGameManager(gm) {
  gameManager = gm;
}

export function getGameManager() {
  return gameManager;
}

let wss;

export function setWebSocketServer(server) {
  wss = server;
}

export function getWebSocketServer() {
  return wss;
}

let clients = new Map();

export function setClientsMap(map) {
  clients = map;
}

export function getClientsMap() {
  return clients;
}

export function sendGameOverMessage(tribeId) {
  const message = JSON.stringify({
    type: 'gameOver',
    tribeId,
  });

  let client;
  for (const [ws, id] of getClientsMap().entries()) {
    if (id === tribeId) {
      client = ws;
      break;
    }
  }

  if (client && client.readyState === 1) {
    client.send(message);
  }
}