import {
  GameState, GamePhase, Player, Building, Role, BuildingType,
  Position, TilePos, BuildOption, AbilityState
} from './types';
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  DAY_DURATION, NIGHT_DURATION,
  STARTING_GOLD, STARTING_WOOD,
  BASE_GOLD_INCOME, GOLD_MINE_INCOME, LUMBER_MILL_INCOME,
  SURVIVOR_HP, SURVIVOR_SPEED, SURVIVOR_DAMAGE,
  VAMPIRE_HP, VAMPIRE_SPEED, VAMPIRE_DAMAGE,
  VAMPIRE_DAY_SPEED, VAMPIRE_DAY_DAMAGE,
  ARROW_TOWER_COST, ARROW_TOWER_DAMAGE, ARROW_TOWER_RANGE,
  ARROW_TOWER_FIRE_RATE, ARROW_TOWER_HP,
  CANNON_TOWER_COST, CANNON_TOWER_COST_WOOD, CANNON_TOWER_DAMAGE,
  CANNON_TOWER_RANGE, CANNON_TOWER_FIRE_RATE, CANNON_TOWER_AOE, CANNON_TOWER_HP,
  WALL_COST, WALL_HP, GOLD_MINE_COST, GOLD_MINE_HP,
  LUMBER_MILL_COST, LUMBER_MILL_COST_WOOD, LUMBER_MILL_HP,
  BLINK_RANGE, BLINK_COOLDOWN,
  RAGE_DURATION, RAGE_COOLDOWN, RAGE_LIFESTEAL, RAGE_SPEED_MULT,
  SURVIVOR_VISION_DAY, SURVIVOR_VISION_NIGHT, VAMPIRE_VISION,
  INFECTION_DELAY
} from './constants';
import { GameMap } from '../map/game-map';
import { CombatSystem } from '../systems/combat';
import { Pathfinding } from '../systems/pathfinding';

export class GameEngine {
  state: GameState;
  map: GameMap;
  private aiTimer = 0;
  private infectionQueue: { playerId: string; timer: number }[] = [];
  private occupiedTiles = new Set<string>();

  buildOptions: BuildOption[] = [
    { type: BuildingType.WALL, name: 'Wall', goldCost: WALL_COST, woodCost: 0, icon: '🧱', description: 'Blocks movement' },
    { type: BuildingType.ARROW_TOWER, name: 'Arrow Tower', goldCost: ARROW_TOWER_COST, woodCost: 0, icon: '🏹', description: 'Fast single-target' },
    { type: BuildingType.CANNON_TOWER, name: 'Cannon Tower', goldCost: CANNON_TOWER_COST, woodCost: CANNON_TOWER_COST_WOOD, icon: '💣', description: 'AoE damage' },
    { type: BuildingType.GOLD_MINE, name: 'Gold Mine', goldCost: GOLD_MINE_COST, woodCost: 0, icon: '⛏️', description: '+5 gold/sec' },
    { type: BuildingType.LUMBER_MILL, name: 'Lumber Mill', goldCost: LUMBER_MILL_COST, woodCost: LUMBER_MILL_COST_WOOD, icon: '🪓', description: '+3 wood/sec' },
  ];

  constructor() {
    this.map = new GameMap();
    this.state = {
      phase: GamePhase.LOBBY,
      dayCount: 0,
      phaseTimer: 0,
      players: [],
      buildings: [],
      projectiles: [],
      localPlayerId: ''
    };
  }

