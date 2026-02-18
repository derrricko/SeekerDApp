import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import GlassCard from './GlassCard';
import {useTheme, Typography} from './theme';
import {EASE_OUT} from '../utils/animations';
import {formatUSDC} from '../data/mockData';
import type {Circle} from '../data/mockData';

interface CircleProgressProps {
  circle: Circle;
}

export default function CircleProgress({circle}: CircleProgressProps) {
  const {colors} = useTheme();
  const progressWidth = useRef(new Animated.Value(0)).current;

  const progress = circle.currentMonthTotal / circle.monthlyGoal;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 800,
      easing: EASE_OUT,
      useNativeDriver: false,
    }).start();
  }, [progress, progressWidth]);

  return (
    <GlassCard variant="subtle">
      <View>
        <View style={circleStyles.header}>
          <Text style={[circleStyles.name, {color: colors.textPrimary}]}>
            {circle.name}
          </Text>
          <View
            style={[
              circleStyles.badge,
              {backgroundColor: colors.secondaryLight},
            ]}>
            <Text style={[circleStyles.badgeText, {color: colors.secondary}]}>
              {circle.members.length} members
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={[
            circleStyles.track,
            {backgroundColor: colors.glassBorder},
          ]}>
          <Animated.View
            style={[
              circleStyles.fill,
              {
                backgroundColor: colors.secondary,
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <Text style={[circleStyles.progressText, {color: colors.textSecondary}]}>
          {formatUSDC(circle.currentMonthTotal)} of{' '}
          {formatUSDC(circle.monthlyGoal)} this month
        </Text>
      </View>
    </GlassCard>
  );
}

const circleStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  name: {
    ...Typography.subheading,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...Typography.bodySmall,
  },
});
