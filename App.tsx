import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, {useEffect, useState} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';
import {ThemeProvider, useTheme} from './components/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './screens/HomeScreen';
import SplashOverlay from './components/SplashOverlay';
import OnboardingModal from './components/OnboardingModal';

function AppContent() {
  const {isDark, colors} = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasLaunched')
      .then(value => {
        setIsFirstLaunch(value === null);
        if (value === null) {
          AsyncStorage.setItem('hasLaunched', 'true');
        }
      })
      .catch(() => setIsFirstLaunch(false));
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
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
        <HomeScreen />
        {showSplash && <SplashOverlay onComplete={handleSplashComplete} />}
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
          endpoint={clusterApiUrl(RPC_ENDPOINT)}>
          <AuthorizationProvider>
            <AppContent />
          </AuthorizationProvider>
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
