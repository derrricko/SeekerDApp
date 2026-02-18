import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useTheme, Typography} from './theme';
import GlassCard from './GlassCard';
import {usePressAnimation, EASE_OUT, EASE_IN} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';
import {formatUSDC} from '../data/mockData';
import type {Vault} from '../data/mockData';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

interface DepositModalProps {
  visible: boolean;
  vault: Vault | null;
  amount: number;
  onClose: () => void;
}

export default function DepositModal({
  visible,
  vault,
  amount,
  onClose,
}: DepositModalProps) {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const {
    scale: btnScale,
    onPressIn: btnPressIn,
    onPressOut: btnPressOut,
  } = usePressAnimation();

  const [stage, setStage] = useState<'confirm' | 'loading' | 'success'>('confirm');

  // Celebration animations
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const amountScale = useRef(new Animated.Value(0.5)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStage('confirm');
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
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
  }, [visible, scaleAnim, opacityAnim]);

  const handleSend = () => {
    triggerHaptic('impactMedium');
    setStage('loading');

    // Fake loading
    setTimeout(() => {
      setStage('success');
      triggerHaptic('notificationSuccess');
      setTimeout(() => triggerHaptic('impactMedium'), 300);

      // Reset celebration values
      glowOpacity.setValue(0);
      amountScale.setValue(0.5);
      messageOpacity.setValue(0);
      buttonsOpacity.setValue(0);

      // Staggered celebration
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 400,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.spring(amountScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 80,
        }),
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 250,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);
  };

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

  if (!vault) {return null;}

  const progress = vault.totalDeposited / vault.target;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[depositStyles.overlay, {opacity: opacityAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <GlassCard style={{borderRadius: 20}}>
            <View style={depositStyles.content}>
              {stage === 'confirm' && (
                <>
                  <Text
                    style={[
                      depositStyles.title,
                      {color: colors.textPrimary},
                    ]}>
                    Confirm Your Gift
                  </Text>

                  <View
                    style={[
                      depositStyles.detailRow,
                      {borderBottomColor: colors.border},
                    ]}>
                    <Text
                      style={[
                        depositStyles.detailLabel,
                        {color: colors.textTertiary},
                      ]}>
                      Vault
                    </Text>
                    <Text
                      style={[
                        depositStyles.detailValue,
                        {color: colors.textPrimary},
                      ]}>
                      {vault.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      depositStyles.detailRow,
                      {borderBottomColor: colors.border},
                    ]}>
                    <Text
                      style={[
                        depositStyles.detailLabel,
                        {color: colors.textTertiary},
                      ]}>
                      Amount
                    </Text>
                    <Text
                      style={[
                        depositStyles.detailValue,
                        {color: colors.textPrimary},
                      ]}>
                      ${amount}
                    </Text>
                  </View>
                  <View
                    style={[
                      depositStyles.detailRow,
                      {borderBottomColor: colors.border},
                    ]}>
                    <Text
                      style={[
                        depositStyles.detailLabel,
                        {color: colors.textTertiary},
                      ]}>
                      Progress
                    </Text>
                    <Text
                      style={[
                        depositStyles.detailValue,
                        {color: colors.textPrimary},
                      ]}>
                      {Math.round(progress * 100)}% funded
                    </Text>
                  </View>

                  <Text
                    style={[
                      depositStyles.disclaimer,
                      {color: colors.textTertiary},
                    ]}>
                    100% of your gift goes to the need.{'\n'}Devnet pilot — no
                    real funds.
                  </Text>

                  <View style={depositStyles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        depositStyles.cancelButton,
                        {borderColor: colors.border},
                      ]}
                      onPress={handleClose}
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          depositStyles.cancelText,
                          {color: colors.textSecondary},
                        ]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <Animated.View
                      style={{flex: 1, transform: [{scale: btnScale}]}}>
                      <TouchableOpacity
                        style={[
                          depositStyles.sendButton,
                          {backgroundColor: colors.primary},
                        ]}
                        onPress={handleSend}
                        onPressIn={btnPressIn}
                        onPressOut={btnPressOut}
                        activeOpacity={0.8}>
                        <Text
                          style={[
                            depositStyles.sendText,
                            {color: colors.textOnPrimary},
                          ]}>
                          Send Gift
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </>
              )}

              {stage === 'loading' && (
                <View style={depositStyles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      depositStyles.loadingText,
                      {color: colors.textSecondary},
                    ]}>
                    Sending your gift...
                  </Text>
                </View>
              )}

              {stage === 'success' && (
                <View style={depositStyles.centered}>
                  {/* Glow */}
                  <Animated.View
                    style={[
                      depositStyles.glow,
                      {
                        backgroundColor: colors.primaryLight,
                        opacity: glowOpacity,
                      },
                    ]}
                  />

                  {/* Amount */}
                  <Animated.Text
                    style={[
                      depositStyles.celebrationAmount,
                      {
                        color: colors.primary,
                        transform: [{scale: amountScale}],
                      },
                    ]}>
                    ${amount}
                  </Animated.Text>

                  <Animated.Text
                    style={[
                      depositStyles.celebrationDirection,
                      {color: colors.textSecondary, opacity: messageOpacity},
                    ]}>
                    toward {vault.name}
                  </Animated.Text>

                  <Animated.Text
                    style={[
                      depositStyles.celebrationMessage,
                      {color: colors.textPrimary, opacity: messageOpacity},
                    ]}>
                    Thank you for your generosity.{'\n'}This transaction was on
                    Solana devnet.
                  </Animated.Text>

                  <Animated.View
                    style={{
                      opacity: buttonsOpacity,
                      alignItems: 'center',
                      width: '100%',
                    }}>
                    <TouchableOpacity
                      style={depositStyles.doneLink}
                      onPress={handleClose}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          depositStyles.doneLinkText,
                          {color: colors.textTertiary},
                        ]}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const depositStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  content: {padding: 28},
  centered: {alignItems: 'center', paddingVertical: 16},
  title: {
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
  disclaimer: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
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
  sendButton: {paddingVertical: 14, borderRadius: 12, alignItems: 'center'},
  sendText: {...Typography.buttonLarge},
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
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
  doneLink: {paddingVertical: 8},
  doneLinkText: {fontSize: Typography.bodySmall.fontSize, fontWeight: '500'},
});
