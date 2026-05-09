import Entity from "./entity.js";

export default class Campfire extends Entity {
    constructor(id, x, y, isLit = false, fuel = 60) {
        super(id, x, y);
        this.isLit = isLit;
        this.fuel = fuel;
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "campfire",
            x: this.x,
            y: this.y,
            isLit: this.isLit
        }
    }
}