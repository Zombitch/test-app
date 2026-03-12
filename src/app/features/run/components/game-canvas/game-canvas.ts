import {
  Component, ElementRef, OnInit, OnDestroy,
  inject, viewChild, signal,
} from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';
import { AriaService } from '../../../../core/services/aria.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { RunOutcome } from '../../../../core/models/game-state.model';
import { WEAPONS } from '../../../../core/models/weapons.model';
import { SKILLS } from '../../../../core/models/skills.model';
import { SECTOR_DEFS } from '../../../../core/models/sectors.model';
import { ResourceType } from '../../../../core/models/resources.model';

import { GameLoop } from '../../../../core/engine/game-loop';
import { Renderer } from '../../../../core/engine/renderer';
import { InputHandler } from '../../../../core/engine/input-handler';
import {
  PlayerEntity, Projectile, EnemyEntity, LootDrop,
  createPlayerEntity,
} from '../../../../core/engine/entity';
import { GameMap, generateMap, isWalkable, TILE_SIZE } from '../../../../core/engine/map-generator';
import {
  fireWeapon, updateProjectiles,
  checkProjectileEnemyCollisions, checkProjectilePlayerCollisions,
  checkEnemyPlayerCollisions, updateEnemies,
  generateLoot, updateLoot, applySkill,
} from '../../../../core/engine/combat-system';
import { generateWaves, spawnWave, splitEnemy, SpawnWave } from '../../../../core/engine/spawner';
import { vec2Dist, vec2, clamp } from '../../../../core/engine/math-utils';

import { HudComponent } from '../hud/hud';
import { SkillButtonComponent } from '../skill-button/skill-button';
import { TouchControlsComponent } from '../touch-controls/touch-controls';

@Component({
  selector: 'app-game-canvas',
  imports: [HudComponent, SkillButtonComponent, TouchControlsComponent],
  template: `
    <div class="game-container">
      <canvas #gameCanvas class="game-canvas"></canvas>

      @if (features.isEnabled('hud')) {
        <app-hud />
      }

      @if (features.isEnabled('touchControls')) {
        <app-touch-controls [inputHandler]="input" />
      }

      @if (features.isEnabled('skillSlot')) {
        <div class="game-skill safe-area-bottom">
          <app-skill-button
            [skill]="currentSkill()"
            [cooldownPercent]="skillCooldownPct()"
            (activated)="onSkillActivated()" />
        </div>
      }

      <!-- Extraction prompt -->
      @if (features.isEnabled('extractionDecision') && showExtraction()) {
        <div class="extraction-prompt">
          <p>Extraction point reached.</p>
          <div class="extraction-prompt__actions">
            <button class="btn btn--success" (click)="extract()">Extract</button>
            <button class="btn" (click)="dismissExtraction()">Push deeper</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-container {
      position: relative;
      width: 100%;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background: #2E3440;
    }
    .game-canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    .game-skill {
      position: absolute;
      bottom: 24px;
      right: 24px;
      z-index: 10;
    }
    .extraction-prompt {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(59, 66, 82, 0.95);
      border: 1px solid #88C0D0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      z-index: 20;
      animation: fadeIn 0.3s ease;
    }
    .extraction-prompt p {
      font-size: 0.9rem;
      margin-bottom: 12px;
      color: #A3BE8C;
    }
    .extraction-prompt__actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  `],
})
export class GameCanvasComponent implements OnInit, OnDestroy {
  private readonly gameState = inject(GameStateService);
  private readonly ariaService = inject(AriaService);
  readonly features = inject(FeatureFlagService);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gameCanvas');

  readonly input = new InputHandler();
  readonly showExtraction = signal(false);
  readonly skillCooldownPct = signal(100);

  // Engine
  private gameLoop!: GameLoop;
  private renderer!: Renderer;
  private map!: GameMap;

  // Entities
  private player!: PlayerEntity;
  private playerProjectiles: Projectile[] = [];
  private enemyProjectiles: Projectile[] = [];
  private enemies: EnemyEntity[] = [];
  private lootDrops: LootDrop[] = [];

