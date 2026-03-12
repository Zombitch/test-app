import { Injectable, signal, computed } from '@angular/core';
import {
  GameState, GamePhase, RunState, RunOutcome, EndState,
  Loadout, createInitialGameState,
} from '../models/game-state.model';
import {
  RunResources, createEmptyRunResources, ResourceType,
} from '../models/resources.model';
import { SectorId } from '../models/sectors.model';
import { WeaponId } from '../models/weapons.model';
import { SkillId } from '../models/skills.model';

const STORAGE_KEY = 'aria-game-state';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly state = signal<GameState>(this.loadState());

  readonly gameState = this.state.asReadonly();
  readonly phase = computed(() => this.state().phase);
  readonly economy = computed(() => this.state().economy);
  readonly aria = computed(() => this.state().aria);
  readonly progression = computed(() => this.state().progression);
  readonly currentRun = computed(() => this.state().currentRun);
  readonly endState = computed(() => this.state().endState);

  /** Transition to a game phase */
  setPhase(phase: GamePhase): void {
    this.update(s => ({ ...s, phase }));
  }

  /** Start a new run */
  startRun(sectorId: SectorId, loadout: Loadout): void {
    const run: RunState = {
      sectorId,
      loadout,
      elapsedTime: 0,
      collectedResources: createEmptyRunResources(),
      enemiesKilled: 0,
      primaryObjectiveComplete: false,
      sideObjectiveComplete: false,
      playerHealth: 100,
      playerMaxHealth: 100,
      playerShield: 0,
      skillCooldownRemaining: 0,
      isExtracting: false,
    };
    this.update(s => ({
      ...s,
      phase: GamePhase.Run,
      currentRun: run,
    }));
  }

  /** Update run state during gameplay */
  updateRun(partial: Partial<RunState>): void {
    this.update(s => ({
      ...s,
      currentRun: s.currentRun ? { ...s.currentRun, ...partial } : null,
    }));
  }

  /** Add collected resources during a run */
  addRunResource(type: ResourceType, amount: number): void {
    this.update(s => {
      if (!s.currentRun) return s;
      const collected = { ...s.currentRun.collectedResources };
      collected[type] += amount;
      return {
        ...s,
        currentRun: { ...s.currentRun, collectedResources: collected },
      };
    });
  }

  /** End the current run */
  endRun(outcome: RunOutcome): void {
    this.update(s => {
      if (!s.currentRun) return s;

      const newEconomy = { ...s.economy };
      const collected = s.currentRun.collectedResources;

      if (outcome === RunOutcome.Success || outcome === RunOutcome.Extracted) {
        // Keep run loot on success
        const total = { ...newEconomy.totalResources };
        for (const key of Object.keys(collected) as ResourceType[]) {
          total[key] += collected[key];
        }
        newEconomy.totalResources = total;
      }

      // Always gain residual hash (meta-currency)
      const hashEarned = Math.floor(
        s.currentRun.enemiesKilled * 2 +
        (s.currentRun.primaryObjectiveComplete ? 20 : 0) +
        (s.currentRun.sideObjectiveComplete ? 10 : 0) +
        (outcome === RunOutcome.Failure ? 5 : 0)
      );
      newEconomy.metaCurrency = {
        residualHash: newEconomy.metaCurrency.residualHash + hashEarned,
      };

      const newProgression = { ...s.progression };
      newProgression.totalRuns++;
      if (outcome === RunOutcome.Success) {
        newProgression.successfulRuns++;
      }

      return {
        ...s,
        phase: GamePhase.Result,
        economy: newEconomy,
        progression: newProgression,
        currentRun: null,
        lastRunOutcome: outcome,
      };
    });
  }

  /** Allocate resources to ARIA */
  allocateToAria(resources: Partial<RunResources>): void {
    this.update(s => {
      const total = { ...s.economy.totalResources };
      const aria = { ...s.aria };

      for (const [key, amount] of Object.entries(resources) as [ResourceType, number][]) {
        if (total[key] >= amount) {
          total[key] -= amount;
          aria.power += amount;
          if (key === 'bitcoin') {
            aria.stability -= Math.floor(amount * 0.5);
          } else {
            aria.stability += Math.floor(amount * 0.1);
          }
        }
      }

      aria.stability = Math.max(0, Math.min(100, aria.stability));

      return {
        ...s,
        economy: { ...s.economy, totalResources: total },
        aria,
      };
    });
  }

  /** Spend residual hash on a perk */
  purchasePerk(perkId: string, cost: number): boolean {
    const state = this.state();
    if (state.economy.metaCurrency.residualHash < cost) return false;
    if (state.progression.purchasedPerks.includes(perkId)) return false;

    this.update(s => ({
      ...s,
      economy: {
        ...s.economy,
        metaCurrency: {
          residualHash: s.economy.metaCurrency.residualHash - cost,
        },
      },
      progression: {
        ...s.progression,
        purchasedPerks: [...s.progression.purchasedPerks, perkId],
      },
    }));
    return true;
  }

  /** Unlock a weapon */
  unlockWeapon(weaponId: WeaponId): void {
    this.update(s => ({
      ...s,
      progression: {
        ...s.progression,
        unlockedWeapons: [...new Set([...s.progression.unlockedWeapons, weaponId])],
      },
    }));
  }

  /** Unlock a skill */
  unlockSkill(skillId: SkillId): void {
    this.update(s => ({
      ...s,
      progression: {
        ...s.progression,
        unlockedSkills: [...new Set([...s.progression.unlockedSkills, skillId])],
      },
    }));
  }

  /** Unlock a sector */
  unlockSector(sectorId: SectorId): void {
    this.update(s => ({
      ...s,
      progression: {
        ...s.progression,
        unlockedSectors: [...new Set([...s.progression.unlockedSectors, sectorId])],
      },
    }));
  }

  /** Check end-state conditions */
  checkEndState(): EndState {
    const s = this.state();
    if (s.aria.power > 500 && s.aria.stability < 20) {
      this.update(st => ({ ...st, endState: EndState.OverloadFailure }));
      return EndState.OverloadFailure;
    }
    if (s.aria.launchReadiness >= 100 && s.aria.stability >= 60) {
      this.update(st => ({ ...st, endState: EndState.PerfectCalibration }));
      return EndState.PerfectCalibration;
    }
    return EndState.None;
  }

  /** Save to localStorage */
  saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // Storage unavailable
    }
  }

  /** Reset entire game */
  resetGame(): void {
    this.state.set(createInitialGameState());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
  }

  private update(fn: (state: GameState) => GameState): void {
    this.state.update(fn);
    this.saveState();
  }

  private loadState(): GameState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as GameState;
      }
    } catch {
      // Corrupted or unavailable
    }
    return createInitialGameState();
  }
}
