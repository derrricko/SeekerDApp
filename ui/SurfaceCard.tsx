import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../theme/Theme';

export default function SurfaceCard({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const {theme} = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          padding: padded ? theme.spacing.lg : 0,
        },
        theme.shadows.card,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
  },
});
