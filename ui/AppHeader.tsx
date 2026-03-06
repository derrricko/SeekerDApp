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
          borderBottomColor: theme.colors.textPrimary,
          backgroundColor: theme.colors.background,
        },
      ]}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            letterSpacing: 8,
            fontFamily: theme.typography.brand,
          },
        ]}>
        {title}
      </Text>
      <View
        style={[styles.rule, {backgroundColor: theme.colors.textPrimary}]}
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
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 52,
    textTransform: 'uppercase',
  },
  rule: {
    marginTop: 8,
    width: '100%',
    height: 3,
  },
});
