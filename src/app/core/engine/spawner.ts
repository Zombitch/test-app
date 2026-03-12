import { EnemyEntity, generateId } from './entity';
import { Vec2, vec2, randomRange } from './math-utils';
import { EnemyFamily, EnemyTier, ENEMY_DEFS, EnemyDef } from '../models/enemies.model';
import { SectorDef } from '../models/sectors.model';

export interface SpawnWave {
  enemies: EnemyFamily[];
  count: number;
  delay: number; // seconds before wave
}

/** Generate spawn waves for a sector */
export function generateWaves(sector: SectorDef, difficulty: number): SpawnWave[] {
  const waves: SpawnWave[] = [];
  const waveCount = 3 + Math.floor(difficulty * 2);

  for (let i = 0; i < waveCount; i++) {
    const family = sector.enemies[i % sector.enemies.length];
    const count = 3 + Math.floor(i * 1.5) + Math.floor(difficulty);
    waves.push({
      enemies: [family],
      count,
      delay: i === 0 ? 2 : 8 + i * 3,
    });
  }

  // Mixed wave at end
  waves.push({
    enemies: sector.enemies,
    count: 5 + Math.floor(difficulty * 3),
    delay: waves[waves.length - 1].delay + 10,
  });

  return waves;
}

/** Spawn enemies from a wave at given spawn points */
export function spawnWave(
  wave: SpawnWave,
  spawnPoints: Vec2[],
): EnemyEntity[] {
  const enemies: EnemyEntity[] = [];

  for (let i = 0; i < wave.count; i++) {
    const family = wave.enemies[i % wave.enemies.length];
    const def = ENEMY_DEFS[family];
    const spawnPoint = spawnPoints[i % spawnPoints.length];

    enemies.push(createEnemy(def, vec2(
      spawnPoint.x + randomRange(-30, 30),
      spawnPoint.y + randomRange(-30, 30),
    )));
  }

  return enemies;
}

/** Create a single enemy entity from definition */
export function createEnemy(def: EnemyDef, position: Vec2): EnemyEntity {
  return {
    id: generateId(),
    position: { ...position },
    previousPosition: { ...position },
    velocity: vec2(randomRange(-30, 30), randomRange(-30, 30)),
    size: def.size,
    active: true,
    family: def.family,
    health: def.health,
    maxHealth: def.health,
    damage: def.damage,
    speed: def.speed,
    behavior: def.behavior,
    fireTimer: randomRange(1, 3),
    fireRate: 0.5,
    marked: false,
    hidden: def.behavior === 'ambush',
    splitCount: def.behavior === 'split' ? 1 : 0,
    lootValue: tierLootValue(def.tier),
    color: def.color,
  };
}

/** Create a split copy of an enemy (for Virus behavior) */
export function splitEnemy(parent: EnemyEntity): EnemyEntity {
  return {
    ...parent,
    id: generateId(),
    position: vec2(parent.position.x + randomRange(-20, 20), parent.position.y + randomRange(-20, 20)),
    previousPosition: { ...parent.position },
    health: Math.floor(parent.maxHealth * 0.6),
    maxHealth: Math.floor(parent.maxHealth * 0.6),
    size: Math.max(8, parent.size - 2),
    splitCount: parent.splitCount - 1,
    lootValue: Math.floor(parent.lootValue * 0.5),
  };
}

function tierLootValue(tier: EnemyTier): number {
  switch (tier) {
    case EnemyTier.Fodder: return 2;
    case EnemyTier.Standard: return 5;
    case EnemyTier.Elite: return 10;
    case EnemyTier.MiniBoss: return 20;
    case EnemyTier.Boss: return 50;
  }
}
