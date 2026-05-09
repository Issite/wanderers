import Entity from "./entity.js";
import Grass from "./grass.js";

export default class Rabbit extends Entity {
    constructor(id, x, y, health = 2, target = null, cooldown = 0) {
        super(id, x, y);
        this.health = health;
        this.target = target;
        this.cooldown = cooldown;
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "rabbit",
            x: this.x,
            y: this.y
        }
    }
}