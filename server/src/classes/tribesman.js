const Entity = require("./entity");

class Tribesman extends Entity {
  constructor(id, x, y, tool = "none", armor = 0, health = 100) {
    super(id, x, y);
    this.health = health;
    this.tool = tool;
    this.armor = armor;
    this.tasks = [];
    this.cooldown = 0;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      health: this.health,
      tool: this.tool,
      armor: this.armor,
      tasks: this.tasks,
      cooldown: this.cooldown
    }
  }
}

module.exports = Tribesman;