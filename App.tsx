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
import {UnreadProvider} from './components/providers/UnreadProvider';
import AppNavigator from './navigation/AppNavigator';
import {ThemeProvider} from './theme/Theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
        <ConnectionProvider>
          <WalletProvider>
            <UnreadProvider>
              <AppNavigator />
            </UnreadProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
