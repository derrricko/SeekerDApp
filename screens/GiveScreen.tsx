import React, {useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CAMPAIGN_OPTIONS, MATCHING_POOL} from '../data/donationConfig';
import {useConnection} from '../components/providers/ConnectionProvider';
import {useWallet} from '../components/providers/WalletProvider';
import {executeDonationSeamless} from '../services/donations';
import {sendMessage} from '../services/chat';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import PrimaryButton from '../ui/PrimaryButton';
import ScreenContainer from '../ui/ScreenContainer';

type Step = 'form' | 'confirm';
const DROPDOWN_ITEM_HEIGHT = 60;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function normalizeAmountInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, '');
  const firstDot = sanitized.indexOf('.');
  if (firstDot === -1) {
    return sanitized;
  }
  const left = sanitized.slice(0, firstDot + 1);
  const right = sanitized.slice(firstDot + 1).replace(/\./g, '');
  return `${left}${right}`.slice(0, 12);
}

export default function GiveScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const connection = useConnection();
  const {connecting, authorizeAndSignAndSendTransaction} = useWallet();

  const [amountInput, setAmountInput] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [matchContext, setMatchContext] = useState('');
  const [recipientNote, setRecipientNote] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const stepMotion = useRef(new Animated.Value(1)).current;
  const campaignMenuMotion = useRef(new Animated.Value(0)).current;
  const [campaignMenuVisible, setCampaignMenuVisible] = useState(false);
  const amountFocusMotion = useRef(new Animated.Value(0)).current;
  const campaignFocusMotion = useRef(new Animated.Value(0)).current;
  const matchFocusMotion = useRef(new Animated.Value(0)).current;
  const noteFocusMotion = useRef(new Animated.Value(0)).current;

  const stepTranslateY = stepMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const dropdownHeight = campaignMenuMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CAMPAIGN_OPTIONS.length * DROPDOWN_ITEM_HEIGHT],
  });
  const dropdownTranslateY = campaignMenuMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  const createFieldAnimatedStyle = (motion: Animated.Value) => ({
    borderColor: motion.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, theme.colors.accent],
    }),
    transform: [
      {
        translateY: motion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -1],
        }),
      },
    ],
  });

  const animateFieldFocus = (motion: Animated.Value, toValue: number) => {
    Animated.timing(motion, {
      toValue,
      duration: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const amount = useMemo(() => {
    const normalized = amountInput.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

  const selectedCampaign = useMemo(
    () => CAMPAIGN_OPTIONS.find(c => c.id === campaignId) || null,
    [campaignId],
  );

  const formattedAmount = useMemo(() => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return '0.00';
    }
    return amount.toFixed(2);
  }, [amount]);

  const reset = () => {
    setAmountInput('');
    setCampaignId('');
    setCampaignOpen(false);
    setCampaignMenuVisible(false);
    campaignMenuMotion.setValue(0);
    amountFocusMotion.setValue(0);
    campaignFocusMotion.setValue(0);
    matchFocusMotion.setValue(0);
    noteFocusMotion.setValue(0);
    setMatchContext('');
    setRecipientNote('');
    setStep('form');
    setError('');
  };

  const validateForm = () => {
    if (amount <= 0 || amount > 10_000) {
      setError('Enter a USDC amount between 0.01 and 10,000.');
      return false;
    }

    if (!selectedCampaign) {
      setError('Select a campaign to continue.');
      return false;
    }

    if (amount < selectedCampaign.minimumUSDC) {
      setError(
        `Minimum for this campaign is ${selectedCampaign.minimumUSDC.toFixed(
          2,
        )} USDC.`,
      );
      return false;
    }

    setError('');
    return true;
  };

  const transitionToStep = (nextStep: Step) => {
    if (nextStep === step) {
      return;
    }

    if (nextStep === 'confirm') {
      animateFieldFocus(amountFocusMotion, 0);
      animateFieldFocus(campaignFocusMotion, 0);
      animateFieldFocus(matchFocusMotion, 0);
      animateFieldFocus(noteFocusMotion, 0);
    }

    Animated.timing(stepMotion, {
      toValue: 0,
      duration: 120,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      stepMotion.setValue(0);
      Animated.timing(stepMotion, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const openCampaignMenu = () => {
    if (campaignOpen) {
      return;
    }
    animateFieldFocus(campaignFocusMotion, 1);
    setCampaignOpen(true);
    setCampaignMenuVisible(true);
    Animated.timing(campaignMenuMotion, {
      toValue: 1,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const closeCampaignMenu = () => {
    if (!campaignOpen && !campaignMenuVisible) {
      return;
    }
    animateFieldFocus(campaignFocusMotion, 0);
    setCampaignOpen(false);
    Animated.timing(campaignMenuMotion, {
      toValue: 0,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(({finished}) => {
      if (finished) {
        setCampaignMenuVisible(false);
      }
    });
  };

  const toggleCampaignMenu = () => {
    if (campaignOpen) {
      closeCampaignMenu();
      return;
    }
    openCampaignMenu();
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }
    closeCampaignMenu();
    transitionToStep('confirm');
  };

  const runDonation = async () => {
    if (loading) {
      return;
    }
    if (!validateForm() || !selectedCampaign) {
      transitionToStep('form');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await executeDonationSeamless(
        connection,
        MATCHING_POOL.wallet,
        MATCHING_POOL.id,
        amount,
        'one_time',
        authorizeAndSignAndSendTransaction,
        selectedCampaign.causePreferences,
        'solo',
      );

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      const conversationId = result.data.conversationId;
      if (conversationId) {
        const payload: string[] = [];
        if (matchContext.trim()) {
          payload.push(`Donor context: ${matchContext.trim()}`);
        }
        if (recipientNote.trim()) {
          payload.push(`Donor note: ${recipientNote.trim()}`);
        }

        if (payload.length > 0) {
          await sendMessage(
            conversationId,
            result.data.donorWallet,
            payload.join('\n\n'),
          ).catch(() => {});
        }
      }

      reset();
      if (conversationId) {
        navigation.navigate('Messages', {conversationId});
      } else {
        navigation.navigate('Messages');
      }
    } catch {
      setError('Donation failed unexpectedly. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputSurface =
    theme.mode === 'light' ? '#FFFFFF' : theme.colors.surface;

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Donate" />
      <ScreenContainer contentStyle={styles.screenContent}>
        <Animated.View
          style={[
            styles.stepContainer,
            {
              opacity: stepMotion,
              transform: [{translateY: stepTranslateY}],
            },
          ]}>
          {step === 'form' ? (
            <View>
              <View style={styles.fieldBlock}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  AMOUNT (USDC)
                  <Text style={styles.requiredMark}> *</Text>
                </Text>
                <Animated.View
                  style={[
                    styles.amountWrap,
                    {
                      backgroundColor: inputSurface,
                    },
                    createFieldAnimatedStyle(amountFocusMotion),
                  ]}>
                  <Text
                    style={[
                      styles.amountPrefix,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    $
                  </Text>
                  <TextInput
                    value={amountInput}
                    onChangeText={value =>
                      setAmountInput(normalizeAmountInput(value))
                    }
                    onFocus={() => animateFieldFocus(amountFocusMotion, 1)}
                    onBlur={() => animateFieldFocus(amountFocusMotion, 0)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textTertiary}
                    style={[
                      styles.amountInput,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}
                  />
                </Animated.View>
              </View>

              <View style={styles.fieldBlock}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  CAMPAIGN
                  <Text style={styles.requiredMark}> *</Text>
                </Text>
                <AnimatedPressable
                  onPress={toggleCampaignMenu}
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: inputSurface,
                    },
                    createFieldAnimatedStyle(campaignFocusMotion),
                  ]}>
                  <Text
                    style={[
                      styles.dropdownValue,
                      {
                        color: selectedCampaign
                          ? theme.colors.textPrimary
                          : theme.colors.textTertiary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {selectedCampaign
                      ? selectedCampaign.label
                      : 'Select a campaign'}
                  </Text>
                  <Text
                    style={[
                      styles.dropdownArrow,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    {campaignOpen ? '˄' : '˅'}
                  </Text>
                </AnimatedPressable>

                {campaignMenuVisible ? (
                  <Animated.View
                    style={[
                      styles.dropdownList,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: inputSurface,
                        opacity: campaignMenuMotion,
                        height: dropdownHeight,
                        transform: [{translateY: dropdownTranslateY}],
                      },
                    ]}>
                    {CAMPAIGN_OPTIONS.map((campaign, index) => {
                      const active = campaign.id === campaignId;
                      const isLast = index === CAMPAIGN_OPTIONS.length - 1;
                      return (
                        <TouchableOpacity
                          key={campaign.id}
                          onPress={() => {
                            setCampaignId(campaign.id);
                            closeCampaignMenu();
                          }}
                          activeOpacity={0.85}
                          style={[
                            styles.dropdownItem,
                            {
                              borderBottomWidth: isLast ? 0 : 1,
                              borderBottomColor: 'rgba(26,17,37,0.2)',
                              backgroundColor: active
                                ? 'rgba(101,84,209,0.08)'
                                : 'transparent',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.dropdownItemLabel,
                              {
                                color: theme.colors.textPrimary,
                                fontFamily: theme.typography.brand,
                              },
                            ]}>
                            {campaign.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Animated.View>
                ) : null}

                {selectedCampaign ? (
                  <Text
                    style={[
                      styles.helper,
                      {color: theme.colors.textSecondary},
                    ]}>
                    {selectedCampaign.summary}
                    {'\n'}
                    Minimum donation: {selectedCampaign.minimumUSDC.toFixed(
                      2,
                    )}{' '}
                    USDC.
                  </Text>
                ) : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  MATCH CONTEXT
                  <Text style={styles.optionalLabel}> (optional)</Text>
                </Text>
                <AnimatedTextInput
                  value={matchContext}
                  onChangeText={setMatchContext}
                  onFocus={() => animateFieldFocus(matchFocusMotion, 1)}
                  onBlur={() => animateFieldFocus(matchFocusMotion, 0)}
                  placeholder="Any details that help us match your donation to a cause or person."
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.multilineInput,
                    {
                      backgroundColor: inputSurface,
                      color: theme.colors.textPrimary,
                    },
                    createFieldAnimatedStyle(matchFocusMotion),
                  ]}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text
                  style={[
                    styles.fieldLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  NOTE FOR RECIPIENT
                  <Text style={styles.optionalLabel}> (optional)</Text>
                </Text>
                <AnimatedTextInput
                  value={recipientNote}
                  onChangeText={setRecipientNote}
                  onFocus={() => animateFieldFocus(noteFocusMotion, 1)}
                  onBlur={() => animateFieldFocus(noteFocusMotion, 0)}
                  placeholder="Leave a note for the recipient."
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.multilineInput,
                    {
                      backgroundColor: inputSurface,
                      color: theme.colors.textPrimary,
                    },
                    createFieldAnimatedStyle(noteFocusMotion),
                  ]}
                />
              </View>

              {!!error && (
                <Text style={[styles.error, {color: theme.colors.danger}]}>
                  {error}
                </Text>
              )}

              <PrimaryButton
                label="Review Donation"
                onPress={handleContinue}
                style={styles.reviewButton}
              />
            </View>
          ) : (
            <View>
              <View style={styles.reviewRows}>
                <View
                  style={[
                    styles.reviewRow,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: inputSurface,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.reviewLabel,
                      {
                        color: theme.colors.textTertiary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    AMOUNT
                  </Text>
                  <Text
                    style={[
                      styles.reviewValue,
                      {color: theme.colors.textPrimary},
                    ]}>
                    {formattedAmount} USDC
                  </Text>
                </View>

                <View
                  style={[
                    styles.reviewRow,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: inputSurface,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.reviewLabel,
                      {
                        color: theme.colors.textTertiary,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    CAMPAIGN
                  </Text>
                  <Text
                    style={[
                      styles.reviewCampaign,
                      {color: theme.colors.textPrimary},
                    ]}>
                    {selectedCampaign?.label || '-'}
                  </Text>
                </View>

                {!!matchContext.trim() && (
                  <View
                    style={[
                      styles.reviewRow,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: inputSurface,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.reviewLabel,
                        {
                          color: theme.colors.textTertiary,
                          fontFamily: theme.typography.brand,
                        },
                      ]}>
                      MATCH CONTEXT
                    </Text>
                    <Text
                      style={[
                        styles.reviewBody,
                        {color: theme.colors.textSecondary},
                      ]}>
                      {matchContext.trim()}
                    </Text>
                  </View>
                )}

                {!!recipientNote.trim() && (
                  <View
                    style={[
                      styles.reviewRow,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: inputSurface,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.reviewLabel,
                        {
                          color: theme.colors.textTertiary,
                          fontFamily: theme.typography.brand,
                        },
                      ]}>
                      NOTE FOR RECIPIENT
                    </Text>
                    <Text
                      style={[
                        styles.reviewBody,
                        {color: theme.colors.textSecondary},
                      ]}>
                      {recipientNote.trim()}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.timelineCopy,
                  {color: theme.colors.textSecondary},
                ]}>
                After confirmation, your USDC donation is sent on-chain. Your
                message thread opens immediately. In 24-48 hours we reach out
                with the specific need your donation is supporting. In 5-7 days
                you receive receipts, photos, and progress updates.
              </Text>

              {!!error && (
                <Text style={[styles.error, {color: theme.colors.danger}]}>
                  {error}
                </Text>
              )}

              <Pressable
                onPress={() => transitionToStep('form')}
                disabled={loading || connecting}
                style={({pressed}) => [
                  styles.backButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: inputSurface,
                    opacity: loading || connecting ? 0.6 : 1,
                    transform: [
                      {scale: pressed ? 0.985 : 1},
                      {translateY: pressed ? 1 : 0},
                    ],
                  },
                ]}>
                <Text
                  style={[
                    styles.backButtonText,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  Back
                </Text>
              </Pressable>

              <Pressable
                onPress={runDonation}
                disabled={loading || connecting}
                style={({pressed}) => [
                  styles.confirmButton,
                  {
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.border,
                    opacity: loading || connecting ? 0.7 : 1,
                    transform: [
                      {scale: pressed ? 0.985 : 1},
                      {translateY: pressed ? 2 : 0},
                    ],
                    shadowOpacity: pressed ? 0.18 : 0.3,
                    shadowOffset: {
                      width: pressed ? 1 : 2,
                      height: pressed ? 1 : 2,
                    },
                    elevation: pressed ? 3 : 5,
                  },
                ]}>
                <Text
                  style={[
                    styles.confirmButtonText,
                    {fontFamily: theme.typography.brand},
                  ]}>
                  {loading || connecting
                    ? 'Authorizing...'
                    : 'Confirm and Sign'}
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContent: {
    paddingTop: 14,
    paddingBottom: 64,
  },
  stepContainer: {
    width: '100%',
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  requiredMark: {
    color: '#D23A63',
    fontSize: 13,
    fontWeight: '700',
  },
  optionalLabel: {
    color: '#7C7595',
    fontSize: 11,
  },
  amountWrap: {
    borderWidth: 2,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  amountPrefix: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    paddingVertical: 8,
  },
  dropdownTrigger: {
    borderWidth: 2,
    minHeight: 68,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
  },
  dropdownList: {
    marginTop: 6,
    borderWidth: 2,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    minHeight: DROPDOWN_ITEM_HEIGHT,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dropdownItemLabel: {
    fontSize: 15,
    lineHeight: 19,
  },
  helper: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  multilineInput: {
    borderWidth: 2,
    minHeight: 84,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    marginTop: 2,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    marginTop: 2,
  },
  reviewRows: {
    gap: 10,
  },
  reviewRow: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reviewLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '700',
  },
  reviewCampaign: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  reviewBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  timelineCopy: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  backButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    minWidth: 96,
    height: 40,
    borderWidth: 2,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  confirmButton: {
    marginTop: 10,
    width: '100%',
    minHeight: 64,
    borderWidth: 3,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1125',
    shadowOpacity: 0.3,
    shadowRadius: 0,
    shadowOffset: {width: 2, height: 2},
    elevation: 5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
