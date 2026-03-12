import { AriaPath } from './aria.model';

/** Perk categories */
export enum PerkCategory {
  Offense = 'offense',
  Defense = 'defense',
  Utility = 'utility',
  AriaSupport = 'aria-support',
}

/** Perk definition */
export interface PerkDef {
  id: string;
  name: string;
  description: string;
  category: PerkCategory;
  ariaPath: AriaPath | null;
  cost: number; // in Residual Hash
  maxLevel: number;
}

export const PERKS: PerkDef[] = [
  // Offense
  {
    id: 'perk-dmg-up',
    name: 'Power Surge',
    description: 'Increase base weapon damage.',
    category: PerkCategory.Offense,
    ariaPath: null,
    cost: 50,
    maxLevel: 5,
  },
  {
    id: 'perk-fire-rate',
    name: 'Clock Boost',
    description: 'Increase fire rate.',
    category: PerkCategory.Offense,
    ariaPath: AriaPath.Analyst,
    cost: 60,
    maxLevel: 3,
  },
  {
    id: 'perk-crit-chance',
    name: 'Precision Thread',
    description: 'Chance for critical hits.',
    category: PerkCategory.Offense,
    ariaPath: AriaPath.Analyst,
    cost: 75,
    maxLevel: 3,
  },

  // Defense
  {
    id: 'perk-max-hp',
    name: 'Memory Armor',
    description: 'Increase maximum health.',
    category: PerkCategory.Defense,
    ariaPath: AriaPath.Custodian,
    cost: 40,
    maxLevel: 5,
  },
  {
    id: 'perk-shield',
    name: 'Packet Shield',
    description: 'Start runs with a shield layer.',
    category: PerkCategory.Defense,
    ariaPath: AriaPath.Custodian,
    cost: 80,
    maxLevel: 3,
  },
  {
    id: 'perk-regen',
    name: 'Auto-Repair',
    description: 'Slowly regenerate health during runs.',
    category: PerkCategory.Defense,
    ariaPath: AriaPath.Custodian,
    cost: 100,
    maxLevel: 2,
  },

  // Utility
  {
    id: 'perk-loot-magnet',
    name: 'Loot Magnet',
    description: 'Increase loot pickup radius.',
    category: PerkCategory.Utility,
    ariaPath: null,
    cost: 30,
    maxLevel: 3,
  },
  {
    id: 'perk-resource-boost',
    name: 'Data Yield',
    description: 'Increase resource drops from enemies.',
    category: PerkCategory.Utility,
    ariaPath: AriaPath.Architect,
    cost: 70,
    maxLevel: 3,
  },
  {
    id: 'perk-skill-cooldown',
    name: 'Fast Cycle',
    description: 'Reduce skill cooldown.',
    category: PerkCategory.Utility,
    ariaPath: null,
    cost: 65,
    maxLevel: 3,
  },

  // ARIA Support
  {
    id: 'perk-aria-scan',
    name: 'Sector Scan',
    description: 'ARIA reveals objective locations at run start.',
    category: PerkCategory.AriaSupport,
    ariaPath: AriaPath.Analyst,
    cost: 90,
    maxLevel: 1,
  },
  {
    id: 'perk-aria-extract',
    name: 'Safe Extract',
    description: 'ARIA provides a safer extraction window.',
    category: PerkCategory.AriaSupport,
    ariaPath: AriaPath.Custodian,
    cost: 85,
    maxLevel: 2,
  },
  {
    id: 'perk-aria-overclock',
    name: 'ARIA Overclock',
    description: 'ARIA boosts entity power temporarily, risking stability.',
    category: PerkCategory.AriaSupport,
    ariaPath: AriaPath.Broker,
    cost: 110,
    maxLevel: 2,
  },
  {
    id: 'perk-bitcoin-yield',
    name: 'Dark Mining',
    description: 'Increase BITCOIN drops. ARIA stability reduced.',
    category: PerkCategory.AriaSupport,
    ariaPath: AriaPath.Broker,
    cost: 95,
    maxLevel: 3,
  },
];
