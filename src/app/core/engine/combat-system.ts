import {
  PlayerEntity, Projectile, EnemyEntity, LootDrop, generateId,
} from './entity';
import {
  Vec2, vec2, vec2Sub, vec2Normalize, vec2Scale, vec2Add,
  vec2Dist, vec2FromAngle, vec2Angle, circleOverlap,
  degToRad, randomRange,
} from './math-utils';
import { Weapon, WeaponId, WEAPONS } from '../models/weapons.model';
import { SkillId } from '../models/skills.model';
import { EnemyBehavior } from '../models/enemies.model';
import { GameMap, isWalkable } from './map-generator';

/** Fire the player's weapon toward the nearest enemy */
export function fireWeapon(
  player: PlayerEntity,
  enemies: EnemyEntity[],
  weapon: Weapon,
  dt: number,
): Projectile[] {
  player.fireTimer -= dt;
  if (player.fireTimer > 0) return [];

  player.fireTimer = 1 / weapon.fireRate;

  // Find nearest active enemy
  const target = findNearestEnemy(player.position, enemies, weapon.range);
  if (!target) return [];

  const baseAngle = vec2Angle(player.position, target.position);
  const projectiles: Projectile[] = [];

  for (let i = 0; i < weapon.projectileCount; i++) {
    const spreadOffset = weapon.projectileCount > 1
      ? degToRad(-weapon.spread / 2 + (weapon.spread / (weapon.projectileCount - 1)) * i)
      : 0;
    const angle = baseAngle + spreadOffset;
    const dir = vec2FromAngle(angle);

    const proj: Projectile = {
      id: generateId(),
      position: { ...player.position },
      previousPosition: { ...player.position },
      velocity: vec2Scale(dir, weapon.projectileSpeed),
      size: 3,
      active: true,
      damage: weapon.baseDamage,
      speed: weapon.projectileSpeed,
      lifetime: 0,
      maxLifetime: weapon.range / weapon.projectileSpeed,
      piercing: weapon.piercing,
      isPlayerProjectile: true,
      marksTarget: weapon.id === WeaponId.Antivirus,
    };
    projectiles.push(proj);
  }

  return projectiles;
}

/** Update all projectiles */
export function updateProjectiles(projectiles: Projectile[], dt: number, map: GameMap): void {
  for (const p of projectiles) {
    if (!p.active) continue;
    p.previousPosition = { ...p.position };
    p.position.x += p.velocity.x * dt;
    p.position.y += p.velocity.y * dt;
    p.lifetime += dt;

    if (p.lifetime >= p.maxLifetime || !isWalkable(map, p.position.x, p.position.y)) {
      p.active = false;
    }
  }
}

/** Check projectile-enemy collisions */
export function checkProjectileEnemyCollisions(
  projectiles: Projectile[],
  enemies: EnemyEntity[],
): { enemy: EnemyEntity; damage: number; marked: boolean }[] {
  const hits: { enemy: EnemyEntity; damage: number; marked: boolean }[] = [];

  for (const p of projectiles) {
    if (!p.active || !p.isPlayerProjectile) continue;
    for (const e of enemies) {
      if (!e.active) continue;
      if (circleOverlap(p.position, p.size, e.position, e.size)) {
        const dmg = e.marked ? Math.floor(p.damage * 1.5) : p.damage;
        hits.push({ enemy: e, damage: dmg, marked: p.marksTarget });
        if (!p.piercing) {
          p.active = false;
        }
        break;
      }
    }
  }

  return hits;
}

/** Check enemy projectile-player collisions */
export function checkProjectilePlayerCollisions(
  projectiles: Projectile[],
  player: PlayerEntity,
): number {
  if (player.invulnerable) return 0;
  let totalDamage = 0;

  for (const p of projectiles) {
    if (!p.active || p.isPlayerProjectile) continue;
    if (circleOverlap(p.position, p.size, player.position, player.size)) {
      totalDamage += p.damage;
      p.active = false;
    }
  }

  return totalDamage;
}

