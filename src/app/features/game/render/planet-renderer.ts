import { Planet, Country, CloudConfig } from '../../../core/models';
import { TerrainType } from '../../../core/models/country.model';
import { projectGeoPoint, ScreenPoint, pointInPolygon } from '../../../core/utils/projection';

interface RenderState {
  rotationX: number;
  rotationY: number;
  zoom: number;
  selectedCountryId: string | null;
  hoveredCountryId: string | null;
}

interface ProjectedCountry {
  country: Country;
  polygons: { x: number; y: number }[][];
  visible: boolean;
  centerX: number;
  centerY: number;
}

interface CloudPatch {
  lat: number;
  lon: number;
  size: number;
  seed: number;
}

export class PlanetRenderer {
  private ctx!: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private projectedCountries: ProjectedCountry[] = [];
  private time = 0;
  private cloudPatches = new Map<string, CloudPatch[]>();

  attach(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  render(planet: Planet, state: RenderState): void {
    const ctx = this.ctx;
    if (!ctx) return;

    this.time += 1 / 60;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const baseRadius = Math.min(this.width, this.height) * 0.35;
    const radius = baseRadius * state.zoom;
    const theme = planet.theme;

    ctx.clearRect(0, 0, this.width, this.height);

    this.drawStarfield(ctx);

    // Atmosphere glow
    if (theme) {
      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.3);
      gradient.addColorStop(0, theme.atmosphereColor + '40');
      gradient.addColorStop(0.5, theme.atmosphereColor + '15');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Planet base
    const baseGradient = ctx.createRadialGradient(
      cx - radius * 0.3, cy - radius * 0.3, radius * 0.1,
      cx, cy, radius,
    );
    baseGradient.addColorStop(0, this.lightenColor(theme?.baseColor ?? '#1a1a4e', 40));
    baseGradient.addColorStop(0.6, theme?.baseColor ?? '#1a1a4e');
    baseGradient.addColorStop(1, theme?.shadowColor ?? '#0a0a20');

    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Grid lines
    this.drawGridLines(ctx, cx, cy, radius, state.rotationX, state.rotationY, theme?.gridColor ?? 'rgba(100,100,255,0.1)');

    // Project and render countries
    this.projectedCountries = this.projectCountries(planet, state.rotationX, state.rotationY, radius, cx, cy);

    for (const pc of this.projectedCountries) {
      if (!pc.visible) continue;
      this.drawCountry(ctx, pc, cx, cy, radius, state.selectedCountryId, state.hoveredCountryId);
    }

    // Draw terrain details (forest, etc.) on top of country fill
    for (const pc of this.projectedCountries) {
      if (!pc.visible) continue;
      this.drawTerrainOverlay(ctx, pc, cx, cy, radius, state.rotationX, state.rotationY);
    }

    // Clouds
    if (theme?.clouds) {
      this.drawClouds(ctx, planet.id, theme.clouds, cx, cy, radius, state.rotationX, state.rotationY);
    }

    // Specular highlight
    const specGradient = ctx.createRadialGradient(
      cx - radius * 0.25, cy - radius * 0.3, 0,
      cx - radius * 0.25, cy - radius * 0.3, radius * 0.6,
    );
    specGradient.addColorStop(0, 'rgba(255,255,255,0.12)');
    specGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = specGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  hitTest(
    screenX: number,
    screenY: number,
    planet: Planet,
    state: RenderState,
  ): Country | null {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const baseRadius = Math.min(this.width, this.height) * 0.35;
    const radius = baseRadius * state.zoom;

    const dx = screenX - cx;
    const dy = screenY - cy;
    if (dx * dx + dy * dy > radius * radius) return null;

    const projected = this.projectCountries(planet, state.rotationX, state.rotationY, radius, cx, cy);

    for (let i = projected.length - 1; i >= 0; i--) {
      const pc = projected[i];
      if (!pc.visible) continue;
      for (const poly of pc.polygons) {
        if (pointInPolygon(screenX, screenY, poly)) {
          return pc.country;
        }
      }
    }
    return null;
  }

  private projectCountries(
    planet: Planet,
    rotationX: number,
    rotationY: number,
    radius: number,
    cx: number,
    cy: number,
  ): ProjectedCountry[] {
    return planet.countries.map(country => {
      const projectedPolys: { x: number; y: number }[][] = [];
      let anyVisible = false;
      let sumX = 0, sumY = 0, count = 0;

      for (const geo of country.polygons) {
        const screenPts: ScreenPoint[] = geo.points.map(p =>
          projectGeoPoint(p, rotationX, rotationY, radius),
        );

        const allHidden = screenPts.every(p => !p.visible);
        if (allHidden) continue;

        anyVisible = true;
        const mapped = screenPts.map(p => ({ x: p.x + cx, y: p.y + cy }));
        projectedPolys.push(mapped);
        for (const pt of mapped) { sumX += pt.x; sumY += pt.y; count++; }
      }

      return {
        country,
        polygons: projectedPolys,
        visible: anyVisible,
        centerX: count > 0 ? sumX / count : cx,
        centerY: count > 0 ? sumY / count : cy,
      };
    });
  }

  private drawCountry(
    ctx: CanvasRenderingContext2D,
    pc: ProjectedCountry,
    cx: number,
    cy: number,
    radius: number,
    selectedId: string | null,
    hoveredId: string | null,
  ): void {
    const style = pc.country.style;
    const isSelected = pc.country.id === selectedId;
    const isHovered = pc.country.id === hoveredId;

    let fill = style?.fillColor ?? '#335577';
    if (isSelected) fill = style?.selectedFillColor ?? '#88aacc';
    else if (isHovered) fill = style?.hoverFillColor ?? '#557799';

    const border = style?.borderColor ?? '#aaccee';

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    for (const poly of pc.polygons) {
      if (poly.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x, poly[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = fill;
      ctx.globalAlpha = isSelected ? 0.9 : 0.75;
      ctx.fill();

      ctx.strokeStyle = border;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==============================
  // TERRAIN OVERLAYS
  // ==============================
  private drawTerrainOverlay(
    ctx: CanvasRenderingContext2D,
    pc: ProjectedCountry,
    cx: number,
    cy: number,
    radius: number,
    rotationX: number,
    rotationY: number,
  ): void {
    const terrain = pc.country.terrain;
    if (!terrain) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Clip to country polygon
    ctx.beginPath();
    for (const poly of pc.polygons) {
      if (poly.length < 3) continue;
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
    }
    ctx.clip();

    switch (terrain) {
      case 'forest':
        this.drawForestTerrain(ctx, pc, radius);
        break;
      case 'fungal':
        this.drawFungalTerrain(ctx, pc, radius);
        break;
      case 'volcanic':
        this.drawVolcanicTerrain(ctx, pc, radius);
        break;
      case 'crystal':
        this.drawCrystalTerrain(ctx, pc, radius);
        break;
      case 'mountain':
        this.drawMountainTerrain(ctx, pc, radius);
        break;
      case 'desert':
        this.drawDesertTerrain(ctx, pc, radius);
        break;
      case 'swamp':
        this.drawSwampTerrain(ctx, pc, radius);
        break;
    }

    ctx.restore();
  }

  private drawForestTerrain(ctx: CanvasRenderingContext2D, pc: ProjectedCountry, radius: number): void {
    const seed = this.hashStr(pc.country.id);
    const treeCount = 12 + (seed % 8);
    const bounds = this.getPolygonBounds(pc.polygons);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < treeCount; i++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);

      if (!this.isInsidePolygons(x, y, pc.polygons)) continue;

      const scale = 0.4 + rng() * 0.6;
      const h = (6 + rng() * 5) * scale;
      const w = (4 + rng() * 3) * scale;

      // Tree trunk
      ctx.fillStyle = 'rgba(60, 30, 10, 0.6)';
      ctx.fillRect(x - 0.5 * scale, y, 1 * scale, h * 0.35);

      // Tree canopy (triangle)
      ctx.fillStyle = `rgba(${30 + Math.floor(rng() * 40)}, ${100 + Math.floor(rng() * 80)}, ${20 + Math.floor(rng() * 30)}, 0.7)`;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.7);
      ctx.lineTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
      ctx.closePath();
      ctx.fill();

      // Second canopy layer (slightly higher, smaller)
      ctx.fillStyle = `rgba(${40 + Math.floor(rng() * 30)}, ${120 + Math.floor(rng() * 60)}, ${30 + Math.floor(rng() * 20)}, 0.6)`;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x - w * 0.35, y - h * 0.35);
      ctx.lineTo(x + w * 0.35, y - h * 0.35);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawFungalTerrain(ctx: CanvasRenderingContext2D, pc: ProjectedCountry, radius: number): void {
    const seed = this.hashStr(pc.country.id);
    const count = 10 + (seed % 6);
    const bounds = this.getPolygonBounds(pc.polygons);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);
      if (!this.isInsidePolygons(x, y, pc.polygons)) continue;

      const scale = 0.5 + rng() * 0.7;
      const h = 5 * scale;

      // Stem
      ctx.strokeStyle = 'rgba(180, 180, 150, 0.5)';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - h);
      ctx.stroke();

      // Cap (ellipse)
      ctx.fillStyle = `rgba(${160 + Math.floor(rng() * 80)}, ${60 + Math.floor(rng() * 80)}, ${100 + Math.floor(rng() * 80)}, 0.65)`;
      ctx.beginPath();
      ctx.ellipse(x, y - h, 3.5 * scale, 2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spots
      ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
      ctx.beginPath();
      ctx.arc(x - 1 * scale, y - h - 0.5 * scale, 0.6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawVolcanicTerrain(ctx: CanvasRenderingContext2D, pc: ProjectedCountry, radius: number): void {
    const seed = this.hashStr(pc.country.id);
    const count = 6 + (seed % 4);
    const bounds = this.getPolygonBounds(pc.polygons);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);
      if (!this.isInsidePolygons(x, y, pc.polygons)) continue;

      const scale = 0.5 + rng() * 0.6;

      // Lava crack
      ctx.strokeStyle = `rgba(255, ${80 + Math.floor(rng() * 80)}, 0, ${0.3 + rng() * 0.3})`;
      ctx.lineWidth = 1 + rng() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segments = 3 + Math.floor(rng() * 3);
      for (let s = 0; s < segments; s++) {
        ctx.lineTo(
          x + (rng() - 0.5) * 14 * scale,
          y + (rng() - 0.5) * 14 * scale,
        );
      }
      ctx.stroke();

      // Lava glow
      if (rng() > 0.5) {
        const glowR = 3 + rng() * 4;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR * scale);
        grad.addColorStop(0, 'rgba(255, 120, 0, 0.25)');
        grad.addColorStop(1, 'rgba(255, 60, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, glowR * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawCrystalTerrain(ctx: CanvasRenderingContext2D, pc: ProjectedCountry, radius: number): void {
    const seed = this.hashStr(pc.country.id);
    const count = 8 + (seed % 5);
    const bounds = this.getPolygonBounds(pc.polygons);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);
      if (!this.isInsidePolygons(x, y, pc.polygons)) continue;

      const scale = 0.5 + rng() * 0.5;
      const h = (8 + rng() * 6) * scale;
      const w = (2 + rng() * 2) * scale;

      // Crystal shard
      const hue = 240 + Math.floor(rng() * 60);
      const pulse = 0.5 + 0.2 * Math.sin(this.time * 2 + i);
      ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${pulse})`;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x - w, y);
      ctx.lineTo(x + w * 0.3, y);
      ctx.closePath();
      ctx.fill();

      // Shine line
      ctx.strokeStyle = `hsla(${hue}, 90%, 85%, ${pulse * 0.8})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.2, y - h * 0.8);
      ctx.lineTo(x - w * 0.5, y - h * 0.2);
      ctx.stroke();
    }
  }

  private drawMountainTerrain(ctx: CanvasRenderingContext2D, pc: ProjectedCountry, radius: number): void {
    const seed = this.hashStr(pc.country.id);
    const count = 5 + (seed % 4);
    const bounds = this.getPolygonBounds(pc.polygons);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);
      if (!this.isInsidePolygons(x, y, pc.polygons)) continue;

      const scale = 0.6 + rng() * 0.6;
      const h = (10 + rng() * 8) * scale;
      const w = (8 + rng() * 6) * scale;

      // Mountain body
      ctx.fillStyle = `rgba(80, 70, 60, ${0.4 + rng() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x - w, y);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();

      // Snow cap
      ctx.fillStyle = 'rgba(220, 220, 240, 0.5)';
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x - w * 0.25, y - h * 0.65);
      ctx.lineTo(x + w * 0.2, y - h * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawDesertTerrain(ctx: CanvasRenderingContext2D, pc: ProjectedCountry, radius: number): void {
    const seed = this.hashStr(pc.country.id);
    const count = 6 + (seed % 4);
    const bounds = this.getPolygonBounds(pc.polygons);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);
      if (!this.isInsidePolygons(x, y, pc.polygons)) continue;

      const scale = 0.5 + rng() * 0.6;

      // Sand dune (arc)
      ctx.strokeStyle = `rgba(${200 + Math.floor(rng() * 40)}, ${170 + Math.floor(rng() * 40)}, ${100 + Math.floor(rng() * 40)}, 0.35)`;
      ctx.lineWidth = 1 + rng();
      ctx.beginPath();
      ctx.arc(x, y + 4 * scale, 8 * scale, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }

  private drawSwampTerrain(ctx: CanvasRenderingContext2D, pc: ProjectedCountry, radius: number): void {
    const seed = this.hashStr(pc.country.id);
    const count = 8 + (seed % 4);
    const bounds = this.getPolygonBounds(pc.polygons);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < count; i++) {
      const x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + rng() * (bounds.maxY - bounds.minY);
      if (!this.isInsidePolygons(x, y, pc.polygons)) continue;

      const scale = 0.4 + rng() * 0.5;

      // Water puddle
      ctx.fillStyle = `rgba(40, ${80 + Math.floor(rng() * 40)}, ${80 + Math.floor(rng() * 40)}, 0.3)`;
      ctx.beginPath();
      ctx.ellipse(x, y, (4 + rng() * 3) * scale, (2 + rng() * 2) * scale, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();

      // Reed
      if (rng() > 0.4) {
        ctx.strokeStyle = 'rgba(60, 100, 40, 0.5)';
        ctx.lineWidth = 0.8;
        const reedH = 4 + rng() * 4;
        ctx.beginPath();
        ctx.moveTo(x + 2 * scale, y);
        ctx.quadraticCurveTo(x + 2 * scale + rng() * 2, y - reedH * scale * 0.5, x + 3 * scale, y - reedH * scale);
        ctx.stroke();
      }
    }
  }

  // ==============================
  // CLOUDS
  // ==============================
  private drawClouds(
    ctx: CanvasRenderingContext2D,
    planetId: string,
    config: CloudConfig,
    cx: number,
    cy: number,
    radius: number,
    rotationX: number,
    rotationY: number,
  ): void {
    if (!this.cloudPatches.has(planetId)) {
      this.generateCloudPatches(planetId, config.count);
    }
    const patches = this.cloudPatches.get(planetId)!;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    for (const patch of patches) {
      // Clouds drift with time
      const driftLon = patch.lon + this.time * config.speed * 20;

      const centerP = projectGeoPoint(
        { lat: patch.lat, lon: driftLon },
        rotationX, rotationY, radius,
      );

      if (!centerP.visible) continue;

      const screenX = centerP.x + cx;
      const screenY = centerP.y + cy;
      const cloudRadius = patch.size * radius * 0.015;

      // Cloud blob (multiple circles for fluffy look)
      ctx.globalAlpha = config.opacity * 0.8;
      ctx.fillStyle = config.color;

      const rng = this.seededRandom(patch.seed);
      const blobs = 3 + Math.floor(rng() * 3);
      for (let b = 0; b < blobs; b++) {
        const ox = (rng() - 0.5) * cloudRadius * 1.5;
        const oy = (rng() - 0.5) * cloudRadius * 0.6;
        const br = cloudRadius * (0.5 + rng() * 0.5);
        ctx.beginPath();
        ctx.arc(screenX + ox, screenY + oy, br, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private generateCloudPatches(planetId: string, count: number): void {
    const rng = this.seededRandom(this.hashStr(planetId + '_clouds'));
    const patches: CloudPatch[] = [];
    for (let i = 0; i < count; i++) {
      patches.push({
        lat: (rng() - 0.5) * 140,
        lon: rng() * 360 - 180,
        size: 3 + rng() * 6,
        seed: Math.floor(rng() * 100000),
      });
    }
    this.cloudPatches.set(planetId, patches);
  }

  // ==============================
  // GRID LINES
  // ==============================
  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    rotationX: number,
    rotationY: number,
    color: string,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;

    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = projectGeoPoint({ lat, lon }, rotationX, rotationY, radius);
        if (p.visible) {
          if (!started) { ctx.moveTo(p.x + cx, p.y + cy); started = true; }
          else ctx.lineTo(p.x + cx, p.y + cy);
        } else { started = false; }
      }
      ctx.stroke();
    }

    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 5) {
        const p = projectGeoPoint({ lat, lon }, rotationX, rotationY, radius);
        if (p.visible) {
          if (!started) { ctx.moveTo(p.x + cx, p.y + cy); started = true; }
          else ctx.lineTo(p.x + cx, p.y + cy);
        } else { started = false; }
      }
      ctx.stroke();
    }
  }

  // ==============================
  // STARFIELD
  // ==============================
  private starPositions: { x: number; y: number; size: number; brightness: number }[] = [];
  private lastStarfieldSize = '';

  private drawStarfield(ctx: CanvasRenderingContext2D): void {
    const key = `${this.width}x${this.height}`;
    if (this.lastStarfieldSize !== key) {
      this.lastStarfieldSize = key;
      this.starPositions = [];
      const count = Math.floor((this.width * this.height) / 2000);
      for (let i = 0; i < count; i++) {
        this.starPositions.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: Math.random() * 1.5 + 0.5,
          brightness: Math.random() * 0.6 + 0.4,
        });
      }
    }

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, this.width, this.height);

    for (const star of this.starPositions) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==============================
  // HELPERS
  // ==============================
  private lightenColor(hex: string, amount: number): string {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r},${g},${b})`;
  }

  private hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  private seededRandom(seed: number): () => number {
    let s = seed || 1;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  private getPolygonBounds(polygons: { x: number; y: number }[][]): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const poly of polygons) {
      for (const p of poly) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    return { minX, maxX, minY, maxY };
  }

  private isInsidePolygons(x: number, y: number, polygons: { x: number; y: number }[][]): boolean {
    for (const poly of polygons) {
      if (pointInPolygon(x, y, poly)) return true;
    }
    return false;
  }
}
