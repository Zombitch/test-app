import { AriaState, createInitialAriaState } from './aria.model';
import { PlayerEconomy, createEmptyRunResources, createEmptyMetaCurrency } from './resources.model';
import { WeaponId } from './weapons.model';
import { SkillId } from './skills.model';
import { SectorId } from './sectors.model';

/** Top-level game phase */
export enum GamePhase {
  Hub = 'hub',
  Run = 'run',
  Result = 'result',
}

/** Run outcome */
export enum RunOutcome {
  Success = 'success',
  Failure = 'failure',
  Extracted = 'extracted',
}

/** End-game state */
export enum EndState {
  None = 'none',
  OverloadFailure = 'overload-failure',
  StarvationFailure = 'starvation-failure',
  PerfectCalibration = 'perfect-calibration',
}

/** Player loadout for a run */
export interface Loadout {
  weaponId: WeaponId;
  skillId: SkillId;
}

/** Current run state */
export interface RunState {
  sectorId: SectorId;
  loadout: Loadout;
  elapsedTime: number;
  collectedResources: import('./resources.model').RunResources;
  enemiesKilled: number;
  primaryObjectiveComplete: boolean;
  sideObjectiveComplete: boolean;
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
  skillCooldownRemaining: number;
  isExtracting: boolean;
}

/** Permanent player progression */
export interface PlayerProgression {
  totalRuns: number;
  successfulRuns: number;
  unlockedWeapons: WeaponId[];
  unlockedSkills: SkillId[];
  unlockedSectors: SectorId[];
  purchasedPerks: string[];
}

/** Complete game state */
export interface GameState {
  phase: GamePhase;
  economy: PlayerEconomy;
  aria: AriaState;
  progression: PlayerProgression;
  currentRun: RunState | null;
  lastRunOutcome: RunOutcome | null;
  endState: EndState;
}

export function createInitialGameState(): GameState {
  return {
    phase: GamePhase.Hub,
    economy: {
      runResources: createEmptyRunResources(),
      totalResources: createEmptyRunResources(),
      metaCurrency: createEmptyMetaCurrency(),
    },
    aria: createInitialAriaState(),
    progression: {
      totalRuns: 0,
      successfulRuns: 0,
      unlockedWeapons: [WeaponId.Cleaner],
      unlockedSkills: [SkillId.Blink],
      unlockedSectors: [SectorId.CacheWastes],
      purchasedPerks: [],
    },
    currentRun: null,
    lastRunOutcome: null,
    endState: EndState.None,
  };
}
