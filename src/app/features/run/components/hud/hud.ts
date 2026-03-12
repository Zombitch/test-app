import { Component, inject } from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';
import { GAME_COLORS } from '../../../../core/config/nord-theme';
import { RESOURCE_LABELS, ResourceType } from '../../../../core/models/resources.model';

@Component({
  selector: 'app-hud',
  template: `
    <div class="hud safe-area-top">
      <!-- Top bar -->
      <div class="hud__top">
        <div class="hud__health-group">
          <div class="hud__bar-label">
            <span>ENTITY</span>
            <span>{{ run()?.playerHealth ?? 0 }}/{{ run()?.playerMaxHealth ?? 100 }}</span>
          </div>
          <div class="hud__bar hud__bar--health">
            <div class="hud__bar-fill" [style.width.%]="healthPercent()" [style.background]="healthColor()"></div>
            <div class="hud__bar-scanline"></div>
          </div>
          @if ((run()?.playerShield ?? 0) > 0) {
            <div class="hud__bar hud__bar--shield">
              <div class="hud__bar-fill" [style.width.%]="shieldPercent()" style="background: #88C0D0"></div>
            </div>
          }
        </div>
        <div class="hud__stats">
          <div class="hud__stat-box hud__stat-box--kills">
            <span class="hud__stat-label">PURGED</span>
            <span class="hud__stat-value">{{ run()?.enemiesKilled ?? 0 }}</span>
          </div>
          <div class="hud__stat-box">
            <span class="hud__stat-label">TIME</span>
            <span class="hud__stat-value">{{ formatTime(run()?.elapsedTime ?? 0) }}</span>
          </div>
        </div>
      </div>

      <!-- Objective indicator -->
      <div class="hud__objective">
        @if (!run()?.primaryObjectiveComplete) {
          <span class="hud__obj-marker"></span>
          <span class="hud__obj-label">// OBJ: ACTIVE</span>
        } @else {
          <span class="hud__obj-marker hud__obj-marker--done"></span>
          <span class="hud__obj-label hud__obj-label--done">// OBJ: COMPLETE</span>
        }
      </div>

      <!-- Run resources collected -->
      <div class="hud__resources">
        @for (res of resourceTypes; track res) {
          @if (getCollected(res) > 0) {
            <span class="hud__res" [style.color]="getColor(res)">
              {{ getLabel(res) }}: {{ getCollected(res) }}
            </span>
          }
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
      max-width: 200px;
    }
    .hud__bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.55rem;
      color: #4C566A;
      letter-spacing: 1px;
      margin-bottom: 1px;
    }
    .hud__bar {
      height: 6px;
      background: rgba(13, 17, 23, 0.8);
      border: 1px solid rgba(76, 86, 106, 0.3);
      overflow: hidden;
      position: relative;
    }
    .hud__bar--shield {
      height: 4px;
      border-color: rgba(136, 192, 208, 0.2);
    }
    .hud__bar-fill {
      height: 100%;
      transition: width 0.15s;
    }
    .hud__bar-scanline {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.15) 2px,
        rgba(0, 0, 0, 0.15) 3px
      );
    }
    .hud__stats {
      display: flex;
      gap: 8px;
    }
    .hud__stat-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 2px 6px;
      background: rgba(13, 17, 23, 0.6);
      border: 1px solid rgba(76, 86, 106, 0.2);
    }
    .hud__stat-box--kills {
      border-color: rgba(191, 97, 106, 0.2);
    }
    .hud__stat-label {
      font-size: 0.5rem;
      color: #4C566A;
      letter-spacing: 1px;
    }
    .hud__stat-value {
      font-size: 0.8rem;
      font-weight: 700;
      color: #D8DEE9;
      font-variant-numeric: tabular-nums;
    }
    .hud__stat-box--kills .hud__stat-value {
      color: #BF616A;
    }
    .hud__objective {
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hud__obj-marker {
      width: 6px;
      height: 6px;
      background: #EBCB8B;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .hud__obj-marker--done {
      background: #A3BE8C;
      animation: none;
    }
    .hud__obj-label {
      font-size: 0.6rem;
      color: #EBCB8B;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .hud__obj-label--done {
      color: #A3BE8C;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    .hud__resources {
      margin-top: 4px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .hud__res {
      font-size: 0.6rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  `],
})
export class HudComponent {
  private readonly gameState = inject(GameStateService);
  readonly run = this.gameState.currentRun;

  readonly resourceTypes: ResourceType[] = ['cpu', 'ram', 'gpu', 'data', 'bitcoin'];

  private readonly colorMap: Record<string, string> = {
    cpu: GAME_COLORS.cpu,
    ram: GAME_COLORS.ram,
    gpu: GAME_COLORS.gpu,
    data: GAME_COLORS.data,
    bitcoin: GAME_COLORS.bitcoin,
  };

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

  getCollected(type: ResourceType): number {
    return this.run()?.collectedResources[type] ?? 0;
  }

  getLabel(type: ResourceType): string {
    return RESOURCE_LABELS[type];
  }

  getColor(type: ResourceType): string {
    return this.colorMap[type];
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
