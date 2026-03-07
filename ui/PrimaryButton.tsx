import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
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
        borderColor: theme.colors.border,
      },
      text: {
        color: '#FFFFFF',
      },
    },
    secondary: {
      container: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.borderMuted,
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
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          opacity: disabled ? 0.5 : 1,
          transform: [{scale: pressed ? 0.992 : 1}, {translateY: pressed ? 1 : 0}],
          width: fullWidth ? '100%' : undefined,
        },
        variant !== 'ghost' ? theme.shadows.press : null,
        variantStyles[variant].container,
        style,
      ]}>
      <Text
        style={[
          styles.text,
          {
            fontFamily:
              variant === 'primary'
                ? theme.typography.brand
                : theme.typography.body,
            fontSize: variant === 'primary' ? 20 : 16,
            letterSpacing: variant === 'primary' ? 1.2 : 0.8,
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
    minHeight: 58,
  },
  text: {
    fontWeight: '700',
  },
});
