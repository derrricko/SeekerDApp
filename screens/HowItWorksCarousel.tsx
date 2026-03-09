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

const FLOW_STEPS = [
  'Confirm the donation on-chain.',
  'Your GiveGlimpse thread opens immediately.',
  'Proof updates arrive in about 5 to 7 days.',
] as const;

const STEPS = [
  {
    key: 'intro',
    label: 'HOW IT WORKS',
    headline: 'One donation. One thread. Proof in the same place.',
    body: 'Glimpse keeps the process simple: confirm one USDC donation, open a direct message thread, and receive proof in that same thread about 5 to 7 days later.',
  },
  {
    key: 'flow',
    label: 'EXAMPLE DONOR FLOW',
    headline: 'What the donor sees after confirming.',
    body: 'This is the exact path the donor follows from confirmation to proof.',
  },
  {
    key: 'proof',
    label: 'WHY GLIMPSE DOES THIS',
    headline: 'Trust comes from seeing the full path of the donation.',
    body: 'The system is designed so donors can verify the transaction, ask questions in context, and receive documented proof in the same place.',
    trustTitle: 'WHAT YOU SHOULD EXPECT',
    trustPoints: [
      'Your donation is a real transaction on Solana mainnet.',
      'The message thread stays tied to that donation.',
      'Proof arrives in the same place you can ask questions or provide context.',
    ],
  },
] as const;

const TOTAL_STEPS = STEPS.length;

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
  const isLastStep = step === TOTAL_STEPS - 1;
  const contentMinHeight =
    activeStep.key === 'intro' ? 228 : activeStep.key === 'flow' ? 286 : 268;
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

  const handleNext = () => {
    if (isLastStep) {
      complete();
      return;
    }

    setStep(current => Math.min(TOTAL_STEPS - 1, current + 1));
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
              {minHeight: contentMinHeight},
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

            {activeStep.key === 'flow' ? (
              <View style={styles.flowStack}>
                {FLOW_STEPS.map((line, index) => (
                  <View
                    key={line}
                    style={[
                      styles.flowCard,
                      {
                        borderColor: theme.colors.borderMuted,
                        backgroundColor: theme.colors.surfaceMuted,
                      },
                    ]}>
                    <View style={styles.flowRow}>
                      <View
                        style={[
                          styles.flowNumber,
                          {
                            borderColor: theme.colors.accent,
                            backgroundColor: theme.colors.accent,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.flowNumberText,
                            {
                              color: '#F3EFFF',
                              fontFamily: theme.typography.brand,
                            },
                          ]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.flowText,
                          {color: theme.colors.textPrimary},
                        ]}>
                        {line}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {activeStep.key === 'proof' ? (
              <View
                style={[
                  styles.trustCard,
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
                  {activeStep.trustTitle}
                </Text>
                {activeStep.trustPoints.map(point => (
                  <View key={point} style={styles.trustRow}>
                    <View
                      style={[
                        styles.trustDot,
                        {backgroundColor: theme.colors.teal},
                      ]}
                    />
                    <Text
                      style={[
                        styles.nextLine,
                        {color: theme.colors.textSecondary},
                      ]}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Animated.View>

          <View style={styles.footer}>
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
                onPress={handleNext}
                activeOpacity={0.9}
                style={[
                  styles.nextButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.accent,
                  },
                ]}>
                <Text
                  style={[
                    styles.nextButtonText,
                    {
                      color: '#F3EFFF',
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {isLastStep ? 'CONTINUE' : 'NEXT'}
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
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
    paddingTop: 18,
    paddingHorizontal: 8,
  },
  kicker: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    marginBottom: 12,
  },
  headline: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '600',
    marginBottom: 14,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  flowStack: {
    marginTop: 18,
    gap: 10,
  },
  flowCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  trustCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  nextTitle: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    marginBottom: 10,
  },
  nextLine: {
    fontSize: 13,
    lineHeight: 20,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flowNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  flowNumberText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  flowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingTop: 14,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.9,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 2,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  trustDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
});