  startGame(playerRole: Role, survivorCount: number): void {
    this.state.players = [];
    this.state.buildings = [];
    this.state.projectiles = [];

    // Create local player
    const spawnIdx = playerRole === Role.SURVIVOR ? 0 : 0;
    const spawn = playerRole === Role.SURVIVOR
      ? this.map.survivorSpawns[spawnIdx]
      : this.map.vampireSpawns[0];
    const spawnPos = this.map.tileToWorld(spawn.tx, spawn.ty);

    const localPlayer = this.createPlayer('player_local', playerRole, spawnPos);
    this.state.localPlayerId = localPlayer.id;
    this.state.players.push(localPlayer);

    if (playerRole === Role.VAMPIRE) {
      // Create AI survivors
      for (let i = 0; i < survivorCount && i < this.map.survivorSpawns.length; i++) {
        const sp = this.map.survivorSpawns[i];
        const pos = this.map.tileToWorld(sp.tx, sp.ty);
        const ai = this.createPlayer(`survivor_${i}`, Role.SURVIVOR, pos);
        this.state.players.push(ai);
      }
    } else {
      // Create AI vampire
      const vsp = this.map.vampireSpawns[0];
      const vpos = this.map.tileToWorld(vsp.tx, vsp.ty);
      const aiVamp = this.createPlayer('vampire_ai', Role.VAMPIRE, vpos);
      this.state.players.push(aiVamp);

      // Create other AI survivors
      for (let i = 1; i < survivorCount && i < this.map.survivorSpawns.length; i++) {
        const sp = this.map.survivorSpawns[i];
        const pos = this.map.tileToWorld(sp.tx, sp.ty);
        const ai = this.createPlayer(`survivor_${i}`, Role.SURVIVOR, pos);
        this.state.players.push(ai);
      }
    }

    this.state.phase = GamePhase.DAY;
    this.state.dayCount = 1;
    this.state.phaseTimer = DAY_DURATION;
    this.rebuildOccupiedTiles();
  }

  private createPlayer(id: string, role: Role, pos: Position): Player {
    if (role === Role.SURVIVOR) {
      return {
        id, role, pos: { ...pos },
        hp: SURVIVOR_HP, maxHp: SURVIVOR_HP,
        speed: SURVIVOR_SPEED, damage: SURVIVOR_DAMAGE,
        gold: STARTING_GOLD, wood: STARTING_WOOD,
        targetPos: null, isMoving: false, isDead: false,
        visionRange: SURVIVOR_VISION_DAY
      };
    } else {
      return {
        id, role, pos: { ...pos },
        hp: VAMPIRE_HP, maxHp: VAMPIRE_HP,
        speed: VAMPIRE_SPEED, damage: VAMPIRE_DAMAGE,
        gold: 0, wood: 0,
        targetPos: null, isMoving: false, isDead: false,
        visionRange: VAMPIRE_VISION,
        kills: 0,
        isRaging: false,
        rageTimer: 0,
        isStealthed: false,
        abilities: [
          { name: 'Blink', cooldown: 0, maxCooldown: BLINK_COOLDOWN, active: false, duration: 0, maxDuration: 0 },
          { name: 'Rage', cooldown: 0, maxCooldown: RAGE_COOLDOWN, active: false, duration: 0, maxDuration: RAGE_DURATION }
        ]
      };
    }
  }

  update(dt: number): void {
    if (this.state.phase === GamePhase.LOBBY || this.state.phase === GamePhase.GAME_OVER) return;

    // Phase timer
    this.state.phaseTimer -= dt;
    if (this.state.phaseTimer <= 0) {
      this.togglePhase();
    }

    // Update vision
    this.updateVision();

    // Resource income for survivors
    this.updateResources(dt);

    // Move players
    this.updateMovement(dt);

    // Tower combat
    CombatSystem.updateTowers(this.state, dt);
    CombatSystem.updateProjectiles(this.state, dt);

    // Vampire melee combat
    this.updateVampireCombat(dt);

    // Ability timers
    this.updateAbilities(dt);

    // AI
    this.aiTimer += dt;
    if (this.aiTimer >= 0.5) {
      this.updateAI();
      this.aiTimer = 0;
    }

    // Infection queue
    this.updateInfections(dt);

    // Check win conditions
    this.checkWinConditions();

    // Clean dead buildings
    this.state.buildings = this.state.buildings.filter(b => b.hp > 0);
  }

  private togglePhase(): void {
    if (this.state.phase === GamePhase.DAY) {
      this.state.phase = GamePhase.NIGHT;
      this.state.phaseTimer = NIGHT_DURATION;
      // Update vampire stats for night
      for (const p of this.state.players) {
        if (p.role === Role.VAMPIRE && !p.isDead) {
          p.speed = VAMPIRE_SPEED;
          p.damage = VAMPIRE_DAMAGE;
        }
      }
    } else if (this.state.phase === GamePhase.NIGHT) {
      this.state.phase = GamePhase.DAY;
      this.state.dayCount++;
      this.state.phaseTimer = DAY_DURATION;
      // Weaken vampires during day
      for (const p of this.state.players) {
        if (p.role === Role.VAMPIRE && !p.isDead) {
          p.speed = VAMPIRE_DAY_SPEED;
          p.damage = VAMPIRE_DAY_DAMAGE;
        }
        // Restore survivor vision
        if (p.role === Role.SURVIVOR && !p.isDead) {
          p.visionRange = SURVIVOR_VISION_DAY;
        }
      }
    }
  }

