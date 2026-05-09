const Tribe = require("./entities/tribe");
const Tribesman = require("./entities/tribesman");
const Totem = require("./entities/totem");
const Meadow = require("./entities/meadow");
const { getNewId } = require("./utils");
const MAP_WIDTH = 8192;
const MAP_HEIGHT = 8192;

class GameManager {
  constructor() {
    this.entities = new Map();
    this.teamCodes = new Map();
    this.updateInterval = null;
    this.onStateChange = null;
    this.updatesPerSecond = 0;
    this.updateCount = 0;
    this.lastUpdateCountReset = Date.now();

    this.createMeadows();
  }

  createMeadows() {
    let tempId = getNewId(this);
    const centerMeadow = new Meadow(tempId, MAP_WIDTH / 2, MAP_HEIGHT / 2, 2, 20, Date.now(), true);
    this.entities.set(centerMeadow.id, centerMeadow);

    let radius = MAP_HEIGHT / 6;
    for (let i = 0; i < 6; i ++) {
      tempId = getNewId(this);
      const angleOffset = Math.random() / 10 * Math.PI;
      const angle = i * (Math.PI / 3) + angleOffset; // 6 meadows evenly spaced with random offset
      const x = (MAP_WIDTH / 2) + radius * Math.cos(angle);
      const y = (MAP_HEIGHT / 2) + radius * Math.sin(angle);
      const tempMeadow = new Meadow(tempId, x, y, 1, 20, Date.now(), false);
      this.entities.set(tempMeadow.id, tempMeadow);
    }

    radius = MAP_HEIGHT / 3;
    for (let i = 0; i < 10; i ++) {
      tempId = getNewId(this);
      const angleOffset = Math.random() / 10 * Math.PI;
      const angle = i * (Math.PI / 5) + angleOffset; // 10 meadows evenly spaced with random offset
      const x = (MAP_WIDTH / 2) + radius * Math.cos(angle);
      const y = (MAP_HEIGHT / 2) + radius * Math.sin(angle);
      const tempMeadow = new Meadow(tempId, x, y, 0, 20, Date.now(), false);
      this.entities.set(tempMeadow.id, tempMeadow);
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
    // Update tribe positions every 16ms (~60fps)
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      this.entities.forEach(entity => {
        if (entity.update) {
          entity.update();
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

  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

module.exports = { GameManager, Tribe, Totem, Tribesman };
