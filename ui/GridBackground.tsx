import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from '../theme/Theme';

const LINES = 28;

export default function GridBackground() {
  const {theme} = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {Array.from({length: LINES}).map((_, idx) => (
        <View
          key={`h-${idx}`}
          style={[
            styles.horizontal,
            {
              backgroundColor: theme.colors.accent,
              opacity: 0.15,
              top: idx * 32,
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
              opacity: 0.15,
              left: idx * 32,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
