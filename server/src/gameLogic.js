import Tribe from "./entities/tribe.js";
import Meadow from "./entities/meadow.js";
import Post from "./entities/post.js";
import Resource from "./entities/resource.js";
import { getNewId } from "./utils.js";
import { MAP_WIDTH, MAP_HEIGHT, INTERACTION_DISTANCE } from "../../shared/constants.js";

export class GameManager {
  constructor() {
    this.entities = new Map();
    this.teamCodes = new Map();
    this.updateInterval = null;
    this.onStateChange = null;
    this.updatesPerSecond = 0;
    this.updateCount = 0;
    this.lastUpdateCountReset = Date.now();
    this.lastUpdateTime = Date.now();
    this.deltaTime = 0;
  }

  createWorld() {
    this.createMeadows();
    this.createPosts();
  }

  createMeadows() {
    let tempId = getNewId(this);
    const centerMeadow = new Meadow(tempId, MAP_WIDTH / 2, MAP_HEIGHT / 2, 2, 20, Date.now(), true, this);
    this.entities.set(centerMeadow.id, centerMeadow);

    let radius = MAP_HEIGHT / 6;
    for (let i = 0; i < 6; i ++) {
      tempId = getNewId(this);
      const angleOffset = Math.random() / 10 * Math.PI;
      const angle = i * (Math.PI / 3) + angleOffset; // 6 meadows evenly spaced with random offset
      const x = (MAP_WIDTH / 2) + radius * Math.cos(angle);
      const y = (MAP_HEIGHT / 2) + radius * Math.sin(angle);
      const tempMeadow = new Meadow(tempId, x, y, 1, 20, Date.now(), false, this);
      this.entities.set(tempMeadow.id, tempMeadow);
    }

    radius = MAP_HEIGHT / 3;
    for (let i = 0; i < 10; i ++) {
      tempId = getNewId(this);
      const angleOffset = Math.random() / 10 * Math.PI;
      const angle = i * (Math.PI / 5) + angleOffset; // 10 meadows evenly spaced with random offset
      const x = (MAP_WIDTH / 2) + radius * Math.cos(angle);
      const y = (MAP_HEIGHT / 2) + radius * Math.sin(angle);
      const tempMeadow = new Meadow(tempId, x, y, 0, 20, Date.now(), false, this);
      this.entities.set(tempMeadow.id, tempMeadow);
    }
  }

  createPosts() {
    const angleOffset = Math.random() * 2 * Math.PI;
    const radius = MAP_HEIGHT / 4.5;
    for (let i = 0; i < 3; i++) {
      const angle = i * (2 * Math.PI / 3) + angleOffset; // 3 posts evenly spaced with random offset
      const x = (MAP_WIDTH / 2) + radius * Math.cos(angle);
      const y = (MAP_HEIGHT / 2) + radius * Math.sin(angle);
      const postId = getNewId(this);
      const post = new Post(postId, x, y, i);
      this.entities.set(post.id, post);
    }
  }

  joinGame(playerName, teamCode) {
    const id = getNewId(this);
    const name = playerName && playerName.trim() ? playerName : `Tribe${id}`;
    let teamId;
    if (teamCode) {
      if (this.teamCodes.has(teamCode)) {
        teamId = this.teamCodes.get(teamCode);
      } else {
        teamId = 3 + this.teamCodes.size % 4; // 3 = first custom team. %4 = 4 custom teams
        this.teamCodes.set(teamCode, teamId);
      }
    } else {
      teamId = Math.random() < 0.5 ? 1 : 2; // Randomly assign to team 1 or 2      
    }
    const x = Math.random() * MAP_WIDTH; // Random starting position
    const y = Math.random() * MAP_HEIGHT;
    const tribe = new Tribe(id, x, y, name, teamId, teamCode);
    this.entities.set(tribe.id, tribe);
    return tribe;
  }

  getTribe(id) {
    return this.entities.get(id);
  }

  getAllEntities() {
    return Array.from(this.entities.values());
  }

  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  startUpdateLoop() {
    // Update world every 16ms (~60fps)
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      this.deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = now;
      this.entities.forEach(entity => {
        if (entity && typeof entity.update === 'function') {
          entity.update(this);
        }
      });
      this.updateCount++;
      
      // Calculate updates per second
      if (now - this.lastUpdateCountReset >= 1000) {
        this.updatesPerSecond = this.updateCount;
        this.updateCount = 0;
        this.lastUpdateCountReset = now;
      }
      
      if (this.onStateChange) {
        this.onStateChange();
      }
    }, 16);
  }

  completeTask(tribesman, task) {
    switch (task.type) {
      case "chop tree":
        const tree = this.entities.get(task.targetId);
        if (tree) {
          tree.health -= 1;
          if (tree.health <= 0) {
            this.spawnResources(tree.x, tree.y, ["wood", "wood"]);
            this.entities.delete(tree.id);
            return true;
          }
        }
        return false;
        break;
      case "pickup resource":
        const resource = this.entities.get(task.targetId);
        if (resource) {
          this.entities.get(tribesman.tribeId).addResource(resource.type);
          this.entities.delete(resource.id);
          return true;
        }
        return false;
        break;
      case "break rock":
        const rock = this.entities.get(task.targetId);
        if (rock) {
          rock.health -= 1;
          if (rock.health <= 0) {
            this.spawnResources(rock.x, rock.y, Array(rock.size * 2).fill("gold"));
            this.entities.delete(rock.id);
            return true;
          }
        }
        return false;
        break;
      case "cut grass":
        const grass = this.entities.get(task.targetId);
        if (grass) {
          let type;
          if ((type = ["none", "wood", "food", "gold"][Math.floor(Math.random() * 4)]) !== "none") {
            this.spawnResources(grass.x, grass.y, [type]);
            this.entities.delete(grass.id);
          }
        }
        return true; // Grass cuts immediately and doesn't need to be removed from the map
        break;
      case "pick mushroom":
        const mushroom = this.entities.get(task.targetId);
        if (mushroom) {
          if (mushroom.type < 4) {
            this.entities.get(tribesman.tribeId).addResource("food");
          } else {
            tribesman.damage(1);
          }
          this.entities.delete(mushroom.id);
        }
        return true;
        break;
      default:
        return true; // Other tasks complete immediately
    }
  }

  tryTargetMushroom(tribeId, mushroomId) {
    return this.entities.get(tribeId).tryTargetMushroom(mushroomId);
  }

  spawnResources(x, y, resourceTypes) {
    resourceTypes.forEach(type => {
      const resourceId = getNewId(this);
      const offset = 40;
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * offset;
      const resourceX = x + radius * Math.cos(angle);
      const resourceY = y + radius * Math.sin(angle);
      const resource = new Resource(resourceId, resourceX, resourceY, type);
      this.entities.set(resourceId, resource);
    });
  }

  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
