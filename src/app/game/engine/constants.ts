// Game constants
export const TILE_SIZE = 32;
export const MAP_WIDTH = 64;
export const MAP_HEIGHT = 64;
export const MAP_PIXEL_WIDTH = MAP_WIDTH * TILE_SIZE;
export const MAP_PIXEL_HEIGHT = MAP_HEIGHT * TILE_SIZE;

// Phase durations in seconds
export const DAY_DURATION = 180;
export const NIGHT_DURATION = 120;

// Starting resources
export const STARTING_GOLD = 200;
export const STARTING_WOOD = 100;

// Passive income per second
export const BASE_GOLD_INCOME = 2;
export const GOLD_MINE_INCOME = 5;
export const LUMBER_MILL_INCOME = 3;

// Survivor stats
export const SURVIVOR_HP = 100;
export const SURVIVOR_SPEED = 80; // pixels per second
export const SURVIVOR_DAMAGE = 5;

// Vampire stats
export const VAMPIRE_HP = 500;
export const VAMPIRE_SPEED = 120;
export const VAMPIRE_DAMAGE = 40;
export const VAMPIRE_DAY_SPEED = 60;
export const VAMPIRE_DAY_DAMAGE = 15;

// Tower stats
export const ARROW_TOWER_COST = 50;
export const ARROW_TOWER_DAMAGE = 15;
export const ARROW_TOWER_RANGE = 4; // tiles
export const ARROW_TOWER_FIRE_RATE = 1; // shots per second
export const ARROW_TOWER_HP = 200;

export const CANNON_TOWER_COST = 100;
export const CANNON_TOWER_COST_WOOD = 25;
export const CANNON_TOWER_DAMAGE = 40;
export const CANNON_TOWER_RANGE = 3;
export const CANNON_TOWER_FIRE_RATE = 0.5;
export const CANNON_TOWER_AOE = 1.5; // tiles
export const CANNON_TOWER_HP = 300;

export const WALL_COST = 10;
export const WALL_HP = 500;

export const GOLD_MINE_COST = 75;
export const GOLD_MINE_HP = 150;

export const LUMBER_MILL_COST = 75;
export const LUMBER_MILL_COST_WOOD = 25;
export const LUMBER_MILL_HP = 150;

// Vampire abilities
export const BLINK_RANGE = 5; // tiles
export const BLINK_COOLDOWN = 8; // seconds
export const RAGE_DURATION = 5; // seconds
export const RAGE_COOLDOWN = 20; // seconds
export const RAGE_LIFESTEAL = 0.3; // 30%
export const RAGE_SPEED_MULT = 1.5;

// Infection
export const INFECTION_DELAY = 3; // seconds

// Vision
export const SURVIVOR_VISION_DAY = 8; // tiles
export const SURVIVOR_VISION_NIGHT = 4;
export const VAMPIRE_VISION = 10;

// Colors
export const COLOR_GRASS = '#2d5a1e';
export const COLOR_GRASS_ALT = '#2a5319';
export const COLOR_SURVIVOR = '#3498db';
export const COLOR_VAMPIRE = '#e74c3c';
export const COLOR_WALL = '#7f8c8d';
export const COLOR_ARROW_TOWER = '#2ecc71';
export const COLOR_CANNON_TOWER = '#e67e22';
export const COLOR_GOLD_MINE = '#f1c40f';
export const COLOR_LUMBER_MILL = '#8b4513';
export const COLOR_HP_BAR = '#27ae60';
export const COLOR_HP_BAR_BG = '#c0392b';
export const COLOR_NIGHT_OVERLAY = 'rgba(0, 0, 20, 0.6)';
export const COLOR_FOG = 'rgba(0, 0, 20, 0.85)';
