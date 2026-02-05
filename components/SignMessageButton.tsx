import React, {useState, useCallback} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {alertAndLog} from '../util/alertAndLog';

export default function SignMessageButton() {
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const signMessage = useCallback(
    async (messageBuffer: Uint8Array) => {
      return await transact(async (wallet: Web3MobileWallet) => {
        const authorizationResult = await authorizeSession(wallet);
        const signedMessages = await wallet.signMessages({
          addresses: [authorizationResult.address],
          payloads: [messageBuffer],
        });
        return signedMessages[0];
      });
    },
    [authorizeSession],
  );

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
          const message = 'Hello world!';
          const messageBuffer = new Uint8Array(
            message.split('').map(c => c.charCodeAt(0)),
          );
          const signedMessage = await signMessage(messageBuffer);
          alertAndLog('Messaged signed:', '' + fromUint8Array(signedMessage));
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
        {signingInProgress ? 'SIGNING...' : 'SIGN MESSAGE'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#A855F7',
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