/** Check enemy-player contact damage */
export function checkEnemyPlayerCollisions(
  enemies: EnemyEntity[],
  player: PlayerEntity,
  dt: number,
): number {
  if (player.invulnerable) return 0;
  let totalDamage = 0;

  for (const e of enemies) {
    if (!e.active || e.hidden) continue;
    if (circleOverlap(e.position, e.size, player.position, player.size)) {
      totalDamage += e.damage * dt;
    }
  }

  return totalDamage;
}

/** Update enemy AI */
export function updateEnemies(
  enemies: EnemyEntity[],
  player: PlayerEntity,
  dt: number,
  map: GameMap,
): Projectile[] {
  const newProjectiles: Projectile[] = [];

  for (const e of enemies) {
    if (!e.active) continue;
    e.previousPosition = { ...e.position };

    const dist = vec2Dist(e.position, player.position);
    const dirToPlayer = vec2Normalize(vec2Sub(player.position, e.position));

    switch (e.behavior) {
      case EnemyBehavior.Rush:
        moveToward(e, player.position, e.speed * dt, map);
        break;

      case EnemyBehavior.Orbit:
        if (dist > 150) {
          moveToward(e, player.position, e.speed * dt, map);
        } else {
          const perpAngle = vec2Angle(e.position, player.position) + Math.PI / 2;
          const perpDir = vec2FromAngle(perpAngle);
          tryMove(e, vec2Scale(perpDir, e.speed * dt), map);
        }
        break;

      case EnemyBehavior.Patrol:
        // Simple patrol: move in direction, reverse at walls
        tryMove(e, vec2Scale(e.velocity, dt), map);
        if (!isWalkable(map, e.position.x + e.velocity.x * 0.5, e.position.y + e.velocity.y * 0.5)) {
          e.velocity.x *= -1;
          e.velocity.y *= -1;
        }
        if (dist < 200) {
          moveToward(e, player.position, e.speed * 0.5 * dt, map);
        }
        break;

      case EnemyBehavior.Ambush:
        if (dist < 150 && e.hidden) {
          e.hidden = false;
        }
        if (!e.hidden) {
          moveToward(e, player.position, e.speed * 1.2 * dt, map);
        }
        break;

      case EnemyBehavior.Ranged:
        if (dist < 120) {
          // Move away
          tryMove(e, vec2Scale(dirToPlayer, -e.speed * dt), map);
        } else if (dist > 250) {
          moveToward(e, player.position, e.speed * dt, map);
        }
        // Shoot
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && dist < 300) {
          e.fireTimer = 1 / e.fireRate;
          const proj: Projectile = {
            id: generateId(),
            position: { ...e.position },
            previousPosition: { ...e.position },
            velocity: vec2Scale(dirToPlayer, 200),
            size: 4,
            active: true,
            damage: e.damage,
            speed: 200,
            lifetime: 0,
            maxLifetime: 2,
            piercing: false,
            isPlayerProjectile: false,
            marksTarget: false,
          };
          newProjectiles.push(proj);
        }
        break;

      case EnemyBehavior.Block:
        // Slowly approach, don't chase aggressively
        if (dist > 80) {
          moveToward(e, player.position, e.speed * 0.5 * dt, map);
        }
        break;

      case EnemyBehavior.Steal:
        // Move toward player fast, then flee
        if (dist > 100) {
          moveToward(e, player.position, e.speed * dt, map);
        } else {
          tryMove(e, vec2Scale(dirToPlayer, -e.speed * 1.5 * dt), map);
        }
        break;

      case EnemyBehavior.Split:
      default:
        moveToward(e, player.position, e.speed * dt, map);
        break;
    }
  }

  return newProjectiles;
}

