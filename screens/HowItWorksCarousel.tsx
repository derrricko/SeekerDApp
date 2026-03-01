import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TOTAL_STEPS = 6;
const TYPING_TARGET = '250.00';

export default function HowItWorksCarousel({
  visible,
  onClose,
  onComplete,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [typedAmount, setTypedAmount] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const stepMotion = useRef(new Animated.Value(1)).current;

  const stepTranslateY = stepMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  useEffect(() => {
    if (!visible) {
      return;
    }
    setStep(0);
  }, [visible]);

  useEffect(() => {
    if (!visible || step !== 0) {
      return;
    }

    let index = 0;
    let deleting = false;
    let pauseTicks = 0;

    setTypedAmount('');
    setCursorVisible(true);

    const typingTimer = setInterval(() => {
      if (pauseTicks > 0) {
        pauseTicks -= 1;
        return;
      }

      if (!deleting) {
        index += 1;
        setTypedAmount(TYPING_TARGET.slice(0, index));
        if (index >= TYPING_TARGET.length) {
          deleting = true;
          pauseTicks = 8;
        }
      } else {
        index -= 1;
        setTypedAmount(TYPING_TARGET.slice(0, Math.max(index, 0)));
        if (index <= 0) {
          deleting = false;
          pauseTicks = 6;
        }
      }
    }, 95);

    const cursorTimer = setInterval(() => {
      setCursorVisible(current => !current);
    }, 420);

    return () => {
      clearInterval(typingTimer);
      clearInterval(cursorTimer);
    };
  }, [step, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    stepMotion.setValue(0);
    Animated.timing(stepMotion, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, visible, stepMotion]);

  const handleNext = () => {
    if (step === TOTAL_STEPS - 1) {
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
      return;
    }
    setStep(current => current + 1);
  };

  const handlePrevious = () => {
    if (step === 0) {
      return;
    }
    setStep(current => current - 1);
  };

  const isFirstStep = step === 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <View style={styles.progressRow}>
              {Array.from({length: TOTAL_STEPS}).map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.progressDot,
                    index === step && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.85}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.content,
              {
                opacity: stepMotion,
                transform: [{translateY: stepTranslateY}],
              },
            ]}>
            {renderStep(step, typedAmount, cursorVisible)}
          </Animated.View>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={[
                styles.navButton,
                isFirstStep && styles.navButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={isFirstStep}>
              <Text
                style={[
                  styles.navButtonText,
                  isFirstStep && styles.navButtonTextDisabled,
                ]}>
                ←
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navButton, styles.navButtonPrimary]}
              activeOpacity={0.9}>
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                {isLastStep ? '✓' : '→'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function renderStep(step: number, typedAmount: string, cursorVisible: boolean) {
  if (step === 0) {
    return (
      <View style={styles.stepWrap}>
        <Text style={[styles.title, styles.titleSentence]}>
          Choose how much you want to give.
        </Text>

        <View style={styles.moneyLoopCard}>
          <View style={styles.moneyLoopHeader}>
            <View style={styles.moneyLoopDot} />
            <View style={styles.moneyLoopDot} />
            <View style={styles.moneyLoopDot} />
          </View>

          <View style={styles.typingBox}>
            <Text style={styles.typingPrefix}>$</Text>
            <Text style={styles.typingText}>{typedAmount || '0'}</Text>
            <View
              style={[styles.typingCursor, {opacity: cursorVisible ? 1 : 0}]}
            />
          </View>

          <View style={styles.keypadRow}>
            <View style={styles.keypadKey} />
            <View style={styles.keypadKey} />
            <View style={styles.keypadKey} />
          </View>
          <View style={styles.keypadRow}>
            <View style={styles.keypadKey} />
            <View style={styles.keypadKey} />
            <View style={styles.keypadKey} />
          </View>
        </View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={styles.stepWrap}>
        <Text style={[styles.title, styles.titleSentenceSmall]}>
          choose the campaign you want to support.
        </Text>
        <CausesIcon />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.stepWrap}>
        <Text style={[styles.title, styles.titleSentenceSmall]}>
          add optional context and a note for the recipient.
        </Text>
        <NoteIcon />
      </View>
    );
  }

  if (step === 3) {
    return (
      <View style={styles.stepWrap}>
        <Text style={[styles.title, styles.titleSentenceSmall]}>
          We connect you directly to the need.
        </Text>
        <ConnectIcon />
      </View>
    );
  }

  if (step === 4) {
    return (
      <View style={styles.stepWrap}>
        <Text style={styles.title}>Confirmed</Text>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.body}>
          Once you confirm, your USDC donation is final and recorded on-chain.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stepWrap}>
      <Text style={styles.title}>Transparency</Text>
      <View style={styles.docIcon}>
        <View style={styles.docFold} />
        <View style={styles.docLine} />
        <View style={styles.docLine} />
      </View>
      <Text style={styles.bodySpread}>
        5-7 days after funds are locked,{'\n'}your Glimpse is updated with
        {'\n'}photos, receipts, and impact.
      </Text>
    </View>
  );
}

