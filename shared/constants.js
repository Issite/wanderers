export const MAP_HEIGHT = 8192;
export const MAP_WIDTH = 8192;
export const MEADOW_BASE_SIZE = 3;
export const MEADOW_SIZE_FACTOR = 50;
export const MAX_MOVE_SPEED = 150;
export const INTERACTION_DISTANCE = 250;
export const TASKS = {
    "fight": { priority: 0, cooldownTime: 2 },
    "chop tree": { priority: 10, cooldownTime: 2 },
    "break rock": { priority: 10, cooldownTime: 2 },
    "cut grass": { priority: 10, cooldownTime: 2 },
    "pick mushroom": { priority: 15, cooldownTime: 1 },
    "pickup resource": { priority: 20, cooldownTime: 1 },
    "idle": { priority: 99, cooldownTime: 0 }
};
export const TEAM_COLORS = ["#705429ff", "#9a2222ff", "#4e2c00ff", "#4363d8ff", "#22ca0fff", "#e4da23ff", "#e1ffffff"];
