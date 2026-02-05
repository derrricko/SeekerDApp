/**
 * Colors - Backwards Compatibility Layer
 * Re-exports theme colors for legacy component support
 * New components should use useTheme() from theme/ThemeContext
 */
import {LightColors, DarkColors} from './theme/ThemeColors';

// Legacy Colors export for backwards compatibility
// These map to light mode by default
export const Colors = {
  // Primary palette (now cool tones)
  primary: LightColors.primary,
  accent: LightColors.accent,
  secondary: LightColors.secondary,

  // Backgrounds
  background: LightColors.background,
  cardBg: LightColors.card,
  headerBg: LightColors.glass,

  // Text
  textDark: LightColors.textPrimary,
  textMedium: LightColors.textSecondary,
  textLight: LightColors.textTertiary,
  light: LightColors.textTertiary,
  inactive: LightColors.textTertiary,

  // Border
  border: LightColors.border,

  // Legacy colors (for old components still referencing these)
  darker: DarkColors.background,
  lighter: LightColors.background,
};
