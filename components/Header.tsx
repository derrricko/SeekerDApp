import React from 'react';
import {StyleSheet, Text, View, Platform} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from './theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({title = 'Glimpse', subtitle}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();

  const headerStyle = {
    paddingTop: insets.top + 16,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  };

  const content = (
    <View style={styles.content}>
      <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>{subtitle}</Text>
      )}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={headerStyle}>
        <BlurView
          style={[StyleSheet.absoluteFill, {zIndex: -1}]}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.glass}
        />
        <View style={[StyleSheet.absoluteFill, {backgroundColor: colors.glass, zIndex: -1}]} />
        {content}
      </View>
    );
  }

  return (
    <View style={[headerStyle, {backgroundColor: colors.glass}]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
});
