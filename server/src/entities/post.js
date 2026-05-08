const Entity = require("./entity");

class Post extends Entity {
    constructor(id, x, y, type = 0) {
        super(id, x, y);
        this.type = type;
    }

    toJSON() {
        return {
            id: this.id,
            type: "post",
            x: this.x,
            y: this.y,
            postType: this.type
        }
    }
}

module.exports = Post;