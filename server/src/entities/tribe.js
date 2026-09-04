import Entity from "./entity.js";
import Tribesman from "./tribesman.js";
import Totem from "./totem.js";
import Task from "../task.js";
import { getNewId, getGameManager } from "../utils.js";
import {
  MAX_MOVE_SPEED,
  INTERACTION_DISTANCE,
  DROPPED_RESOURCE_AVOID_TIME,
  TRIBESMAN_ATTACK_PRIORITIES,
} from "../../../shared/constants.js";

class Tribe extends Entity {
  constructor(id, x, y, name, teamId, teamCode, aiType = "player") {
    super(id, x, y);
    this.name = name;
    this.teamId = teamId;
    this.teamCode = teamCode;
    this.aiType = aiType;
    const gameManager = getGameManager();
    this.tribesmen = [];
    if (aiType === "player") { // i.e. not barbarians
      this.tribesmen = [
        new Tribesman(getNewId(gameManager), 0, 0, id, "axe"),
        new Tribesman(getNewId(gameManager), 0, 0, id, "bow"),
        // new Tribesman(getNewId(gameManager), 0, 0, id, "hammer"),
        // new Tribesman(getNewId(gameManager), 0, 0, id, "scythe")
      ];
    } // barb tribesmen generation called explicitly in gameLogic.js
    this.tribesmen.forEach(tribesman => gameManager.entities.set(tribesman.id, tribesman));
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
    this.avoidingResources = {}; // Resources to avoid for a certain time after dropping
    this.targets = []; // Currently only mushrooms.
    this.opponentTribeId = null;
  }

  generateBarbarians(size) {
    const gameManager = getGameManager();
    for (let i = 0; i <= size; i++) { // not off by one since barb count is meadow size + 1
      const tool = ["axe", "bow", "hammer", "scythe"][Math.floor(Math.random() * 4)];
      const tribesman = new Tribesman(getNewId(gameManager), this.x, this.y, this.id, tool);
      this.tribesmen.push(tribesman);
      gameManager.entities.set(tribesman.id, tribesman);

      // Bigger tribes give more loot: 2 per minion
      this.resources[["food", "wood", "gold"][Math.floor(Math.random() * 3)]]++;
      this.resources[["food", "wood", "gold"][Math.floor(Math.random() * 3)]]++;
    }
  }

  updateDesiredPosition(totemX, totemY) {
    this.desiredX = totemX;
    this.desiredY = totemY;
  }

  update(gameManager) {
    // Calculate distance to desired position
    const dx = this.desiredX - this.x;
    const dy = this.desiredY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
      // Calculate maximum distance tribe can move this frame
      const maxDistance = this.maxMoveSpeed * gameManager.deltaTime;

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

    // Decrement times on avoiding resources
    for (const resourceId in this.avoidingResources) {
      this.avoidingResources[resourceId] -= gameManager.deltaTime;
      if (this.avoidingResources[resourceId] <= 0) {
        delete this.avoidingResources[resourceId];
      }
    }

    this.targets.forEach(targetId => {
      const target = gameManager.entities.get(targetId);
      if (target) {
        switch (target.constructor.name) {
          case "Mushroom": // Basically pickup resource
            const task = new Task("pick mushroom", targetId);
            const idleTribesman = this.tribesmen.find(tribesman => tribesman.tasks[0].type === "idle");
            if (idleTribesman) {
              idleTribesman.addTask(task);
              // Note: Due to multiple tribesmen working multiple tasks, it's possible that this will cause an issue, such as the tribesman assigned never completing the task
              this.targets = this.targets.filter(id => id !== targetId); // Remove from targets once assigned
            }
            break;
        }
      }
    });

    gameManager.entities.forEach(entity => {
      if (!entity) return;
      const distanceToEntity = Math.hypot(entity.x - this.x, entity.y - this.y);
      if (distanceToEntity <= INTERACTION_DISTANCE) {
        switch (entity.constructor.name) {
          case "Tribe":
            if (entity.teamId === this.teamId) { // Add missionary check here later
              break;
            }
            this.fightTribe(entity.id);
            break;
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
          case "Grass":
              this.tribesmen.forEach(tribesman => {
                if (tribesman.tool === "scythe") {
                  const task = new Task("cut grass", entity.id);
                  tribesman.addTask(task);
                }
              });
            break;
          case "Resource":
            if (!this.avoidingResources[entity.id]) { // Only pick up if not avoiding
              const task = new Task("pickup resource", entity.id);
              const idleTribesman = this.tribesmen.find(tribesman => tribesman.tasks[0].type === "idle");
              if (idleTribesman) {
                idleTribesman.addTask(task);
              }
            }
            break;
        }
      }
    });
  }

