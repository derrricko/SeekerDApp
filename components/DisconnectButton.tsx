import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';

import {useAuthorization} from './providers/AuthorizationProvider';
import {Colors} from './Colors';

type Props = Readonly<{
  title: string;
  style?: ViewStyle;
}>;

export default function DisconnectButton({title, style}: Props) {
  const {deauthorizeSession} = useAuthorization();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.button, isPressed && styles.buttonPressed, style]}
      onPress={() => {
        transact(async wallet => {
          await deauthorizeSession(wallet);
        });
      }}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}>
      <Text style={styles.buttonText}>{title}</Text>
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
  buttonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textDark,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
