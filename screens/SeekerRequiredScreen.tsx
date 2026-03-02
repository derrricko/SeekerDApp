// Blocked state screen for non-Seeker users.
// Shows "Connect Wallet" CTA if not connected, or "Seeker Required" if
// connected but no SGT detected.

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTheme} from '../theme/Theme';
import {useWallet} from '../components/providers/WalletProvider';
import AppHeader from '../ui/AppHeader';
import ScreenContainer from '../ui/ScreenContainer';

export default function SeekerRequiredScreen({title}: {title: string}) {
  const {theme} = useTheme();
  const {connected, connecting, connect} = useWallet();

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title={title} />
      <ScreenContainer scroll={false} contentStyle={styles.content}>
        {!connected ? (
          <>
            <Text
              style={[
                styles.heading,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              CONNECT WALLET
            </Text>
            <Text
              style={[
                styles.body,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.body,
                },
              ]}>
              Connect a Solana Seeker wallet to access this feature.
            </Text>
            <Pressable
              onPress={() => connect().catch(() => {})}
              disabled={connecting}
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.accent,
                  opacity: connecting ? 0.6 : 1,
                },
              ]}>
              {connecting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    {fontFamily: theme.typography.brand},
                  ]}>
                  CONNECT
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text
              style={[
                styles.heading,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              SEEKER REQUIRED
            </Text>
            <Text
              style={[
                styles.body,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.body,
                },
              ]}>
              This feature is only available to Solana Seeker device owners.
              Your connected wallet does not hold a Seeker Genesis Token.
            </Text>
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
