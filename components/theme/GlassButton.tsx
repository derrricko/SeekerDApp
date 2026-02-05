import React, {useState} from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from './ThemeContext';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'glass';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}) => {
  const {colors, isDark} = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getBackgroundColor = (): string => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'accent':
        return colors.accent;
      case 'glass':
        return colors.glass;
      default:
        return colors.primary;
    }
  };

  const getShadowColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'accent':
        return colors.accent;
      default:
        return colors.shadow;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return {paddingVertical: 10, paddingHorizontal: 16};
      case 'large':
        return {paddingVertical: 18, paddingHorizontal: 32};
      default:
        return {paddingVertical: 14, paddingHorizontal: 24};
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const buttonStyle: ViewStyle = {
    backgroundColor: variant === 'glass' && Platform.OS === 'ios' ? 'transparent' : getBackgroundColor(),
    borderRadius: 12,
    ...getPadding(),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Shadow
    shadowColor: getShadowColor(),
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: disabled ? 0 : 0.3,
    shadowRadius: 12,
    elevation: disabled ? 0 : 4,
    // Glass border
    ...(variant === 'glass' && {
      borderWidth: 1,
      borderColor: colors.glassBorder,
    }),
  };

  const buttonTextStyle: TextStyle = {
    color: variant === 'glass' ? colors.textPrimary : colors.textOnPrimary,
    fontSize: getFontSize(),
    fontWeight: '600',
    letterSpacing: 0.5,
  };

  if (variant === 'glass' && Platform.OS === 'ios') {
    return (
      <Animated.View style={{transform: [{scale: scaleAnim}]}}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={[buttonStyle, style]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isDark ? 'dark' : 'light'}
            blurAmount={15}
            reducedTransparencyFallbackColor={colors.glass}
          />
          <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[buttonStyle, variant === 'glass' && {backgroundColor: colors.glass}, style]}>
        <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({});

export default GlassButton;
