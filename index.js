// 1. Global polyfills first (MUST be before any Solana imports)
import './globals';

// 2. Crypto polyfill (MUST be before any Solana imports)
import 'react-native-get-random-values';

// 3. App imports
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Event polyfill for wallet-standard-mobile
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    constructor(type, options) {
      this.type = type;
      this.bubbles = options?.bubbles ?? false;
      this.cancelable = options?.cancelable ?? false;
    }
  };
}

window.addEventListener = () => {};
window.removeEventListener = () => {};

AppRegistry.registerComponent(appName, () => App);
