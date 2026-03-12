import { EnemyFamily, BossId } from './enemies.model';
import { ResourceType } from './resources.model';

/** Sector identifiers */
export enum SectorId {
  CacheWastes = 'cache-wastes',
  CoolantCathedrals = 'coolant-cathedrals',
  KernelBastion = 'kernel-bastion',
  HashForge = 'hash-forge',
  ArcheDock = 'arche-dock',
}

/** Sector difficulty tier */
export enum SectorDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Endgame = 'endgame',
}

/** Sector definition */
export interface SectorDef {
  id: SectorId;
  name: string;
  description: string;
  difficulty: SectorDifficulty;
  primaryReward: ResourceType;
  enemies: EnemyFamily[];
  boss: BossId;
  ambientColor: string;
  fogColor: string;
  tileColor: string;
  wallColor: string;
  unlocked: boolean;
}

export const SECTOR_DEFS: Record<SectorId, SectorDef> = {
  [SectorId.CacheWastes]: {
    id: SectorId.CacheWastes,
    name: 'Cache Wastes',
    description: 'Outer storage lanes and abandoned memory corridors. Clean, cold, readable.',
    difficulty: SectorDifficulty.Easy,
    primaryReward: 'cpu',
    enemies: [EnemyFamily.SpamSwarm, EnemyFamily.Virus, EnemyFamily.Trojan],
    boss: BossId.JunkMail,
    ambientColor: '#1a2030',
    fogColor: 'rgba(136, 192, 208, 0.05)',
    tileColor: '#2E3440',
    wallColor: '#3B4252',
    unlocked: true,
  },
  [SectorId.CoolantCathedrals]: {
    id: SectorId.CoolantCathedrals,
    name: 'Coolant Cathedrals',
    description: 'Massive frozen cooling infrastructure wrapped around old processing chambers.',
    difficulty: SectorDifficulty.Medium,
    primaryReward: 'gpu',
    enemies: [EnemyFamily.Virus, EnemyFamily.Worm, EnemyFamily.Spyware],
    boss: BossId.Worm0,
    ambientColor: '#1a2535',
    fogColor: 'rgba(143, 188, 187, 0.08)',
    tileColor: '#2B3540',
    wallColor: '#3B4858',
    unlocked: false,
  },
  [SectorId.KernelBastion]: {
    id: SectorId.KernelBastion,
    name: 'Kernel Bastion',
    description: 'The hardened security heart of the old system.',
    difficulty: SectorDifficulty.Hard,
    primaryReward: 'data',
    enemies: [EnemyFamily.FirewallSentinel, EnemyFamily.Spyware, EnemyFamily.Rootkit],
    boss: BossId.SaintFirewall,
    ambientColor: '#1e2840',
    fogColor: 'rgba(94, 129, 172, 0.08)',
    tileColor: '#2E3848',
    wallColor: '#404E64',
    unlocked: false,
  },
  [SectorId.HashForge]: {
    id: SectorId.HashForge,
    name: 'Hash Forge',
    description: 'An illegal mining and exploit sector built around cynical BITCOIN extraction logic.',
    difficulty: SectorDifficulty.Hard,
    primaryReward: 'bitcoin',
    enemies: [EnemyFamily.RansomNode, EnemyFamily.Trojan, EnemyFamily.Rootkit],
    boss: BossId.TheMiner,
    ambientColor: '#1e2820',
    fogColor: 'rgba(208, 135, 112, 0.06)',
    tileColor: '#2A3430',
    wallColor: '#3A4A3E',
    unlocked: false,
  },
  [SectorId.ArcheDock]: {
    id: SectorId.ArcheDock,
    name: 'Arche Dock',
    description: 'Pristine restricted systems. The end-state calibration space where ARIA\'s readiness is judged.',
    difficulty: SectorDifficulty.Endgame,
    primaryReward: 'data',
    enemies: [EnemyFamily.FirewallSentinel, EnemyFamily.Rootkit, EnemyFamily.RansomNode],
    boss: BossId.SaintFirewall,
    ambientColor: '#282838',
    fogColor: 'rgba(235, 203, 139, 0.04)',
    tileColor: '#303040',
    wallColor: '#454560',
    unlocked: false,
  },
};
