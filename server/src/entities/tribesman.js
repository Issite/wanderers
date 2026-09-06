import Entity from "./entity.js";
import Task from "../task.js";
import { TOOL_ATTACK_COOLDOWNS } from "../../../shared/constants.js";

export default class Tribesman extends Entity {
  constructor(id, x, y, tribeId, tool = "none", armor = 0, health = 3) {
    super(id, x, y);
    this.tribeId = tribeId;
    this.health = health;
    this.tool = tool;
    this.armor = armor;
    this.tasks = [new Task("idle", null)];
    this.targetId = null;
    this.cooldown = 0;
  }

  damage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      return true; // Tribesman is dead
    }
    return false; // Tribesman is still alive
  }

  getKillScore() {
    let score = 0;
    if (this.tool !== "none") {
      score += 2; // Score for having a tool
    }
    // TODO: shields
    score += this.armor; // Score for armor
    return score;
  }

  addTask(task) {
    if (!this.tasks.some(t => t.targetId === task.targetId && t.type === task.type)) {
      this.tasks.push(task);
      this.tasks.sort((a, b) => a.priority - b.priority); // Sort tasks by priority
      if (this.cooldown === 0) {
        this.varyCooldown(this.tasks[0]); // Set cooldown for the next task
      }
    }
  }

  update(gameManager) {
    if (this.cooldown > 0) { // working
      this.cooldown -= gameManager.deltaTime;
      if (this.cooldown <= 0) {
        this.cooldown = 0;
        if (gameManager.completeTask(this, this.tasks[0])) { // i.e. I'm done this step. Am I done?
          if (this.tasks[0].type !== "idle") { // Hard keep idle, since ending a fight will auto-remove fight task
            this.tasks.shift(); // Remove completed task
          }
          this.tasks.sort((a, b) => a.priority - b.priority); // Sort tasks by priority
          this.targetId = this.tasks[0] ? this.tasks[0].targetId : null; // Update targetId to the next task's targetId
        }
        this.varyCooldown(this.tasks[0]); // Set cooldown for the next task
      }
    }
  }

  varyCooldown(task) {
    const variance = Math.random() * 0.4 - 0.2; // Random variance between -0.2 and 0.2
    if (task.type === "fight") {
      this.cooldown = TOOL_ATTACK_COOLDOWNS[this.tool] + variance;
    } else if (task.type !== "idle") {
      this.cooldown = this.tasks[0].cooldownTime + variance;
    } else {
      this.cooldown = 0; // No cooldown for idle tasks
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
      cooldown: this.cooldown,
      targetId: this.targetId
    }
  }
}