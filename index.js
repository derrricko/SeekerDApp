// 1. Global polyfills first (MUST be before any Solana imports)
import './globals';

// 2. Crypto polyfill (MUST be before any Solana imports)
import 'react-native-get-random-values';

// 3. Native screen optimization (must be early, before navigation renders)
import 'react-native-screens';

// 4. App imports
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

const root = global;

// Event polyfill for wallet-standard-mobile
if (typeof root.Event === 'undefined') {
  root.Event = class Event {
    constructor(type, options) {
      this.type = type;
      this.bubbles = options?.bubbles ?? false;
      this.cancelable = options?.cancelable ?? false;
    }
  };
}

if (typeof root.addEventListener !== 'function') {
  root.addEventListener = () => {};
}

if (typeof root.removeEventListener !== 'function') {
  root.removeEventListener = () => {};
}

AppRegistry.registerComponent(appName, () => App);
