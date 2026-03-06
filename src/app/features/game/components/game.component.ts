import { Component, OnInit, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameCanvasComponent } from '../canvas/game-canvas.component';
import { GameStateService } from '../state/game-state.service';
import { ALL_PLANETS } from '../data/planet-data';
import { Planet } from '../../../core/models';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, GameCanvasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-container">
      <app-game-canvas />

      <!-- Planet name -->
      <div class="hud-top">
        <h1 class="planet-name">{{ state.planetName() }}</h1>
      </div>

      <!-- Selected country info -->
      @if (state.selectedCountry(); as country) {
        <div class="info-panel">
          <div class="panel-header">
            <span class="panel-title">{{ country.name }}</span>
            <button class="close-btn" (click)="state.selectCountry(null)">✕</button>
          </div>
          <div class="panel-body">
            <div><span class="label">Region:</span> {{ country.id }}</div>
            @if (country.terrain) {
              <div class="terrain-tag" [attr.data-terrain]="country.terrain">
                {{ country.terrain }}
              </div>
            }
          </div>
        </div>
      }

      <!-- Hovered country tooltip -->
      @if (hoveredName(); as name) {
        <div class="hover-tooltip">{{ name }}</div>
      }

      <!-- Travel panel -->
      <div class="travel-panel">
        <div class="panel-header">
          <span class="panel-title">Travel</span>
        </div>
        <div class="travel-list">
          @for (planet of connectedPlanets(); track planet.id) {
            <button
              class="travel-btn"
              [style.borderColor]="planet.theme?.atmosphereColor ?? '#888'"
              (click)="travelTo(planet)"
            >
              <span class="travel-dot" [style.backgroundColor]="planet.theme?.atmosphereColor ?? '#888'"></span>
              {{ planet.name }}
            </button>
          }
          @empty {
            <span class="no-connections">No connections</span>
          }
        </div>
      </div>

      <!-- Zoom controls -->
      <div class="zoom-controls">
        <button class="zoom-btn" (click)="state.setZoom(0.2)">+</button>
        <button class="zoom-btn" (click)="state.setZoom(-0.2)">−</button>
      </div>

      <!-- Travel transition overlay -->
      @if (state.isTraveling()) {
        <div class="travel-overlay" (animationend)="onTravelAnimEnd()">
          <span class="travel-text">Traveling to {{ state.travelTarget()?.name }}...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .game-container {
      position: relative;
      width: 100%;
      height: 100%;
      background: #050510;
    }

    .hud-top {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      text-align: center;
    }

    .planet-name {
      font-size: 1.8rem;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.85);
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }

    .info-panel {
      position: absolute;
      bottom: 24px;
      left: 24px;
      background: rgba(10, 10, 30, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      min-width: 200px;
      backdrop-filter: blur(8px);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .panel-title {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .panel-body {
      padding: 10px 14px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
    }

    .label {
      color: rgba(255, 255, 255, 0.4);
    }

    .terrain-tag {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      font-size: 1rem;
      padding: 0 4px;
    }
    .close-btn:hover { color: white; }

    .hover-tooltip {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 10, 30, 0.8);
      color: rgba(255, 255, 255, 0.85);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      pointer-events: none;
      letter-spacing: 0.05em;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .travel-panel {
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(10, 10, 30, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      min-width: 160px;
      backdrop-filter: blur(8px);
    }

    .travel-list {
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .travel-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.8);
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.85rem;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .travel-btn:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .travel-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .no-connections {
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.8rem;
      padding: 8px;
    }

    .zoom-controls {
      position: absolute;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .zoom-btn {
      width: 40px;
      height: 40px;
      background: rgba(10, 10, 30, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      transition: background 0.2s;
    }
    .zoom-btn:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .travel-overlay {
      position: absolute;
      inset: 0;
      background: #050510;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: travel-flash 1.2s ease-in-out forwards;
      z-index: 100;
    }

    .travel-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.2rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    @keyframes travel-flash {
      0% { opacity: 0; }
      30% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
  `],
})
export class GameComponent implements OnInit {
  readonly state = inject(GameStateService);

  readonly hoveredName = computed(() => {
    const hovered = this.state.hoveredCountry();
    const selected = this.state.selectedCountry();
    if (hovered && hovered.id !== selected?.id) return hovered.name;
    return null;
  });

  readonly connectedPlanets = computed(() => {
    const current = this.state.currentPlanet();
    if (!current) return [];
    const all = this.state.availablePlanets();
    return all.filter(p => current.connections.includes(p.id));
  });

  ngOnInit(): void {
    this.state.availablePlanets.set(ALL_PLANETS);
    this.state.setPlanet(ALL_PLANETS[0]);
  }

  travelTo(planet: Planet): void {
    this.state.travelTo(planet);
  }

  onTravelAnimEnd(): void {
    this.state.completeTravelTransition();
  }
}
