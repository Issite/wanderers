import { TASKS } from "../../shared/constants.js";

class Task {
    constructor(type, targetId) {
        this.priority = TASKS[type].priority;
        this.type = type;
        this.targetId = targetId;
        this.cooldownTime = TASKS[type].cooldownTime;
    }

    toJSON() {
        return {
            priority: this.priority,
            type: this.type,
            targetId: this.targetId
        }
    }
}

export default Task;