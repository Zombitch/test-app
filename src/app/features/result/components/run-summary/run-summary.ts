import { Component, input } from '@angular/core';
import { RunOutcome } from '../../../../core/models/game-state.model';
import { RunResources, RESOURCE_LABELS, ResourceType } from '../../../../core/models/resources.model';
import { GAME_COLORS } from '../../../../core/config/nord-theme';

@Component({
  selector: 'app-run-summary',
  template: `
    <div class="summary">
      <div class="summary__header" [style.borderColor]="outcomeColor()">
        <h2 class="summary__outcome" [style.color]="outcomeColor()">{{ outcomeLabel() }}</h2>
      </div>

      <div class="summary__stats">
        <div class="summary__stat">
          <span class="text-muted">Enemies killed</span>
          <span>{{ enemiesKilled() }}</span>
        </div>
        <div class="summary__stat">
          <span class="text-muted">Time</span>
          <span>{{ formatTime(elapsedTime()) }}</span>
        </div>
        <div class="summary__stat">
          <span class="text-muted">Objective</span>
          <span [style.color]="objectiveComplete() ? successColor : mutedColor">
            {{ objectiveComplete() ? 'Complete' : 'Incomplete' }}
          </span>
        </div>
      </div>

      @if (outcome() !== 'failure') {
        <div class="summary__loot">
          <h4>Resources Gained</h4>
          @for (res of resourceTypes; track res) {
            @if (getResourceValue(res) > 0) {
              <div class="summary__loot-row" [style.color]="getResourceColor(res)">
                <span>{{ getResourceLabel(res) }}</span>
                <span>+{{ getResourceValue(res) }}</span>
              </div>
            }
          }
        </div>
      }

      <div class="summary__hash">
        <span class="summary__hash-label">Residual Hash earned</span>
        <span class="summary__hash-value">+{{ hashEarned() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .summary {
      padding: 16px;
    }
    .summary__header {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid;
    }
    .summary__outcome {
      font-size: 1.3rem;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .summary__stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }
    .summary__stat {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }
    .summary__loot {
      margin-bottom: 20px;
    }
    .summary__loot h4 {
      font-size: 0.8rem;
      color: #4C566A;
      margin-bottom: 8px;
    }
    .summary__loot-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding: 4px 0;
    }
    .summary__hash {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: rgba(143, 188, 187, 0.08);
      border-radius: 6px;
      border: 1px solid rgba(143, 188, 187, 0.2);
    }
    .summary__hash-label {
      font-size: 0.8rem;
      color: #8FBCBB;
    }
    .summary__hash-value {
      font-size: 1rem;
      font-weight: 700;
      color: #8FBCBB;
    }
  `],
})
export class RunSummaryComponent {
  outcome = input.required<RunOutcome>();
  collectedResources = input.required<RunResources>();
  enemiesKilled = input.required<number>();
  elapsedTime = input.required<number>();
  objectiveComplete = input.required<boolean>();
  hashEarned = input.required<number>();

  readonly resourceTypes: ResourceType[] = ['cpu', 'ram', 'gpu', 'data', 'bitcoin'];
  readonly successColor = GAME_COLORS.success;
  readonly mutedColor = GAME_COLORS.bgInactive;

  private readonly colorMap: Record<string, string> = {
    cpu: GAME_COLORS.cpu,
    ram: GAME_COLORS.ram,
    gpu: GAME_COLORS.gpu,
    data: GAME_COLORS.data,
    bitcoin: GAME_COLORS.bitcoin,
  };

  outcomeLabel(): string {
    switch (this.outcome()) {
      case RunOutcome.Success: return 'Extraction Complete';
      case RunOutcome.Extracted: return 'Early Extraction';
      case RunOutcome.Failure: return 'Entity Lost';
    }
  }

  outcomeColor(): string {
    switch (this.outcome()) {
      case RunOutcome.Success: return GAME_COLORS.success;
      case RunOutcome.Extracted: return GAME_COLORS.warning;
      case RunOutcome.Failure: return GAME_COLORS.danger;
    }
  }

  getResourceValue(type: ResourceType): number {
    return this.collectedResources()[type];
  }

  getResourceLabel(type: ResourceType): string {
    return RESOURCE_LABELS[type];
  }

  getResourceColor(type: ResourceType): string {
    return this.colorMap[type];
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
