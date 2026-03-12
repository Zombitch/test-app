import { Component, inject } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';
import { FeatureFlagService } from '../../core/services/feature-flag.service';
import { GamePhase, RunOutcome } from '../../core/models/game-state.model';
import { createEmptyRunResources } from '../../core/models/resources.model';
import { RunSummaryComponent } from './components/run-summary/run-summary';
import { AriaDialogueComponent } from './components/aria-dialogue/aria-dialogue';

@Component({
  selector: 'app-result',
  imports: [RunSummaryComponent, AriaDialogueComponent],
  template: `
    <div class="result safe-area-top safe-area-bottom">
      <app-run-summary
        [outcome]="outcome"
        [collectedResources]="collectedResources"
        [enemiesKilled]="enemiesKilled"
        [elapsedTime]="elapsedTime"
        [objectiveComplete]="objectiveComplete"
        [hashEarned]="hashEarned" />

      <app-aria-dialogue
        [success]="outcome !== failOutcome"
        (choiceMade)="onChoiceMade()" />

      <div class="result__actions">
        <button class="btn btn--primary w-full" (click)="returnToHub()">
          Return to Archive Core
        </button>
      </div>
    </div>
  `,
  styles: [`
    .result {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      background: #2E3440;
      animation: fadeIn 0.5s ease;
    }
    .result__actions {
      padding: 16px;
      padding-bottom: env(safe-area-inset-bottom, 16px);
      margin-top: auto;
    }
  `],
})
export class ResultComponent {
  private readonly gameState = inject(GameStateService);

  readonly failOutcome = RunOutcome.Failure;

  // Snapshot values since currentRun is null by the time we're in result
  readonly outcome: RunOutcome;
  readonly collectedResources;
  readonly enemiesKilled: number;
  readonly elapsedTime: number;
  readonly objectiveComplete: boolean;
  readonly hashEarned: number;

  constructor() {
    const state = this.gameState.gameState();
    this.outcome = state.lastRunOutcome ?? RunOutcome.Failure;
    // Resources are already transferred to total in gameState.endRun
    this.collectedResources = createEmptyRunResources(); // Already processed
    this.enemiesKilled = state.progression.totalRuns > 0 ? 0 : 0; // Simplified
    this.elapsedTime = 0;
    this.objectiveComplete = false;
    this.hashEarned = 0;
  }

  returnToHub(): void {
    this.gameState.setPhase(GamePhase.Hub);
  }

  onChoiceMade(): void {
    // Choice was applied via AriaService
  }
}
