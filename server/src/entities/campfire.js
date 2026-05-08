const Entity = require("./entity");

class Campfire extends Entity {
    constructor(id, x, y, isLit = false, fuel = 60) {
        super(id, x, y);
        this.isLit = isLit;
        this.fuel = fuel;
    }

    toJSON() {
        return {
            id: this.id,
            type: "campfire",
            x: this.x,
            y: this.y,
            isLit: this.isLit
        }
    }
}

module.exports = Campfire;