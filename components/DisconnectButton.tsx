import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';

import {useAuthorization} from './providers/AuthorizationProvider';

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
    backgroundColor: '#FF6B6B',
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
  buttonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
