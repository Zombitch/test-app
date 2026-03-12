/** All available active skills */
export enum SkillId {
  Blink = 'blink',
  NullField = 'null-field',
  TracePull = 'trace-pull',
  ColdReboot = 'cold-reboot',
  Overclock = 'overclock',
  ScrubWave = 'scrub-wave',
}

/** Skill definition */
export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  cooldown: number;    // seconds
  duration: number;    // seconds (0 for instant)
  unlocked: boolean;
}

export const SKILLS: Record<SkillId, Skill> = {
  [SkillId.Blink]: {
    id: SkillId.Blink,
    name: 'Blink',
    description: 'Short teleport through bullets.',
    cooldown: 5,
    duration: 0,
    unlocked: true,
  },
  [SkillId.NullField]: {
    id: SkillId.NullField,
    name: 'Null Field',
    description: 'Slows enemy shots briefly.',
    cooldown: 8,
    duration: 3,
    unlocked: false,
  },
  [SkillId.TracePull]: {
    id: SkillId.TracePull,
    name: 'Trace Pull',
    description: 'Pulls nearby loot to the player.',
    cooldown: 6,
    duration: 2,
    unlocked: false,
  },
  [SkillId.ColdReboot]: {
    id: SkillId.ColdReboot,
    name: 'Cold Reboot',
    description: 'Emergency shield and brief invulnerability.',
    cooldown: 15,
    duration: 2,
    unlocked: false,
  },
  [SkillId.Overclock]: {
    id: SkillId.Overclock,
    name: 'Overclock',
    description: 'Temporary fire-rate spike.',
    cooldown: 10,
    duration: 4,
    unlocked: false,
  },
  [SkillId.ScrubWave]: {
    id: SkillId.ScrubWave,
    name: 'Scrub Wave',
    description: 'Area pulse that clears weak enemies.',
    cooldown: 12,
    duration: 0,
    unlocked: false,
  },
};
