const Entity = require("./entity");

class Tree extends Entity {
    constructor(id, x, y, health) {
        super(id, x, y);
        this.health = health;
    }

    toJSON() {
        return {
            id: this.id,
            type: "tree",
            x: this.x,
            y: this.y,
            health: this.health
        }
    }
}

module.exports = Tree;