function CausesIcon() {
  return (
    <View style={styles.lineIconFrame}>
      <View style={styles.causeIconRow}>
        <View style={styles.causeIconDot} />
        <View style={styles.causeIconLine} />
      </View>
      <View style={styles.causeIconRow}>
        <View style={styles.causeIconDot} />
        <View style={styles.causeIconLine} />
      </View>
      <View style={styles.causeIconRow}>
        <View style={styles.causeIconDot} />
        <View style={styles.causeIconLine} />
      </View>
    </View>
  );
}

function ConnectIcon() {
  return (
    <View style={styles.lineIconFrame}>
      <View style={styles.connectTopRow}>
        <View style={styles.connectSourceNode} />
        <View style={styles.connectSourceNode} />
      </View>
      <View style={styles.connectTopBar} />
      <View style={styles.connectCenterDot} />
      <View style={styles.connectDropLine} />
      <View style={styles.connectNeedNode} />
      <View style={styles.connectNeedMark} />
    </View>
  );
}

function NoteIcon() {
  return (
    <View style={styles.lineIconFrame}>
      <View style={styles.noteLineWide} />
      <View style={styles.noteLineMid} />
      <View style={styles.noteLineWide} />
      <View style={styles.noteDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 16, 42, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#F4F2FA',
  },
  topRow: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 5,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#CEC8E4',
  },
  progressDotActive: {
    width: 16,
    backgroundColor: '#6554D1',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E2EF',
  },
  closeText: {
    color: '#9C95B7',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  content: {
    minHeight: 230,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepWrapTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
  title: {
    color: '#17102A',
    textAlign: 'center',
    fontSize: 37,
    lineHeight: 42,
    fontWeight: '800',
    marginBottom: 12,
  },
  titleSentence: {
    fontSize: 33,
    lineHeight: 38,
    marginBottom: 2,
    maxWidth: 305,
  },
  titleSentenceSmall: {
    fontSize: 30,
    lineHeight: 35,
    marginBottom: 8,
    maxWidth: 300,
  },
  body: {
    marginTop: 8,
    color: '#5E5878',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'CourierPrime-Regular',
    maxWidth: 280,
  },
  bodySpread: {
    marginTop: 10,
    color: '#5E5878',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 27,
    letterSpacing: 0.35,
    fontFamily: 'CourierPrime-Regular',
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 6,
  },
  moneyLoopCard: {
    marginTop: 14,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD7EE',
    backgroundColor: '#F8F6FD',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  moneyLoopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  moneyLoopDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#CEC8E4',
    marginRight: 5,
  },
  typingBox: {
    width: '100%',
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 13,
    backgroundColor: '#EEEBF9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingPrefix: {
    color: '#6554D1',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    marginRight: 2,
    fontFamily: 'CourierPrime-Regular',
  },
  typingText: {
    color: '#6554D1',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'CourierPrime-Regular',
  },
  typingCursor: {
    marginLeft: 6,
    width: 2,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#6554D1',
  },
  keypadRow: {
    marginTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadKey: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E0F3',
    marginHorizontal: 3,
  },
  lineIconFrame: {
    width: 50,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6554D1',
    marginTop: 2,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  causeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  causeIconDot: {
    width: 4,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#6554D1',
    marginRight: 4,
  },
  causeIconLine: {
    width: 19,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#6554D1',
  },
  noteLineWide: {
    width: 24,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#6554D1',
    marginVertical: 2,
  },
  noteLineMid: {
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#6554D1',
    marginVertical: 2,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#6554D1',
    marginTop: 4,
  },
  connectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectSourceNode: {
    width: 8,
    height: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#6554D1',
  },
  connectTopBar: {
    width: 26,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: '#6554D1',
    marginTop: 2,
  },
  connectCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#6554D1',
    marginTop: 3,
  },
  connectDropLine: {
    width: 1.5,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#6554D1',
    marginTop: 2,
  },
  connectNeedNode: {
    width: 16,
    height: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#6554D1',
    marginTop: 2,
  },
  connectNeedMark: {
    position: 'absolute',
    top: 38,
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#6554D1',
  },
  icon: {
    color: '#6554D1',
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '700',
    marginTop: 2,
  },
  docIcon: {
    width: 50,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6554D1',
    marginTop: 2,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  docFold: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#6554D1',
  },
  docLine: {
    width: 22,
    height: 2,
    backgroundColor: '#6554D1',
    marginVertical: 2,
    borderRadius: 2,
  },
  navRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  navButton: {
    width: 56,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D1EA',
    backgroundColor: '#EEEBF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#F1EEF9',
    borderColor: '#E5E1F0',
  },
  navButtonPrimary: {
    backgroundColor: '#6554D1',
    borderColor: '#5B49CB',
  },
  navButtonText: {
    color: '#5E5878',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    fontFamily: 'CourierPrime-Regular',
  },
  navButtonTextDisabled: {
    color: '#C0B9D8',
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'CourierPrime-Regular',
  },
});
