import {StyleSheet, ViewStyle} from 'react-native';
import {ThemeColors} from './ThemeColors';

/**
 * iOS 18-style Glassmorphism style generators
 */

export interface GlassStyleOptions {
  colors: ThemeColors;
  borderRadius?: number;
  padding?: number;
  intensity?: 'light' | 'medium' | 'strong';
}

export const createGlassCardStyle = (options: GlassStyleOptions): ViewStyle => {
  const {colors, borderRadius = 16, padding = 20, intensity = 'medium'} = options;

  const opacityMap = {
    light: 0.5,
    medium: 0.65,
    strong: 0.8,
  };

  return {
    backgroundColor: colors.glass,
    borderRadius,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding,
    // iOS shadow
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: opacityMap[intensity],
    shadowRadius: 24,
    // Android elevation
    elevation: 8,
  };
};

export const createGlassButtonStyle = (options: GlassStyleOptions): ViewStyle => {
  const {colors, borderRadius = 12, padding = 16} = options;

  return {
    backgroundColor: colors.primary,
    borderRadius,
    paddingVertical: padding,
    paddingHorizontal: padding * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Soft shadow
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  };
};

export const createGlassButtonPressedStyle = (options: GlassStyleOptions): ViewStyle => {
  return {
    ...createGlassButtonStyle(options),
    transform: [{scale: 0.98}],
    shadowOpacity: 0.15,
    shadowRadius: 8,
  };
};

export const createGlassNavStyle = (options: GlassStyleOptions): ViewStyle => {
  const {colors, borderRadius = 24, padding = 8} = options;

  return {
    backgroundColor: colors.glass,
    borderRadius,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    // Subtle shadow
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  };
};

export const createGlassHeaderStyle = (options: GlassStyleOptions): ViewStyle => {
  const {colors, padding = 16} = options;

  return {
    backgroundColor: colors.glass,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    paddingHorizontal: padding,
    paddingTop: padding,
    paddingBottom: padding / 2,
    // Blur effect will be handled by BlurView component
  };
};

// Common style presets
export const GlassPresets = StyleSheet.create({
  pressedScale: {
    transform: [{scale: 0.98}],
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadow: {
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  shadowSubtle: {
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
});
