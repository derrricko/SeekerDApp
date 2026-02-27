import React from 'react';
import {Pressable, StyleSheet, Text, TextStyle, ViewStyle} from 'react-native';
import {useTheme} from '../theme/Theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const {theme} = useTheme();

  const variantStyles: Record<
    Variant,
    {container: ViewStyle; text: TextStyle}
  > = {
    primary: {
      container: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
      },
      text: {
        color: '#FFFFFF',
      },
    },
    secondary: {
      container: {
        backgroundColor: theme.colors.surfaceAlt,
        borderColor: theme.colors.border,
      },
      text: {
        color: theme.colors.textPrimary,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      text: {
        color: theme.colors.textSecondary,
      },
    },
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({pressed}) => [
        styles.base,
        {
          borderRadius: theme.radius.sm,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          opacity: disabled ? 0.5 : 1,
          transform: [{scale: pressed ? 0.99 : 1}],
          width: fullWidth ? '100%' : undefined,
        },
        theme.shadows.subtle,
        variantStyles[variant].container,
        style,
      ]}>
      <Text
        style={[
          styles.text,
          {
            fontFamily: theme.typography.brand,
            fontSize: 22,
            letterSpacing: 1,
            textTransform: 'uppercase',
          },
          variantStyles[variant].text,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  text: {
    fontWeight: '700',
  },
});
