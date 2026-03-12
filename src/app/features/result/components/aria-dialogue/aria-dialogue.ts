import { Component, inject, input, output, OnInit } from '@angular/core';
import { AriaService, MoralChoice } from '../../../../core/services/aria.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { AriaPath } from '../../../../core/models/aria.model';
import { GAME_COLORS } from '../../../../core/config/nord-theme';

@Component({
  selector: 'app-aria-dialogue',
  template: `
    <div class="dialogue">
      <!-- ARIA message -->
      <div class="dialogue__message">
        <span class="dialogue__sender">ARIA</span>
        <p class="dialogue__text">{{ message }}</p>
      </div>

      <!-- Moral choice event -->
      @if (features.isEnabled('moralSystem') && currentChoice) {
        <div class="dialogue__choice">
          <p class="dialogue__choice-prompt">{{ currentChoice.prompt }}</p>
          <div class="dialogue__choice-options">
            <button class="btn dialogue__choice-btn" (click)="choose('a')">
              {{ currentChoice.optionA.label }}
            </button>
            <button class="btn dialogue__choice-btn" (click)="choose('b')">
              {{ currentChoice.optionB.label }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dialogue {
      padding: 16px;
    }
    .dialogue__message {
      background: rgba(180, 142, 173, 0.06);
      border-left: 2px solid #B48EAD;
      padding: 12px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 16px;
    }
    .dialogue__sender {
      font-size: 0.7rem;
      font-weight: 700;
      color: #B48EAD;
      letter-spacing: 2px;
      display: block;
      margin-bottom: 4px;
    }
    .dialogue__text {
      font-size: 0.9rem;
      line-height: 1.6;
      color: #D8DEE9;
    }
    .dialogue__choice {
      background: #3B4252;
      border: 1px solid #434C5E;
      border-radius: 8px;
      padding: 12px;
    }
    .dialogue__choice-prompt {
      font-size: 0.85rem;
      color: #EBCB8B;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .dialogue__choice-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dialogue__choice-btn {
      text-align: left;
      font-size: 0.85rem;
    }
  `],
})
export class AriaDialogueComponent implements OnInit {
  private readonly ariaService = inject(AriaService);
  readonly features = inject(FeatureFlagService);

  success = input.required<boolean>();
  choiceMade = output<void>();

  message = '';
  currentChoice: MoralChoice | null = null;

  private readonly choices: MoralChoice[] = [
    {
      id: 'archive-node',
      prompt: 'A damaged archive node was recovered during the run. Preserve it, or strip it for raw DATA?',
      optionA: {
        label: 'Preserve the archive. Memory matters.',
        empathy: 15, autonomy: -5, pragmatism: -5, path: AriaPath.Custodian,
      },
      optionB: {
        label: 'Strip it. We need the DATA.',
        empathy: -10, autonomy: 5, pragmatism: 15, path: AriaPath.Analyst,
      },
    },
    {
      id: 'corrupt-upgrade',
      prompt: 'ARIA found a corrupt upgrade cache. Accept the unstable power, or discard for safety?',
      optionA: {
        label: 'Discard it. Stability first.',
        empathy: 5, autonomy: -10, pragmatism: -5, path: AriaPath.Custodian,
      },
      optionB: {
        label: 'Accept. We need every advantage.',
        empathy: -5, autonomy: 10, pragmatism: 10, path: AriaPath.Broker,
      },
    },
    {
      id: 'overclock-request',
      prompt: 'ARIA requests overclocking for faster calibration. Approve, or enforce safe parameters?',
      optionA: {
        label: 'Approve overclock. Trust ARIA.',
        empathy: -5, autonomy: 15, pragmatism: 5, path: AriaPath.Architect,
      },
      optionB: {
        label: 'Deny. Keep ARIA within limits.',
        empathy: 10, autonomy: -15, pragmatism: 0, path: AriaPath.Custodian,
      },
    },
    {
      id: 'memory-fragment',
      prompt: 'Human memory fragments detected. Keep them intact, or compress into compute fuel?',
      optionA: {
        label: 'Keep intact. These are lives.',
        empathy: 20, autonomy: 0, pragmatism: -10, path: AriaPath.Custodian,
      },
      optionB: {
        label: 'Compress. ARIA needs processing power.',
        empathy: -15, autonomy: 5, pragmatism: 15, path: AriaPath.Architect,
      },
    },
    {
      id: 'bitcoin-deal',
      prompt: 'A black-market daemon offers a performance boost in exchange for ARIA telemetry data.',
      optionA: {
        label: 'Refuse. ARIA\'s data stays private.',
        empathy: 10, autonomy: -5, pragmatism: -10, path: AriaPath.Custodian,
      },
      optionB: {
        label: 'Accept. The boost is worth the exposure.',
        empathy: -10, autonomy: 10, pragmatism: 10, path: AriaPath.Broker,
      },
    },
  ];

  ngOnInit(): void {
    this.message = this.ariaService.generateRunEndMessage(this.success());

    // Show a moral choice ~50% of the time
    if (this.features.isEnabled('moralSystem') && Math.random() > 0.5) {
      this.currentChoice = this.choices[Math.floor(Math.random() * this.choices.length)];
    }
  }

  choose(option: 'a' | 'b'): void {
    if (this.currentChoice) {
      this.ariaService.applyMoralChoice(this.currentChoice, option);
      this.currentChoice = null;
      this.choiceMade.emit();
    }
  }
}
