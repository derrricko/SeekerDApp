import {ConnectionProvider} from './components/providers/ConnectionProvider';
import {WalletProvider} from './components/providers/WalletProvider';
import {AuthProvider} from './components/providers/AuthProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, {useEffect, useState} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from './components/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SOLANA_CLUSTER} from './config/env';

import HomeScreen from './screens/HomeScreen';
import SplashOverlay from './components/SplashOverlay';
import OnboardingModal from './components/OnboardingModal';

function AppContent() {
  const {isDark, colors} = useTheme();
  const [splashDone, setSplashDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstLaunch] = useState(true);

  const handleSplashDone = () => {
    setSplashDone(true);
    if (isFirstLaunch) {
      setTimeout(() => setShowOnboarding(true), 100);
    }
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <HomeScreen hideHeaderBrand />
        <SplashOverlay onAnimationDone={handleSplashDone} />
        {showOnboarding && (
          <OnboardingModal onComplete={() => setShowOnboarding(false)} />
        )}
      </View>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ConnectionProvider
          config={{commitment: 'processed'}}
          endpoint={clusterApiUrl(SOLANA_CLUSTER)}>
          <WalletProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
