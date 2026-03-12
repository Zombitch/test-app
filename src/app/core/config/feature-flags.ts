/**
 * Feature flags for enabling/disabling game features.
 * Toggle any feature by setting its boolean value.
 */
export interface FeatureFlags {
  // Core phases
  hubPhase: boolean;
  runPhase: boolean;
  resultPhase: boolean;

  // Hub features
  ariaMessages: boolean;
  resourceAllocation: boolean;
  perkShop: boolean;
  loadoutSelection: boolean;
  sectorSelection: boolean;

  // Run features
  enemies: boolean;
  bossEncounters: boolean;
  lootDrops: boolean;
  sideObjectives: boolean;
  eventNodes: boolean;
  extractionDecision: boolean;

  // Combat features
  autoFire: boolean;
  skillSlot: boolean;
  dashAbility: boolean;

  // Systems
  ariaProgression: boolean;
  ariaPersonality: boolean;
  moralSystem: boolean;
  metaCurrency: boolean;
  weaponSystem: boolean;
  skillSystem: boolean;

  // Sectors
  cacheWastes: boolean;
  coolantCathedrals: boolean;
  kernelBastion: boolean;
  hashForge: boolean;
  archeDock: boolean;

  // UI
  touchControls: boolean;
  hud: boolean;
  minimap: boolean;
  damageNumbers: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  hubPhase: true,
  runPhase: true,
  resultPhase: true,

  ariaMessages: true,
  resourceAllocation: true,
  perkShop: true,
  loadoutSelection: true,
  sectorSelection: true,

  enemies: true,
  bossEncounters: true,
  lootDrops: true,
  sideObjectives: true,
  eventNodes: true,
  extractionDecision: true,

  autoFire: true,
  skillSlot: true,
  dashAbility: false,

  ariaProgression: true,
  ariaPersonality: true,
  moralSystem: true,
  metaCurrency: true,
  weaponSystem: true,
  skillSystem: true,

  cacheWastes: true,
  coolantCathedrals: true,
  kernelBastion: true,
  hashForge: true,
  archeDock: false,

  touchControls: true,
  hud: true,
  minimap: true,
  damageNumbers: true,
};
