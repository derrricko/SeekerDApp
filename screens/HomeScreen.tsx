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

export default function HomeScreen({onContinue}: {onContinue: () => void}) {
  const {theme} = useTheme();
  const breathe = useRef(new Animated.Value(0.85)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0.85,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [breathe, fadeIn]);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        {/* G Lettermark */}
        <Animated.View style={[styles.gMarkWrap, {opacity: breathe}]}>
          <View
            style={[styles.gMarkCircle, {borderColor: theme.colors.accent}]}
          />
          <View
            style={[styles.gMarkBar, {backgroundColor: theme.colors.accent}]}
          />
        </Animated.View>

        <Animated.View style={[styles.textBlock, {opacity: fadeIn}]}>
          <Text
            style={[
              styles.kicker,
              {
                color: theme.colors.textTertiary,
                fontFamily: theme.typography.brand,
              },
            ]}>
            DOCUMENTING KINDNESS
          </Text>

          <Text
            style={[
              styles.headline,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.display,
              },
            ]}>
            Give. See the proof.{'\n'}Start a conversation.
          </Text>

          <View style={styles.stepsRow}>
            {['GIVE', 'CONFIRM', 'SEE PROOF'].map((step, i) => (
              <React.Fragment key={step}>
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {step}
                </Text>
                {i < 2 && (
                  <Text
                    style={[
                      styles.stepArrow,
                      {color: theme.colors.textTertiary},
                    ]}>
                    {'\u2192'}
                  </Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={{opacity: fadeIn, width: '100%', maxWidth: 420}}>
          <Pressable
            onPress={onContinue}
            style={({pressed}) => [
              styles.cta,
              {
                backgroundColor: theme.colors.accent,
                borderColor: theme.colors.borderMuted,
                borderRadius: theme.radius.md,
                transform: [{scale: pressed ? 0.985 : 1}],
              },
              theme.shadows.card,
            ]}>
            <Text
              style={[styles.ctaText, {fontFamily: theme.typography.brand}]}>
              GIVE A GLIMPSE
            </Text>
          </Pressable>
        </Animated.View>
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
    paddingHorizontal: 24,
    gap: 24,
  },
  gMarkWrap: {
    width: 64,
    height: 64,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gMarkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
  },
  gMarkBar: {
    position: 'absolute',
    right: 4,
    width: 16,
    height: 2.5,
    borderRadius: 1,
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 3,
    fontWeight: '400',
  },
  headline: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '300',
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stepText: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  stepArrow: {
    fontSize: 10,
    lineHeight: 12,
  },
  cta: {
    width: '100%',
    borderWidth: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#F3EFFF',
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
