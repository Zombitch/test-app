import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewInit, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngine } from './engine/game-engine';
import { Renderer } from './engine/renderer';
import { GamePhase, Role, BuildingType } from './engine/types';
import { TILE_SIZE } from './engine/constants';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('minimapCanvas', { static: true }) minimapRef!: ElementRef<HTMLCanvasElement>;

  engine!: GameEngine;
  renderer!: Renderer;

  // UI state
  gameStarted = false;
  selectedRole: Role = Role.SURVIVOR;
  selectedBuilding: BuildingType | null = null;
  hoveredTile: { tx: number; ty: number } | null = null;
  canBuildHere = false;
  showBuildMenu = false;

  // Touch
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchDragging = false;
  private pinchStartDist = 0;
  private pinchStartScale = 1;

  private animFrameId = 0;
  private lastTime = 0;

  // Key state
  private keys = new Set<string>();

  // Expose enums to template
  readonly GamePhase = GamePhase;
  readonly Role = Role;
  readonly BuildingType = BuildingType;

  ngOnInit(): void {
    this.engine = new GameEngine();
  }

  ngAfterViewInit(): void {
    this.renderer = new Renderer(this.canvasRef.nativeElement);
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  @HostListener('window:resize')
  resizeCanvas(): void {
    if (!this.renderer) return;
    this.renderer.setViewport(window.innerWidth, window.innerHeight);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key.toLowerCase());

    if (!this.gameStarted) return;
    const player = this.engine.getLocalPlayer();
    if (!player) return;

    // Building hotkeys
    if (e.key === '1') this.selectBuilding(BuildingType.WALL);
    if (e.key === '2') this.selectBuilding(BuildingType.ARROW_TOWER);
    if (e.key === '3') this.selectBuilding(BuildingType.CANNON_TOWER);
    if (e.key === '4') this.selectBuilding(BuildingType.GOLD_MINE);
    if (e.key === '5') this.selectBuilding(BuildingType.LUMBER_MILL);
    if (e.key === 'Escape') {
      this.selectedBuilding = null;
      this.showBuildMenu = false;
    }
    if (e.key === 'b') this.showBuildMenu = !this.showBuildMenu;

    // Vampire abilities
    if (player.role === Role.VAMPIRE) {
      if (e.key === 'q') {
        // Blink to mouse position
        if (this.hoveredTile) {
          const pos = this.engine.map.tileToWorld(this.hoveredTile.tx, this.hoveredTile.ty);
          this.engine.useLocalAbility(0, pos);
        }
      }
      if (e.key === 'w') {
        this.engine.useLocalAbility(1);
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  startGame(): void {
    this.engine.startGame(this.selectedRole, 6);
    this.gameStarted = true;

    const player = this.engine.getLocalPlayer();
    if (player) {
      this.renderer.centerOn(player.pos.x, player.pos.y);
    }

    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  selectRole(role: Role): void {
    this.selectedRole = role;
  }

  selectBuilding(type: BuildingType | null): void {
    if (this.selectedBuilding === type) {
      this.selectedBuilding = null;
    } else {
      this.selectedBuilding = type;
    }
  }

  toggleBuildMenu(): void {
    this.showBuildMenu = !this.showBuildMenu;
  }

  onCanvasClick(event: MouseEvent): void {
    if (!this.gameStarted) return;
    const worldPos = this.renderer.getWorldPos(event.clientX, event.clientY);

    if (this.selectedBuilding !== null) {
      const tile = this.engine.map.worldToTile(worldPos.x, worldPos.y);
      const success = this.engine.placeBuilding(this.selectedBuilding, tile.tx, tile.ty);
      if (success) {
        // Keep building mode for convenience (shift-like behavior)
        // Check if still affordable
        const player = this.engine.getLocalPlayer();
        const opt = this.engine.buildOptions.find(o => o.type === this.selectedBuilding);
        if (player && opt && (player.gold < opt.goldCost || player.wood < opt.woodCost)) {
          this.selectedBuilding = null;
        }
      }
    } else {
      // Move player
      this.engine.movePlayer(worldPos.x, worldPos.y);
    }
  }

  onCanvasRightClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.gameStarted) return;

    const worldPos = this.renderer.getWorldPos(event.clientX, event.clientY);
    this.engine.movePlayer(worldPos.x, worldPos.y);
    this.selectedBuilding = null;
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.gameStarted) return;
    const worldPos = this.renderer.getWorldPos(event.clientX, event.clientY);
    const tile = this.engine.map.worldToTile(worldPos.x, worldPos.y);
    this.hoveredTile = tile;
    this.canBuildHere = this.engine.canBuild(tile.tx, tile.ty);
  }

  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    this.renderer.zoom(event.deltaY > 0 ? -0.15 : 0.15);
  }

  // Touch handlers
  onTouchStart(event: TouchEvent): void {
    if (!this.gameStarted) return;
    event.preventDefault();

    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
      return;
    }

    this.lastTouchX = event.touches[0].clientX;
    this.lastTouchY = event.touches[0].clientY;
    this.touchDragging = false;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.gameStarted) return;
    event.preventDefault();

    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / this.pinchStartDist;
      this.renderer.zoom((scale - 1) * 0.1);
      this.pinchStartDist = dist;
      return;
    }

    const dx = event.touches[0].clientX - this.lastTouchX;
    const dy = event.touches[0].clientY - this.lastTouchY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      this.touchDragging = true;
    }

    // Update hovered tile
    const worldPos = this.renderer.getWorldPos(event.touches[0].clientX, event.touches[0].clientY);
    const tile = this.engine.map.worldToTile(worldPos.x, worldPos.y);
    this.hoveredTile = tile;
    this.canBuildHere = this.engine.canBuild(tile.tx, tile.ty);

    this.lastTouchX = event.touches[0].clientX;
    this.lastTouchY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.gameStarted) return;

    if (!this.touchDragging) {
      // Tap = click
      const worldPos = this.renderer.getWorldPos(this.lastTouchX, this.lastTouchY);

      if (this.selectedBuilding !== null) {
        const tile = this.engine.map.worldToTile(worldPos.x, worldPos.y);
        this.engine.placeBuilding(this.selectedBuilding, tile.tx, tile.ty);
      } else {
        this.engine.movePlayer(worldPos.x, worldPos.y);
      }
    }
    this.touchDragging = false;
  }

  private gameLoop(timestamp: number): void {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    // Keyboard camera movement
    const camSpeed = 400 * dt;
    const player = this.engine.getLocalPlayer();
    if (player && !player.isDead) {
      // WASD movement
      let mx = 0, my = 0;
      if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) my += 1;

      // Camera follows player
      this.renderer.centerOn(player.pos.x, player.pos.y);
    }

    // Update game
    this.engine.update(dt);

    // Render
    const visibleTiles = this.engine.getAlliedVisibleTiles();
    this.renderer.render(
      this.engine.state, this.engine.map, visibleTiles,
      this.hoveredTile, this.selectedBuilding, this.canBuildHere
    );

    // Minimap
    const minimapCanvas = this.minimapRef.nativeElement;
    const minimapCtx = minimapCanvas.getContext('2d');
    if (minimapCtx) {
      this.renderer.renderMinimap(minimapCtx, this.engine.state, this.engine.map,
        minimapCanvas.width, minimapCanvas.height);
    }

    if (this.engine.state.phase !== GamePhase.GAME_OVER) {
      this.animFrameId = requestAnimationFrame(t => this.gameLoop(t));
    }
  }

  get localPlayer() {
    return this.engine?.getLocalPlayer();
  }

  get phaseLabel(): string {
    switch (this.engine?.state.phase) {
      case GamePhase.DAY: return `☀️ Day ${this.engine.state.dayCount}`;
      case GamePhase.NIGHT: return `🌙 Night ${this.engine.state.dayCount}`;
      case GamePhase.GAME_OVER: return '💀 Game Over';
      default: return '';
    }
  }

  get phaseTimer(): string {
    const t = Math.ceil(this.engine?.state.phaseTimer || 0);
    const min = Math.floor(t / 60);
    const sec = t % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  get survivorCount(): number {
    return this.engine?.state.players.filter(p => p.role === Role.SURVIVOR && !p.isDead).length || 0;
  }

  get vampireCount(): number {
    return this.engine?.state.players.filter(p => p.role === Role.VAMPIRE && !p.isDead).length || 0;
  }

  get gameOverMessage(): string {
    if (!this.engine || this.engine.state.phase !== GamePhase.GAME_OVER) return '';
    const survivors = this.engine.state.players.filter(p => p.role === Role.SURVIVOR && !p.isDead);
    if (survivors.length === 0) return '🧛 Vampires Win!';
    return '🏠 Survivors Win!';
  }

  restartGame(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.gameStarted = false;
    this.selectedBuilding = null;
    this.showBuildMenu = false;
    this.engine = new GameEngine();
  }

  canAfford(type: BuildingType): boolean {
    const player = this.localPlayer;
    if (!player) return false;
    const opt = this.engine.buildOptions.find(o => o.type === type);
    if (!opt) return false;
    return player.gold >= opt.goldCost && player.wood >= opt.woodCost;
  }
}
