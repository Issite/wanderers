const Entity = require("./entity");

class Grass extends Entity {
    constructor(id, x, y) {
        super(id, x, y);
    }

    toJSON() {
        return {
            id: this.id,
            type: "grass",
            x: this.x,
            y: this.y
        }
    }
}

module.exports = Grass;