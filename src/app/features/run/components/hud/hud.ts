import { Component, inject, input } from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { GAME_COLORS } from '../../../../core/config/nord-theme';

@Component({
  selector: 'app-hud',
  template: `
    <div class="hud safe-area-top">
      <!-- Top bar -->
      <div class="hud__top">
        <div class="hud__health-group">
          <div class="hud__bar hud__bar--health">
            <div class="hud__bar-fill" [style.width.%]="healthPercent()" [style.background]="healthColor()"></div>
          </div>
          @if (run()?.playerShield; as shield) {
            @if (shield > 0) {
              <div class="hud__bar hud__bar--shield">
                <div class="hud__bar-fill" [style.width.%]="shieldPercent()" style="background: #88C0D0"></div>
              </div>
            }
          }
        </div>
        <div class="hud__stats">
          <span class="hud__kills">{{ run()?.enemiesKilled ?? 0 }}</span>
          <span class="hud__timer">{{ formatTime(run()?.elapsedTime ?? 0) }}</span>
        </div>
      </div>

      <!-- Objective indicator -->
      <div class="hud__objective">
        @if (!run()?.primaryObjectiveComplete) {
          <span class="hud__obj-label">OBJ: Active</span>
        } @else {
          <span class="hud__obj-label hud__obj-label--done">OBJ: Complete</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .hud {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      pointer-events: none;
      padding: 8px 12px;
      z-index: 10;
    }
    .hud__top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .hud__health-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: 180px;
    }
    .hud__bar {
      height: 6px;
      background: rgba(59, 66, 82, 0.8);
      border-radius: 3px;
      overflow: hidden;
    }
    .hud__bar--shield {
      height: 4px;
    }
    .hud__bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.15s;
    }
    .hud__stats {
      display: flex;
      gap: 12px;
      font-size: 0.75rem;
    }
    .hud__kills {
      color: #BF616A;
    }
    .hud__timer {
      color: #4C566A;
      font-variant-numeric: tabular-nums;
    }
    .hud__objective {
      margin-top: 4px;
    }
    .hud__obj-label {
      font-size: 0.7rem;
      color: #EBCB8B;
      letter-spacing: 1px;
    }
    .hud__obj-label--done {
      color: #A3BE8C;
    }
  `],
})
export class HudComponent {
  private readonly gameState = inject(GameStateService);
  readonly run = this.gameState.currentRun;

  healthPercent(): number {
    const r = this.run();
    return r ? (r.playerHealth / r.playerMaxHealth) * 100 : 100;
  }

  shieldPercent(): number {
    const r = this.run();
    return r ? Math.min(r.playerShield, 100) : 0;
  }

  healthColor(): string {
    const pct = this.healthPercent();
    if (pct < 25) return GAME_COLORS.danger;
    if (pct < 50) return GAME_COLORS.warning;
    return GAME_COLORS.health;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
