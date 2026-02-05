import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Section} from '../components/Section';
import ConnectButton from '../components/ConnectButton';
import AccountInfo from '../components/AccountInfo';
import {
  useAuthorization,
  Account,
} from '../components/providers/AuthorizationProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import SignMessageButton from '../components/SignMessageButton';
import SignTransactionButton from '../components/SignTransactionButton';

export default function MainScreen() {
  const {connection} = useConnection();
  const {selectedAccount} = useAuthorization();
  const [balance, setBalance] = useState<number | null>(null);

  const fetchAndUpdateBalance = useCallback(
    async (account: Account) => {
      console.log('Fetching balance for: ' + account.publicKey);
      const fetchedBalance = await connection.getBalance(account.publicKey);
      console.log('Balance fetched: ' + fetchedBalance);
      setBalance(fetchedBalance);
    },
    [connection],
  );

  useEffect(() => {
    if (!selectedAccount) {
      return;
    }
    fetchAndUpdateBalance(selectedAccount);
  }, [fetchAndUpdateBalance, selectedAccount]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SOLANA WALLET</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {selectedAccount ? (
          <>
            <AccountInfo
              selectedAccount={selectedAccount}
              balance={balance}
              fetchAndUpdateBalance={fetchAndUpdateBalance}
            />

            <Section title="Sign a transaction">
              <SignTransactionButton />
            </Section>

            <Section title="Sign a message">
              <SignMessageButton />
            </Section>
          </>
        ) : (
          <View style={styles.connectContainer}>
            <Text style={styles.connectTitle}>CONNECT YOUR WALLET</Text>
            <Text style={styles.connectDescription}>
              Connect your Solana wallet to sign transactions and messages.
            </Text>
            <ConnectButton title="Connect Wallet" />
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.clusterText}>
          CLUSTER: {connection.rpcEndpoint.includes('devnet') ? 'DEVNET' : 'MAINNET'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFEF0',
  },
  header: {
    backgroundColor: '#FFFEF0',
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  connectContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 24,
    marginTop: 40,
    shadowColor: '#000000',
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  connectTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  connectDescription: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  clusterText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 11,
    color: '#4ECDC4',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
