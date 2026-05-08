const Entity = require("./entity");

class Crate extends Entity {
    constructor(id, x, y) {
        super(id, x, y);
    }

    toJSON() {
        return {
            id: this.id,
            type: "crate",
            x: this.x,
            y: this.y
        }
    }
}

module.exports = Crate;