import React, {useState, useCallback} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {Keypair, SystemProgram, Transaction} from '@solana/web3.js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {useConnection} from './providers/ConnectionProvider';
import {alertAndLog} from '../util/alertAndLog';

export default function SignTransactionButton() {
  const {connection} = useConnection();
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const signTransaction = useCallback(async () => {
    return await transact(async (wallet: Web3MobileWallet) => {
      const [authorizationResult, latestBlockhash] = await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);

      const keypair = Keypair.generate();
      const randomTransferTransaction = new Transaction({
        ...latestBlockhash,
        feePayer: authorizationResult.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: authorizationResult.publicKey,
          toPubkey: keypair.publicKey,
          lamports: 1_000,
        }),
      );

      const signedTransactions = await wallet.signTransactions({
        transactions: [randomTransferTransaction],
      });

      return signedTransactions[0];
    });
  }, [authorizeSession, connection]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPressed && styles.buttonPressed,
        signingInProgress && styles.buttonDisabled,
      ]}
      disabled={signingInProgress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}
      onPress={async () => {
        if (signingInProgress) {
          return;
        }
        setSigningInProgress(true);
        try {
          const signedTransaction = await signTransaction();
          alertAndLog(
            'Transaction signed',
            'View SignTransactionButton.tsx for implementation.',
          );
          console.log(fromUint8Array(signedTransaction.serialize()));
        } catch (err: any) {
          alertAndLog(
            'Error during signing',
            err instanceof Error ? err.message : err,
          );
        } finally {
          setSigningInProgress(false);
        }
      }}>
      <Text style={styles.buttonText}>
        {signingInProgress ? 'SIGNING...' : 'SIGN TRANSACTION'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFDE59',
    borderWidth: 3,
    borderColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonPressed: {
    shadowOffset: {width: 1, height: 1},
    transform: [{translateX: 3}, {translateY: 3}],
  },
  buttonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  buttonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
