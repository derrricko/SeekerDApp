/**
 * iOS 18-style Glassmorphism Color System
 * Cool-toned palette with light/dark mode support
 */

export const LightColors = {
  // Backgrounds
  background: '#F0F4F8',
  backgroundSecondary: '#E2E8F0',

  // Glass effects
  glass: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  glassHighlight: 'rgba(255, 255, 255, 0.8)',

  // Primary palette
  primary: '#007AFF',
  primaryLight: 'rgba(0, 122, 255, 0.15)',
  accent: '#5856D6',
  accentLight: 'rgba(88, 86, 214, 0.15)',
  secondary: '#32D4DE',
  secondaryLight: 'rgba(50, 212, 222, 0.15)',

  // Semantic colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',

  // Text colors
  textPrimary: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#718096',
  textOnPrimary: '#FFFFFF',

  // Borders & Shadows
  border: 'rgba(0, 0, 0, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.15)',
  shadowStrong: 'rgba(0, 0, 0, 0.25)',

  // Cards
  card: 'rgba(255, 255, 255, 0.75)',
  cardBorder: 'rgba(255, 255, 255, 0.4)',
};

export const DarkColors = {
  // Backgrounds
  background: '#0A1628',
  backgroundSecondary: '#1A2744',

  // Glass effects
  glass: 'rgba(30, 41, 59, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.15)',

  // Primary palette
  primary: '#0A84FF',
  primaryLight: 'rgba(10, 132, 255, 0.2)',
  accent: '#BF5AF2',
  accentLight: 'rgba(191, 90, 242, 0.2)',
  secondary: '#40E0D0',
  secondaryLight: 'rgba(64, 224, 208, 0.2)',

  // Semantic colors
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',

  // Text colors
  textPrimary: '#F7FAFC',
  textSecondary: '#A0AEC0',
  textTertiary: '#718096',
  textOnPrimary: '#FFFFFF',

  // Borders & Shadows
  border: 'rgba(255, 255, 255, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowStrong: 'rgba(0, 0, 0, 0.6)',

  // Cards
  card: 'rgba(30, 41, 59, 0.75)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
};

export type ThemeColors = typeof LightColors;

export const getColors = (isDark: boolean): ThemeColors => {
  return isDark ? DarkColors : LightColors;
};
