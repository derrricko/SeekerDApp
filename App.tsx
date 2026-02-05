import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, {useState} from 'react';
import {StyleSheet, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';
import {ThemeProvider, useTheme} from './components/theme';

import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';

type Screen = 'welcome' | 'home';

function AppContent() {
  const {isDark, colors} = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

  const handleWelcomeContinue = () => setCurrentScreen('home');

  const handleTierPress = (_tierId: string) => {
    // TODO: Integrate wallet transaction for tier donation
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        {currentScreen === 'welcome' ? (
          <WelcomeScreen onContinue={handleWelcomeContinue} />
        ) : (
          <HomeScreen onTierPress={handleTierPress} />
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
