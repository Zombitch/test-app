import { Component, input } from '@angular/core';
import { RunResources, RESOURCE_LABELS, ResourceType } from '../../../core/models/resources.model';
import { GAME_COLORS } from '../../../core/config/nord-theme';

@Component({
  selector: 'app-resource-display',
  template: `
    <div class="resource-display">
      @for (res of resourceTypes; track res) {
        <div class="resource-display__item" [style.color]="getColor(res)">
          <span class="resource-display__label">{{ getLabel(res) }}</span>
          <span class="resource-display__value">{{ getValue(res) }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .resource-display {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .resource-display__item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: rgba(46, 52, 64, 0.6);
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .resource-display__label {
      opacity: 0.7;
    }
  `],
})
export class ResourceDisplayComponent {
  resources = input.required<RunResources>();
  compact = input(false);

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
    return this.compact() ? type.toUpperCase().slice(0, 3) : RESOURCE_LABELS[type];
  }

  getValue(type: ResourceType): number {
    return this.resources()[type];
  }
}
