import Entity from "./entity.js";
import { CLOUD_SPEED, CLOUD_RAIN_TIME } from "../../../shared/constants.js";

export default class Cloud extends Entity {
    constructor(id, x, y, target, isRaining = false) {
        super(id, x, y);
        this.target = target;
        this.isRaining = isRaining;
        this.rainTimer = 0;
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
            } else {
                this.x = this.target.x;
                this.y = this.target.y;

                if (!this.isRaining) {
                    this.target.getRainedOnIdiot(gameManager);
                    this.isRaining = true;
                    this.rainTimer = CLOUD_RAIN_TIME;
                } else {
                    this.target.getMoisturizedIdiot();
                    this.rainTimer -= gameManager.deltaTime;
                    if (this.rainTimer <= 0) {
                        this.isRaining = false;
                        this.target.itsNotSoJover();
                        this.pickNewTarget(gameManager);
                    }
                }
            }
        } else {
            this.pickNewTarget(gameManager);
        }
    }

    pickNewTarget(gameManager) {
        let meadows = Array.from(gameManager.entities.values()).filter(entity => entity && entity.constructor.name === "Meadow");
        meadows = meadows.filter(meadow => !meadow.doomed);
        console.log(`Top meadow before sorting: ${meadows.map(m => `Meadow ${m.id} last watered at ${m.lastWateredTime}`).join(", ")}`);
        meadows.sort((a, b) => {a.lastWateredTime - b.lastWateredTime});
        console.log(`Top meadow after sorting: ${meadows.map(m => `Meadow ${m.id} last watered at ${m.lastWateredTime}`).join(", ")}`);
        if (meadows.length > 0) {
            this.target = meadows[0];
            this.target.itsSoJover();
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
