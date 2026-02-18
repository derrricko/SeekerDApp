import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Platform} from 'react-native';
import {useTheme, Typography} from './theme';
import type {UserStreak} from '../data/mockData';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

interface StreakCardProps {
  streak: UserStreak;
}

/** Terracotta ember — organic teardrop with breathing glow */
function StreakEmber({size = 16, streak}: {size?: number; streak: number}) {
  const {colors} = useTheme();
  const glowOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [glowOpacity]);

  const hasMilestone7 = streak >= 7;
  const hasMilestone30 = streak >= 30;
  const hasMilestone90 = streak >= 90;

  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      {/* Milestone rings */}
      {hasMilestone90 && (
        <View
          style={[
            streakStyles.milestoneRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              borderColor: colors.primaryLight,
            },
          ]}
        />
      )}
      {hasMilestone30 && (
        <View
          style={[
            streakStyles.milestoneRing,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              borderColor: colors.primaryLight,
            },
          ]}
        />
      )}
      {hasMilestone7 && (
        <View
          style={[
            streakStyles.milestoneRing,
            {
              width: size + 5,
              height: size + 5,
              borderRadius: (size + 5) / 2,
              borderColor: colors.primaryLight,
            },
          ]}
        />
      )}
      {/* Outer glow */}
      <Animated.View
        style={[
          streakStyles.glow,
          {
            width: size + 4,
            height: size + 4,
            borderRadius: (size + 4) / 2,
            backgroundColor: colors.primaryLight,
            opacity: glowOpacity,
          },
        ]}
      />
      {/* Teardrop ember */}
      <View
        style={[
          streakStyles.ember,
          {
            width: size,
            height: size,
            backgroundColor: colors.primary,
            borderTopLeftRadius: size * 0.5,
            borderTopRightRadius: size * 0.8,
            borderBottomLeftRadius: size * 0.5,
            borderBottomRightRadius: size * 0.5,
          },
        ]}
      />
    </View>
  );
}

export {StreakEmber};

export default function StreakCard({streak}: StreakCardProps) {
  const {colors} = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Streak at risk pulsing border
  useEffect(() => {
    if (streak.streakAtRisk) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [streak.streakAtRisk, pulseAnim]);

  const borderColor = streak.streakAtRisk
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', colors.primary],
      })
    : 'transparent';

  return (
    <Animated.View
      style={[
        streakStyles.container,
        {
          backgroundColor: colors.glass,
          borderColor,
          borderWidth: streak.streakAtRisk ? 1.5 : 0,
          borderRadius: 16,
        },
      ]}>
      <View style={streakStyles.row}>
        <View style={streakStyles.mainStat}>
          <Text style={[streakStyles.streakNumber, {color: colors.textPrimary}]}>
            {streak.currentStreak}
          </Text>
          <View style={{marginLeft: 6, marginTop: 4}}>
            <StreakEmber size={16} streak={streak.currentStreak} />
          </View>
        </View>
        <Text style={[streakStyles.streakLabel, {color: colors.textSecondary}]}>
          day streak
        </Text>
      </View>

      <View style={streakStyles.statsRow}>
        <View style={streakStyles.stat}>
          <Text style={[streakStyles.statValue, {color: colors.textPrimary}]}>
            {streak.longestStreak}
          </Text>
          <Text style={[streakStyles.statLabel, {color: colors.textTertiary}]}>
            longest
          </Text>
        </View>
        <View
          style={[streakStyles.divider, {backgroundColor: colors.glassBorder}]}
        />
        <View style={streakStyles.stat}>
          <Text style={[streakStyles.statValue, {color: colors.textPrimary}]}>
            {streak.totalGives}
          </Text>
          <Text style={[streakStyles.statLabel, {color: colors.textTertiary}]}>
            total gives
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const streakStyles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  mainStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '200',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.5,
  },
  streakLabel: {
    ...Typography.body,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.subheading,
    fontWeight: '300',
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
  },
  // Ember
  ember: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
  },
  milestoneRing: {
    position: 'absolute',
    borderWidth: 0.5,
  },
});
