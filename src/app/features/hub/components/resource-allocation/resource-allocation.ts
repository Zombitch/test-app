import { Component, inject } from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';
import { ResourceType, RESOURCE_LABELS, RunResources } from '../../../../core/models/resources.model';
import { GAME_COLORS } from '../../../../core/config/nord-theme';
import { ResourceDisplayComponent } from '../../../../shared/components/resource-display/resource-display';

@Component({
  selector: 'app-resource-allocation',
  imports: [ResourceDisplayComponent],
  template: `
    <div class="allocation">
      <h3 class="allocation__title">Feed ARIA</h3>
      <div class="allocation__status">
        <div class="allocation__stat">
          <span class="text-muted">Power</span>
          <span class="text-special">{{ gameState.aria().power }}</span>
        </div>
        <div class="allocation__stat">
          <span class="text-muted">Stability</span>
          <span [style.color]="stabilityColor()">{{ gameState.aria().stability }}%</span>
        </div>
      </div>
      <div class="allocation__bar">
        <div class="allocation__bar-fill allocation__bar-fill--stability"
             [style.width.%]="gameState.aria().stability">
        </div>
      </div>

      <div class="allocation__resources">
        <app-resource-display [resources]="gameState.economy().totalResources" />
      </div>

      <div class="allocation__controls">
        @for (res of resourceTypes; track res) {
          <div class="allocation__row">
            <span class="allocation__res-label" [style.color]="getColor(res)">
              {{ getLabel(res) }}
            </span>
            <span class="allocation__res-value">{{ getAvailable(res) }}</span>
            <div class="allocation__buttons">
              <button class="btn" (click)="allocate(res, 1)" [disabled]="getAvailable(res) < 1">+1</button>
              <button class="btn" (click)="allocate(res, 10)" [disabled]="getAvailable(res) < 10">+10</button>
            </div>
          </div>
        }
      </div>

      <p class="allocation__warning text-muted">
        @if (gameState.aria().stability < 30) {
          ARIA stability critical. Reduce BITCOIN allocation.
        } @else if (gameState.aria().stability > 80) {
          ARIA operating within safe parameters.
        } @else {
          Balance resources carefully. BITCOIN destabilizes.
        }
      </p>
    </div>
  `,
  styles: [`
    .allocation {
      padding: 12px;
    }
    .allocation__title {
      margin-bottom: 12px;
      color: #B48EAD;
    }
    .allocation__status {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.85rem;
    }
    .allocation__stat {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .allocation__bar {
      width: 100%;
      height: 4px;
      background: #3B4252;
      border-radius: 2px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .allocation__bar-fill--stability {
      height: 100%;
      background: #A3BE8C;
      border-radius: 2px;
      transition: width 0.3s;
    }
    .allocation__resources {
      margin-bottom: 16px;
    }
    .allocation__controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .allocation__row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .allocation__res-label {
      width: 70px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .allocation__res-value {
      width: 40px;
      text-align: right;
      font-size: 0.8rem;
      color: #D8DEE9;
    }
    .allocation__buttons {
      display: flex;
      gap: 4px;
      margin-left: auto;
    }
    .allocation__buttons .btn {
      padding: 4px 12px;
      min-height: 36px;
      font-size: 0.75rem;
    }
    .allocation__warning {
      margin-top: 12px;
      font-size: 0.75rem;
      font-style: italic;
    }
  `],
})
export class ResourceAllocationComponent {
  readonly gameState = inject(GameStateService);
  readonly resourceTypes: ResourceType[] = ['cpu', 'ram', 'gpu', 'data', 'bitcoin'];

  private readonly colorMap: Record<string, string> = {
    cpu: GAME_COLORS.cpu,
    ram: GAME_COLORS.ram,
    gpu: GAME_COLORS.gpu,
    data: GAME_COLORS.data,
    bitcoin: GAME_COLORS.bitcoin,
  };

  getColor(type: ResourceType): string {
    return this.colorMap[type];
  }

  getLabel(type: ResourceType): string {
    return RESOURCE_LABELS[type];
  }

  getAvailable(type: ResourceType): number {
    return this.gameState.economy().totalResources[type];
  }

  allocate(type: ResourceType, amount: number): void {
    this.gameState.allocateToAria({ [type]: amount } as Partial<RunResources>);
  }

  stabilityColor(): string {
    const s = this.gameState.aria().stability;
    if (s < 30) return GAME_COLORS.danger;
    if (s < 60) return GAME_COLORS.warning;
    return GAME_COLORS.success;
  }
}
