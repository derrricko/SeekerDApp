import React, {ReactNode, useCallback, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {triggerHaptic} from '../utils/haptics';
import {useTheme} from './theme';

type GlassCardVariant = 'primary' | 'secondary' | 'subtle';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: GlassCardVariant;
  glassColor?: string;
  onPress?: () => void;
}

export default function GlassCard({
  children,
  style,
  variant = 'secondary',
  glassColor,
  onPress,
}: GlassCardProps) {
  const {colors, isDark} = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    triggerHaptic('impactLight');
    onPress?.();
  }, [onPress]);

  const borderWidth = variant === 'subtle' ? 0.5 : 1;
  const shadowOpacity = variant === 'subtle' ? 0.08 : 0.15;
  const shadowRadius = variant === 'subtle' ? 12 : 24;
  const innerPadding = variant === 'primary' ? 24 : 20;

  const glassBackground =
    glassColor ?? (variant === 'primary' ? colors.primaryLight : colors.glass);

  const cardStyle: ViewStyle = {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: glassColor ? 0 : borderWidth,
    borderColor: glassColor ? undefined : colors.glassBorder,
    shadowColor: glassColor ? 'transparent' : colors.shadow,
    shadowOffset: {width: 0, height: glassColor ? 0 : 8},
    shadowOpacity: glassColor ? 0 : shadowOpacity,
    shadowRadius: glassColor ? 0 : shadowRadius,
    elevation: glassColor ? 0 : variant === 'subtle' ? 4 : 8,
    ...style,
  };

  const content = (
    <View style={cardStyle}>
      {!glassColor && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={12}
          reducedTransparencyFallbackColor={colors.card}
        />
      )}
      <View style={{backgroundColor: glassBackground, padding: innerPadding}}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          {content}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return content;
}
