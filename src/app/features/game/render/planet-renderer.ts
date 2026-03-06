import { Planet, Country } from '../../../core/models';
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
}

export class PlanetRenderer {
  private ctx!: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private projectedCountries: ProjectedCountry[] = [];

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

    const cx = this.width / 2;
    const cy = this.height / 2;
    const baseRadius = Math.min(this.width, this.height) * 0.35;
    const radius = baseRadius * state.zoom;
    const theme = planet.theme;

    // Clear
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw starfield background
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

    // Specular highlight
    const specGradient = ctx.createRadialGradient(
      cx - radius * 0.25, cy - radius * 0.3, 0,
      cx - radius * 0.25, cy - radius * 0.3, radius * 0.6,
    );
    specGradient.addColorStop(0, 'rgba(255,255,255,0.15)');
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

    // Check if inside globe
    const dx = screenX - cx;
    const dy = screenY - cy;
    if (dx * dx + dy * dy > radius * radius) return null;

    const projected = this.projectCountries(planet, state.rotationX, state.rotationY, radius, cx, cy);

    // Check in reverse order (top-most rendered last)
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

      for (const geo of country.polygons) {
        const screenPts: ScreenPoint[] = geo.points.map(p =>
          projectGeoPoint(p, rotationX, rotationY, radius),
        );

        const allHidden = screenPts.every(p => !p.visible);
        if (allHidden) continue;

        anyVisible = true;
        projectedPolys.push(screenPts.map(p => ({ x: p.x + cx, y: p.y + cy })));
      }

      return { country, polygons: projectedPolys, visible: anyVisible };
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

    // Clip to globe circle
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
      ctx.globalAlpha = isSelected ? 0.9 : 0.7;
      ctx.fill();

      ctx.strokeStyle = border;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

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

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = projectGeoPoint({ lat, lon }, rotationX, rotationY, radius);
        if (p.visible) {
          if (!started) {
            ctx.moveTo(p.x + cx, p.y + cy);
            started = true;
          } else {
            ctx.lineTo(p.x + cx, p.y + cy);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Longitude lines
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 5) {
        const p = projectGeoPoint({ lat, lon }, rotationX, rotationY, radius);
        if (p.visible) {
          if (!started) {
            ctx.moveTo(p.x + cx, p.y + cy);
            started = true;
          } else {
            ctx.lineTo(p.x + cx, p.y + cy);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }
  }

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

    // Dark space background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, this.width, this.height);

    for (const star of this.starPositions) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private lightenColor(hex: string, amount: number): string {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r},${g},${b})`;
  }
}
