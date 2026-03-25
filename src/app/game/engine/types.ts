export enum GamePhase {
  LOBBY = 'lobby',
  DAY = 'day',
  NIGHT = 'night',
  GAME_OVER = 'game_over'
}

export enum Role {
  SURVIVOR = 'survivor',
  VAMPIRE = 'vampire'
}

export enum BuildingType {
  WALL = 'wall',
  ARROW_TOWER = 'arrow_tower',
  CANNON_TOWER = 'cannon_tower',
  GOLD_MINE = 'gold_mine',
  LUMBER_MILL = 'lumber_mill'
}

export enum TileType {
  GRASS = 0,
  BLOCKED = 1,
  SPAWN_SURVIVOR = 2,
  SPAWN_VAMPIRE = 3,
  RESOURCE_GOLD = 4,
  RESOURCE_WOOD = 5
}

export interface Position {
  x: number;
  y: number;
}

export interface TilePos {
  tx: number;
  ty: number;
}

export interface Entity {
  id: string;
  pos: Position;
  hp: number;
  maxHp: number;
}

export interface Player extends Entity {
  role: Role;
  speed: number;
  damage: number;
  gold: number;
  wood: number;
  targetPos: Position | null;
  isMoving: boolean;
  isDead: boolean;
  visionRange: number;
  // Vampire-specific
  abilities?: AbilityState[];
  kills?: number;
  isRaging?: boolean;
  rageTimer?: number;
  isStealthed?: boolean;
}

export interface Building extends Entity {
  type: BuildingType;
  tileX: number;
  tileY: number;
  ownerId: string;
  // Tower-specific
  range?: number;
  damage?: number;
  fireRate?: number;
  fireCooldown?: number;
  aoeRange?: number;
  target?: Entity | null;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  aoeRange?: number;
  sourceId: string;
  progress: number;
}

export interface AbilityState {
  name: string;
  cooldown: number;
  maxCooldown: number;
  active: boolean;
  duration: number;
  maxDuration: number;
}

export interface GameState {
  phase: GamePhase;
  dayCount: number;
  phaseTimer: number;
  players: Player[];
  buildings: Building[];
  projectiles: Projectile[];
  localPlayerId: string;
}

export interface BuildOption {
  type: BuildingType;
  name: string;
  goldCost: number;
  woodCost: number;
  icon: string;
  description: string;
}
