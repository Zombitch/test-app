import { Vec2, vec2Lerp, vec2Dist, vec2Normalize, vec2Sub } from './math-utils';
import { PlayerEntity, Projectile, EnemyEntity, LootDrop } from './entity';
import { GameMap, TILE_SIZE, TileType, DataStream, MapDecoration } from './map-generator';
import { NORD, GAME_COLORS } from '../config/nord-theme';

const RESOURCE_COLORS: Record<string, string> = {
  cpu: GAME_COLORS.cpu,
  ram: GAME_COLORS.ram,
  gpu: GAME_COLORS.gpu,
  data: GAME_COLORS.data,
  bitcoin: GAME_COLORS.bitcoin,
};

// ─── Cyber visual constants ────────────────────────────────────

const GRID_OPACITY = 0.035;
const SCANLINE_OPACITY = 0.04;
const SCANLINE_SPACING = 3;
const CIRCUIT_TRACE_OPACITY = 0.06;
const DATA_STREAM_PARTICLE_COUNT = 8;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Vec2 = { x: 0, y: 0 };
  private canvasWidth = 0;
  private canvasHeight = 0;
  private frameCount = 0;
  private time = 0;

  // Pre-rendered pattern canvases
  private gridPattern: CanvasPattern | null = null;
  private scanlinePattern: CanvasPattern | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.buildPatterns();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;
    this.buildPatterns();
  }

  updateCamera(target: Vec2, mapWidth: number, mapHeight: number): void {
    const worldW = mapWidth * TILE_SIZE;
    const worldH = mapHeight * TILE_SIZE;
    this.camera.x = Math.max(0, Math.min(target.x - this.canvasWidth / 2, worldW - this.canvasWidth));
    this.camera.y = Math.max(0, Math.min(target.y - this.canvasHeight / 2, worldH - this.canvasHeight));
  }

  clear(): void {
    this.frameCount++;
    this.time = performance.now() / 1000;
    this.ctx.fillStyle = '#0d1117'; // deep void black
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  // ─── Map rendering ──────────────────────────────────────────

  renderMap(map: GameMap, sectorTileColor: string, sectorWallColor: string): void {
    const startTileX = Math.max(0, Math.floor(this.camera.x / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(this.camera.y / TILE_SIZE));
    const endTileX = Math.min(map.width, Math.ceil((this.camera.x + this.canvasWidth) / TILE_SIZE) + 1);
    const endTileY = Math.min(map.height, Math.ceil((this.camera.y + this.canvasHeight) / TILE_SIZE) + 1);

    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const sx = x * TILE_SIZE - this.camera.x;
        const sy = y * TILE_SIZE - this.camera.y;
        const tile = map.tiles[y][x];

        this.renderTile(tile, sx, sy, x, y, sectorTileColor, sectorWallColor);
      }
    }
  }

  private renderTile(
    tile: TileType, sx: number, sy: number,
    tileX: number, tileY: number,
    floorColor: string, wallColor: string,
  ): void {
    const ctx = this.ctx;
    const ts = TILE_SIZE;

    switch (tile) {
      case TileType.Void:
        // Deep void with faint grid
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(sx, sy, ts, ts);
        ctx.strokeStyle = `rgba(136, 192, 208, ${GRID_OPACITY * 0.3})`;
        ctx.strokeRect(sx, sy, ts, ts);
        break;

      case TileType.Wall:
        ctx.fillStyle = wallColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Inner bevel: top-left highlight, bottom-right shadow
        ctx.fillStyle = 'rgba(136, 192, 208, 0.04)';
        ctx.fillRect(sx, sy, ts, 1);
        ctx.fillRect(sx, sy, 1, ts);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(sx, sy + ts - 1, ts, 1);
        ctx.fillRect(sx + ts - 1, sy, 1, ts);
        // Circuit trace patterns on some walls
        if ((tileX + tileY) % 7 === 0) {
          this.drawCircuitTrace(sx, sy, ts);
        }
        break;

      case TileType.Floor:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Hex grid pattern
        ctx.strokeStyle = `rgba(136, 192, 208, ${GRID_OPACITY})`;
        ctx.strokeRect(sx, sy, ts, ts);
        // Occasional floor detail
        if ((tileX * 7 + tileY * 13) % 23 === 0) {
          ctx.fillStyle = 'rgba(136, 192, 208, 0.03)';
          ctx.fillRect(sx + 4, sy + 4, ts - 8, ts - 8);
        }
        break;

      case TileType.DataConduit:
        // Glowing data-flow lane
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Animated glow pulse
        const pulse = Math.sin(this.time * 2 + tileX * 0.5 + tileY * 0.3) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(136, 192, 208, ${0.06 + pulse * 0.08})`;
        ctx.fillRect(sx, sy, ts, ts);
        // Center data line
        ctx.fillStyle = `rgba(136, 192, 208, ${0.15 + pulse * 0.15})`;
        ctx.fillRect(sx + ts * 0.3, sy + ts * 0.45, ts * 0.4, ts * 0.1);
        // Data flow particles
        const particleX = ((this.time * 80 + tileX * 32) % ts);
        ctx.fillStyle = `rgba(136, 192, 208, ${0.3 + pulse * 0.4})`;
        ctx.fillRect(sx + particleX, sy + ts * 0.45, 3, 2);
        break;

      case TileType.ServerRack:
        // Non-walkable server hardware
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(sx, sy, ts, ts);
        // Rack frame
        ctx.strokeStyle = 'rgba(76, 86, 106, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 2, sy + 1, ts - 4, ts - 2);
        // Blinking status LEDs
        const ledPhase = (this.time * 3 + tileX + tileY * 5) % 4;
        for (let i = 0; i < 3; i++) {
          const ledColor = (Math.floor(ledPhase) === i)
            ? `rgba(163, 190, 140, 0.9)` // green active
            : `rgba(76, 86, 106, 0.4)`;   // dim
          ctx.fillStyle = ledColor;
          ctx.fillRect(sx + 6 + i * 8, sy + 4, 3, 2);
        }
        // Drive bays
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = 'rgba(59, 66, 82, 0.8)';
          ctx.fillRect(sx + 4, sy + 10 + i * 7, ts - 8, 5);
          ctx.fillStyle = 'rgba(136, 192, 208, 0.1)';
          ctx.fillRect(sx + 5, sy + 11 + i * 7, ts - 10, 3);
        }
        break;

      case TileType.Terminal:
        // Walkable terminal with screen glow
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Terminal screen
        const screenGlow = Math.sin(this.time * 1.5 + tileX) * 0.1 + 0.2;
        ctx.fillStyle = `rgba(136, 192, 208, ${screenGlow})`;
        ctx.fillRect(sx + 4, sy + 2, ts - 8, ts * 0.5);
        ctx.strokeStyle = 'rgba(136, 192, 208, 0.3)';
        ctx.strokeRect(sx + 4, sy + 2, ts - 8, ts * 0.5);
        // Scrolling text effect
        const textLine = Math.floor(this.time * 4 + tileY) % 4;
        for (let i = 0; i < 3; i++) {
          const alpha = i === textLine ? 0.5 : 0.15;
          ctx.fillStyle = `rgba(136, 192, 208, ${alpha})`;
          ctx.fillRect(sx + 6, sy + 4 + i * 4, randomStaticWidth(tileX + i, 6, ts - 14), 2);
        }
        break;

      case TileType.CableBundle:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Horizontal cables
        for (let i = 0; i < 3; i++) {
          const cy = sy + 8 + i * 8;
          ctx.strokeStyle = `rgba(76, 86, 106, ${0.3 + i * 0.1})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, cy);
          ctx.lineTo(sx + ts, cy);
          ctx.stroke();
        }
        break;

      case TileType.VentGrate:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Grate lines
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = 'rgba(76, 86, 106, 0.3)';
          ctx.fillRect(sx + 2, sy + 3 + i * 6, ts - 4, 2);
        }
        // Coolant steam effect
        const steam = Math.sin(this.time * 0.8 + tileX * 0.3) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(143, 188, 187, ${steam * 0.06})`;
        ctx.fillRect(sx, sy, ts, ts);
        break;

      case TileType.CorruptedFloor:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Glitch blocks
        const glitch = Math.sin(this.time * 5 + tileX * 11 + tileY * 7);
        if (glitch > 0.7) {
          ctx.fillStyle = 'rgba(191, 97, 106, 0.15)'; // red glitch
          const gx = sx + Math.floor(Math.random() * ts * 0.5);
          const gy = sy + Math.floor(Math.random() * ts * 0.5);
          ctx.fillRect(gx, gy, randomStaticWidth(tileX, 4, 12), 3);
        }
        // Static noise
        ctx.fillStyle = `rgba(208, 135, 112, ${0.04 + Math.random() * 0.04})`;
        ctx.fillRect(sx, sy, ts, ts);
        break;

      case TileType.FirewallGate:
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(sx, sy, ts, ts);
        // Pulsing firewall barrier
        const fwPulse = Math.sin(this.time * 3) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(94, 129, 172, ${fwPulse * 0.3})`;
        ctx.fillRect(sx, sy, ts, ts);
        ctx.strokeStyle = `rgba(94, 129, 172, ${fwPulse * 0.6})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
        // Lock icon
        ctx.fillStyle = `rgba(94, 129, 172, ${fwPulse * 0.8})`;
        ctx.fillRect(sx + ts * 0.35, sy + ts * 0.3, ts * 0.3, ts * 0.4);
        break;

      case TileType.MiningRig:
        ctx.fillStyle = '#1a2218';
        ctx.fillRect(sx, sy, ts, ts);
        // Mining hardware glow
        const mineGlow = Math.sin(this.time * 4 + tileX) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(208, 135, 112, ${mineGlow * 0.15})`;
        ctx.fillRect(sx, sy, ts, ts);
        // Hash computation visual
        ctx.strokeStyle = `rgba(208, 135, 112, ${mineGlow * 0.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 3, sy + 3, ts - 6, ts - 6);
        // Processing indicator
        const hashTick = Math.floor(this.time * 8 + tileX) % 4;
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i <= hashTick
            ? `rgba(208, 135, 112, 0.7)`
            : `rgba(76, 86, 106, 0.3)`;
          ctx.fillRect(sx + 6 + i * 6, sy + ts - 8, 4, 3);
        }
        break;

      // Special markers
      case TileType.Objective:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        this.drawCyberMarker(sx + ts / 2, sy + ts / 2, NORD.nord13, 'OBJ', 'objective');
        break;
      case TileType.SideObjective:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        this.drawCyberMarker(sx + ts / 2, sy + ts / 2, NORD.nord15, 'SIDE', 'side');
        break;
      case TileType.Extraction:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        this.drawCyberMarker(sx + ts / 2, sy + ts / 2, NORD.nord14, 'EXT', 'extract');
        break;
      case TileType.Spawn:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        // Spawn pad glow
        ctx.fillStyle = 'rgba(136, 192, 208, 0.05)';
        ctx.fillRect(sx, sy, ts, ts);
        break;
      case TileType.Event:
        ctx.fillStyle = floorColor;
        ctx.fillRect(sx, sy, ts, ts);
        this.drawCyberMarker(sx + ts / 2, sy + ts / 2, NORD.nord8, '?', 'event');
        break;
    }
  }

  // ─── Network topology overlay ────────────────────────────────

  renderNetworkTopology(map: GameMap): void {
    const ctx = this.ctx;

    // Draw network edges (connections between rooms)
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = NORD.nord8;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    for (const [a, b] of map.networkEdges) {
      const ax = a.x - this.camera.x;
      const ay = a.y - this.camera.y;
      const bx = b.x - this.camera.x;
      const by = b.y - this.camera.y;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw room center nodes
    ctx.globalAlpha = 0.08;
    for (const center of map.roomCenters) {
      const sx = center.x - this.camera.x;
      const sy = center.y - this.camera.y;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.strokeStyle = NORD.nord8;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Inner dot
      ctx.fillStyle = NORD.nord8;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── Data streams ────────────────────────────────────────────

  renderDataStreams(streams: DataStream[]): void {
    for (const stream of streams) {
      if (stream.points.length < 2) continue;
      const a = stream.points[0];
      const b = stream.points[1];
      const ax = a.x - this.camera.x;
      const ay = a.y - this.camera.y;
      const bx = b.x - this.camera.x;
      const by = b.y - this.camera.y;

      // Draw data packets moving along the stream
      for (let i = 0; i < DATA_STREAM_PARTICLE_COUNT; i++) {
        const t = ((this.time * stream.speed * 0.01 + i / DATA_STREAM_PARTICLE_COUNT) % 1);
        const px = ax + (bx - ax) * t;
        const py = ay + (by - ay) * t;

        this.ctx.globalAlpha = 0.3 + Math.sin(t * Math.PI) * 0.3;
        this.ctx.fillStyle = stream.color;
        this.ctx.fillRect(px - 1, py - 1, stream.width + 1, stream.width);
        this.ctx.globalAlpha = 1;
      }
    }
  }

  // ─── Player rendering ────────────────────────────────────────

  renderPlayer(player: PlayerEntity, interpolation: number): void {
    const pos = vec2Lerp(player.previousPosition, player.position, interpolation);
    const sx = pos.x - this.camera.x;
    const sy = pos.y - this.camera.y;
    const ctx = this.ctx;

    // Ground glow ring
    ctx.beginPath();
    ctx.arc(sx, sy, player.size + 8, 0, Math.PI * 2);
    const groundGrad = ctx.createRadialGradient(sx, sy, player.size, sx, sy, player.size + 8);
    groundGrad.addColorStop(0, 'rgba(136, 192, 208, 0.08)');
    groundGrad.addColorStop(1, 'rgba(136, 192, 208, 0)');
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // Shield hexagonal field
    if (player.shield > 0) {
      const shieldPulse = Math.sin(this.time * 4) * 0.2 + 0.5;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.time * 0.5);
      this.drawHexagon(0, 0, player.size + 5, `rgba(136, 192, 208, ${shieldPulse * 0.4})`);
      ctx.restore();
    }

    // Invulnerability flash
    if (player.invulnerable) {
      ctx.globalAlpha = 0.5 + Math.sin(this.time * 15) * 0.3;
    }

    // Entity body — angular tech shape
    ctx.save();
    ctx.translate(sx, sy);

    // Outer frame
    ctx.beginPath();
    ctx.moveTo(0, -player.size);
    ctx.lineTo(player.size * 0.8, -player.size * 0.2);
    ctx.lineTo(player.size * 0.6, player.size * 0.6);
    ctx.lineTo(0, player.size * 0.8);
    ctx.lineTo(-player.size * 0.6, player.size * 0.6);
    ctx.lineTo(-player.size * 0.8, -player.size * 0.2);
    ctx.closePath();
    ctx.fillStyle = NORD.nord1;
    ctx.fill();
    ctx.strokeStyle = NORD.nord8;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner core glow
    ctx.beginPath();
    ctx.arc(0, -1, 4, 0, Math.PI * 2);
    const coreGrad = ctx.createRadialGradient(0, -1, 0, 0, -1, 4);
    coreGrad.addColorStop(0, NORD.nord6);
    coreGrad.addColorStop(0.5, NORD.nord8);
    coreGrad.addColorStop(1, 'rgba(136, 192, 208, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Tech lines
    ctx.strokeStyle = `rgba(136, 192, 208, 0.3)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -player.size * 0.4);
    ctx.lineTo(player.size * 0.4, 0);
    ctx.moveTo(0, -player.size * 0.4);
    ctx.lineTo(-player.size * 0.4, 0);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ─── Projectile rendering ────────────────────────────────────

  renderProjectiles(projectiles: Projectile[], interpolation: number): void {
    const ctx = this.ctx;

    for (const p of projectiles) {
      if (!p.active) continue;
      const pos = vec2Lerp(p.previousPosition, p.position, interpolation);
      const sx = pos.x - this.camera.x;
      const sy = pos.y - this.camera.y;

      if (p.isPlayerProjectile) {
        // Cyan data packet
        ctx.fillStyle = NORD.nord8;
        ctx.fillRect(sx - p.size, sy - 1, p.size * 2, 2);

        // Glow trail
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = NORD.nord8;
        const prevPos = vec2Lerp(p.previousPosition, p.position, 0);
        const px = prevPos.x - this.camera.x;
        const py = prevPos.y - this.camera.y;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = NORD.nord8;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (p.marksTarget) {
          // Antivirus tracking ring
          ctx.strokeStyle = NORD.nord13;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Enemy projectile — red/orange threat
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        const threatGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size);
        threatGrad.addColorStop(0, NORD.nord11);
        threatGrad.addColorStop(1, 'rgba(191, 97, 106, 0.3)');
        ctx.fillStyle = threatGrad;
        ctx.fill();
      }
    }
  }

  // ─── Enemy rendering ─────────────────────────────────────────

  renderEnemies(enemies: EnemyEntity[], interpolation: number): void {
    const ctx = this.ctx;

    for (const e of enemies) {
      if (!e.active || e.hidden) continue;
      const pos = vec2Lerp(e.previousPosition, e.position, interpolation);
      const sx = pos.x - this.camera.x;
      const sy = pos.y - this.camera.y;
      const color = e.color || NORD.nord11;

      // Threat aura
      ctx.beginPath();
      ctx.arc(sx, sy, e.size + 4, 0, Math.PI * 2);
      const auraGrad = ctx.createRadialGradient(sx, sy, e.size * 0.5, sx, sy, e.size + 4);
      auraGrad.addColorStop(0, 'rgba(0,0,0,0)');
      auraGrad.addColorStop(1, this.colorWithAlpha(color, 0.08));
      ctx.fillStyle = auraGrad;
      ctx.fill();

      // Enemy body — angular malware shape
      ctx.save();
      ctx.translate(sx, sy);
      const wobble = Math.sin(this.time * 3 + e.id) * 0.1;
      ctx.rotate(wobble);

      // Outer shape
      ctx.beginPath();
      const sides = e.size > 20 ? 6 : e.size > 14 ? 5 : 4;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * e.size;
        const py = Math.sin(angle) * e.size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = this.colorWithAlpha(color, 0.6);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner malware "code" pattern
      ctx.fillStyle = this.colorWithAlpha(color, 0.3);
      const innerSize = e.size * 0.5;
      ctx.fillRect(-innerSize / 2, -innerSize / 2, innerSize, 2);
      ctx.fillRect(-2, -innerSize / 2, 2, innerSize);

      ctx.restore();

      // Health bar
      if (e.maxHealth > 15 && e.health < e.maxHealth) {
        const barW = e.size * 2.2;
        const barH = 3;
        const barX = sx - barW / 2;
        const barY = sy - e.size - 8;
        // Background
        ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        // Health fill
        const hpRatio = e.health / e.maxHealth;
        const hpColor = hpRatio > 0.5 ? color : NORD.nord11;
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
        // Frame
        ctx.strokeStyle = 'rgba(76, 86, 106, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barW, barH);
      }

      // Antivirus mark
      if (e.marked) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.time * 2);
        this.drawHexagon(0, 0, e.size + 4, `rgba(235, 203, 139, 0.5)`);
        ctx.restore();
        // Target crosshair
        ctx.strokeStyle = NORD.nord13;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(sx - e.size - 6, sy);
        ctx.lineTo(sx - e.size - 2, sy);
        ctx.moveTo(sx + e.size + 2, sy);
        ctx.lineTo(sx + e.size + 6, sy);
        ctx.moveTo(sx, sy - e.size - 6);
        ctx.lineTo(sx, sy - e.size - 2);
        ctx.moveTo(sx, sy + e.size + 2);
        ctx.lineTo(sx, sy + e.size + 6);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  // ─── Loot rendering ──────────────────────────────────────────

  renderLoot(drops: LootDrop[], interpolation: number): void {
    const ctx = this.ctx;

    for (const d of drops) {
      if (!d.active) continue;
      const pos = vec2Lerp(d.previousPosition, d.position, interpolation);
      const sx = pos.x - this.camera.x;
      const sy = pos.y - this.camera.y;
      const color = RESOURCE_COLORS[d.resourceType] || NORD.nord4;

      // Floating animation
      const floatY = Math.sin(this.time * 3 + d.id * 0.7) * 2;

      // Glow aura
      ctx.beginPath();
      ctx.arc(sx, sy + floatY, d.size + 4, 0, Math.PI * 2);
      const lootGrad = ctx.createRadialGradient(sx, sy + floatY, 0, sx, sy + floatY, d.size + 4);
      lootGrad.addColorStop(0, this.colorWithAlpha(color, 0.3));
      lootGrad.addColorStop(1, this.colorWithAlpha(color, 0));
      ctx.fillStyle = lootGrad;
      ctx.fill();

      // Data crystal shape
      ctx.save();
      ctx.translate(sx, sy + floatY);
      ctx.rotate(this.time * 1.5 + d.id);
      ctx.beginPath();
      ctx.moveTo(0, -d.size);
      ctx.lineTo(d.size * 0.6, 0);
      ctx.lineTo(0, d.size);
      ctx.lineTo(-d.size * 0.6, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // ─── Post-processing overlays ────────────────────────────────

  renderScanlines(): void {
    const ctx = this.ctx;
    ctx.globalAlpha = SCANLINE_OPACITY;
    ctx.fillStyle = '#000';
    for (let y = 0; y < this.canvasHeight; y += SCANLINE_SPACING) {
      ctx.fillRect(0, y, this.canvasWidth, 1);
    }
    ctx.globalAlpha = 1;
  }

  renderVignette(): void {
    const ctx = this.ctx;
    const cx = this.canvasWidth / 2;
    const cy = this.canvasHeight / 2;
    const radius = Math.max(this.canvasWidth, this.canvasHeight) * 0.7;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  renderFog(fogColor: string): void {
    this.ctx.fillStyle = fogColor;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  renderGlitchEffect(intensity: number = 0.02): void {
    if (Math.random() > intensity) return;
    const ctx = this.ctx;
    // Random horizontal slice displacement
    const sliceY = Math.random() * this.canvasHeight;
    const sliceH = 2 + Math.random() * 6;
    const offset = (Math.random() - 0.5) * 8;
    const imageData = ctx.getImageData(0, sliceY, this.canvasWidth, sliceH);
    ctx.putImageData(imageData, offset, sliceY);
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private drawCircuitTrace(sx: number, sy: number, size: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(136, 192, 208, ${CIRCUIT_TRACE_OPACITY})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // L-shaped circuit trace
    ctx.moveTo(sx + 4, sy + size * 0.3);
    ctx.lineTo(sx + size * 0.5, sy + size * 0.3);
    ctx.lineTo(sx + size * 0.5, sy + size - 4);
    ctx.stroke();
    // Dot at junction
    ctx.fillStyle = `rgba(136, 192, 208, ${CIRCUIT_TRACE_OPACITY * 1.5})`;
    ctx.fillRect(sx + size * 0.5 - 1, sy + size * 0.3 - 1, 2, 2);
  }

  private drawCyberMarker(x: number, y: number, color: string, label: string, type: string): void {
    const ctx = this.ctx;
    const pulse = Math.sin(this.time * 2.5) * 0.3 + 0.7;

    // Outer rotating ring
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.time * 0.8);
    this.drawHexagon(0, 0, 12, this.colorWithAlpha(color, pulse * 0.3));
    ctx.restore();

    // Inner pulsing dot
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = this.colorWithAlpha(color, pulse);
    ctx.fill();

    // Vertical scan line
    const scanY = Math.sin(this.time * 3) * 6;
    ctx.strokeStyle = this.colorWithAlpha(color, 0.2);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y + 14);
    ctx.stroke();

    // Label
    ctx.font = '7px monospace';
    ctx.fillStyle = this.colorWithAlpha(color, pulse * 0.8);
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 14);
  }

  private drawHexagon(cx: number, cy: number, radius: number, strokeColor: string): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private colorWithAlpha(hex: string, alpha: number): string {
    // Handle rgba strings
    if (hex.startsWith('rgba')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private buildPatterns(): void {
    // Could pre-render tile patterns to offscreen canvases for perf
    // Left as direct draw for now — works fine at mobile resolutions
  }
}

/** Deterministic "random" width for static text effects */
function randomStaticWidth(seed: number, min: number, max: number): number {
  return min + ((seed * 7 + 13) % (max - min));
}
