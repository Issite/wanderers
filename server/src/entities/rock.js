const Entity = require("./entities/entity");

class Rock extends Entity {
    constructor(id, x, y, size = 0) {
        super(id, x, y);
        this.size = size;
        this.health = this.size * 3;
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "rock",
            x: this.x,
            y: this.y,
            size: this.size
        }
    }
}

module.exports = Rock;