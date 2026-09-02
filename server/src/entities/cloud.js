import Entity from "./entity.js";
import { CLOUD_SPEED, CLOUD_RAIN_TIME } from "../../../constants.js";

export default class Cloud extends Entity {
    constructor(id, x, y, target, isRaining = false) {
        super(id, x, y);
        this.target = target;
        this.isRaining = isRaining;
    }

    update(gameManager) {
        if (this.target) {
            const maxDistance = CLOUD_SPEED * gameManager.deltaTime;
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance >= maxDistance) {
                this.x += (dx / distance) * maxDistance;
                this.y += (dy / distance) * maxDistance;
            }
        }
    }

    pickNewTarget(gameManager) {
        const meadows = Array.from(gameManager.entities.values()).filter(entity => entity.constructor.name === "Meadow");
        meadows.sort((a, b) => {a.lastWateredTime - b.lastWateredTime});
        if (meadows.length > 0) {
            this.target = meadows[0];
        } else {
            this.target = null;
        }
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "cloud",
            x: this.x,
            y: this.y,
            isRaining: this.isRaining,
        }
    }
}
