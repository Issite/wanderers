import Entity from "./entity.js";

export default class Grass extends Entity {
    constructor(id, x, y) {
        super(id, x, y);
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "grass",
            x: this.x,
            y: this.y
        }
    }
}