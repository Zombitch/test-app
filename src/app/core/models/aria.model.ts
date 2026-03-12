/** ARIA's four evolution paths */
export enum AriaPath {
  Custodian = 'custodian',
  Analyst = 'analyst',
  Architect = 'architect',
  Broker = 'broker',
}

/** ARIA's personality tone progression */
export enum AriaTone {
  Procedural = 'procedural',
  Restrained = 'restrained',
  Curious = 'curious',
  Reactive = 'reactive',
  Confident = 'confident',
  Emotional = 'emotional',
  Persuasive = 'persuasive',
  Cynical = 'cynical',
  Caring = 'caring',
}

/** Hidden moral tracking values */
export interface MoralValues {
  empathy: number;    // -100 to 100
  autonomy: number;   // -100 to 100
  pragmatism: number; // -100 to 100
}

/** ARIA's current state */
export interface AriaState {
  level: number;
  power: number;
  stability: number;
  dominantPath: AriaPath;
  pathAffinities: Record<AriaPath, number>;
  tone: AriaTone;
  moralValues: MoralValues;
  unlockedPerks: string[];
  messages: AriaMessage[];
  launchReadiness: number; // 0-100
}

/** ARIA message/dialogue entry */
export interface AriaMessage {
  id: string;
  text: string;
  tone: AriaTone;
  path: AriaPath | null;
  timestamp: number;
  isRead: boolean;
}

/** ARIA path descriptions */
export const ARIA_PATH_INFO: Record<AriaPath, { name: string; description: string; strength: string }> = {
  [AriaPath.Custodian]: {
    name: 'Custodian',
    description: 'Protective, stable, preservation-first.',
    strength: 'Defense, survival, safer extractions',
  },
  [AriaPath.Analyst]: {
    name: 'Analyst',
    description: 'Precise, efficient, emotionally restrained.',
    strength: 'Scans, critical bonuses, resource conversion',
  },
  [AriaPath.Architect]: {
    name: 'Architect',
    description: 'Forward-looking, ambitious, reconstruction-driven.',
    strength: 'Scaling, long-run synergy, growth effects',
  },
  [AriaPath.Broker]: {
    name: 'Broker',
    description: 'Openly cynical, adaptive, ethically dirty.',
    strength: 'BITCOIN, corruption bargains, risky power spikes',
  },
};

export function createInitialAriaState(): AriaState {
  return {
    level: 1,
    power: 0,
    stability: 50,
    dominantPath: AriaPath.Analyst,
    pathAffinities: {
      [AriaPath.Custodian]: 0,
      [AriaPath.Analyst]: 0,
      [AriaPath.Architect]: 0,
      [AriaPath.Broker]: 0,
    },
    tone: AriaTone.Procedural,
    moralValues: {
      empathy: 0,
      autonomy: 0,
      pragmatism: 0,
    },
    unlockedPerks: [],
    messages: [],
    launchReadiness: 0,
  };
}
