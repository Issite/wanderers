const Tribe = require("./classes/tribe");
const Tribesman = require("./classes/tribesman");
const Totem = require("./classes/totem");
const { getNewId } = require("./utils");

class GameManager {
  constructor() {
    this.entities = new Map();
    this.teamCodes = new Map();
    this.updateInterval = null;
    this.onStateChange = null;
    this.updatesPerSecond = 0;
    this.updateCount = 0;
    this.lastUpdateCountReset = Date.now();
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
    const x = Math.random() * 32768; // Random starting position
    const y = Math.random() * 32768;
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
