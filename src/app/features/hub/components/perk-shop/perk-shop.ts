import { Component, inject } from '@angular/core';
import { GameStateService } from '../../../../core/services/game-state.service';
import { PERKS, PerkDef, PerkCategory } from '../../../../core/models/perks.model';
import { GAME_COLORS } from '../../../../core/config/nord-theme';

@Component({
  selector: 'app-perk-shop',
  template: `
    <div class="perk-shop">
      <div class="perk-shop__header">
        <h3 class="perk-shop__title">Perk Shop</h3>
        <span class="perk-shop__currency">
          <span class="perk-shop__hash-icon">&#x25C8;</span>
          {{ gameState.economy().metaCurrency.residualHash }} Residual Hash
        </span>
      </div>

      @for (category of categories; track category) {
        <div class="perk-shop__category">
          <h4 class="perk-shop__cat-title">{{ formatCategory(category) }}</h4>
          @for (perk of getPerksByCategory(category); track perk.id) {
            <div class="perk-shop__item" [class.perk-shop__item--owned]="isOwned(perk.id)">
              <div class="perk-shop__item-info">
                <span class="perk-shop__item-name">{{ perk.name }}</span>
                <span class="perk-shop__item-desc">{{ perk.description }}</span>
              </div>
              <button
                class="btn btn--primary perk-shop__buy"
                (click)="buy(perk)"
                [disabled]="isOwned(perk.id) || !canAfford(perk.cost)">
                @if (isOwned(perk.id)) {
                  Owned
                } @else {
                  {{ perk.cost }}
                }
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .perk-shop {
      padding: 12px;
    }
    .perk-shop__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .perk-shop__title {
      color: #8FBCBB;
    }
    .perk-shop__currency {
      font-size: 0.8rem;
      color: #8FBCBB;
      font-weight: 600;
    }
    .perk-shop__hash-icon {
      color: #8FBCBB;
    }
    .perk-shop__category {
      margin-bottom: 16px;
    }
    .perk-shop__cat-title {
      font-size: 0.75rem;
      color: #4C566A;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #3B4252;
    }
    .perk-shop__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
      margin-bottom: 4px;
      border-radius: 6px;
      background: #3B4252;
    }
    .perk-shop__item--owned {
      opacity: 0.5;
    }
    .perk-shop__item-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin-right: 8px;
    }
    .perk-shop__item-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #D8DEE9;
    }
    .perk-shop__item-desc {
      font-size: 0.7rem;
      color: #4C566A;
    }
    .perk-shop__buy {
      padding: 4px 12px;
      min-height: 36px;
      font-size: 0.75rem;
      white-space: nowrap;
    }
  `],
})
export class PerkShopComponent {
  readonly gameState = inject(GameStateService);
  readonly categories = [PerkCategory.Offense, PerkCategory.Defense, PerkCategory.Utility, PerkCategory.AriaSupport];

  getPerksByCategory(cat: PerkCategory): PerkDef[] {
    return PERKS.filter(p => p.category === cat);
  }

  formatCategory(cat: PerkCategory): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
  }

  isOwned(perkId: string): boolean {
    return this.gameState.progression().purchasedPerks.includes(perkId);
  }

  canAfford(cost: number): boolean {
    return this.gameState.economy().metaCurrency.residualHash >= cost;
  }

  buy(perk: PerkDef): void {
    this.gameState.purchasePerk(perk.id, perk.cost);
  }
}
