import { Injectable, signal, computed } from '@angular/core';
import { Planet, Country } from '../../../core/models';

export type TravelPhase = 'idle' | 'warp-out' | 'warp' | 'warp-in';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  readonly currentPlanet = signal<Planet | null>(null);
  readonly selectedCountry = signal<Country | null>(null);
  readonly hoveredCountry = signal<Country | null>(null);
  readonly rotationX = signal(0);
  readonly rotationY = signal(0.3);
  readonly zoom = signal(1);
  readonly travelTarget = signal<Planet | null>(null);
  readonly travelPhase = signal<TravelPhase>('idle');
  readonly travelProgress = signal(0);
  readonly availablePlanets = signal<Planet[]>([]);

  // Ship orbit angle (radians), updated each frame
  readonly shipOrbitAngle = signal(0);

  readonly MIN_ZOOM = 0.5;
  readonly MAX_ZOOM = 3;

  readonly planetName = computed(() => this.currentPlanet()?.name ?? '');
  readonly isTraveling = computed(() => this.travelPhase() !== 'idle');

  selectCountry(country: Country | null): void {
    this.selectedCountry.set(country);
  }

  hoverCountry(country: Country | null): void {
    this.hoveredCountry.set(country);
  }

  rotate(dx: number, dy: number): void {
    this.rotationX.update(r => r + dx);
    this.rotationY.update(r => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, r + dy)));
  }

  setZoom(delta: number): void {
    this.zoom.update(z => Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, z + delta)));
  }

  setPlanet(planet: Planet): void {
    this.currentPlanet.set(planet);
    this.selectedCountry.set(null);
    this.hoveredCountry.set(null);
    this.rotationX.set(0);
    this.rotationY.set(0.3);
    this.zoom.set(1);
  }

  travelTo(planet: Planet): void {
    if (this.travelPhase() !== 'idle') return;
    this.travelTarget.set(planet);
    this.travelPhase.set('warp-out');
    this.travelProgress.set(0);
    this.selectedCountry.set(null);
    this.hoveredCountry.set(null);
  }

  /** Called each frame to advance travel animation. Returns true while animating. */
  advanceTravel(dt: number): boolean {
    const phase = this.travelPhase();
    if (phase === 'idle') return false;

    const WARP_OUT_DURATION = 1.2;
    const WARP_DURATION = 0.8;
    const WARP_IN_DURATION = 1.2;

    let progress = this.travelProgress() + dt;

    if (phase === 'warp-out') {
      if (progress >= WARP_OUT_DURATION) {
        this.travelPhase.set('warp');
        this.travelProgress.set(0);
        // Switch planet at warp midpoint
        const target = this.travelTarget();
        if (target) {
          this.currentPlanet.set(target);
          this.selectedCountry.set(null);
          this.hoveredCountry.set(null);
          this.rotationX.set(0);
          this.rotationY.set(0.3);
          this.zoom.set(1);
        }
      } else {
        this.travelProgress.set(progress);
      }
    } else if (phase === 'warp') {
      if (progress >= WARP_DURATION) {
        this.travelPhase.set('warp-in');
        this.travelProgress.set(0);
      } else {
        this.travelProgress.set(progress);
      }
    } else if (phase === 'warp-in') {
      if (progress >= WARP_IN_DURATION) {
        this.travelPhase.set('idle');
        this.travelProgress.set(0);
        this.travelTarget.set(null);
      } else {
        this.travelProgress.set(progress);
      }
    }

    return true;
  }

  advanceShipOrbit(dt: number): void {
    this.shipOrbitAngle.update(a => a + dt * 0.6);
  }
}
