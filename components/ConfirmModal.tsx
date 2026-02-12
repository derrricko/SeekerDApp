import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import {useTheme, Typography} from './theme';
import GlassCard from './GlassCard';
import {usePressAnimation, EASE_OUT, EASE_IN} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const NOTE_MAX_LENGTH = 280;

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes('user rejected') ||
    lower.includes('declined') ||
    lower.includes('cancelled')
  ) {
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
  onConfirm: (note?: string) => void;
  onRetry: () => void;
  onClose: () => void;
  onViewGlimpses?: () => void;
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
  onViewGlimpses,
}: ConfirmModalProps) {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const {
    scale: btnScale,
    onPressIn: btnPressIn,
    onPressOut: btnPressOut,
  } = usePressAnimation();

  // Note of encouragement
  const [note, setNote] = useState('');

  // Celebration animations
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const amountScale = useRef(new Animated.Value(0.5)).current;
  const directionOpacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setNote('');
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Celebration animation sequence on success
  useEffect(() => {
    if (success) {
      // Double haptic
      triggerHaptic('notificationSuccess');
      setTimeout(() => triggerHaptic('impactMedium'), 300);

      // Reset celebration values
      glowOpacity.setValue(0);
      amountScale.setValue(0.5);
      directionOpacity.setValue(0);
      messageOpacity.setValue(0);
      buttonsOpacity.setValue(0);

      // Staggered entrance
      Animated.sequence([
        // Glow fades in
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 400,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        // Amount scales up with spring overshoot
        Animated.spring(amountScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 80,
        }),
        // Direction fades in
        Animated.timing(directionOpacity, {
          toValue: 1,
          duration: 250,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        // Thank you message fades in
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        // Buttons fade in
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 250,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (error) {
      triggerHaptic('notificationError');
    }
  }, [success, error]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleConfirm = () => {
    triggerHaptic('impactMedium');
    onConfirm(note.trim() || undefined);
  };

  const handleViewGlimpses = () => {
    handleClose();
    setTimeout(() => onViewGlimpses?.(), 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
      <Animated.View style={[modalStyles.overlay, {opacity: opacityAnim}]}>
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <GlassCard style={{borderRadius: 20}}>
            <View style={modalStyles.cardContent}>
              {loading ? (
                <View style={modalStyles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      modalStyles.loadingText,
                      {color: colors.textSecondary},
                    ]}>
                    Sending your gift...
                  </Text>
                  <TouchableOpacity
                    style={[
                      modalStyles.cancelLoadingButton,
                      {borderColor: colors.border},
                    ]}
                    onPress={handleClose}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        modalStyles.cancelText,
                        {color: colors.textSecondary},
                      ]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : success ? (
                <View style={modalStyles.centered}>
                  {/* Radial glow */}
                  <Animated.View
                    style={[
                      modalStyles.glow,
                      {
                        backgroundColor: colors.primaryLight,
                        opacity: glowOpacity,
                      },
                    ]}
                  />

                  {/* Amount — springs in */}
                  <Animated.Text
                    style={[
                      modalStyles.celebrationAmount,
                      {
                        color: colors.primary,
                        transform: [{scale: amountScale}],
                      },
                    ]}>
                    ${amount}
                  </Animated.Text>

                  {/* Direction — stagger +100ms */}
                  <Animated.Text
                    style={[
                      modalStyles.celebrationDirection,
                      {color: colors.textSecondary, opacity: directionOpacity},
                    ]}>
                    toward {direction}
                  </Animated.Text>

                  {/* Thank you message */}
                  <Animated.Text
                    style={[
                      modalStyles.celebrationMessage,
                      {color: colors.textPrimary, opacity: messageOpacity},
                    ]}>
                    Thank you for your generosity. You will receive receipts and
                    photos soon.
                  </Animated.Text>

                  {/* Buttons — fade in last */}
                  <Animated.View
                    style={[
                      modalStyles.celebrationButtons,
                      {opacity: buttonsOpacity},
                    ]}>
                    {txSignature && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={modalStyles.txHashWrap}
                        onPress={() =>
                          Linking.openURL(
                            `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
                          )
                        }>
                        <Text
                          style={[
                            modalStyles.txHash,
                            {color: colors.textTertiary},
                          ]}>
                          View on Solana Explorer
                        </Text>
                      </TouchableOpacity>
                    )}

                    {onViewGlimpses && (
                      <Animated.View style={{transform: [{scale: btnScale}]}}>
                        <TouchableOpacity
                          style={[
                            modalStyles.glimpsesButton,
                            {backgroundColor: colors.primary},
                          ]}
                          onPress={handleViewGlimpses}
                          onPressIn={btnPressIn}
                          onPressOut={btnPressOut}
                          activeOpacity={0.8}>
                          <Text
                            style={[
                              modalStyles.glimpsesButtonText,
                              {color: colors.textOnPrimary},
                            ]}>
                            View Your Glimpses
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}

                    <TouchableOpacity
                      style={modalStyles.doneLink}
                      onPress={handleClose}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          modalStyles.doneLinkText,
                          {color: colors.textTertiary},
                        ]}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              ) : error ? (
                <View style={modalStyles.centered}>
                  <View
                    style={[
                      modalStyles.errorCircle,
                      {borderColor: colors.error},
                    ]}>
                    <Text style={[modalStyles.errorX, {color: colors.error}]}>
                      !
                    </Text>
                  </View>
                  <Text
                    style={[
                      modalStyles.successTitle,
                      {color: colors.textPrimary},
                    ]}>
                    Something went wrong
                  </Text>
                  <Text
                    style={[
                      modalStyles.successBody,
                      {color: colors.textSecondary},
                    ]}>
                    {friendlyError(error)}
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        modalStyles.cancelButton,
                        {borderColor: colors.border},
                      ]}
                      onPress={handleClose}
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          modalStyles.cancelText,
                          {color: colors.textSecondary},
                        ]}>
                        Close
                      </Text>
                    </TouchableOpacity>
                    <Animated.View
                      style={{flex: 1, transform: [{scale: btnScale}]}}>
                      <TouchableOpacity
                        style={[
                          modalStyles.confirmButton,
                          {backgroundColor: colors.primary},
                        ]}
                        onPress={() => {
                          triggerHaptic('impactMedium');
                          onRetry();
                        }}
                        onPressIn={btnPressIn}
                        onPressOut={btnPressOut}
                        activeOpacity={0.8}>
                        <Text
                          style={[
                            modalStyles.confirmButtonText,
                            {color: colors.textOnPrimary},
                          ]}>
                          Try Again
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      modalStyles.confirmTitle,
                      {color: colors.textPrimary},
                    ]}>
                    Confirm Your Gift
                  </Text>
                  <View
                    style={[
                      modalStyles.detailRow,
                      {borderBottomColor: colors.border},
                    ]}>
                    <Text
                      style={[
                        modalStyles.detailLabel,
                        {color: colors.textTertiary},
                      ]}>
                      Amount
                    </Text>
                    <Text
                      style={[
                        modalStyles.detailValue,
                        {color: colors.textPrimary},
                      ]}>
                      ${amount}
                    </Text>
                  </View>
                  <View
                    style={[
                      modalStyles.detailRow,
                      {borderBottomColor: colors.border},
                    ]}>
                    <Text
                      style={[
                        modalStyles.detailLabel,
                        {color: colors.textTertiary},
                      ]}>
                      Toward
                    </Text>
                    <Text
                      style={[
                        modalStyles.detailValue,
                        {color: colors.textPrimary},
                      ]}>
                      {direction}
                    </Text>
                  </View>

                  {/* Note of encouragement */}
                  <View style={modalStyles.noteSection}>
                    <TextInput
                      style={[
                        modalStyles.noteInput,
                        {
                          color: colors.textPrimary,
                          borderColor: colors.glassBorder,
                          backgroundColor: colors.glass,
                        },
                      ]}
                      placeholder="Add a note of encouragement (optional)"
                      placeholderTextColor={colors.textTertiary}
                      value={note}
                      onChangeText={setNote}
                      maxLength={NOTE_MAX_LENGTH}
                      multiline
                      textAlignVertical="top"
                    />
                    <Text
                      style={[
                        modalStyles.noteCounter,
                        {color: colors.textTertiary},
                      ]}>
                      {note.length}/{NOTE_MAX_LENGTH}
                    </Text>
                  </View>

                  <Text
                    style={[
                      modalStyles.disclaimer,
                      {color: colors.textTertiary},
                    ]}>
                    100% of your gift goes to the need. Any amount raised beyond
                    the goal will be applied to the next cause or refunded.
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        modalStyles.cancelButton,
                        {borderColor: colors.border},
                      ]}
                      onPress={handleClose}
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          modalStyles.cancelText,
                          {color: colors.textSecondary},
                        ]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <Animated.View
                      style={{flex: 1, transform: [{scale: btnScale}]}}>
                      <TouchableOpacity
                        style={[
                          modalStyles.confirmButton,
                          {backgroundColor: colors.primary},
                        ]}
                        onPress={handleConfirm}
                        onPressIn={btnPressIn}
                        onPressOut={btnPressOut}
                        activeOpacity={0.8}>
                        <Text
                          style={[
                            modalStyles.confirmButtonText,
                            {color: colors.textOnPrimary},
                          ]}>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  cardContent: {padding: 28},
  centered: {alignItems: 'center', paddingVertical: 16},
  loadingText: {
    marginTop: 24,
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
  },

  // Celebration
  glow: {
    position: 'absolute',
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  celebrationAmount: {
    fontSize: 56,
    fontWeight: '200',
    fontFamily: DISPLAY_FONT,
    letterSpacing: 1,
    marginBottom: 8,
  },
  celebrationDirection: {
    fontSize: Typography.body.fontSize,
    fontWeight: '400',
    marginBottom: 24,
  },
  celebrationMessage: {
    fontSize: Typography.body.fontSize,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  celebrationButtons: {
    alignItems: 'center',
    width: '100%',
  },
  txHashWrap: {marginBottom: 16},
  txHash: {
    fontSize: Typography.bodySmall.fontSize,
    textDecorationLine: 'underline',
  },
  glimpsesButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
  },
  glimpsesButtonText: {...Typography.buttonLarge},
  doneLink: {paddingVertical: 8},
  doneLinkText: {fontSize: Typography.bodySmall.fontSize, fontWeight: '500'},

  // Error
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorX: {fontSize: 36, fontWeight: '600'},
  successTitle: {...Typography.subheading, marginBottom: 12},
  successBody: {fontSize: Typography.body.fontSize, marginBottom: 12},

  // Confirm state
  confirmTitle: {
    ...Typography.subheading,
    marginBottom: 24,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailLabel: {fontSize: Typography.bodySmall.fontSize},
  detailValue: {fontSize: Typography.bodySmall.fontSize, fontWeight: '600'},

  // Note
  noteSection: {marginTop: 20},
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: Typography.body.fontSize,
    minHeight: 80,
    lineHeight: 22,
  },
  noteCounter: {
    fontSize: Typography.caption.fontSize,
    textAlign: 'right',
    marginTop: 4,
  },

  disclaimer: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: Typography.bodySmall.lineHeight,
  },
  buttonRow: {flexDirection: 'row', gap: 12},
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {fontSize: Typography.body.fontSize, fontWeight: '500'},
  confirmButton: {paddingVertical: 14, borderRadius: 12, alignItems: 'center'},
  confirmButtonText: {...Typography.buttonLarge},
  cancelLoadingButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
  },
});
