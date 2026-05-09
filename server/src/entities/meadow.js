import {
    MEADOW_BASE_SIZE,
    MEADOW_SIZE_FACTOR
} from "../../../shared/constants.js";
import Entity from "./entity.js";
import Mushroom from "./mushroom.js";
import Tree from "./tree.js";
import Grass from "./grass.js";
import Rock from "./rock.js";
import { getNewId, getGameManager, releaseId } from "../utils.js";


class Meadow extends Entity {
    constructor(id, x, y, size = 0, moisture = 20, lastWateredTime = Date.now(), isCenter = false) {
        super(id, x, y);
        this.size = size;
        this.moisture = moisture;
        this.lastWateredTime = lastWateredTime;
        this.isCenter = isCenter;
        this.growths = [];
        this.getRainedOnIdiot();
    }

    getRainedOnIdiot() {
        let newGrowths = [];
        const pixelSize = (MEADOW_BASE_SIZE + this.size) * MEADOW_SIZE_FACTOR;

        // Filter out removed growths, and count each type
        const gameManager = getGameManager();
        this.growths = this.growths.filter(growth => 
            gameManager.entities.values().includes(growth)
        );
        const mushroomCount = this.growths.filter(g => g.isInstanceOf(Mushroom)).length;
        const treeCount = this.growths.filter(g => g.isInstanceOf(Tree)).length;
        const grassCount = this.growths.filter(g => g.isInstanceOf(Grass)).length;
        const rockCount = this.growths.filter(g => g.isInstanceOf(Rock)).length;

        // Generate mushrooms (3 per meadow size) with 50% chance each
        for (let i = 0; i < (this.size * 3) - mushroomCount; i++) {
            if (Math.random() < 0.5) {
                const mushroomId = getNewId(gameManager);
                const angle = Math.random() * 2 * Math.PI;
                const radius = (0.5 + Math.random() * 0.5) * pixelSize; // Random radius based on meadow size
                const mushroomX = this.x + radius * Math.cos(angle);
                const mushroomY = this.y + radius * Math.sin(angle);
                const mushroomType = Math.floor(Math.random() * 8); // Random mushroom type
                const mushroom = new Mushroom(mushroomId, mushroomX, mushroomY, mushroomType);
                newGrowths.push(mushroom);
                this.growths.push(mushroom);
            }
        }

        // Generate grass (2 per meadow size) with 90% chance each
        for (let i = 0; i < (this.size * 2) - grassCount; i++) {
            if (Math.random() < 0.9) {
                const grassId = getNewId(gameManager);
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.random() * pixelSize;
                const grassX = this.x + radius * Math.cos(angle);
                const grassY = this.y + radius * Math.sin(angle);
                const grass = new Grass(grassId, grassX, grassY);
                newGrowths.push(grass);
                this.growths.push(grass);
            }
        }

        // Generate rocks (2 of size meadowSize - 2*(1 at 50% chance))
        for (let i = 0; i < 2 - rockCount; i++) {
            const rockId = getNewId(gameManager);
            const angle = Math.random() * 2 * Math.PI;
            const radius = (0.25 + Math.random() * 0.5) * pixelSize;
            const rockX = this.x + radius * Math.cos(angle);
            const rockY = this.y + radius * Math.sin(angle);
            const rockSize = this.size - (Math.random() < 0.5 ? 1 : 0) - (Math.random() < 0.5 ? 1 : 0);
            if (this.size > 0 && rockSize > 0) {
                const rock = new Rock(rockId, rockX, rockY, rockSize);
                newGrowths.push(rock);
                this.growths.push(rock);
            } else {
                releaseId(gameManager, rockId);
            }
        }

        // Generate Trees (1 per meadow size) with 70% chance each
        for (let i = 0; i < this.size - treeCount; i++) {
            if (Math.random() < 0.7) {
                const treeId = getNewId(gameManager);
                const angle = Math.random() * 2 * Math.PI;
                const radius = (Math.random() * 0.5) * pixelSize;
                const treeX = this.x + radius * Math.cos(angle);
                const treeY = this.y + radius * Math.sin(angle);
                const tree = new Tree(treeId, treeX, treeY, 4);
                newGrowths.push(tree);
                this.growths.push(tree);
            }
        }

        this.lastWateredTime = Date.now();
        this.getMoisturizedIdiot();
        return newGrowths;
    }

    getMoisturizedIdiot() {
        this.moisture = Math.min(20, this.moisture + 0.1);
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "meadow",
            x: this.x,
            y: this.y,
            size: this.size,
            moisture: this.moisture,
            isCenter: this.isCenter
        }
    }
}

export default Meadow;