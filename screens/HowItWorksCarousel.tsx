import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../theme/Theme';

const TOTAL_STEPS = 3;

const STEPS = [
  {
    key: 'give',
    label: 'GIVE',
    headline: 'GoFundMe takes three percent. We take zero.',
    body: 'Donate USDC in seconds to start a real thread tied to your on-chain transaction.',
  },
  {
    key: 'confirm',
    label: 'CONFIRM',
    headline:
      'This is not a whitepaper. This is working software on Solana mainnet.',
    body: 'Your donation confirms on-chain and opens a conversation tied to that donation.',
  },
  {
    key: 'proof',
    label: 'SEE PROOF',
    headline: "We're not asking you to trust us. We're showing you the proof.",
    body: 'Every donation has a verifiable receipt and a visible update path.',
  },
] as const;

export default function HowItWorksCarousel({
  visible,
  onClose,
  onComplete,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const {theme} = useTheme();
  const [step, setStep] = useState(0);
  const stepMotion = useRef(new Animated.Value(1)).current;

  const activeStep = STEPS[step];

  const stepTranslateY = stepMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
  });

  useEffect(() => {
    if (!visible) {
      return;
    }
    setStep(0);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    stepMotion.setValue(0);
    Animated.timing(stepMotion, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, stepMotion, visible]);

  const complete = () => {
    if (onComplete) {
      onComplete();
      return;
    }
    onClose();
  };

  const progressDots = useMemo(
    () =>
      Array.from({length: TOTAL_STEPS}).map((_, index) => (
        <View
          key={`progress-${index}`}
          style={[
            styles.progressDot,
            {
              backgroundColor:
                index === step ? theme.colors.accent : theme.colors.borderMuted,
              width: index === step ? 18 : 6,
            },
          ]}
        />
      )),
    [step, theme.colors.accent, theme.colors.borderMuted],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={[styles.backdrop, {backgroundColor: theme.colors.overlay}]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderMuted,
            },
          ]}>
          <View style={styles.headerRow}>
            <View style={styles.progressRow}>{progressDots}</View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  borderColor: theme.colors.borderMuted,
                  backgroundColor: theme.colors.surfaceMuted,
                },
              ]}
              activeOpacity={0.85}>
              <Text
                style={[
                  styles.closeText,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                ×
              </Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.content,
              {opacity: stepMotion, transform: [{translateY: stepTranslateY}]},
            ]}>
            <Text
              style={[
                styles.kicker,
                {
                  color: theme.colors.accent,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              {activeStep.label}
            </Text>
            <Text style={[styles.headline, {color: theme.colors.textPrimary}]}>
              {activeStep.headline}
            </Text>
            <Text style={[styles.body, {color: theme.colors.textSecondary}]}>
              {activeStep.body}
            </Text>

            {step === TOTAL_STEPS - 1 ? (
              <View
                style={[
                  styles.nextCard,
                  {
                    borderColor: theme.colors.borderMuted,
                    backgroundColor: theme.colors.surfaceMuted,
                  },
                ]}>
                <Text
                  style={[
                    styles.nextTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  WHAT HAPPENS NEXT
                </Text>
                <Text
                  style={[
                    styles.nextLine,
                    {color: theme.colors.textSecondary},
                  ]}>
                  1. Your donation confirms on-chain.
                </Text>
                <Text
                  style={[
                    styles.nextLine,
                    {color: theme.colors.textSecondary},
                  ]}>
                  2. Your message thread opens.
                </Text>
                <Text
                  style={[
                    styles.nextLine,
                    {color: theme.colors.textSecondary},
                  ]}>
                  3. Proof updates appear in that thread.
                </Text>
              </View>
            ) : null}
          </Animated.View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.accent,
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.9}
              onPress={complete}>
              <Text
                style={[
                  styles.primaryText,
                  {fontFamily: theme.typography.brand, color: '#F3EFFF'},
                ]}>
                START DONATION
              </Text>
            </TouchableOpacity>

            <View style={styles.navRow}>
              <TouchableOpacity
                onPress={() => setStep(current => Math.max(0, current - 1))}
                disabled={step === 0}
                activeOpacity={0.85}
                style={[
                  styles.navButton,
                  {
                    borderColor: theme.colors.borderMuted,
                    opacity: step === 0 ? 0.45 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.navButtonText,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  BACK
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setStep(current => Math.min(TOTAL_STEPS - 1, current + 1))
                }
                disabled={step === TOTAL_STEPS - 1}
                activeOpacity={0.85}
                style={[
                  styles.navButton,
                  {
                    borderColor: theme.colors.borderMuted,
                    opacity: step === TOTAL_STEPS - 1 ? 0.45 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.navButtonText,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  NEXT
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerRow: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    height: 6,
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 17,
    lineHeight: 18,
    fontWeight: '700',
  },
  content: {
    minHeight: 230,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  kicker: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  headline: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '600',
    marginBottom: 9,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  nextCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  nextTitle: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    marginBottom: 6,
  },
  nextLine: {
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    gap: 8,
  },
  primaryButton: {
    borderWidth: 2,
    borderRadius: 11,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.9,
    fontWeight: '700',
  },
});
