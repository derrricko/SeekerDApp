import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from '../theme/Theme';

const GRID_STEP = 36;
const LINES = 40;

export default function GridBackground() {
  const {theme} = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View
        style={[
          styles.haloPrimary,
          {backgroundColor: 'rgba(255,255,255,0.22)'},
        ]}
      />
      <View
        style={[
          styles.haloSecondary,
          {backgroundColor: 'rgba(101,84,209,0.08)'},
        ]}
      />
      {Array.from({length: LINES}).map((_, idx) => (
        <View
          key={`h-${idx}`}
          style={[
            styles.horizontal,
            {
              backgroundColor: theme.colors.border,
              opacity: idx % 4 === 0 ? 0.1 : 0.05,
              top: idx * GRID_STEP,
            },
          ]}
        />
      ))}
      {Array.from({length: LINES}).map((_, idx) => (
        <View
          key={`v-${idx}`}
          style={[
            styles.vertical,
            {
              backgroundColor: theme.colors.accent,
              opacity: idx % 4 === 0 ? 0.08 : 0.035,
              left: idx * GRID_STEP,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  haloPrimary: {
    position: 'absolute',
    top: -88,
    right: -44,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  haloSecondary: {
    position: 'absolute',
    bottom: -132,
    left: -92,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
});
