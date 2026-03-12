import { Component, input } from '@angular/core';
import { InputHandler } from '../../../../core/engine/input-handler';
import { NORD } from '../../../../core/config/nord-theme';

@Component({
  selector: 'app-touch-controls',
  template: `
    <div class="touch-overlay">
      <!-- Joystick visualization -->
      @if (inputHandler().joystickActive) {
        <svg class="touch-overlay__joystick" [style.left.px]="joystickX()" [style.top.px]="joystickY()">
          <!-- Base circle -->
          <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(136,192,208,0.15)" stroke-width="2" />
          <!-- Thumb circle -->
          <circle [attr.cx]="thumbX()" [attr.cy]="thumbY()" r="22" fill="rgba(136,192,208,0.2)" stroke="rgba(136,192,208,0.3)" stroke-width="1" />
        </svg>
      }
    </div>
  `,
  styles: [`
    .touch-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 5;
    }
    .touch-overlay__joystick {
      position: absolute;
      width: 120px;
      height: 120px;
      transform: translate(-50%, -50%);
    }
  `],
})
export class TouchControlsComponent {
  inputHandler = input.required<InputHandler>();

  joystickX(): number {
    return this.inputHandler().joystickOriginPos?.x ?? 0;
  }

  joystickY(): number {
    return this.inputHandler().joystickOriginPos?.y ?? 0;
  }

  thumbX(): number {
    const origin = this.inputHandler().joystickOriginPos;
    const current = this.inputHandler().joystickCurrentPos;
    if (!origin || !current) return 60;
    return 60 + (current.x - origin.x);
  }

  thumbY(): number {
    const origin = this.inputHandler().joystickOriginPos;
    const current = this.inputHandler().joystickCurrentPos;
    if (!origin || !current) return 60;
    return 60 + (current.y - origin.y);
  }
}
