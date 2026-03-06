import { Injectable, signal, computed } from '@angular/core';
import { Planet, Country } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  readonly currentPlanet = signal<Planet | null>(null);
  readonly selectedCountry = signal<Country | null>(null);
  readonly hoveredCountry = signal<Country | null>(null);
  readonly rotationX = signal(0);
  readonly rotationY = signal(0.3);
  readonly zoom = signal(1);
  readonly travelTarget = signal<Planet | null>(null);
  readonly isTraveling = signal(false);
  readonly availablePlanets = signal<Planet[]>([]);

  readonly MIN_ZOOM = 0.5;
  readonly MAX_ZOOM = 3;

  readonly planetName = computed(() => this.currentPlanet()?.name ?? '');

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
    this.travelTarget.set(planet);
    this.isTraveling.set(true);
  }

  completeTravelTransition(): void {
    const target = this.travelTarget();
    if (target) {
      this.setPlanet(target);
      this.travelTarget.set(null);
      this.isTraveling.set(false);
    }
  }
}
