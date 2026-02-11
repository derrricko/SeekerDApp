/**
 * WalletProvider — wallet-standard wrapper for Solana Mobile.
 *
 * Wraps LocalSolanaMobileWalletAdapterWallet in a React context with
 * session persistence via createDefaultAuthorizationCache().
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {PublicKey} from '@solana/web3.js';
import {
  LocalSolanaMobileWalletAdapterWallet,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-standard-mobile';
import {APP_IDENTITY, SOLANA_CLUSTER} from '../../config/env';

import type {WalletAccount} from '@wallet-standard/base';
import type {SolanaSignInInput, SolanaSignInOutput} from '@solana/wallet-standard-features';

// ─── Chain identifier ───────────────────────────────────────────────────────

const CHAIN =
  SOLANA_CLUSTER === 'mainnet-beta' ? 'solana:mainnet' : 'solana:devnet';

// ─── Context types ──────────────────────────────────────────────────────────

export interface WalletContextState {
  /** The current wallet account, or null if not connected */
  account: WalletAccount | null;
  /** Convenience: PublicKey derived from account address */
  publicKey: PublicKey | null;
  /** Whether the wallet is connected */
  connected: boolean;
  /** Connect (authorize) the wallet */
  connect: () => Promise<void>;
  /** Disconnect (deauthorize) the wallet */
  disconnect: () => Promise<void>;
  /**
   * Sign In With Solana — returns signed message + signature for SIWS auth.
   * Connects if not already connected.
   */
  signIn: (input?: SolanaSignInInput) => Promise<SolanaSignInOutput | null>;
  /**
   * Sign and send a serialized transaction.
   * Returns the raw signature bytes.
   */
  signAndSendTransaction: (
    transaction: Uint8Array,
  ) => Promise<Uint8Array>;
}

const WalletContext = createContext<WalletContextState>({
  account: null,
  publicKey: null,
  connected: false,
  connect: async () => {
    throw new Error('WalletProvider not initialized');
  },
  disconnect: async () => {
    throw new Error('WalletProvider not initialized');
  },
  signIn: async () => {
    throw new Error('WalletProvider not initialized');
  },
  signAndSendTransaction: async () => {
    throw new Error('WalletProvider not initialized');
  },
});

// ─── Provider ───────────────────────────────────────────────────────────────

export function WalletProvider({children}: {children: ReactNode}) {
  const [accounts, setAccounts] = useState<readonly WalletAccount[]>([]);

  // Create the wallet-standard wallet instance once
  const walletRef = useRef<LocalSolanaMobileWalletAdapterWallet | null>(null);
  if (walletRef.current === null) {
    try {
      walletRef.current = new LocalSolanaMobileWalletAdapterWallet({
        appIdentity: APP_IDENTITY,
        authorizationCache: createDefaultAuthorizationCache(),
        chains: [CHAIN],
        chainSelector: createDefaultChainSelector(),
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      });
    } catch {
      // Wallet adapter may fail on non-Android or misconfigured devices
      console.warn('Failed to initialize wallet adapter');
    }
  }
  const wallet = walletRef.current;

  // Listen for account changes via wallet-standard events
  useEffect(() => {
    if (!wallet) {
      return;
    }

    const eventsFeature = wallet.features['standard:events'];
    if (!eventsFeature) {
      return;
    }

    const unsubscribe = eventsFeature.on('change', ({accounts: newAccounts}) => {
      if (newAccounts) {
        setAccounts(newAccounts);
      }
    });

    // Sync initial state
    setAccounts(wallet.accounts);

    return unsubscribe;
  }, [wallet]);

  const account = accounts.length > 0 ? accounts[0] : null;

  const publicKey = useMemo(() => {
    if (!account) {
      return null;
    }
    try {
      return new PublicKey(account.address);
    } catch {
      return null;
    }
  }, [account]);

  const connected = wallet?.connected ?? false;

  const connect = useCallback(async () => {
    if (!wallet) {
      throw new Error('Wallet adapter not available');
    }
    const connectFeature = wallet.features['standard:connect'];
    const result = await connectFeature.connect();
    setAccounts(result.accounts);
  }, [wallet]);

  const disconnect = useCallback(async () => {
    if (!wallet) {
      return;
    }
    const disconnectFeature = wallet.features['standard:disconnect'];
    await disconnectFeature.disconnect();
    setAccounts([]);
  }, [wallet]);

  const signIn = useCallback(
    async (input?: SolanaSignInInput): Promise<SolanaSignInOutput | null> => {
      if (!wallet) {
        return null;
      }
      const signInFeature = wallet.features['solana:signIn'];
      if (!signInFeature) {
        return null;
      }

      const results = await signInFeature.signIn(input ?? {});
      if (results.length > 0) {
        // signIn also connects the wallet
        setAccounts(wallet.accounts);
        return results[0];
      }
      return null;
    },
    [wallet],
  );

  const signAndSendTransaction = useCallback(
    async (transaction: Uint8Array): Promise<Uint8Array> => {
      if (!account) {
        throw new Error('Wallet not connected');
      }
      if (!wallet) {
        throw new Error('Wallet adapter not available');
      }

      const feature = wallet.features['solana:signAndSendTransaction'];
      if (!feature) {
        throw new Error('signAndSendTransaction not supported by wallet');
      }

      const results = await feature.signAndSendTransaction({
        account,
        transaction,
        chain: CHAIN,
      });

      return results[0].signature;
    },
    [wallet, account],
  );

  const value = useMemo<WalletContextState>(
    () => ({
      account,
      publicKey,
      connected,
      connect,
      disconnect,
      signIn,
      signAndSendTransaction,
    }),
    [account, publicKey, connected, connect, disconnect, signIn, signAndSendTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextState {
  return useContext(WalletContext);
}
