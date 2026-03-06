import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTheme} from '../theme/Theme';

const STRIP_STEPS = ['GIVE', 'CONFIRM', 'SEE PROOF'] as const;

export default function HomeScreen({onContinue}: {onContinue: () => void}) {
  const {theme} = useTheme();
  const stripValues = useRef(
    STRIP_STEPS.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    for (const value of stripValues) {
      value.setValue(0);
    }

    Animated.stagger(
      110,
      stripValues.map(value =>
        Animated.timing(value, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [stripValues]);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <View
          style={[
            styles.stripWrap,
            {
              borderColor: theme.colors.borderMuted,
              backgroundColor: theme.colors.surface,
            },
          ]}>
          {STRIP_STEPS.map((step, index) => {
            const value = stripValues[index];
            const isLast = index === STRIP_STEPS.length - 1;
            return (
              <React.Fragment key={step}>
                <Animated.View
                  style={[
                    styles.stepPill,
                    {
                      borderColor: theme.colors.borderMuted,
                      backgroundColor: value.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          theme.colors.surfaceMuted,
                          `${theme.colors.accent}33`,
                        ],
                      }),
                    },
                  ]}>
                  <Animated.Text
                    style={[
                      styles.stepText,
                      {
                        fontFamily: theme.typography.brand,
                        color: value.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            theme.colors.textSecondary,
                            theme.colors.textPrimary,
                          ],
                        }),
                      },
                    ]}>
                    {step}
                  </Animated.Text>
                </Animated.View>
                {!isLast ? (
                  <Text
                    style={[
                      styles.arrow,
                      {
                        color: theme.colors.textTertiary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    →
                  </Text>
                ) : null}
              </React.Fragment>
            );
          })}
        </View>

        <Pressable
          onPress={onContinue}
          style={({pressed}) => [
            styles.cta,
            {
              backgroundColor: theme.colors.accent,
              borderColor: theme.colors.border,
              transform: [{scale: pressed ? 0.985 : 1}],
            },
          ]}>
          <Text style={[styles.ctaText, {fontFamily: theme.typography.brand}]}>
            START DONATION
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 18,
  },
  stripWrap: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    borderWidth: 1,
    borderRadius: 9,
    minWidth: 94,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.9,
    fontWeight: '700',
  },
  arrow: {
    marginHorizontal: 7,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  cta: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 2,
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#F3EFFF',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
