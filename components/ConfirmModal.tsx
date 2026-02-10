import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useTheme, Typography} from './theme';
import GlassCard from './GlassCard';
import {usePressAnimation, EASE_OUT, EASE_IN} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('user rejected') || lower.includes('declined') || lower.includes('cancelled')) {
    return 'Transaction was cancelled.';
  }
  if (lower.includes('insufficient')) {
    return 'Insufficient funds in your wallet.';
  }
  if (lower.includes('timeout')) {
    return 'The transaction timed out. Please try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  return 'Something went wrong. Please try again.';
}

export interface ConfirmModalProps {
  visible: boolean;
  amount: number;
  direction: string;
  loading: boolean;
  success: boolean | null;
  error: string | null;
  txSignature: string | null;
  onConfirm: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  visible,
  amount,
  direction,
  loading,
  success,
  error,
  txSignature,
  onConfirm,
  onRetry,
  onClose,
}: ConfirmModalProps) {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const {scale: btnScale, onPressIn: btnPressIn, onPressOut: btnPressOut} = usePressAnimation();

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, friction: 8, tension: 65}),
        Animated.timing(opacityAnim, {toValue: 1, duration: 200, easing: EASE_OUT, useNativeDriver: true}),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (success) {
      triggerHaptic('notificationSuccess');
    } else if (error) {
      triggerHaptic('notificationError');
    }
  }, [success, error]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {toValue: 0.9, duration: 150, easing: EASE_IN, useNativeDriver: true}),
      Animated.timing(opacityAnim, {toValue: 0, duration: 150, easing: EASE_IN, useNativeDriver: true}),
    ]).start(() => onClose());
  };

  const handleConfirm = () => {
    triggerHaptic('impactMedium');
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[modalStyles.overlay, {opacity: opacityAnim}]}>
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <GlassCard style={{borderRadius: 20}}>
            <View style={modalStyles.cardContent}>
              {loading ? (
                <View style={modalStyles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[modalStyles.loadingText, {color: colors.textSecondary}]}>
                    Sending your gift...
                  </Text>
                  <TouchableOpacity
                    style={[modalStyles.cancelLoadingButton, {borderColor: colors.border}]}
                    onPress={handleClose}
                    activeOpacity={0.8}>
                    <Text style={[modalStyles.cancelText, {color: colors.textSecondary}]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : success ? (
                <View style={modalStyles.centered}>
                  <View style={[modalStyles.successCircle, {borderColor: colors.success}]}>
                    <Text style={[modalStyles.successCheck, {color: colors.success}]}>
                      {'\u2713'}
                    </Text>
                  </View>
                  <Text style={[modalStyles.successTitle, {color: colors.textPrimary}]}>
                    Gift Sent
                  </Text>
                  <Text style={[modalStyles.successBody, {color: colors.textSecondary}]}>
                    ${amount} toward {direction}
                  </Text>
                  {txSignature && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={modalStyles.txHashWrap}
                      onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)}>
                      <Text style={[modalStyles.txHash, {color: colors.textTertiary}]}>
                        View transaction details
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Animated.View style={{transform: [{scale: btnScale}]}}>
                    <TouchableOpacity
                      style={[modalStyles.doneButton, {backgroundColor: colors.primary}]}
                      onPress={handleClose}
                      onPressIn={btnPressIn}
                      onPressOut={btnPressOut}
                      activeOpacity={0.8}>
                      <Text style={[modalStyles.doneText, {color: colors.textOnPrimary}]}>Done</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              ) : error ? (
                <View style={modalStyles.centered}>
                  <View style={[modalStyles.errorCircle, {borderColor: colors.error}]}>
                    <Text style={[modalStyles.errorX, {color: colors.error}]}>!</Text>
                  </View>
                  <Text style={[modalStyles.successTitle, {color: colors.textPrimary}]}>
                    Something went wrong
                  </Text>
                  <Text style={[modalStyles.successBody, {color: colors.textSecondary}]}>
                    {friendlyError(error)}
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity
                      style={[modalStyles.cancelButton, {borderColor: colors.border}]}
                      onPress={handleClose}
                      activeOpacity={0.8}>
                      <Text style={[modalStyles.cancelText, {color: colors.textSecondary}]}>Close</Text>
                    </TouchableOpacity>
                    <Animated.View style={{flex: 1, transform: [{scale: btnScale}]}}>
                      <TouchableOpacity
                        style={[modalStyles.confirmButton, {backgroundColor: colors.primary}]}
                        onPress={() => { triggerHaptic('impactMedium'); onRetry(); }}
                        onPressIn={btnPressIn}
                        onPressOut={btnPressOut}
                        activeOpacity={0.8}>
                        <Text style={[modalStyles.confirmButtonText, {color: colors.textOnPrimary}]}>Try Again</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[modalStyles.confirmTitle, {color: colors.textPrimary}]}>
                    Confirm Your Gift
                  </Text>
                  <View style={[modalStyles.detailRow, {borderBottomColor: colors.border}]}>
                    <Text style={[modalStyles.detailLabel, {color: colors.textTertiary}]}>Amount</Text>
                    <Text style={[modalStyles.detailValue, {color: colors.textPrimary}]}>${amount}</Text>
                  </View>
                  <View style={[modalStyles.detailRow, {borderBottomColor: colors.border}]}>
                    <Text style={[modalStyles.detailLabel, {color: colors.textTertiary}]}>Toward</Text>
                    <Text style={[modalStyles.detailValue, {color: colors.textPrimary}]}>{direction}</Text>
                  </View>
                  <Text style={[modalStyles.disclaimer, {color: colors.textTertiary}]}>
                    100% of your gift goes to the need. Any amount raised beyond the goal will be applied to the next cause or refunded.
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity
                      style={[modalStyles.cancelButton, {borderColor: colors.border}]}
                      onPress={handleClose}
                      activeOpacity={0.8}>
                      <Text style={[modalStyles.cancelText, {color: colors.textSecondary}]}>Cancel</Text>
                    </TouchableOpacity>
                    <Animated.View style={{flex: 1, transform: [{scale: btnScale}]}}>
                      <TouchableOpacity
                        style={[modalStyles.confirmButton, {backgroundColor: colors.primary}]}
                        onPress={handleConfirm}
                        onPressIn={btnPressIn}
                        onPressOut={btnPressOut}
                        activeOpacity={0.8}>
                        <Text style={[modalStyles.confirmButtonText, {color: colors.textOnPrimary}]}>
                          Send Gift
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </>
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 32},
  cardContent: {padding: 28},
  centered: {alignItems: 'center', paddingVertical: 16},
  loadingText: {marginTop: 24, fontSize: Typography.body.fontSize, fontWeight: '500'},
  successCircle: {width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 24},
  successCheck: {fontSize: 36, fontWeight: '300'},
  successTitle: {...Typography.subheading, marginBottom: 12},
  successBody: {fontSize: Typography.body.fontSize, marginBottom: 12},
  txHashWrap: {marginBottom: 24},
  txHash: {fontSize: Typography.bodySmall.fontSize, textDecorationLine: 'underline'},
  errorCircle: {width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 24},
  errorX: {fontSize: 36, fontWeight: '600'},
  doneButton: {paddingVertical: 16, paddingHorizontal: 56, borderRadius: 12, marginTop: 8},
  doneText: {...Typography.buttonLarge},
  confirmTitle: {...Typography.subheading, marginBottom: 24, textAlign: 'center'},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1},
  detailLabel: {fontSize: Typography.bodySmall.fontSize},
  detailValue: {fontSize: Typography.bodySmall.fontSize, fontWeight: '600'},
  disclaimer: {fontSize: Typography.bodySmall.fontSize, textAlign: 'center', marginTop: 20, marginBottom: 24, lineHeight: Typography.bodySmall.lineHeight},
  buttonRow: {flexDirection: 'row', gap: 12},
  cancelButton: {flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center'},
  cancelText: {fontSize: Typography.body.fontSize, fontWeight: '500'},
  confirmButton: {paddingVertical: 14, borderRadius: 12, alignItems: 'center'},
  confirmButtonText: {...Typography.buttonLarge},
  cancelLoadingButton: {paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, borderWidth: 1, marginTop: 24},
});
