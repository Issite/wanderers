import Entity from "./entity.js";
import { RABBIT_MOVE_SPEED } from "../../../shared/constants.js";

export default class Rabbit extends Entity {
    constructor(id, x, y, health = 2, target = null) {
        super(id, x, y);
        this.health = health;
        this.target = target;
        this.cooldown = 5;
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
                    const maxDistance = RABBIT_MOVE_SPEED * gameManager.deltaTime;
                    if (distance <= maxDistance) {
                        this.x = targetEntity.x;
                        this.y = targetEntity.y;
                    } else {
                        const moveX = (dx / distance) * maxDistance;
                        const moveY = (dy / distance) * maxDistance;
                        this.x += moveX;
                        this.y += moveY;
                    }
                } else { // Reached the grass
                    this.x = targetEntity.x;
                    this.y = targetEntity.y;
                    this.cooldown -= gameManager.deltaTime;
                    if (this.cooldown <= 0) {
                        this.cooldown = 5;
                        gameManager.entities.delete(targetEntity.id); // Eat the grass
                        this.setTarget(null); // Find a new target
                    }
                }
            } else {
                this.setTarget(null); // Target no longer exists, find a new one
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