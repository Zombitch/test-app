/** All available weapon types */
export enum WeaponId {
  Cleaner = 'cleaner',
  Antivirus = 'antivirus',
  SecurityLoader = 'security-loader',
  SwarmKiller = 'swarm-killer',
  FirewallBreaker = 'firewall-breaker',
  Reset = 'reset',
}

/** Weapon definition */
export interface Weapon {
  id: WeaponId;
  name: string;
  identity: string;
  description: string;
  role: string;
  baseDamage: number;
  fireRate: number;       // shots per second
  projectileSpeed: number;
  projectileCount: number;
  spread: number;         // angle in degrees
  piercing: boolean;
  range: number;
  unlocked: boolean;
}

export const WEAPONS: Record<WeaponId, Weapon> = {
  [WeaponId.Cleaner]: {
    id: WeaponId.Cleaner,
    name: 'Cleaner',
    identity: 'Delete noise. Stay alive.',
    description: 'A steady, accurate stream of purge rounds.',
    role: 'Balanced, safe, good starter weapon.',
    baseDamage: 10,
    fireRate: 6,
    projectileSpeed: 600,
    projectileCount: 1,
    spread: 0,
    piercing: false,
    range: 400,
    unlocked: true,
  },
  [WeaponId.Antivirus]: {
    id: WeaponId.Antivirus,
    name: 'Antivirus',
    identity: 'Not the fastest. The smartest.',
    description: 'Tracking packets that mark infected targets. Marked enemies take extra damage and cannot replicate.',
    role: 'Anti-virus / anti-elite, priority kills.',
    baseDamage: 8,
    fireRate: 4,
    projectileSpeed: 500,
    projectileCount: 1,
    spread: 0,
    piercing: false,
    range: 450,
    unlocked: false,
  },
  [WeaponId.SecurityLoader]: {
    id: WeaponId.SecurityLoader,
    name: 'Security Loader',
    identity: 'Security was always for those who don\'t get hit.',
    description: 'A burst weapon that loads security packets in volleys. Burst power grows while undamaged.',
    role: 'Disciplined play, rewards clean movement.',
    baseDamage: 7,
    fireRate: 8,
    projectileSpeed: 550,
    projectileCount: 3,
    spread: 5,
    piercing: false,
    range: 350,
    unlocked: false,
  },
  [WeaponId.SwarmKiller]: {
    id: WeaponId.SwarmKiller,
    name: 'Swarm Killer',
    identity: 'When the sector dumps trash on you, dump harder.',
    description: 'Wide spread weapon for crowd control. Excellent against spam floods and worm clusters.',
    role: 'Close/mid crowd clear, panic control.',
    baseDamage: 5,
    fireRate: 5,
    projectileSpeed: 450,
    projectileCount: 5,
    spread: 30,
    piercing: false,
    range: 250,
    unlocked: false,
  },
  [WeaponId.FirewallBreaker]: {
    id: WeaponId.FirewallBreaker,
    name: 'Firewall Breaker',
    identity: 'Permission denied? Cute.',
    description: 'Piercing heavy shots that shred armor, shield nodes, and elite barriers.',
    role: 'Anti-heavy, anti-boss utility.',
    baseDamage: 25,
    fireRate: 2,
    projectileSpeed: 400,
    projectileCount: 1,
    spread: 0,
    piercing: true,
    range: 500,
    unlocked: false,
  },
  [WeaponId.Reset]: {
    id: WeaponId.Reset,
    name: 'Reset',
    identity: 'Sometimes the cleanest fix is a controlled crash.',
    description: 'Builds charge from kills, then triggers localized reset pulses that wipe bullets and damage nearby enemies.',
    role: 'Technical nuke, clutch recovery.',
    baseDamage: 15,
    fireRate: 3,
    projectileSpeed: 500,
    projectileCount: 1,
    spread: 0,
    piercing: false,
    range: 300,
    unlocked: false,
  },
};
