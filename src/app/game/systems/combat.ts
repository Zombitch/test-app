import { Building, Player, Projectile, Entity, GameState } from '../engine/types';
import { TILE_SIZE } from '../engine/constants';

export class CombatSystem {

  static updateTowers(state: GameState, dt: number): void {
    const vampires = state.players.filter(p => p.role === 'vampire' && !p.isDead);

    for (const building of state.buildings) {
      if (!building.range || !building.damage) continue;
      if (building.hp <= 0) continue;

      // Update cooldown
      if (building.fireCooldown && building.fireCooldown > 0) {
        building.fireCooldown -= dt;
        continue;
      }

      // Find target
      const target = this.findTarget(building, vampires);
      if (!target) continue;

      // Fire projectile
      const projId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      state.projectiles.push({
        id: projId,
        x: building.pos.x,
        y: building.pos.y,
        targetX: target.pos.x,
        targetY: target.pos.y,
        speed: 300,
        damage: building.damage,
        aoeRange: building.aoeRange,
        sourceId: building.id,
        progress: 0
      });

      building.fireCooldown = 1 / (building.fireRate || 1);
    }
  }

  static updateProjectiles(state: GameState, dt: number): void {
    const toRemove: string[] = [];

    for (const proj of state.projectiles) {
      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Hit
        this.applyDamage(state, proj);
        toRemove.push(proj.id);
      } else {
        const move = proj.speed * dt;
        proj.x += (dx / dist) * move;
        proj.y += (dy / dist) * move;
        proj.progress += move;

        // Safety: remove if traveled too far
        if (proj.progress > 500) {
          toRemove.push(proj.id);
        }
      }
    }

    state.projectiles = state.projectiles.filter(p => !toRemove.includes(p.id));
  }

  private static findTarget(tower: Building, enemies: Player[]): Player | null {
    const range = (tower.range || 0) * TILE_SIZE;
    let closest: Player | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      const dx = enemy.pos.x - tower.pos.x;
      const dy = enemy.pos.y - tower.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= range && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    return closest;
  }

  private static applyDamage(state: GameState, proj: Projectile): void {
    if (proj.aoeRange) {
      // AoE damage
      const aoePixels = proj.aoeRange * TILE_SIZE;
      for (const player of state.players) {
        if (player.isDead) continue;
        if (player.role !== 'vampire') continue;
        const dx = player.pos.x - proj.targetX;
        const dy = player.pos.y - proj.targetY;
        if (Math.sqrt(dx * dx + dy * dy) <= aoePixels) {
          player.hp -= proj.damage;
        }
      }
    } else {
      // Single target - find nearest vampire at target location
      let nearest: Player | null = null;
      let nearestDist = Infinity;
      for (const player of state.players) {
        if (player.isDead || player.role !== 'vampire') continue;
        const dx = player.pos.x - proj.targetX;
        const dy = player.pos.y - proj.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearest = player;
          nearestDist = dist;
        }
      }
      if (nearest && nearestDist < TILE_SIZE * 2) {
        nearest.hp -= proj.damage;
      }
    }
  }

  static vampireAttack(vampire: Player, target: Player | Building, dt: number): number {
    if (!vampire.isRaging) {
      return vampire.damage * dt;
    }
    return vampire.damage * dt * 1.5;
  }

  static distance(a: Entity, b: Entity): number {
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
