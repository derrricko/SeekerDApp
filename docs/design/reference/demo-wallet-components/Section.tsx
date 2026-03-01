import React, {ReactNode} from 'react';
import {StyleSheet, Text, View, Platform} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from './theme';

export const Section: React.FC<{
  children?: ReactNode;
  description?: string;
  title?: string;
}> = ({children, description, title}) => {
  const {colors, isDark} = useTheme();

  const cardStyle = {
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  };

  const content = (
    <View style={{backgroundColor: colors.glass, padding: 20}}>
      {title ? (
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>{title}</Text>
      ) : null}
      {description ? (
        <Text style={[styles.sectionDescription, {color: colors.textSecondary}]}>
          {description}
        </Text>
      ) : null}
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={cardStyle}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.card}
        />
        {content}
      </View>
    );
  }

  return (
    <View style={[cardStyle, {backgroundColor: colors.card}]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  childrenContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
  },
});
