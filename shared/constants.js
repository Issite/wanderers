export const MAP_HEIGHT = 8192;
export const MAP_WIDTH = 8192;
export const RABBIT_MOVE_SPEED = 100;
export const TARGET_RABBIT_POPULATION = 16;
export const MEADOW_BASE_SIZE = 3;
export const MEADOW_SIZE_FACTOR = 50;
export const CLOUD_SPEED = 50;
export const CLOUD_RAIN_TIME = 5;
export const CLOUD_COUNT = 2;
export const MAX_MOVE_SPEED = 150;
export const INTERACTION_DISTANCE = 250;
export const TASKS = {
    "fight": { priority: 0, cooldownTime: 2 },
    "panic": { priority: 1, cooldownTime: 0.5 },
    "chop tree": { priority: 10, cooldownTime: 2 },
    "break rock": { priority: 10, cooldownTime: 2 },
    "cut grass": { priority: 10, cooldownTime: 2 },
    "pick mushroom": { priority: 15, cooldownTime: 1 },
    "pickup resource": { priority: 20, cooldownTime: 1 },
    "collect crate": { priority: 20, cooldownTime: 1 },
    "idle": { priority: 99, cooldownTime: 0 }
};
export const TRIBESMAN_ATTACK_PRIORITIES = {
    "sword": 0,
    "axe": 1,
    "hammer": 1,
    "scythe": 1,
    "dagger": 1,
    "bow": 2,
    "none": 3
};
export const TOOL_ATTACK_COOLDOWNS = {
    "sword": 2,
    "axe": 4,
    "hammer": 4,
    "scythe": 4,
    "dagger": 2,
    "bow": 5,
    "none": 0.5 // Shouldn't ever be referenced, but just in case
};
export const DROPPED_RESOURCE_AVOID_TIME = 5;
export const TEAM_COLORS = ["#705429ff", "#9a2222ff", "#4e2c00ff", "#4363d8ff", "#22ca0fff", "#e4da23ff", "#e1ffffff"];
