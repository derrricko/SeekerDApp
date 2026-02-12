import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import GlassCard from './GlassCard';
import PresetChip from './PresetChip';
import {useTheme, Typography} from './theme';
import {triggerHaptic} from '../utils/haptics';
import {CHIP_IN_AMOUNTS} from '../data/content';
import type {Need} from '../data/content';

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

interface GiveChoiceModalProps {
  visible: boolean;
  need: Need | null;
  onSelectAmount: (amount: number) => void;
  onClose: () => void;
}

export default function GiveChoiceModal({
  visible,
  need,
  onSelectAmount,
  onClose,
}: GiveChoiceModalProps) {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Progress bar animation
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Local chip-in state
  const [chipMode, setChipMode] = useState<'preset' | 'custom' | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const chipInAmount =
    chipMode === 'preset' && selectedPreset
      ? selectedPreset
      : chipMode === 'custom'
      ? parseInt(customAmount, 10) || 0
      : 0;
  const isChipInValid = chipInAmount >= 10;

  const hasFunding = need ? need.funded > 0 : false;
  const fundedPct = need ? Math.min(need.funded / need.amount, 1) : 0;

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setChipMode(null);
      setSelectedPreset(null);
      setCustomAmount('');
      progressWidth.setValue(0);
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

      // Animate progress bar after modal entrance
      if (hasFunding) {
        Animated.timing(progressWidth, {
          toValue: fundedPct,
          duration: 600,
          delay: 250,
          easing: EASE_OUT,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [visible]);

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

  const handleFundFull = () => {
    if (!need) {
      return;
    }
    triggerHaptic('impactMedium');
    onSelectAmount(need.amount);
  };

  const handleChipIn = () => {
    if (!isChipInValid) {
      return;
    }
    triggerHaptic('impactMedium');
    onSelectAmount(chipInAmount);
  };

  const handlePresetSelect = (value: number) => {
    setChipMode('preset');
    setSelectedPreset(value);
    setCustomAmount('');
  };

  const handleCustomSelect = () => {
    setChipMode('custom');
    setSelectedPreset(null);
    setCustomAmount('');
  };

  const handleCustomChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 10000) {
      return;
    }
    setCustomAmount(cleaned);
  };

  if (!need) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
      <Animated.View style={[modalStyles.overlay, {opacity: opacityAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <GlassCard style={{borderRadius: 20}}>
            <View style={modalStyles.cardContent}>
              {/* Header */}
              <Text style={[modalStyles.title, {color: colors.textPrimary}]}>
                {need.title}
              </Text>

              {/* Progress bar — only show if there's funding */}
              {hasFunding && (
                <View style={modalStyles.progressSection}>
                  <View
                    style={[
                      modalStyles.progressTrack,
                      {backgroundColor: colors.glassBorder},
                    ]}>
                    <Animated.View
                      style={[
                        modalStyles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: progressWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      modalStyles.progressLabel,
                      {color: colors.textTertiary},
                    ]}>
                    ${need.funded} of ${need.amount} raised
                  </Text>
                </View>
              )}

              {/* Fund the entire need — hero button */}
              <TouchableOpacity
                style={[
                  modalStyles.fundFullButton,
                  {backgroundColor: colors.primary, shadowColor: colors.shadow},
                ]}
                onPress={handleFundFull}
                activeOpacity={0.8}>
                <Text
                  style={[
                    modalStyles.fundFullText,
                    {color: colors.textOnPrimary},
                  ]}>
                  Fund the entire need {'\u2014'} $
                  {need.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>

              {/* "or chip in" divider */}
              <View style={modalStyles.dividerRow}>
                <View
                  style={[
                    modalStyles.dividerLine,
                    {backgroundColor: colors.border},
                  ]}
                />
                <Text
                  style={[
                    modalStyles.dividerText,
                    {color: colors.textTertiary},
                  ]}>
                  or chip in
                </Text>
                <View
                  style={[
                    modalStyles.dividerLine,
                    {backgroundColor: colors.border},
                  ]}
                />
              </View>

              {/* Chip-in presets */}
              <View style={modalStyles.chipsRow}>
                {CHIP_IN_AMOUNTS.map(value => (
                  <PresetChip
                    key={value}
                    label={`$${value}`}
                    selected={chipMode === 'preset' && selectedPreset === value}
                    onPress={() => handlePresetSelect(value)}
                  />
                ))}
                <PresetChip
                  label="Other"
                  selected={chipMode === 'custom'}
                  onPress={handleCustomSelect}
                />
              </View>

              {/* Custom amount input */}
              {chipMode === 'custom' && (
                <View
                  style={[modalStyles.customRow, {borderColor: colors.border}]}>
                  <Text
                    style={[
                      modalStyles.customDollar,
                      {color: colors.textTertiary},
                    ]}>
                    $
                  </Text>
                  <TextInput
                    style={[
                      modalStyles.customInput,
                      {color: colors.textPrimary},
                    ]}
                    value={customAmount}
                    onChangeText={handleCustomChange}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    autoFocus
                  />
                </View>
              )}

              {/* Funding note */}
              <Text
                style={[modalStyles.fundingNote, {color: colors.textTertiary}]}>
                Chip-ins combine to fully fund the need. Any excess goes to the
                next cause.
              </Text>

              {/* Chip In button — appears as text until amount selected */}
              {isChipInValid ? (
                <TouchableOpacity
                  style={[
                    modalStyles.chipInButton,
                    {borderColor: colors.primary},
                  ]}
                  onPress={handleChipIn}
                  activeOpacity={0.8}>
                  <Text
                    style={[modalStyles.chipInText, {color: colors.primary}]}>
                    Chip In ${chipInAmount}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={modalStyles.chipInPlaceholder}>
                  <Text
                    style={[
                      modalStyles.chipInHint,
                      {color: colors.textTertiary},
                    ]}>
                    Select an amount above
                  </Text>
                </View>
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
  cardContent: {padding: 24},
  title: {
    ...Typography.subheading,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressLabel: {
    fontSize: Typography.caption.fontSize,
    letterSpacing: Typography.caption.letterSpacing,
    marginTop: 6,
    textAlign: 'center',
  },
  fundFullButton: {
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fundFullText: {
    ...Typography.buttonLarge,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {flex: 1, height: 1},
  dividerText: {
    fontSize: 11,
    marginHorizontal: 16,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  customDollar: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    marginRight: 4,
  },
  customInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    padding: 0,
  },
  chipInButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  chipInText: {
    ...Typography.buttonLarge,
  },
  chipInPlaceholder: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  chipInHint: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '400',
  },
  fundingNote: {
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
});
