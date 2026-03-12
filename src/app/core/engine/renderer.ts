import { Vec2, vec2Lerp } from './math-utils';
import { PlayerEntity, Projectile, EnemyEntity, LootDrop } from './entity';
import { GameMap, TILE_SIZE, TileType } from './map-generator';
import { NORD, GAME_COLORS } from '../config/nord-theme';

const RESOURCE_COLORS: Record<string, string> = {
  cpu: GAME_COLORS.cpu,
  ram: GAME_COLORS.ram,
  gpu: GAME_COLORS.gpu,
  data: GAME_COLORS.data,
  bitcoin: GAME_COLORS.bitcoin,
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Vec2 = { x: 0, y: 0 };
  private canvasWidth = 0;
  private canvasHeight = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    // Crisp pixel rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  updateCamera(target: Vec2, mapWidth: number, mapHeight: number): void {
    const worldW = mapWidth * TILE_SIZE;
    const worldH = mapHeight * TILE_SIZE;
    this.camera.x = Math.max(0, Math.min(target.x - this.canvasWidth / 2, worldW - this.canvasWidth));
    this.camera.y = Math.max(0, Math.min(target.y - this.canvasHeight / 2, worldH - this.canvasHeight));
  }

  clear(): void {
    this.ctx.fillStyle = GAME_COLORS.bgPrimary;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  renderMap(map: GameMap, sectorTileColor: string, sectorWallColor: string): void {
    const startTileX = Math.max(0, Math.floor(this.camera.x / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(this.camera.y / TILE_SIZE));
    const endTileX = Math.min(map.width, Math.ceil((this.camera.x + this.canvasWidth) / TILE_SIZE) + 1);
    const endTileY = Math.min(map.height, Math.ceil((this.camera.y + this.canvasHeight) / TILE_SIZE) + 1);

    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const screenX = x * TILE_SIZE - this.camera.x;
        const screenY = y * TILE_SIZE - this.camera.y;
        const tile = map.tiles[y][x];

        switch (tile) {
          case TileType.Wall:
            this.ctx.fillStyle = sectorWallColor;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Wall edge highlight
            this.ctx.fillStyle = 'rgba(136, 192, 208, 0.03)';
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, 1);
            this.ctx.fillRect(screenX, screenY, 1, TILE_SIZE);
            break;
          case TileType.Floor:
            this.ctx.fillStyle = sectorTileColor;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Subtle grid lines
            this.ctx.strokeStyle = 'rgba(136, 192, 208, 0.04)';
            this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
          case TileType.Objective:
            this.ctx.fillStyle = sectorTileColor;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            this.drawMarker(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, NORD.nord13, 'OBJ');
            break;
          case TileType.SideObjective:
            this.ctx.fillStyle = sectorTileColor;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            this.drawMarker(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, NORD.nord15, 'SIDE');
            break;
          case TileType.Extraction:
            this.ctx.fillStyle = sectorTileColor;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            this.drawMarker(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, NORD.nord14, 'EXT');
            break;
          case TileType.Spawn:
            this.ctx.fillStyle = sectorTileColor;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
          case TileType.Event:
            this.ctx.fillStyle = sectorTileColor;
            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            this.drawMarker(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, NORD.nord8, '?');
            break;
        }
      }
    }
  }

  renderPlayer(player: PlayerEntity, interpolation: number): void {
    const pos = vec2Lerp(player.previousPosition, player.position, interpolation);
    const sx = pos.x - this.camera.x;
    const sy = pos.y - this.camera.y;

    // Shield glow
    if (player.shield > 0) {
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, player.size + 4, 0, Math.PI * 2);
      this.ctx.strokeStyle = GAME_COLORS.shield;
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 0.5;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }

    // Invulnerability flash
    if (player.invulnerable) {
      this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
    }

    // Player body — diamond shape
    this.ctx.beginPath();
    this.ctx.moveTo(sx, sy - player.size);
    this.ctx.lineTo(sx + player.size * 0.7, sy);
    this.ctx.lineTo(sx, sy + player.size * 0.6);
    this.ctx.lineTo(sx - player.size * 0.7, sy);
    this.ctx.closePath();
    this.ctx.fillStyle = NORD.nord8;
    this.ctx.fill();
    this.ctx.strokeStyle = NORD.nord6;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Inner glow
    this.ctx.beginPath();
    this.ctx.arc(sx, sy - 2, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = NORD.nord6;
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
  }

  renderProjectiles(projectiles: Projectile[], interpolation: number): void {
    for (const p of projectiles) {
      if (!p.active) continue;
      const pos = vec2Lerp(p.previousPosition, p.position, interpolation);
      const sx = pos.x - this.camera.x;
      const sy = pos.y - this.camera.y;

      this.ctx.beginPath();
      this.ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.isPlayerProjectile ? NORD.nord8 : NORD.nord11;
      this.ctx.fill();

      if (p.marksTarget) {
        // Antivirus tracking glow
        this.ctx.strokeStyle = NORD.nord13;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
  }

  renderEnemies(enemies: EnemyEntity[], interpolation: number): void {
    for (const e of enemies) {
      if (!e.active || e.hidden) continue;
      const pos = vec2Lerp(e.previousPosition, e.position, interpolation);
      const sx = pos.x - this.camera.x;
      const sy = pos.y - this.camera.y;

      // Enemy body
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, e.size, 0, Math.PI * 2);
      this.ctx.fillStyle = e.color ?? NORD.nord11;
      this.ctx.globalAlpha = 0.8;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;

      // Health bar (for enemies with more than fodder health)
      if (e.maxHealth > 15 && e.health < e.maxHealth) {
        const barW = e.size * 2;
        const barH = 3;
        const barX = sx - barW / 2;
        const barY = sy - e.size - 6;
        this.ctx.fillStyle = NORD.nord1;
        this.ctx.fillRect(barX, barY, barW, barH);
        this.ctx.fillStyle = NORD.nord11;
        this.ctx.fillRect(barX, barY, barW * (e.health / e.maxHealth), barH);
      }

      // Antivirus mark indicator
      if (e.marked) {
        this.ctx.strokeStyle = NORD.nord13;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, e.size + 3, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  renderLoot(drops: LootDrop[], interpolation: number): void {
    for (const d of drops) {
      if (!d.active) continue;
      const pos = vec2Lerp(d.previousPosition, d.position, interpolation);
      const sx = pos.x - this.camera.x;
      const sy = pos.y - this.camera.y;

      const color = RESOURCE_COLORS[d.resourceType] || NORD.nord4;

      // Glowing loot dot
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      // Pulse effect
      const pulse = Math.sin(Date.now() * 0.005 + d.id) * 0.3 + 0.7;
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, d.size + 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = color;
      this.ctx.globalAlpha = pulse * 0.4;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
  }

  renderFog(fogColor: string): void {
    this.ctx.fillStyle = fogColor;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  private drawMarker(x: number, y: number, color: string, label: string): void {
    // Pulsing marker
    const pulse = Math.sin(Date.now() * 0.003) * 2 + 10;
    this.ctx.beginPath();
    this.ctx.arc(x, y, pulse, 0, Math.PI * 2);
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = 0.5;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;

    this.ctx.font = '8px monospace';
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x, y + 3);
  }
}