  // Waves
  private waves: SpawnWave[] = [];
  private currentWaveIndex = 0;
  private waveTimer = 0;

  // State
  private runTime = 0;
  private extractionDismissed = false;
  private objectiveReached = false;

  currentSkill() {
    const run = this.gameState.currentRun();
    return SKILLS[run?.loadout.skillId ?? 'blink'];
  }

  ngOnInit(): void {
    const canvas = this.canvasRef().nativeElement;
    this.renderer = new Renderer(canvas);
    this.input.bind(canvas);

    const run = this.gameState.currentRun();
    if (!run) return;

    const sectorDef = SECTOR_DEFS[run.sectorId];

    // Generate map
    this.map = generateMap(sectorDef);

    // Init player
    this.player = createPlayerEntity();
    this.player.position = { ...this.map.spawnPoint };
    this.player.previousPosition = { ...this.map.spawnPoint };

    // Generate waves
    this.waves = generateWaves(sectorDef, 1);

    // ARIA message
    const msg = this.ariaService.generateRunStartMessage(sectorDef.name);
    this.ariaService.addMessage(msg);

    // Start game loop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (interp) => this.render(interp),
    );
    this.gameLoop.start();

    // Handle resize
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.gameLoop?.stop();
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) this.input.unbind(canvas);
    window.removeEventListener('resize', this.onResize);
  }

  onSkillActivated(): void {
    const run = this.gameState.currentRun();
    if (!run) return;
    const skill = SKILLS[run.loadout.skillId];
    applySkill(run.loadout.skillId, this.player, this.enemies, [...this.playerProjectiles, ...this.enemyProjectiles]);
    this.player.skillCooldown = skill.cooldown;
    this.skillCooldownPct.set(0);
  }

  extract(): void {
    this.gameState.endRun(RunOutcome.Extracted);
  }

  dismissExtraction(): void {
    this.extractionDismissed = true;
    this.showExtraction.set(false);
  }

  private update(dt: number): void {
    const run = this.gameState.currentRun();
    if (!run) return;

    this.runTime += dt;
    this.input.update();

    // Player movement
    this.player.previousPosition = { ...this.player.position };
    const moveX = this.player.position.x + this.input.movement.x * this.player.speed * dt;
    const moveY = this.player.position.y + this.input.movement.y * this.player.speed * dt;
    if (isWalkable(this.map, moveX, this.player.position.y)) {
      this.player.position.x = moveX;
    }
    if (isWalkable(this.map, this.player.position.x, moveY)) {
      this.player.position.y = moveY;
    }
    this.player.velocity = {
      x: this.input.movement.x * this.player.speed,
      y: this.input.movement.y * this.player.speed,
    };

    // Invulnerability timer
    if (this.player.invulnerable) {
      this.player.invulnerableTimer -= dt;
      if (this.player.invulnerableTimer <= 0) {
        this.player.invulnerable = false;
      }
    }

    // Skill cooldown
    if (this.player.skillCooldown > 0) {
      this.player.skillCooldown -= dt;
      const skill = SKILLS[run.loadout.skillId];
      const pct = ((skill.cooldown - this.player.skillCooldown) / skill.cooldown) * 100;
      this.skillCooldownPct.set(clamp(pct, 0, 100));
    }

    // Auto-fire
    if (this.features.isEnabled('autoFire')) {
      const weapon = WEAPONS[run.loadout.weaponId];
      const newProj = fireWeapon(this.player, this.enemies, weapon, dt);
      this.playerProjectiles.push(...newProj);
    }

    // Update projectiles
    updateProjectiles(this.playerProjectiles, dt, this.map);
    updateProjectiles(this.enemyProjectiles, dt, this.map);

    // Enemy AI
    if (this.features.isEnabled('enemies')) {
      const enemyProj = updateEnemies(this.enemies, this.player, dt, this.map);
      this.enemyProjectiles.push(...enemyProj);
    }

    // Collisions
    const hits = checkProjectileEnemyCollisions(this.playerProjectiles, this.enemies);
    for (const hit of hits) {
      hit.enemy.health -= hit.damage;
      if (hit.marked) hit.enemy.marked = true;
      if (hit.enemy.health <= 0) {
        hit.enemy.active = false;
        // Split behavior
        if (hit.enemy.splitCount > 0) {
          this.enemies.push(splitEnemy(hit.enemy));
          this.enemies.push(splitEnemy(hit.enemy));
        }
        // Generate loot
        if (this.features.isEnabled('lootDrops')) {
          const loot = generateLoot(hit.enemy);
          this.lootDrops.push(...loot);
        }
        this.gameState.updateRun({ enemiesKilled: run.enemiesKilled + 1 });
      }
    }

    // Player damage
    const projDmg = checkProjectilePlayerCollisions(this.enemyProjectiles, this.player);
    const contactDmg = checkEnemyPlayerCollisions(this.enemies, this.player, dt);
    const totalDmg = projDmg + contactDmg;
    if (totalDmg > 0) {
      if (this.player.shield > 0) {
        this.player.shield = Math.max(0, this.player.shield - totalDmg);
      } else {
        this.player.health = Math.max(0, this.player.health - totalDmg);
      }
      this.player.damageStreak = 0; // Reset Security Loader streak
      this.gameState.updateRun({
        playerHealth: this.player.health,
        playerShield: this.player.shield,
      });
    } else {
      this.player.damageStreak += dt;
    }

    // Player death
    if (this.player.health <= 0) {
      this.gameState.endRun(RunOutcome.Failure);
      this.gameLoop.stop();
      return;
    }

    // Loot collection
    const magnetRadius = 50;
    const collected = updateLoot(this.lootDrops, this.player, magnetRadius, dt);
    for (const loot of collected) {
      this.gameState.addRunResource(loot.resourceType as ResourceType, loot.amount);
    }

    // Wave spawning
    this.waveTimer += dt;
    if (this.currentWaveIndex < this.waves.length) {
      const wave = this.waves[this.currentWaveIndex];
      if (this.waveTimer >= wave.delay) {
        const spawned = spawnWave(wave, this.map.enemySpawnPoints);
        this.enemies.push(...spawned);
        this.currentWaveIndex++;
      }
    }

    // Objective check
    if (!this.objectiveReached) {
      const distToObj = vec2Dist(this.player.position, this.map.objectivePoint);
      if (distToObj < TILE_SIZE) {
        this.objectiveReached = true;
        this.gameState.updateRun({ primaryObjectiveComplete: true });
      }
    }

    // Extraction check
    if (!this.extractionDismissed && this.features.isEnabled('extractionDecision')) {
      const distToExt = vec2Dist(this.player.position, this.map.extractionPoint);
      if (distToExt < TILE_SIZE * 1.5) {
        this.showExtraction.set(true);
      } else {
        this.showExtraction.set(false);
      }
    }

    // Update run state
    this.gameState.updateRun({ elapsedTime: this.runTime });

    // Cleanup inactive entities
    this.playerProjectiles = this.playerProjectiles.filter(p => p.active);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.active);
    this.enemies = this.enemies.filter(e => e.active);
    this.lootDrops = this.lootDrops.filter(d => d.active);
  }

  private render(interpolation: number): void {
    const run = this.gameState.currentRun();
    if (!run) return;

    const sector = SECTOR_DEFS[run.sectorId];

    this.renderer.updateCamera(this.player.position, this.map.width, this.map.height);
    this.renderer.clear();
    this.renderer.renderMap(this.map, sector.tileColor, sector.wallColor);
    this.renderer.renderLoot(this.lootDrops, interpolation);
    this.renderer.renderEnemies(this.enemies, interpolation);
    this.renderer.renderProjectiles([...this.playerProjectiles, ...this.enemyProjectiles], interpolation);
    this.renderer.renderPlayer(this.player, interpolation);
    this.renderer.renderFog(sector.fogColor);
  }

  private onResize = (): void => {
    this.renderer?.resize();
  };
}
