import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  DonationCadence,
  DonationMode,
  CAUSE_OPTIONS,
  MATCHING_POOL,
} from '../data/donationConfig';
import {useConnection} from '../components/providers/ConnectionProvider';
import {useWallet} from '../components/providers/WalletProvider';
import {executeDonation, DonationResult} from '../services/donations';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import PrimaryButton from '../ui/PrimaryButton';
import ScreenContainer from '../ui/ScreenContainer';
import SegmentedControl from '../ui/SegmentedControl';
import SurfaceCard from '../ui/SurfaceCard';

type Step = 'form' | 'confirm' | 'done';

const MAX_CAUSES = 3;

export default function GiveScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const connection = useConnection();
  const {connected, publicKey, connect, connecting, signAndSendTransaction} =
    useWallet();

  const [amountInput, setAmountInput] = useState('');
  const [cadence, setCadence] = useState<DonationCadence>('one_time');
  const [donationMode, setDonationMode] = useState<DonationMode>('solo');
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<DonationResult | null>(null);

  const amount = useMemo(() => {
    const normalized = amountInput.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

  const canContinue = amount > 0 && amount <= 10_000;

  const toggleCause = (causeId: string) => {
    setSelectedCauses(prev => {
      if (prev.includes(causeId)) {
        return prev.filter(id => id !== causeId);
      }
      if (prev.length >= MAX_CAUSES) {
        return prev;
      }
      return [...prev, causeId];
    });
  };

  const runDonation = async () => {
    if (loading) {
      return;
    }
    if (!canContinue) {
      return;
    }
    if (!connected || !publicKey) {
      setError('Connect your wallet first.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await executeDonation(
      connection,
      publicKey,
      MATCHING_POOL.wallet,
      MATCHING_POOL.id,
      amount,
      cadence,
      signAndSendTransaction,
      selectedCauses,
      donationMode,
    );

    if (result.success) {
      setReceipt(result.data);
      setStep('done');
    } else {
      setError(result.error.message);
      if (result.error.recoverable) {
        setStep('confirm');
      } else {
        setStep('form');
      }
    }
    setLoading(false);
  };

  const reset = () => {
    setAmountInput('');
    setCadence('one_time');
    setDonationMode('solo');
    setSelectedCauses([]);
    setStep('form');
    setError('');
    setReceipt(null);
  };

  const causeLabels = selectedCauses
    .map(id => CAUSE_OPTIONS.find(c => c.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Give" />
      <ScreenContainer>
        {!connected && (
          <SurfaceCard style={{marginBottom: theme.spacing.md}}>
            <Text
              style={[
                styles.eyebrow,
                {
                  color: theme.colors.textTertiary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              WALLET
            </Text>
            <Text
              style={[
                styles.helper,
                {color: theme.colors.textSecondary, marginBottom: 12},
              ]}>
              Connect your Solana wallet to donate.
            </Text>
            <PrimaryButton
              label={connecting ? 'Connecting...' : 'Connect Wallet'}
              onPress={connect}
              disabled={connecting}
            />
          </SurfaceCard>
        )}
        <SurfaceCard>
          {step === 'form' && (
            <>
              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                NEW CONTRIBUTION
              </Text>
              <Text
                style={[styles.headline, {color: theme.colors.textPrimary}]}>
                Enter amount
              </Text>

              <TextInput
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surfaceAlt,
                  },
                ]}
              />
              <Text
                style={[
                  styles.inputUnit,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                USDC
              </Text>

              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                    marginTop: 12,
                  },
                ]}>
                CAUSES (CHOOSE UP TO {MAX_CAUSES})
              </Text>

              <View style={styles.causeGrid}>
                {CAUSE_OPTIONS.map(cause => {
                  const active = selectedCauses.includes(cause.id);
                  return (
                    <PrimaryButton
                      key={cause.id}
                      label={cause.label}
                      variant={active ? 'primary' : 'secondary'}
                      onPress={() => toggleCause(cause.id)}
                      fullWidth={false}
                      style={styles.causeButton}
                    />
                  );
                })}
              </View>

              <Text
                style={[styles.helper, {color: theme.colors.textSecondary}]}>
                Cause selections help us match your donation to the right need.
              </Text>

              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                    marginTop: 12,
                  },
                ]}>
                DONATION TYPE
              </Text>

              <SegmentedControl<DonationMode>
                value={donationMode}
                onChange={setDonationMode}
                options={[
                  {label: 'Solo', value: 'solo'},
                  {label: 'Group', value: 'group'},
                ]}
              />

              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                    marginTop: 12,
                  },
                ]}>
                COMMITMENT
              </Text>

              <SegmentedControl<DonationCadence>
                value={cadence}
                onChange={setCadence}
                options={[
                  {label: 'One-time', value: 'one_time'},
                  {label: 'Daily', value: 'daily'},
                ]}
              />

              <Text
                style={[styles.helper, {color: theme.colors.textSecondary}]}>
                Daily commitments build streaks and increase weighted impact.
              </Text>

              {!!error && (
                <Text style={[styles.error, {color: theme.colors.danger}]}>
                  {error}
                </Text>
              )}

              <PrimaryButton
                label="Continue"
                onPress={() => {
                  if (!canContinue) {
                    setError('Enter a USDC amount between 0.01 and 10,000.');
                    return;
                  }
                  setError('');
                  setStep('confirm');
                }}
                style={{marginTop: 14}}
              />
            </>
          )}

          {step === 'confirm' && (
            <>
              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                CONFIRM
              </Text>
              <Text
                style={[styles.headline, {color: theme.colors.textPrimary}]}>
                {amount} USDC
              </Text>
              <Text
                style={[styles.helper, {color: theme.colors.textSecondary}]}>
                {MATCHING_POOL.name} ·{' '}
                {cadence === 'daily' ? 'Daily commitment' : 'One-time donation'}
                {donationMode === 'group' ? ' · Group' : ''}
              </Text>
              {causeLabels ? (
                <Text
                  style={[
                    styles.helper,
                    {color: theme.colors.textSecondary, marginTop: 4},
                  ]}>
                  Causes: {causeLabels}
                </Text>
              ) : null}

              {!!error && (
                <Text
                  style={[
                    styles.error,
                    {color: theme.colors.danger, marginTop: 8},
                  ]}>
                  {error}
                </Text>
              )}

              <View style={styles.confirmActions}>
                <PrimaryButton
                  label="Back"
                  variant="secondary"
                  fullWidth={false}
                  style={styles.confirmBtn}
                  onPress={() => setStep('form')}
                />
                <PrimaryButton
                  label={loading ? 'Sending...' : 'Send'}
                  fullWidth={false}
                  style={styles.confirmBtn}
                  onPress={runDonation}
                  disabled={loading}
                />
              </View>
            </>
          )}

          {step === 'done' && receipt && (
            <>
              <Text
                style={[
                  styles.eyebrow,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                COMPLETE
              </Text>
              <Text
                style={[styles.headline, {color: theme.colors.textPrimary}]}>
                RECEIVED
              </Text>
              <Text
                style={[styles.helper, {color: theme.colors.textSecondary}]}>
                {receipt.memo.a} USDC · {MATCHING_POOL.name}
              </Text>
              <Text
                style={[styles.helper, {color: theme.colors.textSecondary}]}
                numberOfLines={1}>
                TX {receipt.txSignature.slice(0, 16)}...
              </Text>

              <Text
                style={[
                  styles.holdMessage,
                  {color: theme.colors.textSecondary},
                ]}>
                Your donation is being processed. We are connecting you to a
                need based on the data and information you provided us. We will
                be reaching out with updates in the message thread. Remember you
                have 48 hours to request a refund.
              </Text>

              {receipt.conversationId ? (
                <PrimaryButton
                  label="Open Thread"
                  onPress={() => {
                    navigation.navigate('Messages', {
                      conversationId: receipt.conversationId,
                    });
                    reset();
                  }}
                  style={{marginTop: 16}}
                />
              ) : null}

              <PrimaryButton
                label="My Glimpses"
                variant="secondary"
                onPress={() => {
                  navigation.navigate('Glimpses');
                  reset();
                }}
                style={{marginTop: receipt.conversationId ? 10 : 16}}
              />
            </>
          )}
        </SurfaceCard>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  headline: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 2,
  },
  inputUnit: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'right',
  },
  causeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  causeButton: {
    minWidth: 106,
    paddingHorizontal: 12,
  },
  helper: {
    fontSize: 16,
    lineHeight: 22,
  },
  holdMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  error: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  confirmBtn: {
    flex: 1,
  },
});
