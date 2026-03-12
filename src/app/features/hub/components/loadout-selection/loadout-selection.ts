import { Component, inject, output, signal } from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { WeaponId, WEAPONS, Weapon } from '../../../../core/models/weapons.model';
import { SkillId, SKILLS, Skill } from '../../../../core/models/skills.model';
import { Loadout } from '../../../../core/models/game-state.model';

@Component({
  selector: 'app-loadout-selection',
  template: `
    <div class="loadout">
      <h3 class="loadout__title">Loadout</h3>

      @if (features.isEnabled('weaponSystem')) {
        <div class="loadout__section">
          <h4 class="loadout__section-title">Weapon</h4>
          <div class="loadout__grid">
            @for (wId of unlockedWeapons(); track wId) {
              <button
                class="loadout__card"
                [class.loadout__card--selected]="selectedWeapon() === wId"
                (click)="selectWeapon(wId)">
                <span class="loadout__card-name">{{ getWeapon(wId).name }}</span>
                <span class="loadout__card-desc">{{ getWeapon(wId).identity }}</span>
              </button>
            }
          </div>
        </div>
      }

      @if (features.isEnabled('skillSystem')) {
        <div class="loadout__section">
          <h4 class="loadout__section-title">Skill</h4>
          <div class="loadout__grid">
            @for (sId of unlockedSkills(); track sId) {
              <button
                class="loadout__card"
                [class.loadout__card--selected]="selectedSkill() === sId"
                (click)="selectSkill(sId)">
                <span class="loadout__card-name">{{ getSkill(sId).name }}</span>
                <span class="loadout__card-desc">{{ getSkill(sId).description }}</span>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .loadout {
      padding: 12px;
    }
    .loadout__title {
      margin-bottom: 12px;
      color: #88C0D0;
    }
    .loadout__section {
      margin-bottom: 16px;
    }
    .loadout__section-title {
      font-size: 0.8rem;
      color: #4C566A;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .loadout__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .loadout__card {
      display: flex;
      flex-direction: column;
      padding: 10px;
      background: #3B4252;
      border: 1px solid #434C5E;
      border-radius: 6px;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      color: #D8DEE9;
      transition: border-color 0.15s;
      min-height: 44px;
    }
    .loadout__card--selected {
      border-color: #88C0D0;
      background: rgba(136, 192, 208, 0.08);
    }
    .loadout__card:active {
      background: #434C5E;
    }
    .loadout__card-name {
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .loadout__card-desc {
      font-size: 0.7rem;
      color: #4C566A;
      line-height: 1.3;
    }
  `],
})
export class LoadoutSelectionComponent {
  readonly gameState = inject(GameStateService);
  readonly features = inject(FeatureFlagService);
  readonly loadoutChanged = output<Loadout>();

  readonly selectedWeapon = signal<WeaponId>(WeaponId.Cleaner);
  readonly selectedSkill = signal<SkillId>(SkillId.Blink);

  unlockedWeapons() {
    return this.gameState.progression().unlockedWeapons;
  }

  unlockedSkills() {
    return this.gameState.progression().unlockedSkills;
  }

  getWeapon(id: WeaponId): Weapon {
    return WEAPONS[id];
  }

  getSkill(id: SkillId): Skill {
    return SKILLS[id];
  }

  selectWeapon(id: WeaponId): void {
    this.selectedWeapon.set(id);
    this.emitLoadout();
  }

  selectSkill(id: SkillId): void {
    this.selectedSkill.set(id);
    this.emitLoadout();
  }

  getLoadout(): Loadout {
    return {
      weaponId: this.selectedWeapon(),
      skillId: this.selectedSkill(),
    };
  }

  private emitLoadout(): void {
    this.loadoutChanged.emit(this.getLoadout());
  }
}
