// Polyfills required before any Solana import
require('./globals');

// Suppress noisy async warnings from animation timers after teardown
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('after the Jest environment has been torn down') ||
      args[0].includes('after it has been torn down') ||
      args[0].includes('not wrapped in act'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock native modules
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

jest.mock('@react-native-community/blur', () => {
  const React = require('react');
  return {
    BlurView: props => React.createElement('View', props, props.children),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({children}) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaView: ({children}) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  };
});

// Mock Solana web3.js to avoid ESM/mjs issues
jest.mock('@solana/web3.js', () => {
  const mockPubkey = key => ({
    toBase58: () => String(key),
    toString: () => String(key),
    toBuffer: () => Buffer.alloc(32),
    equals: jest.fn(),
  });
  const PublicKey = jest.fn().mockImplementation(mockPubkey);
  PublicKey.findProgramAddressSync = jest.fn(() => [mockPubkey('mock'), 255]);
  return {
    Connection: jest.fn(),
    PublicKey,
    Transaction: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      sign: jest.fn(),
    })),
    SystemProgram: {transfer: jest.fn()},
    clusterApiUrl: jest.fn(() => 'https://api.devnet.solana.com'),
    LAMPORTS_PER_SOL: 1000000000,
    TransactionInstruction: jest.fn(),
  };
});

jest.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddress: jest.fn(),
  getAssociatedTokenAddressSync: jest.fn(() => ({
    toBase58: () => 'mockATA',
    toString: () => 'mockATA',
  })),
  createTransferInstruction: jest.fn(),
  TOKEN_PROGRAM_ID: {
    toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  },
  ASSOCIATED_TOKEN_PROGRAM_ID: {
    toBase58: () => 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  },
}));

jest.mock('@solana-mobile/mobile-wallet-adapter-protocol-web3js', () => ({
  transact: jest.fn(),
}));

jest.mock('@solana-mobile/mobile-wallet-adapter-protocol', () => ({}));

jest.mock('@coral-xyz/borsh', () => {
  const fieldFn = () => ({encode: jest.fn(), decode: jest.fn()});
  return {
    struct: jest.fn(() => ({
      encode: jest.fn(() => Buffer.alloc(0)),
      decode: jest.fn(),
    })),
    u8: fieldFn,
    u16: fieldFn,
    u32: fieldFn,
    u64: fieldFn,
    u128: fieldFn,
    i64: fieldFn,
    bool: fieldFn,
    str: fieldFn,
    publicKey: fieldFn,
    vec: jest.fn(fieldFn),
    option: jest.fn(fieldFn),
  };
});

// Mock Supabase to avoid network calls
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({data: [], error: null})),
        })),
      })),
    })),
    auth: {getSession: jest.fn(() => Promise.resolve({data: null}))},
  })),
}));

// Mock the needs service to avoid Supabase network calls
jest.mock('./services/needs', () => ({
  fetchActiveNeeds: jest.fn(() => {
    const {NEEDS} = require('./data/content');
    return Promise.resolve(NEEDS);
  }),
}));
