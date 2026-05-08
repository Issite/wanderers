const Entity = require("./entity");
const Tribesman = require("./tribesman");
const Totem = require("./totem");
const { getNewId, getGameManager } = require("../utils");

class Tribe extends Entity {
  constructor(id, x, y, name, teamId, teamCode) {
    super(id, x, y);
    this.name = name;
    this.teamId = teamId;
    this.teamCode = teamCode;
    const gameManager = getGameManager();
    this.tribesmen = [
      new Tribesman(getNewId(gameManager), 0, 0, "axe"),
      new Tribesman(getNewId(gameManager), 0, 0, "bow")
    ];
    this.totem = new Totem(getNewId(gameManager), x, y, this.id);
    // Maximum pixels per second the tribe can move
    this.maxMoveSpeed = 200;
    this.lastUpdateTime = Date.now();
    this.desiredX = this.x;
    this.desiredY = this.y;
    this.resources = {
      food: 3,
      wood: 3,
      gold: 0,
      water: 0
    };
  }

  updateDesiredPosition(totemX, totemY) {
    this.desiredX = totemX;
    this.desiredY = totemY;
  }

  update() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;

    // Calculate distance to desired position
    const dx = this.desiredX - this.x;
    const dy = this.desiredY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
      // Calculate maximum distance tribe can move this frame
      const maxDistance = this.maxMoveSpeed * deltaTime;

      if (distance <= maxDistance) {
        // Can reach desired position
        this.x = this.desiredX;
        this.y = this.desiredY;
      } else {
        // Move towards desired position at max speed
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * maxDistance;
        this.y += Math.sin(angle) * maxDistance;
      }
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      teamId: this.teamId,
      tribesmen: this.tribesmen,
      totem: this.totem,
      x: this.x,
      y: this.y,
      resources: this.resources
    };
  }
}

module.exports = Tribe;