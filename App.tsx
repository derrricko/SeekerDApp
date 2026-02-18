import {ConnectionProvider} from './components/providers/ConnectionProvider';
import {WalletProvider} from './components/providers/WalletProvider';
import {AuthProvider} from './components/providers/AuthProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, {useState} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from './components/theme';
import {SOLANA_CLUSTER} from './config/env';
import ErrorBoundary from './components/ErrorBoundary';

import AppNavigator from './navigation/AppNavigator';
import SplashOverlay from './components/SplashOverlay';

// Hoisted to module level to avoid re-render allocation
const CONNECTION_CONFIG = {commitment: 'processed' as const};

function AppContent() {
  const {isDark, colors} = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashDone = () => {
    setSplashDone(true);
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppNavigator />
        {!splashDone && <SplashOverlay onAnimationDone={handleSplashDone} />}
      </View>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ConnectionProvider
            config={CONNECTION_CONFIG}
            endpoint={clusterApiUrl(SOLANA_CLUSTER)}>
            <WalletProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </WalletProvider>
          </ConnectionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
