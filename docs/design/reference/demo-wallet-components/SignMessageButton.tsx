import React, {useState, useCallback, useRef} from 'react';
import {TouchableOpacity, Text, StyleSheet, Animated} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {alertAndLog} from '../util/alertAndLog';
import {useTheme} from './theme';

export default function SignMessageButton() {
  const {colors} = useTheme();
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
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: signingInProgress ? colors.textTertiary : colors.secondary,
            shadowColor: colors.secondary,
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
            const message = 'Hello world!';
            const messageBuffer = new Uint8Array(
              message.split('').map(c => c.charCodeAt(0)),
            );
            const signedMessage = await signMessage(messageBuffer);
            alertAndLog('Message signed:', '' + fromUint8Array(signedMessage));
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
          {signingInProgress ? 'Signing...' : 'Sign Message'}
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
