import { Component, inject, signal, viewChild } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';
import { AriaService } from '../../core/services/aria.service';
import { FeatureFlagService } from '../../core/services/feature-flag.service';
import { GamePhase, Loadout } from '../../core/models/game-state.model';
import { SectorId } from '../../core/models/sectors.model';
import { WeaponId } from '../../core/models/weapons.model';
import { SkillId } from '../../core/models/skills.model';
import { AriaMessagesComponent } from './components/aria-messages/aria-messages';
import { ResourceAllocationComponent } from './components/resource-allocation/resource-allocation';
import { LoadoutSelectionComponent } from './components/loadout-selection/loadout-selection';
import { SectorSelectionComponent } from './components/sector-selection/sector-selection';
import { PerkShopComponent } from './components/perk-shop/perk-shop';
import { ResourceDisplayComponent } from '../../shared/components/resource-display/resource-display';

type HubTab = 'aria' | 'resources' | 'loadout' | 'perks' | 'deploy';

@Component({
  selector: 'app-hub',
  imports: [
    AriaMessagesComponent,
    ResourceAllocationComponent,
    LoadoutSelectionComponent,
    SectorSelectionComponent,
    PerkShopComponent,
    ResourceDisplayComponent,
  ],
  template: `
    <div class="hub safe-area-top safe-area-bottom">
      <!-- Header -->
      <header class="hub__header">
        <div class="hub__brand">
          <span class="hub__logo">ARIA</span>
          <span class="hub__subtitle">Archive Core</span>
        </div>
        <div class="hub__quick-stats">
          <app-resource-display [resources]="gameState.economy().totalResources" [compact]="true" />
        </div>
      </header>

      <!-- Tab content -->
      <main class="hub__content">
        @switch (activeTab()) {
          @case ('aria') {
            @if (features.isEnabled('ariaMessages')) {
              <app-aria-messages />
            }
          }
          @case ('resources') {
            @if (features.isEnabled('resourceAllocation')) {
              <app-resource-allocation />
            }
          }
          @case ('loadout') {
            @if (features.isEnabled('loadoutSelection')) {
              <app-loadout-selection (loadoutChanged)="onLoadoutChanged($event)" />
            }
          }
          @case ('perks') {
            @if (features.isEnabled('perkShop')) {
              <app-perk-shop />
            }
          }
          @case ('deploy') {
            @if (features.isEnabled('sectorSelection')) {
              <app-sector-selection (sectorSelected)="onSectorSelected($event)" />
            }
          }
        }
      </main>

      <!-- Bottom navigation -->
      <nav class="hub__nav">
        <button
          class="hub__nav-btn"
          [class.hub__nav-btn--active]="activeTab() === 'aria'"
          (click)="activeTab.set('aria')">
          <span class="hub__nav-icon">&#x25C8;</span>
          <span class="hub__nav-label">ARIA</span>
        </button>
        <button
          class="hub__nav-btn"
          [class.hub__nav-btn--active]="activeTab() === 'resources'"
          (click)="activeTab.set('resources')">
          <span class="hub__nav-icon">&#x25B2;</span>
          <span class="hub__nav-label">Feed</span>
        </button>
        <button
          class="hub__nav-btn"
          [class.hub__nav-btn--active]="activeTab() === 'loadout'"
          (click)="activeTab.set('loadout')">
          <span class="hub__nav-icon">&#x25A0;</span>
          <span class="hub__nav-label">Loadout</span>
        </button>
        <button
          class="hub__nav-btn"
          [class.hub__nav-btn--active]="activeTab() === 'perks'"
          (click)="activeTab.set('perks')">
          <span class="hub__nav-icon">&#x2726;</span>
          <span class="hub__nav-label">Perks</span>
        </button>
        <button
          class="hub__nav-btn hub__nav-btn--deploy"
          [class.hub__nav-btn--active]="activeTab() === 'deploy'"
          (click)="activeTab.set('deploy')">
          <span class="hub__nav-icon">&#x25B6;</span>
          <span class="hub__nav-label">Deploy</span>
        </button>
      </nav>
    </div>
  `,
  styles: [`
    .hub {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      background: #2E3440;
    }

    /* Header */
    .hub__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #3B4252;
      border-bottom: 1px solid #434C5E;
    }
    .hub__brand {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .hub__logo {
      font-size: 1.2rem;
      font-weight: 700;
      color: #B48EAD;
      letter-spacing: 3px;
    }
    .hub__subtitle {
      font-size: 0.7rem;
      color: #4C566A;
    }
    .hub__quick-stats {
      font-size: 0.7rem;
    }

    /* Content */
    .hub__content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Bottom Nav */
    .hub__nav {
      display: flex;
      background: #3B4252;
      border-top: 1px solid #434C5E;
      padding: 4px 0;
      padding-bottom: env(safe-area-inset-bottom, 4px);
    }
    .hub__nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 8px 4px;
      background: none;
      border: none;
      color: #4C566A;
      font-family: inherit;
      font-size: 0.65rem;
      cursor: pointer;
      transition: color 0.15s;
      min-height: 44px;
    }
    .hub__nav-btn--active {
      color: #88C0D0;
    }
    .hub__nav-btn--deploy {
      color: #4C566A;
    }
    .hub__nav-btn--deploy.hub__nav-btn--active {
      color: #A3BE8C;
    }
    .hub__nav-icon {
      font-size: 1.1rem;
    }
    .hub__nav-label {
      letter-spacing: 0.5px;
    }
  `],
})
export class HubComponent {
  readonly gameState = inject(GameStateService);
  readonly ariaService = inject(AriaService);
  readonly features = inject(FeatureFlagService);

  readonly activeTab = signal<HubTab>('aria');
  private currentLoadout: Loadout = { weaponId: WeaponId.Cleaner, skillId: SkillId.Blink };

  readonly loadoutComp = viewChild(LoadoutSelectionComponent);

  onLoadoutChanged(loadout: Loadout): void {
    this.currentLoadout = loadout;
  }

  onSectorSelected(sectorId: SectorId): void {
    const loadout = this.loadoutComp()?.getLoadout() ?? this.currentLoadout;
    this.gameState.startRun(sectorId, loadout);
  }
}