  fightTribe(otherTribeId, force = false) {
    // pain
    const otherTribe = getGameManager().entities.get(otherTribeId);
    const distanceToOtherTribe = Math.hypot(otherTribe.x - this.x, otherTribe.y - this.y);
    if (!force && this.opponentTribeId && this.opponentTribeId === otherTribe.id) {
      return; // Already fighting this tribe
    }
    if (distanceToOtherTribe > INTERACTION_DISTANCE) {
      this.opponentTribeId = null;
      return; // Not close enough to fight
    }
    if (!otherTribe.tribesmen) {
      this.opponentTribeId = null;
      return; // Other tribe is dead
    }
    this.opponentTribeId = otherTribe.id;
    const otherTribesmen = otherTribe.tribesmen.sort((a, b) => TRIBESMAN_ATTACK_PRIORITIES[a.tool] - TRIBESMAN_ATTACK_PRIORITIES[b.tool]);
    let hitList = [];
    otherTribesmen.forEach(tribesman => {
      hitList.push({targeted: false, tribesman: tribesman});
    });
    this.tribesmen.forEach(tribesman => {
      if (tribesman.tasks[0].type === "fight") {
        const currentTargetId = tribesman.tasks[0].targetId;
        const currentTarget = hitList.find(hit => hit.tribesman.id === currentTargetId);
        if (currentTarget) {
          currentTarget.targeted = true;
          return; // Already has a living target
        } else {
          tribesman.tasks.shift(); // Remove invalid target
        }
      }
      let task, targetId;
      switch (tribesman.tool) {
        case "none":
          task = new Task("panic", null);
          tribesman.addTask(task);
          break;
        case "bow":
          task = new Task("fight", hitList[0].tribesman.id); // Bows always focus down
          hitList[0].targeted = true;
          tribesman.addTask(task);
          break;
        case "dagger":
          /* Try, in order:
          * Find a target that is not already targeted and has a bow
          * Find first target that has a bow
          * Find a target that is not already targeted
          * Find first target
          */
          targetId = hitList.find(hit => !hit.targeted && hit.tribesman.tool === "bow");
          if (!targetId) {
            targetId = hitList.find(hit => hit.tribesman.tool === "bow");
          }
          if (!targetId) {
            targetId = hitList.find(hit => !hit.targeted);
          }
          if (!targetId) {
            targetId = hitList[0].tribesman.id;
          }
          hitList.find(hit => hit.tribesman.id === targetId.tribesman.id).targeted = true;
          task = new Task("fight", targetId);
          tribesman.addTask(task);
          break;
        default:
          targetId = hitList.find(hit => !hit.targeted)?.tribesman.id || hitList[0].tribesman.id;
          hitList.find(hit => hit.tribesman.id === targetId).targeted = true;
          task = new Task("fight", targetId);
          tribesman.addTask(task);
          break;
      }
    })
  }

  removeTribesman(tribesmanId) {
    this.tribesmen = this.tribesmen.filter(tribesman => tribesman.id !== tribesmanId);
  }

  tryTargetMushroom(mushroomId) {
    const mushroom = getGameManager().entities.get(mushroomId);
    if (mushroom && mushroom.constructor.name === "Mushroom" && !this.targets.includes(mushroomId) && Math.hypot(this.x - mushroom.x, this.y - mushroom.y) <= INTERACTION_DISTANCE) {
      this.targets.push(mushroomId);
      return true;
    }
    return false;
  }

  addResource(type) {
    if (this.resources[type] !== undefined) {
      this.resources[type]++;
    }
  }

  avoidResources(resources) {
    resources.forEach(resource => {
      this.avoidingResources[resource.id] = DROPPED_RESOURCE_AVOID_TIME;
    });
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