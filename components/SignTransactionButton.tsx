import React, {useState, useCallback, useRef} from 'react';
import {TouchableOpacity, Text, StyleSheet, Animated} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {Keypair, SystemProgram, Transaction} from '@solana/web3.js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {useConnection} from './providers/ConnectionProvider';
import {alertAndLog} from '../util/alertAndLog';
import {useTheme} from './theme';

export default function SignTransactionButton() {
  const {colors} = useTheme();
  const {connection} = useConnection();
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

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
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: signingInProgress ? colors.textTertiary : colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        disabled={signingInProgress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
        <Text style={[styles.buttonText, {color: colors.textOnPrimary}]}>
          {signingInProgress ? 'Signing...' : 'Sign Transaction'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
