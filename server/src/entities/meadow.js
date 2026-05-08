const Entity = require("./entity");

class Meadow extends Entity {
    constructor(id, x, y, size = 0, moisture = 20, lastWateredTime = Date.now(), isCenter = false) {
        super(id, x, y);
        this.size = size;
        this.moisture = moisture;
        this.lastWateredTime = lastWateredTime;
        this.isCenter = isCenter;
    }

    toJSON() {
        return {
            id: this.id,
            type: "meadow",
            x: this.x,
            y: this.y,
            size: this.size,
            moisture: this.moisture,
            isCenter: this.isCenter
        }
    }
}

module.exports = Meadow;