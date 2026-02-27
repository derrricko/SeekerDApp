import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/Theme';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
}) {
  const {theme} = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.sm,
        },
      ]}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                borderRadius: theme.radius.sm,
                backgroundColor: selected ? theme.colors.accent : 'transparent',
              },
            ]}>
            <Text
              style={[
                styles.label,
                {
                  color: selected ? '#FFFFFF' : theme.colors.textSecondary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 2,
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
