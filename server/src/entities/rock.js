const Entity = require("./entities/entity");

class Rock extends Entity {
    constructor(id, x, y, size = 0, health = 4) {
        super(id, x, y);
        this.size = size;
        this.health = health;
    }

    toJSON() {
        return {
            id: this.id,
            type: "rock",
            x: this.x,
            y: this.y,
            size: this.size
        }
    }
}

module.exports = Rock;