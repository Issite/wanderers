import Entity from "./entity.js";

export default class Mushroom extends Entity {
    constructor(id, x, y, type = 0) {
        super(id, x, y);
        this.type = type;
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "mushroom",
            x: this.x,
            y: this.y,
            type: this.type
        }
    }
}