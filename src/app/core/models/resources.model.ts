/** Run resources — collected during missions, lost on failure */
export interface RunResources {
  cpu: number;
  ram: number;
  gpu: number;
  data: number;
  bitcoin: number;
}

/** Permanent meta-currency — earned even on failure */
export interface MetaCurrency {
  residualHash: number;
}

/** Combined player economy */
export interface PlayerEconomy {
  runResources: RunResources;
  totalResources: RunResources;
  metaCurrency: MetaCurrency;
}

export function createEmptyRunResources(): RunResources {
  return { cpu: 0, ram: 0, gpu: 0, data: 0, bitcoin: 0 };
}

export function createEmptyMetaCurrency(): MetaCurrency {
  return { residualHash: 0 };
}

export type ResourceType = keyof RunResources;

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  cpu: 'CPU',
  ram: 'RAM',
  gpu: 'GPU',
  data: 'DATA',
  bitcoin: 'BITCOIN',
};

export const RESOURCE_DESCRIPTIONS: Record<ResourceType, string> = {
  cpu: 'Processing power — fire rate, targeting, support timing',
  ram: 'Memory — perk capacity, temporary modifiers, build flexibility',
  gpu: 'Visual compute — weapon output, beam weapons, heavy effects',
  data: 'Information — lore, decryption, intel, advanced upgrades',
  bitcoin: 'Black-market currency — shady shortcuts, exploit upgrades',
};
