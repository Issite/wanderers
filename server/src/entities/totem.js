const Entity = require("./entity");

class Totem extends Entity {
    constructor(id, x, y, tribeId) {
        super(id, x, y);
        this.tribeId = tribeId;
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "totem",
            x: this.x,
            y: this.y,
            tribeId: this.tribeId
        };
    }
}

module.exports = Totem;