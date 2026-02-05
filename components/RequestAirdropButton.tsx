import {useConnection} from '../components/providers/ConnectionProvider';
import React, {useState, useCallback} from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';
import {Account} from './providers/AuthorizationProvider';
import {alertAndLog} from '../util/alertAndLog';
import {LAMPORTS_PER_SOL} from '@solana/web3.js';
import {Colors} from './Colors';

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
  const {connection} = useConnection();
  const [airdropInProgress, setAirdropInProgress] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const requestAirdrop = useCallback(async () => {
    const signature = await connection.requestAirdrop(
      selectedAccount.publicKey,
      LAMPORTS_PER_AIRDROP,
    );

    return await connection.confirmTransaction(signature);
  }, [connection, selectedAccount]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPressed && styles.buttonPressed,
        airdropInProgress && styles.buttonDisabled,
        style,
      ]}
      disabled={airdropInProgress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
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
      <Text style={styles.buttonText}>
        {airdropInProgress ? 'REQUESTING...' : 'REQUEST AIRDROP'}
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
