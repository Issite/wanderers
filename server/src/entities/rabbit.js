const Entity = require("./entity");
const Grass = require("./grass");

class Rabbit extends Entity {
    constructor(id, x, y, health = 2, target = null, cooldown = 0) {
        super(id, x, y);
        this.health = health;
        this.target = target;
        this.cooldown = cooldown;
    }

    toJSON() {
        return {
            id: this.id,
            type: "rabbit",
            x: this.x,
            y: this.y
        }
    }
}

module.exports = Rabbit;