import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {DonationCadence} from '../components/providers/AppStateProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import {useWallet} from '../components/providers/WalletProvider';
import {executeDonation, DonationResult} from '../services/donations';
import {RECIPIENTS} from '../data/recipients';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import PrimaryButton from '../ui/PrimaryButton';
import ScreenContainer from '../ui/ScreenContainer';
import SegmentedControl from '../ui/SegmentedControl';
import SurfaceCard from '../ui/SurfaceCard';

type Step = 'form' | 'confirm' | 'done';

// Default to open-fund for hackathon. Recipient picker can be added to UI later.
const DEFAULT_RECIPIENT =
  RECIPIENTS.find(r => r.id === 'open-fund') || RECIPIENTS[0];

export default function GiveScreen() {
  const {theme} = useTheme();
  const connection = useConnection();
  const {connected, publicKey, connect, connecting, signAndSendTransaction} =
    useWallet();

  const [amountInput, setAmountInput] = useState('');
  const [cadence, setCadence] = useState<DonationCadence>('one_time');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<DonationResult | null>(null);

  const amount = useMemo(() => {
    const parsed = Number(amountInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

  const canContinue = amount > 0;

  const runDonation = async () => {
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
      DEFAULT_RECIPIENT.wallet,
      DEFAULT_RECIPIENT.id,
      amount,
      signAndSendTransaction,
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
    setStep('form');
    setError('');
    setReceipt(null);
  };

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
                placeholder="0"
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
                  styles.eyebrow,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                    marginTop: 8,
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
                    setError('Enter a number above zero.');
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
                {amount} SOL
              </Text>
              <Text
                style={[styles.helper, {color: theme.colors.textSecondary}]}>
                {cadence === 'daily' ? 'Daily commitment' : 'One-time donation'}
              </Text>

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
                {receipt.memo.a} SOL · {DEFAULT_RECIPIENT.name}
              </Text>
              <Text
                style={[styles.helper, {color: theme.colors.textSecondary}]}
                numberOfLines={1}>
                TX {receipt.txSignature.slice(0, 16)}...
              </Text>
              {receipt.conversationId && (
                <Text
                  style={[
                    styles.helper,
                    {color: theme.colors.accent, marginTop: 4},
                  ]}>
                  Message thread created
                </Text>
              )}
              <PrimaryButton
                label="Give Again"
                onPress={reset}
                style={{marginTop: 16}}
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
    marginBottom: 10,
  },
  helper: {
    fontSize: 16,
    lineHeight: 22,
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
