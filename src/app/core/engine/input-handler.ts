import { Vec2, vec2 } from './math-utils';

/** Handles touch/mouse/keyboard input for mobile-first controls */
export class InputHandler {
  /** Normalized movement direction from left-thumb joystick */
  movement: Vec2 = vec2(0, 0);

  /** Whether skill button is pressed */
  skillPressed = false;

  private joystickOrigin: Vec2 | null = null;
  private joystickCurrent: Vec2 | null = null;
  private joystickTouchId: number | null = null;
  private skillTouchId: number | null = null;
  private readonly joystickRadius = 60;

  // Keyboard fallback
  private keys = new Set<string>();

  /** Joystick rendering info */
  get joystickActive(): boolean {
    return this.joystickOrigin !== null;
  }

  get joystickOriginPos(): Vec2 | null {
    return this.joystickOrigin;
  }

  get joystickCurrentPos(): Vec2 | null {
    return this.joystickCurrent;
  }

  get joystickRadiusSize(): number {
    return this.joystickRadius;
  }

  bind(canvas: HTMLCanvasElement): void {
    // Touch events
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

    // Keyboard fallback for testing
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  unbind(canvas: HTMLCanvasElement): void {
    canvas.removeEventListener('touchstart', this.onTouchStart);
    canvas.removeEventListener('touchmove', this.onTouchMove);
    canvas.removeEventListener('touchend', this.onTouchEnd);
    canvas.removeEventListener('touchcancel', this.onTouchEnd);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  update(): void {
    // Keyboard movement
    if (this.keys.size > 0 && this.joystickOrigin === null) {
      let mx = 0;
      let my = 0;
      if (this.keys.has('w') || this.keys.has('arrowup')) my = -1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) my = 1;
      if (this.keys.has('a') || this.keys.has('arrowleft')) mx = -1;
      if (this.keys.has('d') || this.keys.has('arrowright')) mx = 1;
      const len = Math.sqrt(mx * mx + my * my);
      this.movement = len > 0 ? vec2(mx / len, my / len) : vec2(0, 0);
    }

    if (this.keys.has(' ')) {
      this.skillPressed = true;
    }
  }

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Left half: joystick
      if (x < rect.width * 0.5 && this.joystickTouchId === null) {
        this.joystickTouchId = touch.identifier;
        this.joystickOrigin = vec2(x, y);
        this.joystickCurrent = vec2(x, y);
      }
      // Right half: skill button
      else if (x >= rect.width * 0.5) {
        this.skillTouchId = touch.identifier;
        this.skillPressed = true;
      }
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (touch.identifier === this.joystickTouchId && this.joystickOrigin) {
        this.joystickCurrent = vec2(x, y);
        const dx = x - this.joystickOrigin.x;
        const dy = y - this.joystickOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, this.joystickRadius);
        if (dist > 0) {
          this.movement = vec2((dx / dist) * (clamped / this.joystickRadius), (dy / dist) * (clamped / this.joystickRadius));
        }
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystickOrigin = null;
        this.joystickCurrent = null;
        this.movement = vec2(0, 0);
      }

      if (touch.identifier === this.skillTouchId) {
        this.skillTouchId = null;
      }
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase());
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
    if (e.key === ' ') {
      this.skillPressed = false;
    }
  };
}
