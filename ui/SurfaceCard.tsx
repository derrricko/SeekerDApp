import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../theme/Theme';

type SurfaceTone = 'default' | 'hero' | 'muted';

export default function SurfaceCard({
  children,
  style,
  padded = true,
  tone = 'default',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: SurfaceTone;
}) {
  const {theme} = useTheme();
  const toneStyles: Record<
    SurfaceTone,
    ViewStyle
  > = {
    default: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.borderMuted,
    },
    hero: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.borderMuted,
    },
    muted: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.borderMuted,
    },
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radius.md,
          padding: padded ? theme.spacing.lg : 0,
        },
        theme.shadows.card,
        toneStyles[tone],
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
  },
});
