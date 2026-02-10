/**
 * Glimpse palette
 * Warm, human tones with light/dark support
 */

export const LightColors = {
  // Backgrounds
  background: '#F7F1E9',
  backgroundSecondary: '#EFE3D5',

  // Glass effects
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(72, 51, 38, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.9)',

  // Primary palette (terracotta)
  primary: '#D07A4F',
  primaryLight: 'rgba(208, 122, 79, 0.18)',
  accent: '#355C5A',
  accentLight: 'rgba(53, 92, 90, 0.12)',
  secondary: '#2F7B6D',
  secondaryLight: 'rgba(47, 123, 109, 0.15)',

  // Semantic colors
  success: '#3A9B6E',
  warning: '#E39A3B',
  error: '#D35B4C',

  // Text colors
  textPrimary: '#2A1C12',
  textSecondary: '#5C4B40',
  textTertiary: '#8B776B',
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
  glassHighlight: 'rgba(255, 255, 255, 0.12)',

  // Primary palette (terracotta)
  primary: '#E29A73',
  primaryLight: 'rgba(226, 154, 115, 0.2)',
  accent: '#89C2B5',
  accentLight: 'rgba(137, 194, 181, 0.18)',
  secondary: '#79B19F',
  secondaryLight: 'rgba(121, 177, 159, 0.18)',

  // Semantic colors
  success: '#52B788',
  warning: '#F2B366',
  error: '#E07A6A',

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
