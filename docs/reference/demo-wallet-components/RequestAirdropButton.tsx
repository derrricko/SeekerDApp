import {useConnection} from '../components/providers/ConnectionProvider';
import React, {useState, useCallback, useRef} from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle, Animated} from 'react-native';
import {Account} from './providers/AuthorizationProvider';
import {alertAndLog} from '../util/alertAndLog';
import {LAMPORTS_PER_SOL} from '@solana/web3.js';
import {useTheme} from './theme';

type Props = Readonly<{
  selectedAccount: Account;
  onAirdropComplete: (account: Account) => void;
  style?: ViewStyle;
}>;

function convertLamportsToSOL(lamports: number) {
  return new Intl.NumberFormat(undefined, {maximumFractionDigits: 1}).format(
    (lamports || 0) / LAMPORTS_PER_SOL,
  );
}

const LAMPORTS_PER_AIRDROP = 1000000000;

export default function RequestAirdropButton({
  selectedAccount,
  onAirdropComplete,
  style,
}: Props) {
  const {colors} = useTheme();
  const {connection} = useConnection();
  const [airdropInProgress, setAirdropInProgress] = useState(false);
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

  const requestAirdrop = useCallback(async () => {
    const signature = await connection.requestAirdrop(
      selectedAccount.publicKey,
      LAMPORTS_PER_AIRDROP,
    );

    return await connection.confirmTransaction(signature);
  }, [connection, selectedAccount]);

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: airdropInProgress ? colors.textTertiary : colors.secondary,
            shadowColor: colors.secondary,
          },
          style,
        ]}
        disabled={airdropInProgress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        onPress={async () => {
          if (airdropInProgress) {
            return;
          }
          setAirdropInProgress(true);
          try {
            await requestAirdrop();
            alertAndLog(
              'Funding successful:',
              String(convertLamportsToSOL(LAMPORTS_PER_AIRDROP)) +
                ' SOL added to ' +
                selectedAccount.publicKey,
            );
            onAirdropComplete(selectedAccount);
          } catch (err: any) {
            alertAndLog(
              'Failed to fund account:',
              err instanceof Error ? err.message : err,
            );
          } finally {
            setAirdropInProgress(false);
          }
        }}>
        <Text style={[styles.buttonText, {color: colors.textOnPrimary}]}>
          {airdropInProgress ? 'Requesting...' : 'Request Airdrop'}
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
