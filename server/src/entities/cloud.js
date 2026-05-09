import Entity from "./entity.js";

export default class Cloud extends Entity {
    constructor(id, x, y, target, isRaining = false) {
        super(id, x, y);
        this.target = target;
        this.isRaining = isRaining;
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
