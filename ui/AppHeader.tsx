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
          styles.eyebrow,
          {
            color: theme.colors.textTertiary,
            fontFamily: theme.typography.body,
          },
        ]}>
        GIVEGLIMPSE
      </Text>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            letterSpacing: 5.5,
            fontFamily: theme.typography.brand,
          },
        ]}>
        {title}
      </Text>
      <View
        style={[styles.ruleTrack, {backgroundColor: theme.colors.borderMuted}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 2.4,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
    textTransform: 'uppercase',
  },
  ruleTrack: {
    marginTop: 10,
    width: '100%',
    height: 1,
    borderRadius: 999,
  },
});
