/**
 * Glimpse palette
 * Warm, human tones with light/dark support
 */

export const LightColors = {
  // Backgrounds
  background: '#F7F1E9',
  backgroundSecondary: '#EFE3D5',

  // Glass effects
  glass: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(72, 51, 38, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.75)',

  // Primary palette (terracotta)
  primary: '#B8663C',
  primaryLight: 'rgba(184, 102, 60, 0.16)',
  accent: '#355C5A',
  accentLight: 'rgba(53, 92, 90, 0.12)',
  secondary: '#B89B5E',
  secondaryLight: 'rgba(184, 155, 94, 0.15)',

  // Semantic colors
  success: '#3A9B6E',
  warning: '#E39A3B',
  error: '#C43D3D',

  // Text colors
  textPrimary: '#2A1C12',
  textSecondary: '#5C4B40',
  textTertiary: '#6E5F54',
  textOnPrimary: '#FFFFFF',

  // Borders & Shadows
  border: 'rgba(43, 30, 22, 0.08)',
  shadow: 'rgba(43, 30, 22, 0.18)',
  shadowStrong: 'rgba(43, 30, 22, 0.32)',

  // Cards
  card: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(255, 255, 255, 0.5)',
};

export const DarkColors = {
  // Backgrounds
  background: '#14110E',
  backgroundSecondary: '#201A16',

  // Glass effects
  glass: 'rgba(32, 26, 22, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.20)',

  // Primary palette (terracotta)
  primary: '#E29A73',
  primaryLight: 'rgba(226, 154, 115, 0.2)',
  accent: '#89C2B5',
  accentLight: 'rgba(137, 194, 181, 0.18)',
  secondary: '#D4B87A',
  secondaryLight: 'rgba(212, 184, 122, 0.18)',

  // Semantic colors
  success: '#52B788',
  warning: '#F2B366',
  error: '#E06060',

  // Text colors
  textPrimary: '#F8F2EA',
  textSecondary: '#C7B8AA',
  textTertiary: '#9A887A',
  textOnPrimary: '#1A120D',

  // Borders & Shadows
  border: 'rgba(255, 255, 255, 0.10)',
  shadow: 'rgba(0, 0, 0, 0.45)',
  shadowStrong: 'rgba(0, 0, 0, 0.6)',

  // Cards
  card: 'rgba(32, 26, 22, 0.86)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
};

export type ThemeColors = typeof LightColors;

export const getColors = (isDark: boolean): ThemeColors => {
  return isDark ? DarkColors : LightColors;
};
