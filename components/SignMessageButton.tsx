import React, {useState, useCallback} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {alertAndLog} from '../util/alertAndLog';
import {Colors} from './Colors';

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
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: Colors.border,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: Colors.border,
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonPressed: {
    shadowOffset: {width: 0, height: 0},
    transform: [{translateX: 6}, {translateY: 6}],
  },
  buttonDisabled: {
    backgroundColor: Colors.headerBg,
  },
  buttonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textDark,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
