import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';

import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';

type Screen = 'welcome' | 'home';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

  const handleWelcomeContinue = () => {
    setCurrentScreen('home');
  };

  const handleTierPress = (tierId: string) => {
    // TODO: Navigate to payment/donation flow
    console.log('Selected tier:', tierId);
  };

  return (
    <SafeAreaProvider>
      <ConnectionProvider
        config={{commitment: 'processed'}}
        endpoint={clusterApiUrl(RPC_ENDPOINT)}>
        <AuthorizationProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent
          />
          <View style={styles.container}>
            {currentScreen === 'welcome' ? (
              <WelcomeScreen onContinue={handleWelcomeContinue} />
            ) : (
              <HomeScreen onTierPress={handleTierPress} />
            )}
          </View>
        </AuthorizationProvider>
      </ConnectionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
});
