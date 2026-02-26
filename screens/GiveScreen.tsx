// v2 Give Screen — single scrollable donation flow
//
// LAYOUT:
//   ┌─────────────────────────┐
//   │  Wallet status / connect│
//   │  Recipient grid (2-col) │
//   │  Amount input + presets │
//   │  Send button            │
//   │  Success / error state  │
//   └─────────────────────────┘

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useWallet} from '../components/providers/WalletProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import {executeDonation, DonationResult} from '../services/donations';
import {RECIPIENTS, Recipient} from '../data/recipients';
import {getExplorerUrl} from '../utils/explorer';
import {AppError} from '../utils/errors';

type FlowState = 'idle' | 'confirming' | 'sending' | 'success' | 'error';

const PRESETS = [0.1, 0.5, 1.0, 5.0];
const MIN_SOL = 0.001;
const MAX_SOL = 100;

export default function GiveScreen() {
  const {connected, publicKey, connecting, connect, signAndSendTransaction} =
    useWallet();
  const connection = useConnection();

  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null,
  );
  const [amount, setAmount] = useState('');
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [result, setResult] = useState<DonationResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const validAmount = amountNum >= MIN_SOL && amountNum <= MAX_SOL;
  const canSend = connected && selectedRecipient && validAmount;

  const handleConfirm = useCallback(() => {
    if (!canSend || !selectedRecipient) return;
    setFlowState('confirming');
  }, [canSend, selectedRecipient]);

  const handleSend = useCallback(async () => {
    if (!canSend || !publicKey || !selectedRecipient) return;

    setFlowState('sending');
    setError(null);

    const donationResult = await executeDonation(
      connection,
      publicKey,
      selectedRecipient.wallet,
      selectedRecipient.id,
      amountNum,
      signAndSendTransaction,
    );

    if (donationResult.success) {
      setResult(donationResult.data);
      setFlowState('success');
    } else {
      setError(donationResult.error);
      setFlowState('error');
    }
  }, [
    canSend,
    publicKey,
    selectedRecipient,
    amountNum,
    connection,
    signAndSendTransaction,
  ]);

  const handleReset = () => {
    setFlowState('idle');
    setSelectedRecipient(null);
    setAmount('');
    setResult(null);
    setError(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {/* Header */}
      <Text style={styles.title}>Give</Text>
      <Text style={styles.subtitle}>
        Send SOL directly. Every donation creates a verifiable on-chain receipt.
      </Text>

      {/* Wallet */}
      <View style={styles.section}>
        {connected && publicKey ? (
          <View style={styles.walletConnected}>
            <View style={styles.walletDot} />
            <Text style={styles.walletText}>
              {publicKey.toBase58().slice(0, 4)}...
              {publicKey.toBase58().slice(-4)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={connect}
            disabled={connecting}>
            {connecting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Recipients */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pick a recipient</Text>
        <View style={styles.recipientGrid}>
          {RECIPIENTS.map(r => {
            const isSelected = selectedRecipient?.id === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.recipientCard,
                  isSelected && styles.recipientCardSelected,
                ]}
                onPress={() => setSelectedRecipient(r)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.recipientName,
                    isSelected && styles.recipientNameSelected,
                  ]}>
                  {r.name}
                </Text>
                <Text style={styles.recipientCategory}>{r.category}</Text>
                <Text style={styles.recipientDesc} numberOfLines={2}>
                  {r.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Amount (SOL)</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor="#888"
        />
        <View style={styles.presets}>
          {PRESETS.map(preset => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetChip,
                amountNum === preset && styles.presetChipActive,
              ]}
              onPress={() => setAmount(String(preset))}>
              <Text
                style={[
                  styles.presetText,
                  amountNum === preset && styles.presetTextActive,
                ]}>
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount validation hint */}
      {amount !== '' && !validAmount && amountNum > 0 && (
        <Text style={styles.validationHint}>
          {amountNum < MIN_SOL
            ? `Minimum donation is ${MIN_SOL} SOL`
            : `Maximum donation is ${MAX_SOL} SOL`}
        </Text>
      )}

      {/* Send Button */}
      {flowState === 'idle' && (
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleConfirm}
          disabled={!canSend}
          activeOpacity={0.8}>
          <Text style={styles.sendButtonText}>
            {selectedRecipient
              ? `Send ${amountNum || '...'} SOL to ${selectedRecipient.name}`
              : 'Select a recipient'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Confirmation step */}
      {flowState === 'confirming' && selectedRecipient && (
        <View style={[styles.stateCard, styles.confirmCard]}>
          <Text style={styles.stateTitle}>Confirm donation</Text>
          <Text style={styles.confirmAmount}>{amountNum} SOL</Text>
          <Text style={styles.stateText}>
            to {selectedRecipient.name}
          </Text>
          <Text style={styles.confirmWallet}>
            {selectedRecipient.wallet.slice(0, 8)}...{selectedRecipient.wallet.slice(-4)}
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setFlowState('idle')}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmSendButton}
              onPress={handleSend}
              activeOpacity={0.8}>
              <Text style={styles.confirmSendButtonText}>Confirm & Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sending state */}
      {flowState === 'sending' && (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.stateText}>
            Sending {amountNum} SOL to {selectedRecipient?.name}...
          </Text>
        </View>
      )}

      {/* Success state */}
      {flowState === 'success' && result && (
        <View style={[styles.stateCard, styles.successCard]}>
          <Text style={styles.successEmoji}>✓</Text>
          <Text style={styles.stateTitle}>Donation sent</Text>
          <Text style={styles.stateText}>
            {amountNum} SOL to {selectedRecipient?.name}
          </Text>
          <Text style={styles.txLink}>
            {getExplorerUrl(result.txSignature)}
          </Text>
          {result.conversationId ? (
            <Text style={styles.chatHint}>
              A message thread has been created. Check the Messages tab.
            </Text>
          ) : (
            <Text style={styles.chatHint}>
              Chat room will be created when you reopen the app.
            </Text>
          )}
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Give again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error state */}
      {flowState === 'error' && error && (
        <View style={[styles.stateCard, styles.errorCard]}>
          <Text style={styles.stateTitle}>Something went wrong</Text>
          <Text style={styles.stateText}>{error.message}</Text>
          {error.recoverable && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setFlowState('idle')}>
              <Text style={styles.resetButtonText}>Try again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Wallet
  walletConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 10,
  },
  walletText: {
    fontSize: 15,
    color: '#FAFAFA',
    fontFamily: 'monospace',
  },
  connectButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Recipients
  recipientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipientCard: {
    width: '47%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  recipientCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#1A1A2E',
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 4,
  },
  recipientNameSelected: {
    color: '#818CF8',
  },
  recipientCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },

  // Amount
  amountInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 12,
  },
  presets: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  presetChipActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#1A1A2E',
  },
  presetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  presetTextActive: {
    color: '#818CF8',
  },

  // Validation
  validationHint: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },

  // Send button
  sendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // State cards
  stateCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginTop: 8,
  },
  confirmCard: {
    borderColor: '#4F46E540',
  },
  confirmAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#818CF8',
    marginVertical: 8,
  },
  confirmWallet: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#AAA',
  },
  confirmSendButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmSendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  successCard: {
    borderColor: '#22C55E40',
  },
  errorCard: {
    borderColor: '#EF444440',
  },
  successEmoji: {
    fontSize: 32,
    color: '#22C55E',
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 8,
  },
  stateText: {
    fontSize: 15,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  txLink: {
    fontSize: 12,
    color: '#818CF8',
    marginTop: 12,
    textAlign: 'center',
  },
  chatHint: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 16,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FAFAFA',
  },
});
