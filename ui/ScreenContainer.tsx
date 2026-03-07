import React from 'react';
import {Platform, ScrollView, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../theme/Theme';
import GridBackground from './GridBackground';

type ScreenContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

const ScreenContainer = React.forwardRef<ScrollView, ScreenContainerProps>(
  function ScreenContainer({children, scroll = true, contentStyle}, ref) {
    const {theme} = useTheme();

    if (!scroll) {
      return (
        <View
          style={[
            styles.container,
            {backgroundColor: theme.colors.background},
          ]}>
          <GridBackground />
          <View style={[styles.innerFill, contentStyle]}>{children}</View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.container,
          {backgroundColor: theme.colors.background},
        ]}>
        <GridBackground />
        <ScrollView
          ref={ref}
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
  },
);

export default ScreenContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerFill: {
    flex: 1,
  },
});
