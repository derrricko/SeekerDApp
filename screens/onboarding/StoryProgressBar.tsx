import React from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useTheme} from '../../components/theme';
import {TOTAL_SLIDES} from '../../data/journeyContent';

interface StoryProgressBarProps {
  scrollX: Animated.Value;
  slideWidth: number;
}

export default function StoryProgressBar({
  scrollX,
  slideWidth,
}: StoryProgressBarProps) {
  const {colors} = useTheme();

  const scaleX = scrollX.interpolate({
    inputRange: [0, (TOTAL_SLIDES - 1) * slideWidth],
    outputRange: [1 / TOTAL_SLIDES, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.track}>
      <View
        style={[styles.trackBackground, {backgroundColor: colors.border}]}
      />
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: colors.primary,
            transform: [{scaleX}],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  trackBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 1.5,
  },
  fill: {
    height: 3,
    borderRadius: 1.5,
    transformOrigin: 'left center',
  },
});
