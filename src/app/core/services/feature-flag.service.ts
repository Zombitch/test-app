import { Injectable, signal, computed } from '@angular/core';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from '../config/feature-flags';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags = signal<FeatureFlags>({ ...DEFAULT_FEATURE_FLAGS });

  readonly allFlags = this.flags.asReadonly();

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags()[flag];
  }

  toggle(flag: keyof FeatureFlags): void {
    this.flags.update(f => ({ ...f, [flag]: !f[flag] }));
  }

  enable(flag: keyof FeatureFlags): void {
    this.flags.update(f => ({ ...f, [flag]: true }));
  }

  disable(flag: keyof FeatureFlags): void {
    this.flags.update(f => ({ ...f, [flag]: false }));
  }

  setAll(flags: Partial<FeatureFlags>): void {
    this.flags.update(f => ({ ...f, ...flags }));
  }

  reset(): void {
    this.flags.set({ ...DEFAULT_FEATURE_FLAGS });
  }
}
