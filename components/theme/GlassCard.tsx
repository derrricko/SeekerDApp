import React, {ReactNode} from 'react';
import {View, StyleSheet, ViewStyle, Platform} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from './ThemeContext';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  padding?: number;
  intensity?: 'light' | 'medium' | 'strong';
  blurAmount?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderRadius = 16,
  padding = 20,
  intensity = 'medium',
  blurAmount = 20,
}) => {
  const {colors, isDark} = useTheme();

  const blurType = isDark ? 'dark' : 'light';

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    // Shadow
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: intensity === 'strong' ? 0.25 : intensity === 'medium' ? 0.15 : 0.1,
    shadowRadius: 24,
    elevation: 8,
  };

  const contentStyle: ViewStyle = {
    padding,
    backgroundColor: Platform.OS === 'android' ? colors.glass : 'transparent',
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={[containerStyle, style]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={blurType}
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor={colors.card}
        />
        <View style={[contentStyle, {backgroundColor: colors.glass}]}>
          {children}
        </View>
      </View>
    );
  }

  // Android fallback - semi-transparent background without blur
  return (
    <View style={[containerStyle, contentStyle, style]}>
      {children}
    </View>
  );
};

export default GlassCard;
