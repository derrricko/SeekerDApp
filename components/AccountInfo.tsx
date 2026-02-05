import React from 'react';
import {LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {StyleSheet, View, Text} from 'react-native';
import RequestAirdropButton from './RequestAirdropButton';
import DisconnectButton from './DisconnectButton';

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
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  walletHeader: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: '#000000',
    letterSpacing: 3,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  balanceContainer: {
    backgroundColor: '#FFDE59',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 11,
    color: '#000000',
    letterSpacing: 2,
    marginBottom: 4,
  },
  walletBalance: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 32,
    color: '#000000',
  },
  labelContainer: {
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  labelText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 12,
    color: '#000000',
    textTransform: 'uppercase',
  },
  walletAddress: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 11,
    color: '#4A4A4A',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
});
