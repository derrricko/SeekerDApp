import React, {useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Linking,
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
import {getExplorerUrl} from '../utils/explorer';
import AppHeader from '../ui/AppHeader';
import PrimaryButton from '../ui/PrimaryButton';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';

type Step = 'form' | 'confirm' | 'processing';
const DROPDOWN_ITEM_HEIGHT = 60;
const QUICK_AMOUNTS = [5, 10, 25, 50] as const;
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
  const {connecting, authorizeSignAndBuildTransaction} = useWallet();

  const [amountInput, setAmountInput] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [matchContext, setMatchContext] = useState('');
  const [recipientNote, setRecipientNote] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingTxSig, setProcessingTxSig] = useState('');
  const [processingConversationId, setProcessingConversationId] = useState('');
  const stepMotion = useRef(new Animated.Value(1)).current;
  const campaignMenuMotion = useRef(new Animated.Value(0)).current;
  const [campaignMenuVisible, setCampaignMenuVisible] = useState(false);
  const donationInFlight = useRef(false);
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
      duration: 100,
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
    setShowOptionalFields(false);
    amountFocusMotion.setValue(0);
    campaignFocusMotion.setValue(0);
    matchFocusMotion.setValue(0);
    noteFocusMotion.setValue(0);
    setMatchContext('');
    setRecipientNote('');
    setStep('form');
    setError('');
    setProcessingTxSig('');
    setProcessingConversationId('');
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

    // Clear error when going back to form so stale messages don't persist
    if (nextStep === 'form') {
      setError('');
    }

    if (nextStep === 'confirm') {
      animateFieldFocus(amountFocusMotion, 0);
      animateFieldFocus(campaignFocusMotion, 0);
      animateFieldFocus(matchFocusMotion, 0);
      animateFieldFocus(noteFocusMotion, 0);
    }

    Animated.timing(stepMotion, {
      toValue: 0,
      duration: 250,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      stepMotion.setValue(0);
      Animated.timing(stepMotion, {
        toValue: 1,
        duration: 250,
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
      duration: 180,
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
      duration: 180,
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
    Keyboard.dismiss();
    closeCampaignMenu();
    transitionToStep('confirm');
  };

  const runDonation = async () => {
    if (donationInFlight.current || loading) {
      return;
    }
    if (!validateForm() || !selectedCampaign) {
      transitionToStep('form');
      return;
    }

    donationInFlight.current = true;
    setLoading(true);
    setError('');

    try {
      const result = await executeDonationSeamless(
        connection,
        MATCHING_POOL.wallet,
        MATCHING_POOL.id,
        amount,
        'one_time',
        authorizeSignAndBuildTransaction,
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

      setProcessingConversationId(conversationId || '');

      if (conversationId) {
        reset();
        navigation.navigate('Messages', {conversationId});
      } else {
        // Backend failed but tx is on-chain — show processing state with error
        setProcessingTxSig(result.data.txSignature);
        if (result.data.recordError) {
          console.error(
            '[give] Donation recorded on-chain but thread creation is delayed:',
            result.data.recordError,
          );
          setError(
            'Your donation is confirmed on-chain. Message thread setup is taking longer than usual.',
          );
        }
        transitionToStep('processing');
      }
    } catch {
      setError('Donation failed unexpectedly. Please try again.');
    } finally {
      donationInFlight.current = false;
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
                        fontFamily: theme.typography.displayRegular,
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
                        fontFamily: theme.typography.display,
                      },
                    ]}
                  />
                </Animated.View>

                <View style={styles.quickPills}>
                  {QUICK_AMOUNTS.map(amt => {
                    const active = amount === amt;
                    return (
                      <Pressable
                        key={amt}
                        onPress={() => setAmountInput(String(amt))}
                        style={[
                          styles.quickPill,
                          {
                            backgroundColor: active
                              ? theme.colors.accent + '18'
                              : theme.colors.surfaceMuted,
                            borderColor: active
                              ? theme.colors.accent
                              : theme.colors.borderMuted,
                            borderRadius: theme.radius.sm,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.quickPillText,
                            {
                              color: active
                                ? theme.colors.accent
                                : theme.colors.textSecondary,
                              fontFamily: theme.typography.brand,
                            },
                          ]}>
                          ${amt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
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

              <TouchableOpacity
                onPress={() => setShowOptionalFields(v => !v)}
                style={styles.optionalToggle}
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.optionalDividerLine,
                    {backgroundColor: theme.colors.borderMuted},
                  ]}
                />
                <Text
                  style={[
                    styles.optionalSectionLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {showOptionalFields
                    ? 'HIDE OPTIONS \u25B4'
                    : 'ADD A NOTE \u25BE'}
                </Text>
              </TouchableOpacity>

              {showOptionalFields ? (
                <>
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
                </>
              ) : null}

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
          ) : step === 'confirm' ? (
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
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.display,
                      },
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
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.displayRegular,
                      },
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

              <View style={styles.timelineList}>
                <Text
                  style={[
                    styles.timelineItem,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {'—  '}On-chain confirmation is immediate
                </Text>
                <Text
                  style={[
                    styles.timelineItem,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {'—  '}5-7 days: receipts, photos, and updates
                </Text>
                <Text
                  style={[
                    styles.timelineItem,
                    {color: theme.colors.textTertiary},
                  ]}>
                  {'—  '}Network fee: {'<'}$0.01 SOL (paid to Solana validators,
                  not Glimpse)
                </Text>
              </View>

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
                    backgroundColor: 'transparent',
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
                  BACK
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
          ) : step === 'processing' ? (
            <View>
              <SurfaceCard style={styles.processingCard}>
                <Text
                  style={[
                    styles.processingTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  DONATION CONFIRMED
                </Text>
                <Text
                  style={[
                    styles.processingAmount,
                    {
                      color: theme.colors.accent,
                      fontFamily: theme.typography.display,
                    },
                  ]}>
                  {formattedAmount} USDC
                </Text>
                <Text
                  style={[
                    styles.processingBody,
                    {color: theme.colors.textSecondary},
                  ]}>
                  Your donation is confirmed on-chain. We are processing your
                  message thread — it will appear in Messages shortly.
                </Text>
              </SurfaceCard>

              {!!error && (
                <Text style={[styles.error, {color: theme.colors.danger}]}>
                  {error}
                </Text>
              )}

              {!!processingTxSig && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(getExplorerUrl(processingTxSig))
                  }
                  activeOpacity={0.7}
                  style={[
                    styles.explorerLink,
                    {borderColor: theme.colors.border},
                  ]}>
                  <Text
                    style={[
                      styles.explorerLinkText,
                      {
                        color: theme.colors.accent,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    View on Solana Explorer
                  </Text>
                </TouchableOpacity>
              )}

              {!!processingConversationId && (
                <PrimaryButton
                  label="View Your Thread"
                  onPress={() => {
                    const convId = processingConversationId;
                    reset();
                    navigation.navigate('Messages', {conversationId: convId});
                  }}
                  style={styles.reviewButton}
                />
              )}

              <PrimaryButton
                label="Done"
                variant="secondary"
                onPress={() => {
                  reset();
                  navigation.navigate('Glimpses');
                }}
                style={{marginTop: 8}}
              />
            </View>
          ) : null}
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create<
  Record<
    string,
    import('react-native').ViewStyle | import('react-native').TextStyle
  >
>({
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
    borderWidth: 1.5,
    borderRadius: 10,
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  amountPrefix: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '300',
    paddingVertical: 8,
  },
  quickPills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickPill: {
    flex: 1,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dropdownTrigger: {
    borderWidth: 1.5,
    borderRadius: 10,
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
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
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
    borderWidth: 1.5,
    borderRadius: 10,
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
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reviewLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '400',
  },
  reviewCampaign: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
  },
  reviewBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  timelineList: {
    marginTop: 12,
    gap: 4,
  },
  timelineItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 14,
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  confirmButton: {
    marginTop: 10,
    width: '100%',
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1125',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  processingCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  processingTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  processingAmount: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '400',
    marginBottom: 12,
  },
  processingBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  explorerLink: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  explorerLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionalToggle: {
    marginTop: 4,
    marginBottom: 14,
  },
  optionalDividerLine: {
    height: 1,
    marginBottom: 10,
  },
  optionalSectionLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
  },
});
