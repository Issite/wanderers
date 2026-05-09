import Entity from "./entity.js";

export default class Well extends Entity {
    constructor(id, x, y, durability) {
        super(id, x, y);
        this.durability = durability;
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "well",
            x: this.x,
            y: this.y,
            durability: this.durability
        }
    }
}