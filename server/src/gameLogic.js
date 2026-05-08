class Tribesman {
  constructor(type) {
    this.type = type; // 'axe' or 'bow'
    this.health = 3;
  }
}

class Totem {
  constructor(tribeId) {
    this.tribeId = tribeId;
    this.x = Math.random() * 32768;
    this.y = Math.random() * 32768;
  }
}

class Tribe {
  constructor(id, name, teamCode) {
    this.id = id;
    this.name = name;
    this.teamCode = teamCode || this.assignTeam();
    this.tribesmen = [
      new Tribesman('axe'),
      new Tribesman('bow')
    ];
    this.totem = new Totem(id);
    // Tribe's actual position (starts at totem position)
    this.x = this.totem.x;
    this.y = this.totem.y;
    // Maximum pixels per second the tribe can move
    this.maxMoveSpeed = 200;
    this.lastUpdateTime = Date.now();
    this.desiredX = this.x;
    this.desiredY = this.y;
    this.createdAt = new Date();
    this.resources = {
        food: 3,
        wood: 3,
        gold: 0,
        water: 0
    };
  }

  assignTeam() {
    // Randomly assign to team 1 or team 2 if no team code provided
    return Math.random() < 0.5 ? 'team1' : 'team2';
  }

  updateDesiredPosition(totemX, totemY) {
    this.desiredX = totemX;
    this.desiredY = totemY;
  }

  updateActualPosition() {
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
      teamCode: this.teamCode,
      tribesmen: this.tribesmen,
      totem: this.totem,
      x: this.x,
      y: this.y,
      maxMoveSpeed: this.maxMoveSpeed,
      createdAt: this.createdAt,
      resources: this.resources
    };
  }
}

class GameManager {
  constructor() {
    this.tribes = new Map();
    this.updateInterval = null;
    this.onStateChange = null;
    this.updatesPerSecond = 0;
    this.updateCount = 0;
    this.lastUpdateCountReset = Date.now();
  }

  generateRandomId() {
    return Math.floor(Math.random() * 10000);
  }

  generateTribeName() {
    return `Tribe${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }

  joinGame(playerName, teamCode) {
    let id = this.generateRandomId();
    // Ensure unique ID
    while (this.tribes.has(id)) {
      id = this.generateRandomId();
    }
    const name = playerName && playerName.trim() ? playerName : this.generateTribeName();
    const tribe = new Tribe(id, name, teamCode);
    this.tribes.set(tribe.id, tribe);
    return tribe;
  }

  getTribe(tribeId) {
    return this.tribes.get(tribeId);
  }

  getAllTribes() {
    return Array.from(this.tribes.values());
  }

  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  startUpdateLoop() {
    // Update tribe positions every 16ms (~60fps)
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      this.tribes.forEach(tribe => {
        tribe.updateActualPosition();
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
