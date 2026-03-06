import { GameStateService } from '../state/game-state.service';
import { PlanetRenderer } from '../render/planet-renderer';

const ROTATION_SENSITIVITY = 0.005;
const ZOOM_SENSITIVITY = 0.001;

export class InputHandler {
  private canvas!: HTMLCanvasElement;
  private state!: GameStateService;
  private renderer!: PlanetRenderer;

  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private hasMoved = false;

  // Touch state
  private lastPinchDistance = 0;

  private boundMouseDown = this.onMouseDown.bind(this);
  private boundMouseMove = this.onMouseMove.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);
  private boundWheel = this.onWheel.bind(this);
  private boundClick = this.onClick.bind(this);
  private boundTouchStart = this.onTouchStart.bind(this);
  private boundTouchMove = this.onTouchMove.bind(this);
  private boundTouchEnd = this.onTouchEnd.bind(this);
  private boundContextMenu = (e: Event) => e.preventDefault();

  attach(canvas: HTMLCanvasElement, state: GameStateService, renderer: PlanetRenderer): void {
    this.canvas = canvas;
    this.state = state;
    this.renderer = renderer;

    canvas.addEventListener('mousedown', this.boundMouseDown);
    canvas.addEventListener('mousemove', this.boundMouseMove);
    canvas.addEventListener('mouseup', this.boundMouseUp);
    canvas.addEventListener('mouseleave', this.boundMouseUp);
    canvas.addEventListener('wheel', this.boundWheel, { passive: false });
    canvas.addEventListener('click', this.boundClick);
    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.boundTouchEnd);
    canvas.addEventListener('contextmenu', this.boundContextMenu);
  }

  detach(): void {
    const c = this.canvas;
    if (!c) return;
    c.removeEventListener('mousedown', this.boundMouseDown);
    c.removeEventListener('mousemove', this.boundMouseMove);
    c.removeEventListener('mouseup', this.boundMouseUp);
    c.removeEventListener('mouseleave', this.boundMouseUp);
    c.removeEventListener('wheel', this.boundWheel);
    c.removeEventListener('click', this.boundClick);
    c.removeEventListener('touchstart', this.boundTouchStart);
    c.removeEventListener('touchmove', this.boundTouchMove);
    c.removeEventListener('touchend', this.boundTouchEnd);
    c.removeEventListener('contextmenu', this.boundContextMenu);
  }

  private getCanvasCoords(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.hasMoved = false;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private onMouseMove(e: MouseEvent): void {
    const coords = this.getCanvasCoords(e);
    this.updateHover(coords.x, coords.y);

    if (!this.isDragging) return;

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      this.hasMoved = true;
    }

    this.state.rotate(dx * ROTATION_SENSITIVITY, dy * ROTATION_SENSITIVITY);
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private onMouseUp(_e: MouseEvent): void {
    this.isDragging = false;
  }

  private onClick(e: MouseEvent): void {
    if (this.hasMoved) return;
    const coords = this.getCanvasCoords(e);
    this.performSelection(coords.x, coords.y);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    this.state.setZoom(delta);
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.hasMoved = false;
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      this.lastPinchDistance = this.getPinchDistance(e.touches);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.lastX;
      const dy = e.touches[0].clientY - this.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.hasMoved = true;
      this.state.rotate(dx * ROTATION_SENSITIVITY, dy * ROTATION_SENSITIVITY);
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = this.getPinchDistance(e.touches);
      const delta = (dist - this.lastPinchDistance) * 0.005;
      this.state.setZoom(delta);
      this.lastPinchDistance = dist;
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0 && !this.hasMoved && e.changedTouches.length === 1) {
      const coords = this.getCanvasCoords(e.changedTouches[0]);
      this.performSelection(coords.x, coords.y);
    }
    this.isDragging = false;
  }

  private getPinchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateHover(screenX: number, screenY: number): void {
    const planet = this.state.currentPlanet();
    if (!planet) return;
    const hit = this.renderer.hitTest(screenX, screenY, planet, {
      rotationX: this.state.rotationX(),
      rotationY: this.state.rotationY(),
      zoom: this.state.zoom(),
      selectedCountryId: null,
      hoveredCountryId: null,
    });
    this.state.hoverCountry(hit);
    this.canvas.style.cursor = hit ? 'pointer' : 'grab';
  }

  private performSelection(screenX: number, screenY: number): void {
    const planet = this.state.currentPlanet();
    if (!planet) return;
    const hit = this.renderer.hitTest(screenX, screenY, planet, {
      rotationX: this.state.rotationX(),
      rotationY: this.state.rotationY(),
      zoom: this.state.zoom(),
      selectedCountryId: null,
      hoveredCountryId: null,
    });
    this.state.selectCountry(hit);
  }
}
