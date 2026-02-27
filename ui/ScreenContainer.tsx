import React from 'react';
import {ScrollView, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../theme/Theme';
import GridBackground from './GridBackground';

export default function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const {theme} = useTheme();

  if (!scroll) {
    return (
      <View
        style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <GridBackground />
        <View style={[styles.innerFill, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <GridBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
          },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerFill: {
    flex: 1,
  },
});
