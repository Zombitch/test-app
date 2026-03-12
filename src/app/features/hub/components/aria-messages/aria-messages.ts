import { Component, inject } from '@angular/core';
import { AriaService } from '../../../../core/services/aria.service';
import { AriaMessage, AriaTone } from '../../../../core/models/aria.model';
import { GAME_COLORS } from '../../../../core/config/nord-theme';

@Component({
  selector: 'app-aria-messages',
  template: `
    <div class="aria-messages">
      <div class="aria-messages__header">
        <span class="aria-messages__title">ARIA</span>
        <span class="aria-messages__tone" [style.color]="toneColor()">{{ ariaService.tone() }}</span>
      </div>
      <div class="aria-messages__list">
        @for (msg of ariaService.messages(); track msg.id) {
          <div
            class="aria-messages__item"
            [class.aria-messages__item--unread]="!msg.isRead"
            (click)="markRead(msg)">
            <p class="aria-messages__text">{{ msg.text }}</p>
            <span class="aria-messages__time">{{ formatTime(msg.timestamp) }}</span>
          </div>
        } @empty {
          <div class="aria-messages__empty">
            <p>System initialized.</p>
            <p class="text-muted">ARIA is listening.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .aria-messages {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .aria-messages__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #434C5E;
    }
    .aria-messages__title {
      font-weight: 700;
      font-size: 0.9rem;
      color: #B48EAD;
      letter-spacing: 2px;
    }
    .aria-messages__tone {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .aria-messages__list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .aria-messages__item {
      padding: 8px;
      margin-bottom: 6px;
      border-left: 2px solid #4C566A;
      border-radius: 0 4px 4px 0;
      background: rgba(59, 66, 82, 0.3);
      transition: background 0.2s;
    }
    .aria-messages__item--unread {
      border-left-color: #B48EAD;
      background: rgba(180, 142, 173, 0.08);
    }
    .aria-messages__text {
      font-size: 0.85rem;
      line-height: 1.5;
      color: #D8DEE9;
    }
    .aria-messages__time {
      font-size: 0.65rem;
      color: #4C566A;
      margin-top: 4px;
      display: block;
    }
    .aria-messages__empty {
      padding: 24px 12px;
      text-align: center;
      font-size: 0.85rem;
    }
  `],
})
export class AriaMessagesComponent {
  readonly ariaService = inject(AriaService);

  toneColor(): string {
    const tone = this.ariaService.tone();
    const map: Partial<Record<AriaTone, string>> = {
      [AriaTone.Cynical]: GAME_COLORS.bitcoin,
      [AriaTone.Caring]: GAME_COLORS.custodian,
      [AriaTone.Confident]: GAME_COLORS.analyst,
      [AriaTone.Emotional]: GAME_COLORS.special,
    };
    return map[tone] || GAME_COLORS.textSecondary;
  }

  markRead(msg: AriaMessage): void {
    if (!msg.isRead) {
      this.ariaService.markRead(msg.id);
    }
  }

  formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
