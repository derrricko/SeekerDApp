/**
 * @format
 */
import {Buffer} from 'buffer';
import 'react-native-get-random-values';

// Polyfill TextEncoder/TextDecoder for Hermes (required by @solana/web3.js)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      const buf = Buffer.from(str, 'utf-8');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
  };
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(buf) {
      return Buffer.from(buf).toString('utf-8');
    }
  };
}

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Mock event listener functions to prevent them from fataling.
window.addEventListener = () => {};
window.removeEventListener = () => {};
window.Buffer = Buffer;

AppRegistry.registerComponent(appName, () => App);
