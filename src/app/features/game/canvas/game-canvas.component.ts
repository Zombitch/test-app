import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  NgZone,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { GameStateService } from '../state/game-state.service';
import { PlanetRenderer } from '../render/planet-renderer';
import { InputHandler } from '../input/input-handler';

@Component({
  selector: 'app-game-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #gameCanvas></canvas>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: grab;
    }
  `],
})
export class GameCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private state = inject(GameStateService);
  private zone = inject(NgZone);
  private renderer = new PlanetRenderer();
  private inputHandler = new InputHandler();
  private animFrameId = 0;
  private resizeObserver!: ResizeObserver;
  private lastFrameTime = 0;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    this.renderer.attach(ctx);
    this.inputHandler.attach(canvas, this.state, this.renderer);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas.parentElement!);
    this.handleResize();

    this.lastFrameTime = performance.now();
    this.zone.runOutsideAngular(() => this.renderLoop());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
    this.inputHandler.detach();
    this.resizeObserver.disconnect();
  }

  private handleResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    this.renderer.resize(w, h);
  }

  private renderLoop = (): void => {
    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1); // cap at 100ms
    this.lastFrameTime = now;

    // Advance ship orbit
    this.state.advanceShipOrbit(dt);

    // Advance travel animation
    this.state.advanceTravel(dt);

    const planet = this.state.currentPlanet();
    const target = this.state.travelTarget();

    if (planet) {
      this.renderer.renderScene(planet, {
        rotationX: this.state.rotationX(),
        rotationY: this.state.rotationY(),
        zoom: this.state.zoom(),
        selectedCountryId: this.state.selectedCountry()?.id ?? null,
        hoveredCountryId: this.state.hoveredCountry()?.id ?? null,
        shipOrbitAngle: this.state.shipOrbitAngle(),
        travelPhase: this.state.travelPhase(),
        travelProgress: this.state.travelProgress(),
        targetPlanetName: target?.name ?? null,
        targetAtmosphereColor: target?.theme?.atmosphereColor ?? null,
      });
    }

    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };
}
