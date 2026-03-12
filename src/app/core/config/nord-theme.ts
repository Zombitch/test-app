/**
 * Nord Theme color palette for ARIA.
 * Based on the Nord color scheme (dark mode variant).
 * https://www.nordtheme.com
 */
export const NORD = {
  // Polar Night — dark backgrounds
  nord0: '#2E3440',  // darkest background
  nord1: '#3B4252',  // elevated surfaces
  nord2: '#434C5E',  // selection / hover
  nord3: '#4C566A',  // comments, inactive

  // Snow Storm — text and foreground
  nord4: '#D8DEE9',  // primary text
  nord5: '#E5E9F0',  // secondary text
  nord6: '#ECEFF4',  // bright white text

  // Frost — accent blues/cyans
  nord7: '#8FBCBB',   // teal / support
  nord8: '#88C0D0',   // cyan / primary accent
  nord9: '#81A1C1',   // blue / secondary accent
  nord10: '#5E81AC',  // deep blue / tertiary

  // Aurora — status colors
  nord11: '#BF616A',  // red / danger / overload
  nord12: '#D08770',  // orange / warning / bitcoin
  nord13: '#EBCB8B',  // yellow / highlight / data
  nord14: '#A3BE8C',  // green / success / stable
  nord15: '#B48EAD',  // purple / special / ARIA
} as const;

/** Semantic color mapping for game elements */
export const GAME_COLORS = {
  // Backgrounds
  bgPrimary: NORD.nord0,
  bgSurface: NORD.nord1,
  bgElevated: NORD.nord2,
  bgInactive: NORD.nord3,

  // Text
  textPrimary: NORD.nord4,
  textSecondary: NORD.nord5,
  textBright: NORD.nord6,

  // Resources
  cpu: NORD.nord8,
  ram: NORD.nord9,
  gpu: NORD.nord15,
  data: NORD.nord13,
  bitcoin: NORD.nord12,
  residualHash: NORD.nord7,

  // ARIA paths
  custodian: NORD.nord14,
  analyst: NORD.nord8,
  architect: NORD.nord9,
  broker: NORD.nord12,

  // Status
  health: NORD.nord11,
  shield: NORD.nord8,
  success: NORD.nord14,
  warning: NORD.nord13,
  danger: NORD.nord11,
  special: NORD.nord15,

  // UI
  accent: NORD.nord8,
  accentSecondary: NORD.nord9,
  border: NORD.nord3,
  overlay: 'rgba(46, 52, 64, 0.85)',
} as const;
