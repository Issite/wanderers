import Entity from "./entity.js";
import Task from "../task.js";

export default class Tribesman extends Entity {
  constructor(id, x, y, tool = "none", armor = 0, health = 3) {
    super(id, x, y);
    this.health = health;
    this.tool = tool;
    this.armor = armor;
    this.tasks = [new Task("idle", null, 0)];
    this.cooldown = 0;
  }

  addTask(task) {
    if (!this.tasks.some(t => t.targetId === task.targetId && t.type === task.type)) {
      this.tasks.push(task);
      this.tasks.sort((a, b) => a.priority - b.priority); // Sort tasks by priority
      if (this.cooldown === 0) {
        this.cooldown = this.tasks[0].cooldownTime;
      }
    }
  }

  update(gameManager) {
    if (this.cooldown > 0) { // working
      this.cooldown -= gameManager.deltaTime;
      if (this.cooldown <= 0) {
        this.cooldown = 0;
        if (gameManager.completeTask(this, this.tasks[0])) { // i.e. I'm done this step. Am I done?
          this.tasks.shift(); // Remove completed task
          this.tasks.sort((a, b) => a.priority - b.priority); // Sort tasks by priority
        }
        this.cooldown = this.tasks[0].cooldownTime;
      }
    }
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