/** Generate loot from a killed enemy */
export function generateLoot(enemy: EnemyEntity): LootDrop[] {
  const drops: LootDrop[] = [];
  const types = ['cpu', 'ram', 'gpu', 'data'];

  // Higher tier enemies drop more
  const dropCount = Math.ceil(enemy.lootValue / 3);

  for (let i = 0; i < dropCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    drops.push({
      id: generateId(),
      position: vec2(
        enemy.position.x + randomRange(-15, 15),
        enemy.position.y + randomRange(-15, 15),
      ),
      previousPosition: { ...enemy.position },
      velocity: vec2(randomRange(-50, 50), randomRange(-50, 50)),
      size: 4,
      active: true,
      resourceType: type,
      amount: Math.ceil(enemy.lootValue / dropCount),
      magnetTimer: 0,
    });
  }

  // Bitcoin chance from special enemies
  if (enemy.family === 'ransom-node' || Math.random() < 0.1) {
    drops.push({
      id: generateId(),
      position: { ...enemy.position },
      previousPosition: { ...enemy.position },
      velocity: vec2(randomRange(-30, 30), randomRange(-30, 30)),
      size: 5,
      active: true,
      resourceType: 'bitcoin',
      amount: Math.ceil(enemy.lootValue * 0.5),
      magnetTimer: 0,
    });
  }

  return drops;
}

/** Update loot drops (magnet toward player) */
export function updateLoot(
  drops: LootDrop[],
  player: PlayerEntity,
  magnetRadius: number,
  dt: number,
): LootDrop[] {
  const collected: LootDrop[] = [];

  for (const d of drops) {
    if (!d.active) continue;
    d.previousPosition = { ...d.position };

    const dist = vec2Dist(d.position, player.position);

    if (dist < player.size + d.size) {
      d.active = false;
      collected.push(d);
      continue;
    }

    // Magnetic pull
    if (dist < magnetRadius) {
      const dir = vec2Normalize(vec2Sub(player.position, d.position));
      const pullSpeed = 300 * (1 - dist / magnetRadius);
      d.position.x += dir.x * pullSpeed * dt;
      d.position.y += dir.y * pullSpeed * dt;
    } else {
      // Slow down initial velocity
      d.velocity.x *= 0.95;
      d.velocity.y *= 0.95;
      d.position.x += d.velocity.x * dt;
      d.position.y += d.velocity.y * dt;
    }
  }

  return collected;
}

/** Apply skill effect */
export function applySkill(
  skillId: SkillId,
  player: PlayerEntity,
  enemies: EnemyEntity[],
  projectiles: Projectile[],
): void {
  switch (skillId) {
    case SkillId.Blink:
      // Teleport forward in movement direction
      const blinkDist = 100;
      const dir = vec2Normalize(player.velocity);
      const newX = player.position.x + dir.x * blinkDist;
      const newY = player.position.y + dir.y * blinkDist;
      player.position = vec2(newX, newY);
      player.invulnerable = true;
      player.invulnerableTimer = 0.3;
      break;

    case SkillId.NullField:
      // Slow all enemy projectiles
      for (const p of projectiles) {
        if (!p.isPlayerProjectile && p.active) {
          p.velocity.x *= 0.3;
          p.velocity.y *= 0.3;
        }
      }
      break;

    case SkillId.ColdReboot:
      player.shield = 50;
      player.invulnerable = true;
      player.invulnerableTimer = 2;
      break;

    case SkillId.Overclock:
      player.fireTimer = 0;
      break;

    case SkillId.ScrubWave:
      for (const e of enemies) {
        if (!e.active) continue;
        const dist = vec2Dist(player.position, e.position);
        if (dist < 150 && e.health <= 20) {
          e.health = 0;
          e.active = false;
        }
      }
      break;

    case SkillId.TracePull:
      // Handled in loot update via increased magnet radius
      break;
  }
}

// Helpers

function findNearestEnemy(pos: Vec2, enemies: EnemyEntity[], range: number): EnemyEntity | null {
  let nearest: EnemyEntity | null = null;
  let nearestDist = range;

  for (const e of enemies) {
    if (!e.active || e.hidden) continue;
    const d = vec2Dist(pos, e.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = e;
    }
  }

  return nearest;
}

function moveToward(e: EnemyEntity, target: Vec2, amount: number, map: GameMap): void {
  const dir = vec2Normalize(vec2Sub(target, e.position));
  tryMove(e, vec2Scale(dir, amount), map);
}

function tryMove(e: EnemyEntity, delta: Vec2, map: GameMap): void {
  const newX = e.position.x + delta.x;
  const newY = e.position.y + delta.y;
  if (isWalkable(map, newX, e.position.y)) e.position.x = newX;
  if (isWalkable(map, e.position.x, newY)) e.position.y = newY;
}
