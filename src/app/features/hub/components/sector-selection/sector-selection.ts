import { Component, inject, output } from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { SectorId, SectorDef, SECTOR_DEFS, SectorDifficulty } from '../../../../core/models/sectors.model';
import { RESOURCE_LABELS } from '../../../../core/models/resources.model';
import { GAME_COLORS } from '../../../../core/config/nord-theme';

@Component({
  selector: 'app-sector-selection',
  template: `
    <div class="sectors">
      <h3 class="sectors__title">Select Sector</h3>
      <div class="sectors__list">
        @for (sector of availableSectors(); track sector.id) {
          <button
            class="sectors__card"
            (click)="selectSector(sector.id)">
            <div class="sectors__card-header">
              <span class="sectors__card-name">{{ sector.name }}</span>
              <span class="sectors__card-diff" [style.color]="difficultyColor(sector.difficulty)">
                {{ sector.difficulty }}
              </span>
            </div>
            <p class="sectors__card-desc">{{ sector.description }}</p>
            <div class="sectors__card-reward">
              Primary: <span [style.color]="getRewardColor(sector)">{{ getRewardLabel(sector) }}</span>
            </div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .sectors {
      padding: 12px;
    }
    .sectors__title {
      margin-bottom: 12px;
      color: #81A1C1;
    }
    .sectors__list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sectors__card {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: #3B4252;
      border: 1px solid #434C5E;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      color: #D8DEE9;
      transition: border-color 0.15s, background 0.15s;
      min-height: 44px;
    }
    .sectors__card:active {
      background: #434C5E;
      border-color: #81A1C1;
    }
    .sectors__card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .sectors__card-name {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .sectors__card-diff {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .sectors__card-desc {
      font-size: 0.75rem;
      color: #4C566A;
      line-height: 1.4;
      margin-bottom: 6px;
    }
    .sectors__card-reward {
      font-size: 0.7rem;
      color: #4C566A;
    }
  `],
})
export class SectorSelectionComponent {
  private readonly gameState = inject(GameStateService);
  private readonly features = inject(FeatureFlagService);

  readonly sectorSelected = output<SectorId>();

  availableSectors(): SectorDef[] {
    const unlocked = this.gameState.progression().unlockedSectors;
    return unlocked
      .filter(id => this.isSectorEnabled(id))
      .map(id => SECTOR_DEFS[id]);
  }

  selectSector(id: SectorId): void {
    this.sectorSelected.emit(id);
  }

  getRewardLabel(sector: SectorDef): string {
    return RESOURCE_LABELS[sector.primaryReward];
  }

  getRewardColor(sector: SectorDef): string {
    const map: Record<string, string> = {
      cpu: GAME_COLORS.cpu,
      ram: GAME_COLORS.ram,
      gpu: GAME_COLORS.gpu,
      data: GAME_COLORS.data,
      bitcoin: GAME_COLORS.bitcoin,
    };
    return map[sector.primaryReward] || GAME_COLORS.textPrimary;
  }

  difficultyColor(diff: SectorDifficulty): string {
    switch (diff) {
      case SectorDifficulty.Easy: return GAME_COLORS.success;
      case SectorDifficulty.Medium: return GAME_COLORS.warning;
      case SectorDifficulty.Hard: return GAME_COLORS.danger;
      case SectorDifficulty.Endgame: return GAME_COLORS.special;
    }
  }

  private isSectorEnabled(id: SectorId): boolean {
    const flagMap: Record<string, string> = {
      'cache-wastes': 'cacheWastes',
      'coolant-cathedrals': 'coolantCathedrals',
      'kernel-bastion': 'kernelBastion',
      'hash-forge': 'hashForge',
      'arche-dock': 'archeDock',
    };
    const flag = flagMap[id];
    return flag ? this.features.isEnabled(flag as any) : true;
  }
}
