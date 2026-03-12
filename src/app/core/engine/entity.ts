import { Vec2, vec2 } from './math-utils';

/** Base entity for all game objects */
export interface Entity {
  id: number;
  position: Vec2;
  previousPosition: Vec2;
  velocity: Vec2;
  size: number;
  active: boolean;
}

/** Player entity */
export interface PlayerEntity extends Entity {
  health: number;
  maxHealth: number;
  shield: number;
  speed: number;
  invulnerable: boolean;
  invulnerableTimer: number;
  fireTimer: number;
  skillCooldown: number;
  killCharge: number; // for Reset weapon
  damageStreak: number; // for Security Loader
}

/** Projectile (player or enemy) */
export interface Projectile extends Entity {
  damage: number;
  speed: number;
  lifetime: number;
  maxLifetime: number;
  piercing: boolean;
  isPlayerProjectile: boolean;
  marksTarget: boolean; // for Antivirus
}

/** Enemy entity */
export interface EnemyEntity extends Entity {
  family: string;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  behavior: string;
  fireTimer: number;
  fireRate: number;
  marked: boolean; // Antivirus mark
  hidden: boolean; // Rootkit stealth
  splitCount: number;
  lootValue: number;
  color: string;
}

/** Loot drop */
export interface LootDrop extends Entity {
  resourceType: string;
  amount: number;
  magnetTimer: number;
}

let nextId = 1;

export function createPlayerId(): number {
  return 0;
}

export function generateId(): number {
  return nextId++;
}

export function createPlayerEntity(): PlayerEntity {
  return {
    id: createPlayerId(),
    position: vec2(0, 0),
    previousPosition: vec2(0, 0),
    velocity: vec2(0, 0),
    size: 14,
    active: true,
    health: 100,
    maxHealth: 100,
    shield: 0,
    speed: 200,
    invulnerable: false,
    invulnerableTimer: 0,
    fireTimer: 0,
    skillCooldown: 0,
    killCharge: 0,
    damageStreak: 0,
  };
}
