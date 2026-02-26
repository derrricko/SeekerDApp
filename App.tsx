// v2 App root — minimal provider stack
//
//   ConnectionProvider (Solana RPC)
//     → WalletProvider (MWA)
//       → AppNavigator (tabs)

import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ConnectionProvider} from './components/providers/ConnectionProvider';
import {WalletProvider} from './components/providers/WalletProvider';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ConnectionProvider>
        <WalletProvider>
          <AppNavigator />
        </WalletProvider>
      </ConnectionProvider>
    </SafeAreaProvider>
  );
}
