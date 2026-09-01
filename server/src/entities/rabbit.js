import Entity from "./entity.js";
import Grass from "./grass.js";
import { RABBIT_MOVE_SPEED } from "../../../shared/constants.js";

export default class Rabbit extends Entity {
    constructor(id, x, y, health = 2, target = null) {
        super(id, x, y);
        this.health = health;
        this.target = target;
        this.cooldown = 3000;
    }

    setTarget(target) {
        this.target = target;
    }

    update(gameManager) {
        if (!this.target) {
            // Find nearby grass to target
            const newTarget = this.findNearbyGrass(gameManager);
            if (newTarget) {
                this.setTarget(newTarget.id);
            }
        }
        if (this.target) {
            const targetEntity = gameManager.entities.get(this.target);
            if (targetEntity) {
                const dx = targetEntity.x - this.x;
                const dy = targetEntity.y - this.y;
                const distance = Math.hypot(dx, dy);
                if (distance > 1) { // Avoid jittering when very close
                    const moveX = (dx / distance) * RABBIT_MOVE_SPEED * (gameManager.deltaTime / 1000);
                    const moveY = (dy / distance) * RABBIT_MOVE_SPEED * (gameManager.deltaTime / 1000);
                    this.x += moveX;
                    this.y += moveY;
                } else { // Reached the grass
                    this.x = targetEntity.x;
                    this.y = targetEntity.y;
                    this.cooldown -= gameManager.deltaTime;
                    if (this.cooldown <= 0) {
                        this.cooldown = 3000;
                        gameManager.entities.delete(targetEntity.id); // Eat the grass
                        this.setTarget(null); // Find a new target
                    }
                }
            }
        }
    }

    findNearbyGrass(gameManager) {
        let closestGrass = null;
        for (const entity of gameManager.entities.values()) {
            if (entity && entity.constructor.name === "Grass") {
                const dx = entity.x - this.x;
                const dy = entity.y - this.y;
                const distance = Math.hypot(dx, dy);
                if (!closestGrass || distance < closestGrass.distance) {
                    closestGrass = { id: entity.id, distance };
                }
            }
        }
        return closestGrass;
    }

    toJSON() {
        return {
            id: this.id,
            entityType: "rabbit",
            x: this.x,
            y: this.y
        }
    }
}