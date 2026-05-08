const Entity = require("./entity");

class Resource extends Entity {
    constructor(id, x, y, type) {
        super(id, x, y);
        this.type = type;
    }
    
    toJSON() {
        return {
            id: this.id,
            entityType: "resource",
            x: this.x,
            y: this.y,
            resourceType: this.type
        }
    }
}

module.exports = Resource;