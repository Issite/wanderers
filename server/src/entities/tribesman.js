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
      console.log(`Adding task: ${task.type} on target ${task.targetId}`);
      this.tasks.push(task);
      this.tasks.sort((a, b) => a.priority - b.priority); // Sort tasks by priority
      if (this.cooldown === 0) {
        this.cooldown = this.tasks[0].cooldownTime;
      }
      console.log(`Current task: ${this.tasks[0].type} (Cooldown: ${this.cooldown.toFixed(2)}s)`);
    }
  }

  update(gameManager) {
    // console.log(`Updating tribesman ${this.id} at position (${this.x.toFixed(2)}, ${this.y.toFixed(2)}) with tool ${this.tool} and armor ${this.armor}. (Cooldown: ${this.cooldown.toFixed(2)}s, Tasks: ${this.tasks.map(t => t.type).join(", ")})`);
    if (this.cooldown > 0) { // working
      this.cooldown -= gameManager.deltaTime;
      if (this.cooldown <= 0) {
        console.log(`Task completed: ${this.tasks[0].type} on target ${this.tasks[0].targetId}`);
        this.cooldown = 0;
        gameManager.completeTask(this, this.tasks[0]);
        this.tasks.shift(); // Remove completed task
        this.tasks.sort((a, b) => a.priority - b.priority); // Sort tasks by priority
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