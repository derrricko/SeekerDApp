import React from 'react';
import {LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {StyleSheet, View, Text, Platform} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import RequestAirdropButton from './RequestAirdropButton';
import DisconnectButton from './DisconnectButton';
import {useTheme} from './theme';

interface Account {
  address: string;
  label?: string | undefined;
  publicKey: PublicKey;
}

type AccountInfoProps = Readonly<{
  selectedAccount: Account;
  balance: number | null;
  fetchAndUpdateBalance: (account: Account) => void;
}>;

function convertLamportsToSOL(lamports: number) {
  return new Intl.NumberFormat(undefined, {maximumFractionDigits: 1}).format(
    (lamports || 0) / LAMPORTS_PER_SOL,
  );
}

export default function AccountInfo({
  balance,
  selectedAccount,
  fetchAndUpdateBalance,
}: AccountInfoProps) {
  const {colors, isDark} = useTheme();

  const cardStyle = {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  };

  const content = (
    <View style={{backgroundColor: colors.glass, padding: 20}}>
      <Text style={[styles.walletHeader, {color: colors.textPrimary}]}>Wallet Info</Text>

      <View style={[styles.balanceContainer, {backgroundColor: colors.primaryLight}]}>
        <Text style={[styles.balanceLabel, {color: colors.textSecondary}]}>Balance</Text>
        <Text style={[styles.walletBalance, {color: colors.primary}]}>
          {balance ? convertLamportsToSOL(balance) : '0'} SOL
        </Text>
      </View>

      <View style={[styles.labelContainer, {backgroundColor: colors.secondaryLight}]}>
        <Text style={[styles.labelText, {color: colors.secondary}]}>
          {selectedAccount.label || 'Unknown Wallet'}
        </Text>
      </View>

      <Text style={[styles.walletAddress, {color: colors.textTertiary}]}>
        {selectedAccount.address}
      </Text>

      <View style={styles.buttonGroup}>
        <DisconnectButton title="Disconnect" />
        <RequestAirdropButton
          selectedAccount={selectedAccount}
          onAirdropComplete={async (account: Account) =>
            await fetchAndUpdateBalance(account)
          }
        />
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <View style={cardStyle}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isDark ? 'dark' : 'light'}
            blurAmount={20}
            reducedTransparencyFallbackColor={colors.card}
          />
          {content}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[cardStyle, {backgroundColor: colors.card}]}>
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  walletHeader: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  balanceContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '600',
  },
  labelContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  walletAddress: {
    fontSize: 12,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
});
