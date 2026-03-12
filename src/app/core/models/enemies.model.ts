/** Enemy family types */
export enum EnemyFamily {
  SpamSwarm = 'spam-swarm',
  Virus = 'virus',
  Trojan = 'trojan',
  Worm = 'worm',
  Spyware = 'spyware',
  FirewallSentinel = 'firewall-sentinel',
  Rootkit = 'rootkit',
  RansomNode = 'ransom-node',
}

/** Enemy tier classification */
export enum EnemyTier {
  Fodder = 'fodder',
  Standard = 'standard',
  Elite = 'elite',
  MiniBoss = 'mini-boss',
  Boss = 'boss',
}

/** Enemy definition */
export interface EnemyDef {
  family: EnemyFamily;
  name: string;
  description: string;
  tier: EnemyTier;
  health: number;
  speed: number;
  damage: number;
  size: number;
  color: string;
  behavior: EnemyBehavior;
}

export enum EnemyBehavior {
  Rush = 'rush',           // charge at player
  Orbit = 'orbit',         // circle around player
  Patrol = 'patrol',       // move in patterns
  Ambush = 'ambush',       // hide then strike
  Ranged = 'ranged',       // shoot from distance
  Split = 'split',         // duplicate when hit
  Block = 'block',         // shield/block path
  Steal = 'steal',         // target loot
}

export const ENEMY_DEFS: Record<EnemyFamily, EnemyDef> = {
  [EnemyFamily.SpamSwarm]: {
    family: EnemyFamily.SpamSwarm,
    name: 'Spam Swarm',
    description: 'Weak flood enemies that overwhelm through numbers.',
    tier: EnemyTier.Fodder,
    health: 10,
    speed: 120,
    damage: 3,
    size: 12,
    color: '#88C0D0',
    behavior: EnemyBehavior.Rush,
  },
  [EnemyFamily.Virus]: {
    family: EnemyFamily.Virus,
    name: 'Virus',
    description: 'Duplicates if ignored too long.',
    tier: EnemyTier.Standard,
    health: 25,
    speed: 80,
    damage: 8,
    size: 16,
    color: '#BF616A',
    behavior: EnemyBehavior.Split,
  },
  [EnemyFamily.Trojan]: {
    family: EnemyFamily.Trojan,
    name: 'Trojan',
    description: 'Fake weak units hiding dangerous forms.',
    tier: EnemyTier.Standard,
    health: 40,
    speed: 60,
    damage: 15,
    size: 18,
    color: '#D08770',
    behavior: EnemyBehavior.Ambush,
  },
  [EnemyFamily.Worm]: {
    family: EnemyFamily.Worm,
    name: 'Worm',
    description: 'Long pathing enemies that cut routes.',
    tier: EnemyTier.Standard,
    health: 35,
    speed: 100,
    damage: 10,
    size: 14,
    color: '#A3BE8C',
    behavior: EnemyBehavior.Patrol,
  },
  [EnemyFamily.Spyware]: {
    family: EnemyFamily.Spyware,
    name: 'Spyware',
    description: 'Tracks and steals loot or reveals the player.',
    tier: EnemyTier.Standard,
    health: 20,
    speed: 110,
    damage: 5,
    size: 14,
    color: '#B48EAD',
    behavior: EnemyBehavior.Steal,
  },
  [EnemyFamily.FirewallSentinel]: {
    family: EnemyFamily.FirewallSentinel,
    name: 'Firewall Sentinel',
    description: 'Armored blockers that shield other enemies.',
    tier: EnemyTier.Elite,
    health: 80,
    speed: 40,
    damage: 12,
    size: 24,
    color: '#5E81AC',
    behavior: EnemyBehavior.Block,
  },
  [EnemyFamily.Rootkit]: {
    family: EnemyFamily.Rootkit,
    name: 'Rootkit',
    description: 'Hidden elites that activate late and hit hard.',
    tier: EnemyTier.Elite,
    health: 60,
    speed: 90,
    damage: 20,
    size: 20,
    color: '#4C566A',
    behavior: EnemyBehavior.Ambush,
  },
  [EnemyFamily.RansomNode]: {
    family: EnemyFamily.RansomNode,
    name: 'Ransom Node',
    description: 'Mini-boss with corrupt reward logic.',
    tier: EnemyTier.MiniBoss,
    health: 150,
    speed: 30,
    damage: 25,
    size: 28,
    color: '#EBCB8B',
    behavior: EnemyBehavior.Ranged,
  },
};

/** Boss definitions */
export enum BossId {
  JunkMail = 'junk-mail',
  Worm0 = 'worm-0',
  SaintFirewall = 'saint-firewall',
  TheMiner = 'the-miner',
}

export interface BossDef {
  id: BossId;
  name: string;
  title: string;
  description: string;
  sector: string;
  health: number;
  phases: number;
}

export const BOSS_DEFS: Record<BossId, BossDef> = {
  [BossId.JunkMail]: {
    id: BossId.JunkMail,
    name: 'JUNK_MAIL',
    title: 'Spam Core',
    description: 'Floods the screen with low-damage clutter until the player breaks its source nodes.',
    sector: 'cache-wastes',
    health: 500,
    phases: 3,
  },
  [BossId.Worm0]: {
    id: BossId.Worm0,
    name: 'WORM_0',
    title: 'Frozen Segmented Worm',
    description: 'A segmented frozen worm threading through the map forcing constant repositioning.',
    sector: 'coolant-cathedrals',
    health: 700,
    phases: 3,
  },
  [BossId.SaintFirewall]: {
    id: BossId.SaintFirewall,
    name: 'SAINT_FIREWALL',
    title: 'Geometric Defense AI',
    description: 'Traps the player in shrinking bullet lattices.',
    sector: 'kernel-bastion',
    health: 900,
    phases: 4,
  },
  [BossId.TheMiner]: {
    id: BossId.TheMiner,
    name: 'THE MINER',
    title: 'Cynical Exploit Core',
    description: 'Offers fake "investment" choices, then weaponizes them.',
    sector: 'hash-forge',
    health: 800,
    phases: 3,
  },
};
