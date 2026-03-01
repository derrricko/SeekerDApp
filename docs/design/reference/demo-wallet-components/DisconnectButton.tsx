import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, {useRef} from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle, Animated} from 'react-native';

import {useAuthorization} from './providers/AuthorizationProvider';
import {useTheme} from './theme';

type Props = Readonly<{
  title: string;
  style?: ViewStyle;
}>;

export default function DisconnectButton({title, style}: Props) {
  const {colors} = useTheme();
  const {deauthorizeSession} = useAuthorization();
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

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.secondary,
            shadowColor: colors.secondary,
          },
          style,
        ]}
        onPress={() => {
          transact(async wallet => {
            await deauthorizeSession(wallet);
          });
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <Text style={[styles.buttonText, {color: colors.textOnPrimary}]}>{title}</Text>
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
