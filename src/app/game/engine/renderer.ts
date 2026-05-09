import { GameState, GamePhase, Player, Building, BuildingType, Role, Projectile } from './types';
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  COLOR_GRASS, COLOR_GRASS_ALT, COLOR_SURVIVOR, COLOR_VAMPIRE,
  COLOR_WALL, COLOR_ARROW_TOWER, COLOR_CANNON_TOWER,
  COLOR_GOLD_MINE, COLOR_LUMBER_MILL, COLOR_HP_BAR, COLOR_HP_BAR_BG,
  COLOR_NIGHT_OVERLAY, COLOR_FOG
} from './constants';
import { GameMap } from '../map/game-map';
import { TileType } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cameraX = 0;
  private cameraY = 0;
  private scale = 1;
  private targetScale = 1;
  private screenWidth = 0;
  private screenHeight = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  setViewport(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  centerOn(x: number, y: number): void {
    this.cameraX = x - this.screenWidth / (2 * this.scale);
    this.cameraY = y - this.screenHeight / (2 * this.scale);
  }

  setZoom(zoom: number): void {
    this.targetScale = Math.max(0.3, Math.min(3, zoom));
  }

  zoom(delta: number): void {
    this.targetScale = Math.max(0.3, Math.min(3, this.targetScale + delta));
  }

  getWorldPos(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.scale + this.cameraX,
      y: screenY / this.scale + this.cameraY
    };
  }

  render(state: GameState, map: GameMap, visibleTiles: Set<string>,
         hoveredTile: { tx: number; ty: number } | null,
         selectedBuilding: BuildingType | null, canBuildHere: boolean): void {
    // Smooth zoom
    this.scale += (this.targetScale - this.scale) * 0.15;

    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(-this.cameraX, -this.cameraY);

    // Calculate visible tile range
    const startTX = Math.max(0, Math.floor(this.cameraX / TILE_SIZE) - 1);
    const startTY = Math.max(0, Math.floor(this.cameraY / TILE_SIZE) - 1);
    const endTX = Math.min(MAP_WIDTH, Math.ceil((this.cameraX + this.screenWidth / this.scale) / TILE_SIZE) + 1);
    const endTY = Math.min(MAP_HEIGHT, Math.ceil((this.cameraY + this.screenHeight / this.scale) / TILE_SIZE) + 1);

    // Draw tiles
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const x = tx * TILE_SIZE;
        const y = ty * TILE_SIZE;
        const tile = map.tiles[ty]?.[tx];

        // Checkerboard grass
        const isAlt = (tx + ty) % 2 === 0;
        this.ctx.fillStyle = isAlt ? COLOR_GRASS : COLOR_GRASS_ALT;
        this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        if (tile === TileType.BLOCKED) {
          this.ctx.fillStyle = '#555';
          this.ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        } else if (tile === TileType.RESOURCE_GOLD) {
          this.ctx.fillStyle = '#f1c40f44';
          this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.ctx.fillStyle = '#f1c40f';
          this.ctx.font = `${TILE_SIZE * 0.6}px Arial`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText('$', x + TILE_SIZE / 2, y + TILE_SIZE * 0.7);
        } else if (tile === TileType.RESOURCE_WOOD) {
          this.ctx.fillStyle = '#8b451344';
          this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.ctx.fillStyle = '#8b4513';
          this.ctx.font = `${TILE_SIZE * 0.6}px Arial`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText('🌲', x + TILE_SIZE / 2, y + TILE_SIZE * 0.75);
        }
      }
    }

    // Draw grid lines (subtle)
    this.ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    this.ctx.lineWidth = 0.5;
    for (let ty = startTY; ty <= endTY; ty++) {
      this.ctx.beginPath();
      this.ctx.moveTo(startTX * TILE_SIZE, ty * TILE_SIZE);
      this.ctx.lineTo(endTX * TILE_SIZE, ty * TILE_SIZE);
      this.ctx.stroke();
    }
    for (let tx = startTX; tx <= endTX; tx++) {
      this.ctx.beginPath();
      this.ctx.moveTo(tx * TILE_SIZE, startTY * TILE_SIZE);
      this.ctx.lineTo(tx * TILE_SIZE, endTY * TILE_SIZE);
      this.ctx.stroke();
    }

    // Draw buildings
    for (const building of state.buildings) {
      if (building.hp <= 0) continue;
      this.drawBuilding(building);
    }

    // Draw build preview
    if (hoveredTile && selectedBuilding !== null) {
      const px = hoveredTile.tx * TILE_SIZE;
      const py = hoveredTile.ty * TILE_SIZE;
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillStyle = canBuildHere ? '#2ecc71' : '#e74c3c';
      this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      this.ctx.globalAlpha = 1;

      // Show range for towers
      if (selectedBuilding === BuildingType.ARROW_TOWER || selectedBuilding === BuildingType.CANNON_TOWER) {
        const range = selectedBuilding === BuildingType.ARROW_TOWER ? 4 : 3;
        this.ctx.strokeStyle = canBuildHere ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(
          px + TILE_SIZE / 2, py + TILE_SIZE / 2,
          range * TILE_SIZE, 0, Math.PI * 2
        );
        this.ctx.stroke();
      }
    }

    // Draw projectiles
    for (const proj of state.projectiles) {
      this.drawProjectile(proj);
    }

    // Draw players
    for (const player of state.players) {
      if (player.isDead) continue;
      this.drawPlayer(player, state);
    }

    // Night overlay with fog of war
    if (state.phase === GamePhase.NIGHT) {
      this.drawFogOfWar(state, visibleTiles, startTX, startTY, endTX, endTY);
    }

    this.ctx.restore();
  }

  private drawBuilding(b: Building): void {
    const x = b.tileX * TILE_SIZE;
    const y = b.tileY * TILE_SIZE;
    const s = TILE_SIZE;

    switch (b.type) {
      case BuildingType.WALL:
        this.ctx.fillStyle = COLOR_WALL;
        this.ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        // Brick pattern
        this.ctx.strokeStyle = '#6c7a7d';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
        this.ctx.beginPath();
        this.ctx.moveTo(x + 2, y + s / 2);
        this.ctx.lineTo(x + s - 2, y + s / 2);
        this.ctx.stroke();
        break;

      case BuildingType.ARROW_TOWER:
        this.ctx.fillStyle = '#1a3a1a';
        this.ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        this.ctx.fillStyle = COLOR_ARROW_TOWER;
        this.ctx.beginPath();
        this.ctx.moveTo(x + s / 2, y + 4);
        this.ctx.lineTo(x + s - 4, y + s - 4);
        this.ctx.lineTo(x + 4, y + s - 4);
        this.ctx.closePath();
        this.ctx.fill();
        // Range indicator
        if (b.range) {
          this.ctx.strokeStyle = 'rgba(46,204,113,0.15)';
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.arc(b.pos.x, b.pos.y, b.range * TILE_SIZE, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        break;

      case BuildingType.CANNON_TOWER:
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        this.ctx.fillStyle = COLOR_CANNON_TOWER;
        this.ctx.beginPath();
        this.ctx.arc(x + s / 2, y + s / 2, s * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(x + s / 2, y + s / 2, s * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case BuildingType.GOLD_MINE:
        this.ctx.fillStyle = '#3a3000';
        this.ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        this.ctx.fillStyle = COLOR_GOLD_MINE;
        this.ctx.font = `${s * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⛏', x + s / 2, y + s * 0.7);
        break;

      case BuildingType.LUMBER_MILL:
        this.ctx.fillStyle = '#2a1500';
        this.ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        this.ctx.fillStyle = COLOR_LUMBER_MILL;
        this.ctx.font = `${s * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🪓', x + s / 2, y + s * 0.7);
        break;
    }

    // HP bar
    if (b.hp < b.maxHp) {
      this.drawHpBar(x, y - 6, s, 4, b.hp / b.maxHp);
    }
  }

  private drawPlayer(player: Player, state: GameState): void {
    const { x, y } = player.pos;
    const radius = TILE_SIZE * 0.4;

    if (player.role === Role.SURVIVOR) {
      // Blue circle with body
      this.ctx.fillStyle = COLOR_SURVIVOR;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Eyes
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(x - 4, y - 3, 3, 0, Math.PI * 2);
      this.ctx.arc(x + 4, y - 3, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.beginPath();
      this.ctx.arc(x - 4, y - 3, 1.5, 0, Math.PI * 2);
      this.ctx.arc(x + 4, y - 3, 1.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Local player indicator
      if (player.id === state.localPlayerId) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    } else {
      // Vampire - red with fangs
      const rageGlow = player.isRaging;
      if (rageGlow) {
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 15;
      }

      this.ctx.fillStyle = COLOR_VAMPIRE;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Bat-like ears
      this.ctx.beginPath();
      this.ctx.moveTo(x - radius, y - radius * 0.5);
      this.ctx.lineTo(x - radius * 0.6, y - radius * 1.3);
      this.ctx.lineTo(x - radius * 0.2, y - radius * 0.5);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x + radius, y - radius * 0.5);
      this.ctx.lineTo(x + radius * 0.6, y - radius * 1.3);
      this.ctx.lineTo(x + radius * 0.2, y - radius * 0.5);
      this.ctx.fill();

      // Red eyes
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.beginPath();
      this.ctx.arc(x - 4, y - 2, 2.5, 0, Math.PI * 2);
      this.ctx.arc(x + 4, y - 2, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Fangs
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.moveTo(x - 3, y + 3);
      this.ctx.lineTo(x - 1, y + 8);
      this.ctx.lineTo(x + 1, y + 3);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x + 1, y + 3);
      this.ctx.lineTo(x + 3, y + 8);
      this.ctx.lineTo(x + 5, y + 3);
      this.ctx.fill();

      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;

      // Local player indicator
      if (player.id === state.localPlayerId) {
        this.ctx.strokeStyle = '#ff6666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    // HP bar
    this.drawHpBar(x - TILE_SIZE / 2, y - radius - 10, TILE_SIZE, 4, player.hp / player.maxHp);

    // Name tag
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    const label = player.id === state.localPlayerId ? 'You' : player.id.replace('_', ' ');
    this.ctx.strokeText(label, x, y - radius - 14);
    this.ctx.fillText(label, x, y - radius - 14);
  }

  private drawProjectile(proj: Projectile): void {
    this.ctx.fillStyle = proj.aoeRange ? '#e67e22' : '#f39c12';
    this.ctx.beginPath();
    this.ctx.arc(proj.x, proj.y, proj.aoeRange ? 4 : 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Trail
    this.ctx.strokeStyle = proj.aoeRange ? 'rgba(230,126,34,0.3)' : 'rgba(243,156,18,0.3)';
    this.ctx.lineWidth = 1;
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(proj.x, proj.y);
      this.ctx.lineTo(proj.x - (dx / dist) * 10, proj.y - (dy / dist) * 10);
      this.ctx.stroke();
    }
  }

  private drawFogOfWar(state: GameState, visibleTiles: Set<string>,
                       startTX: number, startTY: number, endTX: number, endTY: number): void {
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const key = `${tx},${ty}`;
        if (!visibleTiles.has(key)) {
          this.ctx.fillStyle = COLOR_FOG;
          this.ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else {
          // Dim overlay for visible night tiles
          this.ctx.fillStyle = COLOR_NIGHT_OVERLAY;
          this.ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  private drawHpBar(x: number, y: number, width: number, height: number, ratio: number): void {
    ratio = Math.max(0, Math.min(1, ratio));
    this.ctx.fillStyle = COLOR_HP_BAR_BG;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.fillStyle = ratio > 0.5 ? COLOR_HP_BAR : ratio > 0.25 ? '#f39c12' : '#e74c3c';
    this.ctx.fillRect(x, y, width * ratio, height);
  }

  renderMinimap(ctx: CanvasRenderingContext2D, state: GameState, map: GameMap,
                width: number, height: number): void {
    const scaleX = width / (MAP_WIDTH * TILE_SIZE);
    const scaleY = height / (MAP_HEIGHT * TILE_SIZE);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Buildings
    for (const b of state.buildings) {
      if (b.hp <= 0) continue;
      const bx = b.pos.x * scaleX;
      const by = b.pos.y * scaleY;
      switch (b.type) {
        case BuildingType.WALL: ctx.fillStyle = COLOR_WALL; break;
        case BuildingType.ARROW_TOWER: ctx.fillStyle = COLOR_ARROW_TOWER; break;
        case BuildingType.CANNON_TOWER: ctx.fillStyle = COLOR_CANNON_TOWER; break;
        case BuildingType.GOLD_MINE: ctx.fillStyle = COLOR_GOLD_MINE; break;
        case BuildingType.LUMBER_MILL: ctx.fillStyle = COLOR_LUMBER_MILL; break;
      }
      ctx.fillRect(bx - 1, by - 1, 3, 3);
    }

    // Players
    for (const p of state.players) {
      if (p.isDead) continue;
      const px = p.pos.x * scaleX;
      const py = p.pos.y * scaleY;
      ctx.fillStyle = p.role === Role.SURVIVOR ? COLOR_SURVIVOR : COLOR_VAMPIRE;
      ctx.beginPath();
      ctx.arc(px, py, p.id === state.localPlayerId ? 4 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Camera viewport
    const vx = this.cameraX * scaleX;
    const vy = this.cameraY * scaleY;
    const vw = (this.screenWidth / this.scale) * scaleX;
    const vh = (this.screenHeight / this.scale) * scaleY;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);
  }
}
