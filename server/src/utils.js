function getNewId(gameManager) {
  let id = 0;
  while (gameManager.entities.has(id)) {
    id = Math.floor(Math.random() * 10000);
  }
  return id;
}

function getGameManager() {
  return require('./index').gameManager;
}

module.exports = { getNewId, getGameManager };