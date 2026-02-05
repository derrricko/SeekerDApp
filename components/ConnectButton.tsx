import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, {useState, useCallback} from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';

import {useAuthorization} from './providers/AuthorizationProvider';
import {alertAndLog} from '../util/alertAndLog';
import {Colors} from './Colors';

type Props = Readonly<{
  title: string;
  style?: ViewStyle;
}>;

export default function ConnectButton({title, style}: Props) {
  const {authorizeSession} = useAuthorization();
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleConnectPress = useCallback(async () => {
    try {
      if (authorizationInProgress) {
        return;
      }
      setAuthorizationInProgress(true);
      await transact(async wallet => {
        await authorizeSession(wallet);
      });
    } catch (err: any) {
      alertAndLog(
        'Error during connect',
        err instanceof Error ? err.message : err,
      );
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [authorizationInProgress, authorizeSession]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPressed && styles.buttonPressed,
        authorizationInProgress && styles.buttonDisabled,
        style,
      ]}
      disabled={authorizationInProgress}
      onPress={handleConnectPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}>
      <Text style={styles.buttonText}>
        {authorizationInProgress ? 'CONNECTING...' : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
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
