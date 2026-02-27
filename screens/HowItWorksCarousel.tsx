import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

const TOTAL_STEPS = 6;
const TYPING_TARGET = '250.00';

export default function HowItWorksCarousel({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [poolType, setPoolType] = useState<'private' | 'public'>('private');
  const [typedAmount, setTypedAmount] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

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

  const handlePrimary = () => {
    if (step === TOTAL_STEPS - 1) {
      onClose();
      return;
    }
    setStep(current => current + 1);
  };

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

          <View style={styles.content}>
            {renderStep(
              step,
              poolType,
              setPoolType,
              typedAmount,
              cursorVisible,
            )}
          </View>

          <TouchableOpacity
            onPress={handlePrimary}
            style={styles.primaryButton}
            activeOpacity={0.9}>
            <Text style={styles.primaryText}>
              {step === TOTAL_STEPS - 1 ? 'Open App' : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function renderStep(
  step: number,
  poolType: 'private' | 'public',
  setPoolType: (value: 'private' | 'public') => void,
  typedAmount: string,
  cursorVisible: boolean,
) {
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
          choose 2-3 causes or organizations that are near to your heart.
        </Text>
        <CausesIcon />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.stepWrap}>
        <Text style={[styles.title, styles.titleSentenceSmall]}>
          donate as a group or privately.
        </Text>
        <View style={styles.choiceRow}>
          <TouchableOpacity
            onPress={() => setPoolType('private')}
            activeOpacity={0.85}
            style={[
              styles.choiceCard,
              poolType === 'private'
                ? styles.choiceCardActive
                : styles.choiceCardInactive,
            ]}>
            <View style={styles.choiceInner}>
              <PrivatePoolIcon />
              <Text style={styles.choiceLabel}>Private</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPoolType('public')}
            activeOpacity={0.85}
            style={[
              styles.choiceCard,
              poolType === 'public'
                ? styles.choiceCardActive
                : styles.choiceCardInactive,
            ]}>
            <View style={styles.choiceInner}>
              <PublicPoolIcon />
              <Text style={styles.choiceLabel}>Group</Text>
            </View>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.title}>Refundable</Text>
        <Text style={styles.icon}>↩</Text>
        <Text style={styles.body}>
          Your deposited money can be withdrawn within 48 hours if you change
          your mind.
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

function PrivatePoolIcon() {
  return (
    <View style={styles.optionIconWrap}>
      <View style={styles.singleHead} />
      <View style={styles.singleBody} />
    </View>
  );
}

function PublicPoolIcon() {
  return (
    <View style={styles.optionIconWrap}>
      <View style={styles.publicHeads}>
        <View style={styles.publicHead} />
        <View style={styles.publicHead} />
      </View>
      <View style={styles.publicBase} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 8,
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
  choiceRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  choiceCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  choiceCardActive: {
    borderColor: '#6554D1',
    backgroundColor: '#F5F2FF',
  },
  choiceCardInactive: {
    borderColor: '#DDD6EE',
    backgroundColor: '#F8F5FD',
  },
  choiceInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceLabel: {
    marginTop: 8,
    color: '#17102A',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'CourierPrime-Regular',
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
  optionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CEC8E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  singleHead: {
    width: 7,
    height: 7,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#6554D1',
    marginBottom: 2,
  },
  singleBody: {
    width: 12,
    height: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#6554D1',
  },
  publicHeads: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  publicHead: {
    width: 6,
    height: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#6554D1',
    backgroundColor: 'transparent',
    marginHorizontal: 1,
  },
  publicBase: {
    width: 15,
    height: 5,
    borderWidth: 1.5,
    borderColor: '#6554D1',
    borderRadius: 5,
    marginTop: 2,
    backgroundColor: 'transparent',
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
  primaryButton: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6554D1',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'CourierPrime-Regular',
  },
});
