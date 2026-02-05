import React from 'react';
import {LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {StyleSheet, View, Text} from 'react-native';
import RequestAirdropButton from './RequestAirdropButton';
import DisconnectButton from './DisconnectButton';
import {Colors} from './Colors';

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
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.walletHeader}>WALLET INFO</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>BALANCE</Text>
          <Text style={styles.walletBalance}>
            {balance ? convertLamportsToSOL(balance) : '0'} SOL
          </Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            {selectedAccount.label || 'Unknown Wallet'}
          </Text>
        </View>
        <Text style={styles.walletAddress}>{selectedAccount.address}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Removed padding - parent provides 20pt
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderWidth: 3,
    borderColor: Colors.border,
    padding: 20,
    shadowColor: Colors.border,
    shadowOffset: {width: 8, height: 8},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  walletHeader: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textDark,
    letterSpacing: 3,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  balanceContainer: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 11,
    color: Colors.textDark,
    letterSpacing: 2,
    marginBottom: 4,
  },
  walletBalance: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 32,
    color: Colors.textDark,
  },
  labelContainer: {
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  labelText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 12,
    color: Colors.textDark,
    textTransform: 'uppercase',
  },
  walletAddress: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
});
