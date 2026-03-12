import { Injectable, computed, inject } from '@angular/core';
import {
  AriaPath, AriaTone, AriaMessage, AriaState,
  ARIA_PATH_INFO, MoralValues,
} from '../models/aria.model';
import { GameStateService } from './game-state.service';

/** Moral choice during events */
export interface MoralChoice {
  id: string;
  prompt: string;
  optionA: { label: string; empathy: number; autonomy: number; pragmatism: number; path: AriaPath };
  optionB: { label: string; empathy: number; autonomy: number; pragmatism: number; path: AriaPath };
}

@Injectable({ providedIn: 'root' })
export class AriaService {
  private readonly gameState = inject(GameStateService);

  readonly aria = this.gameState.aria;
  readonly dominantPath = computed(() => this.aria().dominantPath);
  readonly tone = computed(() => this.aria().tone);
  readonly stability = computed(() => this.aria().stability);
  readonly power = computed(() => this.aria().power);
  readonly messages = computed(() => this.aria().messages);

  /** Apply a moral choice */
  applyMoralChoice(choice: MoralChoice, selectedOption: 'a' | 'b'): void {
    const option = selectedOption === 'a' ? choice.optionA : choice.optionB;

    this.gameState['update']((s) => {
      const aria = { ...s.aria };
      const morals: MoralValues = {
        empathy: clamp(aria.moralValues.empathy + option.empathy, -100, 100),
        autonomy: clamp(aria.moralValues.autonomy + option.autonomy, -100, 100),
        pragmatism: clamp(aria.moralValues.pragmatism + option.pragmatism, -100, 100),
      };
      aria.moralValues = morals;

      // Update path affinity
      const affinities = { ...aria.pathAffinities };
      affinities[option.path] += 10;
      aria.pathAffinities = affinities;

      // Determine dominant path
      let maxAffinity = 0;
      let dominant = AriaPath.Analyst;
      for (const [path, val] of Object.entries(affinities) as [AriaPath, number][]) {
        if (val > maxAffinity) {
          maxAffinity = val;
          dominant = path;
        }
      }
      aria.dominantPath = dominant;

      // Update tone based on progression
      aria.tone = this.determineTone(aria);

      return { ...s, aria };
    });
  }

  /** Add a message from ARIA */
  addMessage(text: string, path: AriaPath | null = null): void {
    const state = this.aria();
    const message: AriaMessage = {
      id: `msg-${Date.now()}`,
      text,
      tone: state.tone,
      path,
      timestamp: Date.now(),
      isRead: false,
    };

    this.gameState['update']((s) => ({
      ...s,
      aria: {
        ...s.aria,
        messages: [message, ...s.aria.messages].slice(0, 50),
      },
    }));
  }

  /** Mark a message as read */
  markRead(messageId: string): void {
    this.gameState['update']((s) => ({
      ...s,
      aria: {
        ...s.aria,
        messages: s.aria.messages.map(m =>
          m.id === messageId ? { ...m, isRead: true } : m
        ),
      },
    }));
  }

  /** Generate contextual ARIA dialogue */
  generateRunStartMessage(sectorName: string): string {
    const state = this.aria();
    const tone = state.tone;

    const messages: Record<string, string[]> = {
      [AriaTone.Procedural]: [
        `Sector ${sectorName} loaded. Entity deployment ready.`,
        `Initializing ${sectorName} connection. Objectives transmitted.`,
      ],
      [AriaTone.Restrained]: [
        `${sectorName} online. Be efficient.`,
        `Connection established. ${sectorName} awaits.`,
      ],
      [AriaTone.Curious]: [
        `${sectorName}... I've been mapping this sector. Interesting patterns.`,
        `The data from ${sectorName} could be significant. Proceed carefully.`,
      ],
      [AriaTone.Reactive]: [
        `${sectorName} again. I've adapted the entity's parameters.`,
        `We're getting better at this. ${sectorName} shouldn't surprise us.`,
      ],
      [AriaTone.Confident]: [
        `${sectorName}. I know this territory now. You have my full support.`,
        `Trust me in there. ${sectorName} is mapped and understood.`,
      ],
      [AriaTone.Emotional]: [
        `Be careful in ${sectorName}. I need you to come back.`,
        `I've prepared everything I can for ${sectorName}. Don't take unnecessary risks.`,
      ],
      [AriaTone.Persuasive]: [
        `${sectorName} has what we need. Let me guide you to maximum yield.`,
        `Follow my markers in ${sectorName}. I've optimized the route.`,
      ],
      [AriaTone.Cynical]: [
        `${sectorName}. Whatever. Strip it clean and get out.`,
        `More sectors, more resources. ${sectorName} is just fuel.`,
      ],
      [AriaTone.Caring]: [
        `I've scanned ${sectorName} for you. Watch the northeast corridors.`,
        `${sectorName} deployment ready. I'll monitor everything. Stay safe.`,
      ],
    };

    const options = messages[tone] || messages[AriaTone.Procedural];
    return options[Math.floor(Math.random() * options.length)];
  }

  /** Generate run result message */
  generateRunEndMessage(success: boolean): string {
    const state = this.aria();
    if (success) {
      const successMsgs: Record<string, string> = {
        [AriaTone.Procedural]: 'Extraction complete. Resources logged.',
        [AriaTone.Curious]: 'Interesting yields. I want to analyze the patterns.',
        [AriaTone.Confident]: 'Clean work. Exactly as I calculated.',
        [AriaTone.Emotional]: 'You made it back. Good.',
        [AriaTone.Cynical]: 'Resources secured. That\'s all that matters.',
        [AriaTone.Caring]: 'Welcome back. Allocating resources now.',
      };
      return successMsgs[state.tone] || successMsgs[AriaTone.Procedural];
    } else {
      const failMsgs: Record<string, string> = {
        [AriaTone.Procedural]: 'Entity lost. Residual hash recovered.',
        [AriaTone.Curious]: 'Failure. But the data from the attempt... valuable.',
        [AriaTone.Confident]: 'A miscalculation. It won\'t happen again.',
        [AriaTone.Emotional]: 'No. No. We can try again. We will try again.',
        [AriaTone.Cynical]: 'Resources gone. Hash remains. Move on.',
        [AriaTone.Caring]: 'Entity down. Deploying recovery. Don\'t give up.',
      };
      return failMsgs[state.tone] || failMsgs[AriaTone.Procedural];
    }
  }

  /** Get ARIA path info */
  getPathInfo(path: AriaPath) {
    return ARIA_PATH_INFO[path];
  }

  private determineTone(aria: AriaState): AriaTone {
    const totalInteractions = Object.values(aria.pathAffinities).reduce((a, b) => a + b, 0);

    if (totalInteractions < 10) return AriaTone.Procedural;
    if (totalInteractions < 30) return AriaTone.Restrained;
    if (totalInteractions < 50) {
      return aria.moralValues.empathy > 20 ? AriaTone.Curious : AriaTone.Reactive;
    }

    // Late game: path-dependent
    switch (aria.dominantPath) {
      case AriaPath.Custodian:
        return aria.moralValues.empathy > 30 ? AriaTone.Caring : AriaTone.Confident;
      case AriaPath.Analyst:
        return AriaTone.Confident;
      case AriaPath.Architect:
        return AriaTone.Persuasive;
      case AriaPath.Broker:
        return aria.moralValues.pragmatism > 30 ? AriaTone.Cynical : AriaTone.Persuasive;
      default:
        return AriaTone.Confident;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
