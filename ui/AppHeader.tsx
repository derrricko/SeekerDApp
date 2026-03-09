import React from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/Theme';

export default function AppHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
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
      <View style={styles.topRow}>
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
      </View>
      <View style={styles.titleRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={[styles.backBtn, {borderColor: theme.colors.borderMuted}]}>
            <Text
              style={[
                styles.backArrow,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              {'\u2190'}
            </Text>
          </TouchableOpacity>
        ) : null}
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
      </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backArrow: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
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
