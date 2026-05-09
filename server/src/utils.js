function getNewId(gameManager) {
  let id = 0;
  while (gameManager.entities.has(id)) {
    id = Math.floor(Math.random() * 10000);
  }
  gameManager.entities.set(id, null); // Reserve the ID
  return id;
}

function releaseId(gameManager, id) {
  gameManager.entities.delete(id);
}

let gameManager;

export function setGameManager(gm) {
  gameManager = gm;
}

export function getGameManager() {
  return gameManager;
}

export { getNewId, releaseId };