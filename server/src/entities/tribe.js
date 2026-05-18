import Entity from "./entity.js";
import Tribesman from "./tribesman.js";
import Totem from "./totem.js";
import Task from "../task.js";
import { getNewId, getGameManager } from "../utils.js";
import { MAX_MOVE_SPEED, INTERACTION_DISTANCE } from "../../../shared/constants.js";

class Tribe extends Entity {
  constructor(id, x, y, name, teamId, teamCode) {
    super(id, x, y);
    this.name = name;
    this.teamId = teamId;
    this.teamCode = teamCode;
    const gameManager = getGameManager();
    this.tribesmen = [
      new Tribesman(getNewId(gameManager), 0, 0, id, "axe"),
      new Tribesman(getNewId(gameManager), 0, 0, id, "scythe")
    ];
    gameManager.entities.set(this.tribesmen[0].id, this.tribesmen[0]);
    gameManager.entities.set(this.tribesmen[1].id, this.tribesmen[1]);
    this.totem = new Totem(getNewId(gameManager), x, y, this.id);
    this.maxMoveSpeed = MAX_MOVE_SPEED;
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

  update(gameManager) {
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

    gameManager.entities.forEach(entity => {
      if (!entity) return;
      const distanceToEntity = Math.hypot(entity.x - this.x, entity.y - this.y);
      if (distanceToEntity <= INTERACTION_DISTANCE) {
        switch (entity.constructor.name) {
          case "Tree":
            this.tribesmen.forEach(tribesman => {
              if (tribesman.tool === "axe") {
                const task = new Task("chop tree", entity.id);
                tribesman.addTask(task);
              }
            });
            break;
          case "Rock":
            this.tribesmen.forEach(tribesman => {
              if (tribesman.tool === "hammer") {
                const task = new Task("break rock", entity.id);
                tribesman.addTask(task);  
              }
            });
            break;
          case "Mushroom":
            break;
          case "Grass":
              this.tribesmen.forEach(tribesman => {
                if (tribesman.tool === "scythe") {
                  const task = new Task("cut grass", entity.id);
                  tribesman.addTask(task);
                }
              });
            break;
          case "Resource":
            const task = new Task("pickup resource", entity.id);
            const idleTribesman = this.tribesmen.find(tribesman => tribesman.tasks[0].type === "idle");
            if (idleTribesman) {
              idleTribesman.addTask(task);
            }
            break;
        }
      }
    });
  }

  addResource(type) {
    if (this.resources[type] !== undefined) {
      this.resources[type]++;
    }
  }

  toJSON() {
    return {
      id: this.id,
      entityType: "tribe",
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

export default Tribe;