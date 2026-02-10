import React, {useRef} from 'react';
import {Animated, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {useTheme, Typography} from './theme';
import {triggerHaptic} from '../utils/haptics';

const springConfig = {useNativeDriver: true, speed: 50, bounciness: 4};

interface PresetChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function PresetChip({label, selected, onPress}: PresetChipProps) {
  const {colors} = useTheme();
  const chipScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    triggerHaptic('impactLight');
    Animated.spring(chipScale, {toValue: 0.93, ...springConfig}).start();
  };
  const handlePressOut = () => {
    Animated.spring(chipScale, {toValue: 1, ...springConfig}).start();
  };

  return (
    <Animated.View style={{transform: [{scale: chipScale}]}}>
      <TouchableOpacity
        style={[
          chipStyles.chip,
          {
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.primaryLight : 'transparent',
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}>
        <Text
          style={[
            chipStyles.chipText,
            {color: selected ? colors.primary : colors.textSecondary},
            selected && {fontWeight: '600'},
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
});
