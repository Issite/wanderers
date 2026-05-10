import { TASK_PRIORITIES } from "../../shared/constants";

class Task {
    constructor(type, targetId, cooldownTime = 1000) {
        this.priority = TASK_PRIORITIES[type];
        this.type = type;
        this.targetId = targetId;
        this.cooldownTime = cooldownTime;
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