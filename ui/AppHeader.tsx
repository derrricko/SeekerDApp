import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/Theme';

export default function AppHeader({title}: {title: string}) {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
          borderBottomColor: theme.colors.borderMuted,
          backgroundColor: theme.colors.background,
        },
      ]}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            letterSpacing: 4,
            fontFamily: theme.typography.display,
          },
        ]}>
        {title}
      </Text>
      <View
        style={[styles.rule, {backgroundColor: theme.colors.borderMuted}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
    textTransform: 'uppercase',
  },
  rule: {
    marginTop: 6,
    width: '100%',
    height: 2,
  },
});
