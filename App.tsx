import {ConnectionProvider} from './components/providers/ConnectionProvider';
import {WalletProvider} from './components/providers/WalletProvider';
import {AuthProvider} from './components/providers/AuthProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from './components/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SOLANA_CLUSTER} from './config/env';

import HomeScreen from './screens/HomeScreen';
import SplashOverlay from './components/SplashOverlay';
import OnboardingJourney from './screens/OnboardingJourney';

const JOURNEY_SEEN_KEY = '@glimpse_onboarding_journey_seen';

function AppContent() {
  const {isDark, colors} = useTheme();
  const [showJourney, setShowJourney] = useState(false);
  const isFirstLaunchRef = useRef(false);

  // Check AsyncStorage on mount — resolves well before splash finishes (~4s)
  useEffect(() => {
    AsyncStorage.getItem(JOURNEY_SEEN_KEY).then(value => {
      isFirstLaunchRef.current = value !== 'true';
    });
  }, []);

  const handleSplashDone = () => {
    if (isFirstLaunchRef.current) {
      setTimeout(() => setShowJourney(true), 100);
    }
  };

  const handleJourneyComplete = () => {
    AsyncStorage.setItem(JOURNEY_SEEN_KEY, 'true');
    setShowJourney(false);
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
        {showJourney && (
          <OnboardingJourney onComplete={handleJourneyComplete} />
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