  private updateVision(): void {
    for (const p of this.state.players) {
      if (p.isDead) continue;
      if (p.role === Role.SURVIVOR) {
        p.visionRange = this.state.phase === GamePhase.DAY ? SURVIVOR_VISION_DAY : SURVIVOR_VISION_NIGHT;
      }
    }
  }

  private updateResources(dt: number): void {
    for (const player of this.state.players) {
      if (player.isDead || player.role !== Role.SURVIVOR) continue;

      player.gold += BASE_GOLD_INCOME * dt;

      // Income from buildings
      for (const b of this.state.buildings) {
        if (b.ownerId !== player.id) continue;
        if (b.type === BuildingType.GOLD_MINE) {
          player.gold += GOLD_MINE_INCOME * dt;
        } else if (b.type === BuildingType.LUMBER_MILL) {
          player.wood += LUMBER_MILL_INCOME * dt;
        }
      }
    }
  }

  private updateMovement(dt: number): void {
    for (const player of this.state.players) {
      if (player.isDead || !player.targetPos) continue;

      const dx = player.targetPos.x - player.pos.x;
      const dy = player.targetPos.y - player.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3) {
        player.targetPos = null;
        player.isMoving = false;
        continue;
      }

      let speed = player.speed;
      if (player.isRaging) speed *= RAGE_SPEED_MULT;

      const move = speed * dt;
      const nx = player.pos.x + (dx / dist) * move;
      const ny = player.pos.y + (dy / dist) * move;

      // Collision check with map
      const tile = this.map.worldToTile(nx, ny);
      if (this.map.isWalkable(tile.tx, tile.ty) && !this.isBuildingAt(tile.tx, tile.ty)) {
        player.pos.x = nx;
        player.pos.y = ny;
        player.isMoving = true;
      } else {
        // Try sliding along axes
        const tileX = this.map.worldToTile(nx, player.pos.y);
        if (this.map.isWalkable(tileX.tx, tileX.ty) && !this.isBuildingAt(tileX.tx, tileX.ty)) {
          player.pos.x = nx;
        } else {
          const tileY = this.map.worldToTile(player.pos.x, ny);
          if (this.map.isWalkable(tileY.tx, tileY.ty) && !this.isBuildingAt(tileY.tx, tileY.ty)) {
            player.pos.y = ny;
          }
        }
      }
    }
  }

  private isBuildingAt(tx: number, ty: number): boolean {
    return this.occupiedTiles.has(`${tx},${ty}`);
  }

  private updateVampireCombat(dt: number): void {
    for (const vamp of this.state.players) {
      if (vamp.isDead || vamp.role !== Role.VAMPIRE) continue;

      // Attack nearby survivors
      for (const surv of this.state.players) {
        if (surv.isDead || surv.role !== Role.SURVIVOR) continue;
        const dist = CombatSystem.distance(vamp, surv);
        if (dist < TILE_SIZE * 1.2) {
          const dmg = CombatSystem.vampireAttack(vamp, surv, dt);
          surv.hp -= dmg;

          // Lifesteal
          if (vamp.isRaging) {
            vamp.hp = Math.min(vamp.maxHp, vamp.hp + dmg * RAGE_LIFESTEAL);
          }

          if (surv.hp <= 0) {
            this.killSurvivor(surv, vamp);
          }
        }
      }

      // Attack buildings
      for (const building of this.state.buildings) {
        if (building.hp <= 0) continue;
        const dist = CombatSystem.distance(vamp, building);
        if (dist < TILE_SIZE * 1.2) {
          building.hp -= vamp.damage * dt * 0.5;
          if (building.hp <= 0) {
            this.rebuildOccupiedTiles();
          }
        }
      }
    }
  }

  private killSurvivor(survivor: Player, killer: Player): void {
    survivor.isDead = true;
    survivor.hp = 0;
    killer.kills = (killer.kills || 0) + 1;

    // Power scaling for vampire
    killer.maxHp += 50;
    killer.hp += 50;
    killer.damage += 5;

    // Queue infection
    this.infectionQueue.push({ playerId: survivor.id, timer: INFECTION_DELAY });
  }

  private updateInfections(dt: number): void {
    const completed: string[] = [];

    for (const inf of this.infectionQueue) {
      inf.timer -= dt;
      if (inf.timer <= 0) {
        this.infectPlayer(inf.playerId);
        completed.push(inf.playerId);
      }
    }

    this.infectionQueue = this.infectionQueue.filter(i => !completed.includes(i.playerId));
  }

  private infectPlayer(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    player.role = Role.VAMPIRE;
    player.isDead = false;
    player.hp = VAMPIRE_HP * 0.6; // Weaker as newly turned
    player.maxHp = VAMPIRE_HP * 0.6;
    player.speed = VAMPIRE_SPEED * 0.8;
    player.damage = VAMPIRE_DAMAGE * 0.6;
    player.visionRange = VAMPIRE_VISION;
    player.kills = 0;
    player.isRaging = false;
    player.abilities = [
      { name: 'Blink', cooldown: 0, maxCooldown: BLINK_COOLDOWN, active: false, duration: 0, maxDuration: 0 },
      { name: 'Rage', cooldown: 0, maxCooldown: RAGE_COOLDOWN, active: false, duration: 0, maxDuration: RAGE_DURATION }
    ];

    // Spawn at map edge
    const spawn = this.map.vampireSpawns[Math.floor(Math.random() * this.map.vampireSpawns.length)];
    const pos = this.map.tileToWorld(spawn.tx, spawn.ty);
    player.pos = { ...pos };
  }

  private updateAbilities(dt: number): void {
    for (const player of this.state.players) {
      if (player.isDead || !player.abilities) continue;
      for (const ability of player.abilities) {
        if (ability.cooldown > 0) {
          ability.cooldown -= dt;
          if (ability.cooldown < 0) ability.cooldown = 0;
        }
        if (ability.active && ability.maxDuration > 0) {
          ability.duration -= dt;
          if (ability.duration <= 0) {
            ability.active = false;
            if (ability.name === 'Rage') {
              player.isRaging = false;
            }
          }
        }
      }
    }
  }

  private updateAI(): void {
    for (const player of this.state.players) {
      if (player.isDead || player.id === this.state.localPlayerId) continue;

      if (player.role === Role.SURVIVOR) {
        this.updateSurvivorAI(player);
      } else {
        this.updateVampireAI(player);
      }
    }
  }

  private updateSurvivorAI(survivor: Player): void {
    if (survivor.isMoving && survivor.targetPos) return;

    if (this.state.phase === GamePhase.DAY) {
      // Build defenses around spawn
      if (survivor.gold >= ARROW_TOWER_COST && Math.random() < 0.15) {
        const tile = this.map.worldToTile(survivor.pos.x, survivor.pos.y);
        const offsets = [
          { dx: -2, dy: 0 }, { dx: 2, dy: 0 },
          { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
          { dx: -1, dy: -1 }, { dx: 1, dy: 1 },
          { dx: -3, dy: 0 }, { dx: 0, dy: -3 },
        ];
        for (const off of offsets) {
          const bx = tile.tx + off.dx;
          const by = tile.ty + off.dy;
          if (this.canBuild(bx, by)) {
            if (Math.random() < 0.5) {
              this.placeBuildingAt(survivor, BuildingType.ARROW_TOWER, bx, by);
            } else if (survivor.gold >= WALL_COST) {
              this.placeBuildingAt(survivor, BuildingType.WALL, bx, by);
            }
            break;
          }
        }
      }

      // Wander near spawn
      if (!survivor.isMoving && Math.random() < 0.3) {
        const range = 3 * TILE_SIZE;
        survivor.targetPos = {
          x: survivor.pos.x + (Math.random() - 0.5) * range,
          y: survivor.pos.y + (Math.random() - 0.5) * range
        };
      }
    } else {
      // Night: flee from vampires
      const nearestVamp = this.findNearestVampire(survivor);
      if (nearestVamp) {
        const dist = CombatSystem.distance(survivor, nearestVamp);
        if (dist < TILE_SIZE * 6) {
          // Run away
          const dx = survivor.pos.x - nearestVamp.pos.x;
          const dy = survivor.pos.y - nearestVamp.pos.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          survivor.targetPos = {
            x: survivor.pos.x + (dx / len) * TILE_SIZE * 4,
            y: survivor.pos.y + (dy / len) * TILE_SIZE * 4
          };
        }
      }
    }
  }

  private updateVampireAI(vampire: Player): void {
    if (this.state.phase === GamePhase.DAY) {
      // Day: stay near edges, avoid towers
      if (!vampire.isMoving && Math.random() < 0.2) {
        const spawn = this.map.vampireSpawns[Math.floor(Math.random() * this.map.vampireSpawns.length)];
        const pos = this.map.tileToWorld(spawn.tx, spawn.ty);
        vampire.targetPos = { ...pos };
      }
      return;
    }

    // Night: hunt survivors
    const nearestSurvivor = this.findNearestSurvivor(vampire);
    if (nearestSurvivor) {
      vampire.targetPos = { x: nearestSurvivor.pos.x, y: nearestSurvivor.pos.y };

      // Use abilities
      const dist = CombatSystem.distance(vampire, nearestSurvivor);
      if (vampire.abilities) {
        // Use Blink to close distance
        if (dist > TILE_SIZE * 3 && dist < TILE_SIZE * BLINK_RANGE) {
          const blink = vampire.abilities.find(a => a.name === 'Blink');
          if (blink && blink.cooldown <= 0) {
            this.useAbility(vampire, 'Blink', nearestSurvivor.pos);
          }
        }
        // Use Rage when close
        if (dist < TILE_SIZE * 2) {
          const rage = vampire.abilities.find(a => a.name === 'Rage');
          if (rage && rage.cooldown <= 0 && !rage.active) {
            this.useAbility(vampire, 'Rage');
          }
        }
      }
    }
  }

  private findNearestVampire(from: Player): Player | null {
    let nearest: Player | null = null;
    let nearestDist = Infinity;
    for (const p of this.state.players) {
      if (p.isDead || p.role !== Role.VAMPIRE) continue;
      const dist = CombatSystem.distance(from, p);
      if (dist < nearestDist) {
        nearest = p;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  private findNearestSurvivor(from: Player): Player | null {
    let nearest: Player | null = null;
    let nearestDist = Infinity;
    for (const p of this.state.players) {
      if (p.isDead || p.role !== Role.SURVIVOR) continue;
      const dist = CombatSystem.distance(from, p);
      if (dist < nearestDist) {
        nearest = p;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  // Public APIs
  movePlayer(targetX: number, targetY: number): void {
    const player = this.getLocalPlayer();
    if (!player || player.isDead) return;
    player.targetPos = { x: targetX, y: targetY };
  }

  placeBuilding(type: BuildingType, tx: number, ty: number): boolean {
    const player = this.getLocalPlayer();
    if (!player || player.isDead || player.role !== Role.SURVIVOR) return false;
    return this.placeBuildingAt(player, type, tx, ty);
  }

  private placeBuildingAt(player: Player, type: BuildingType, tx: number, ty: number): boolean {
    if (!this.canBuild(tx, ty)) return false;

    const option = this.buildOptions.find(o => o.type === type);
    if (!option) return false;
    if (player.gold < option.goldCost || player.wood < option.woodCost) return false;

    let building: Building;
    const pos = this.map.tileToWorld(tx, ty);
    const id = `building_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    switch (type) {
      case BuildingType.WALL:
        building = { id, type, pos, tileX: tx, tileY: ty, ownerId: player.id, hp: WALL_HP, maxHp: WALL_HP };
        break;
      case BuildingType.ARROW_TOWER:
        building = {
          id, type, pos, tileX: tx, tileY: ty, ownerId: player.id,
          hp: ARROW_TOWER_HP, maxHp: ARROW_TOWER_HP,
          range: ARROW_TOWER_RANGE, damage: ARROW_TOWER_DAMAGE,
          fireRate: ARROW_TOWER_FIRE_RATE, fireCooldown: 0
        };
        break;
      case BuildingType.CANNON_TOWER:
        building = {
          id, type, pos, tileX: tx, tileY: ty, ownerId: player.id,
          hp: CANNON_TOWER_HP, maxHp: CANNON_TOWER_HP,
          range: CANNON_TOWER_RANGE, damage: CANNON_TOWER_DAMAGE,
          fireRate: CANNON_TOWER_FIRE_RATE, fireCooldown: 0,
          aoeRange: CANNON_TOWER_AOE
        };
        break;
      case BuildingType.GOLD_MINE:
        building = { id, type, pos, tileX: tx, tileY: ty, ownerId: player.id, hp: GOLD_MINE_HP, maxHp: GOLD_MINE_HP };
        break;
      case BuildingType.LUMBER_MILL:
        building = { id, type, pos, tileX: tx, tileY: ty, ownerId: player.id, hp: LUMBER_MILL_HP, maxHp: LUMBER_MILL_HP };
        break;
      default:
        return false;
    }

    player.gold -= option.goldCost;
    player.wood -= option.woodCost;
    this.state.buildings.push(building);
    this.map.tiles[ty][tx] = 1; // Mark as blocked
    this.occupiedTiles.add(`${tx},${ty}`);
    return true;
  }

  canBuild(tx: number, ty: number): boolean {
    return this.map.isBuildable(tx, ty) && !this.occupiedTiles.has(`${tx},${ty}`);
  }

  useAbility(player: Player, abilityName: string, targetPos?: Position): void {
    if (!player.abilities) return;
    const ability = player.abilities.find(a => a.name === abilityName);
    if (!ability || ability.cooldown > 0) return;

    switch (abilityName) {
      case 'Blink':
        if (targetPos) {
          const dx = targetPos.x - player.pos.x;
          const dy = targetPos.y - player.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = BLINK_RANGE * TILE_SIZE;
          if (dist <= maxDist) {
            const tile = this.map.worldToTile(targetPos.x, targetPos.y);
            if (this.map.isWalkable(tile.tx, tile.ty)) {
              player.pos = { ...targetPos };
            }
          } else {
            // Blink max distance in target direction
            player.pos.x += (dx / dist) * maxDist;
            player.pos.y += (dy / dist) * maxDist;
          }
        }
        ability.cooldown = ability.maxCooldown;
        break;

      case 'Rage':
        ability.active = true;
        ability.duration = ability.maxDuration;
        ability.cooldown = ability.maxCooldown;
        player.isRaging = true;
        break;
    }
  }

  useLocalAbility(index: number, targetPos?: Position): void {
    const player = this.getLocalPlayer();
    if (!player || player.isDead || player.role !== Role.VAMPIRE || !player.abilities) return;
    if (index >= player.abilities.length) return;
    this.useAbility(player, player.abilities[index].name, targetPos);
  }

  getLocalPlayer(): Player | null {
    return this.state.players.find(p => p.id === this.state.localPlayerId) || null;
  }

  private rebuildOccupiedTiles(): void {
    this.occupiedTiles.clear();
    for (const b of this.state.buildings) {
      if (b.hp > 0) {
        this.occupiedTiles.add(`${b.tileX},${b.tileY}`);
      }
    }
  }

  private checkWinConditions(): void {
    const survivors = this.state.players.filter(p => p.role === Role.SURVIVOR && !p.isDead);
    const vampires = this.state.players.filter(p => p.role === Role.VAMPIRE && !p.isDead);

    if (survivors.length === 0) {
      this.state.phase = GamePhase.GAME_OVER;
    }
    if (vampires.length === 0 && this.infectionQueue.length === 0) {
      this.state.phase = GamePhase.GAME_OVER;
    }
  }

  getVisibleTiles(player: Player): Set<string> {
    const visible = new Set<string>();
    const tile = this.map.worldToTile(player.pos.x, player.pos.y);
    const range = Math.ceil(player.visionRange);

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (dx * dx + dy * dy <= range * range) {
          visible.add(`${tile.tx + dx},${tile.ty + dy}`);
        }
      }
    }
    return visible;
  }

  getAlliedVisibleTiles(): Set<string> {
    const visible = new Set<string>();
    const localPlayer = this.getLocalPlayer();
    if (!localPlayer) return visible;

    for (const player of this.state.players) {
      if (player.isDead) continue;
      if (player.role === localPlayer.role) {
        const pv = this.getVisibleTiles(player);
        pv.forEach(v => visible.add(v));
      }
    }

    // Buildings also provide vision
    for (const b of this.state.buildings) {
      if (b.hp <= 0) continue;
      const owner = this.state.players.find(p => p.id === b.ownerId);
      if (owner && owner.role === localPlayer.role) {
        const range = 3;
        for (let dy = -range; dy <= range; dy++) {
          for (let dx = -range; dx <= range; dx++) {
            if (dx * dx + dy * dy <= range * range) {
              visible.add(`${b.tileX + dx},${b.tileY + dy}`);
            }
          }
        }
      }
    }

    return visible;
  }
}
