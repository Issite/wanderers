import Entity from "./entity.js";

export default class Tribesman extends Entity {
  constructor(id, x, y, tool = "none", armor = 0, health = 3) {
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
      entityType: "tribesman",
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