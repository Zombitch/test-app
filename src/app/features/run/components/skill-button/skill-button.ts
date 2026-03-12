import { Component, input, output } from '@angular/core';
import { Skill } from '../../../../core/models/skills.model';

@Component({
  selector: 'app-skill-button',
  template: `
    <button
      class="skill-btn"
      [class.skill-btn--ready]="cooldownPercent() >= 100"
      [class.skill-btn--cooldown]="cooldownPercent() < 100"
      [disabled]="cooldownPercent() < 100"
      (touchstart)="onActivate($event)"
      (click)="onActivate($event)">
      <svg class="skill-btn__ring" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#3B4252" stroke-width="6" />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="#88C0D0"
          stroke-width="6"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset()"
          transform="rotate(-90, 50, 50)" />
      </svg>
      <span class="skill-btn__name">{{ skill().name }}</span>
    </button>
  `,
  styles: [`
    .skill-btn {
      position: relative;
      width: 64px;
      height: 64px;
      border: none;
      border-radius: 50%;
      background: rgba(59, 66, 82, 0.8);
      color: #D8DEE9;
      font-family: inherit;
      font-size: 0.65rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .skill-btn--ready {
      background: rgba(136, 192, 208, 0.15);
      box-shadow: 0 0 12px rgba(136, 192, 208, 0.2);
    }
    .skill-btn--cooldown {
      opacity: 0.6;
    }
    .skill-btn:active {
      transform: scale(0.95);
    }
    .skill-btn__ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .skill-btn__name {
      z-index: 1;
      text-align: center;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  `],
})
export class SkillButtonComponent {
  skill = input.required<Skill>();
  cooldownPercent = input<number>(100);
  activated = output<void>();

  readonly circumference = 2 * Math.PI * 45;

  dashOffset(): number {
    const pct = this.cooldownPercent() / 100;
    return this.circumference * (1 - pct);
  }

  onActivate(e: Event): void {
    e.preventDefault();
    if (this.cooldownPercent() >= 100) {
      this.activated.emit();
    }
  }
}
