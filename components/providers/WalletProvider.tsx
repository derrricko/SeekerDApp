// v2 WalletProvider — MWA wallet connection + wallet-signed Supabase auth
//
// INTERFACE:
//   useWallet() → { connected, publicKey, connect, disconnect,
//                   signAndSendTransaction, authorizeAndSignAndSendTransaction }

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PublicKey, Transaction} from '@solana/web3.js';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {APP_IDENTITY, SOLANA_CLUSTER} from '../../config/env';
import {
  createWalletAuthMessage,
  authenticateWalletSignature,
} from '../../services/auth';
import {retryPendingConversations} from '../../services/donations';
import {
  hydrateSupabaseAccessToken,
  setSupabaseAccessToken,
} from '../../services/supabase';
import {decodeBase64, encodeBase64} from '../../utils/base64';
import {utf8Encode} from '../../utils/utf8';

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  connect: () => Promise<PublicKey>;
  disconnect: () => void;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  authorizeAndSignAndSendTransaction: (
    buildTransaction: (donorPubkey: PublicKey) => Promise<Transaction>,
  ) => Promise<{publicKey: PublicKey; signature: string}>;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  connecting: false,
  connect: async () => {
    throw new Error('WalletProvider is not mounted');
  },
  disconnect: () => {},
  signAndSendTransaction: async () => '',
  authorizeAndSignAndSendTransaction: async () => {
    throw new Error('WalletProvider is not mounted');
  },
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({children}: {children: React.ReactNode}) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connected = publicKey !== null;

  // Restore auth token (if present) so Supabase client headers are hydrated early.
  React.useEffect(() => {
    hydrateSupabaseAccessToken().catch(() => {});
  }, []);

  const connect = useCallback(async (): Promise<PublicKey> => {
    let connectedPubkey: PublicKey | null = null;
    setConnecting(true);
    try {
      await transact(async wallet => {
        const auth = await wallet.authorize({
          chain: `solana:${SOLANA_CLUSTER}`,
          identity: APP_IDENTITY,
        });

        if (!auth.accounts?.length || !auth.accounts[0]?.address) {
          throw new Error('Wallet authorize returned no accounts');
        }

        const base64Address = auth.accounts[0].address;
        const pubkey = parseAuthorizedAccountAddress(base64Address);
        connectedPubkey = pubkey;
        const walletAddress = pubkey.toBase58();

        // Wallet signs a short-lived auth challenge. Server verifies signature and
        // returns a JWT used for Supabase RLS access scoped to this wallet.
        const message = createWalletAuthMessage();
        const payload = utf8Encode(message);
        const signedPayloads = await wallet.signMessages({
          addresses: [base64Address],
          payloads: [payload],
        });

        if (!signedPayloads[0]) {
          throw new Error('Wallet did not return a signed auth payload');
        }

        const signature = encodeBase64(signedPayloads[0]);
        const authResult = await authenticateWalletSignature({
          wallet: walletAddress,
          signature,
          message,
        });

        await setSupabaseAccessToken(authResult.token);
        setPublicKey(pubkey);
        await AsyncStorage.setItem('@glimpse_wallet_address', walletAddress);

        // Best-effort replay for orphaned DB writes where on-chain tx succeeded.
        retryPendingConversations().catch(() => {});
      });

      if (!connectedPubkey) {
        throw new Error('Wallet authorize returned no usable account');
      }

      return connectedPubkey;
    } catch (error) {
      setPublicKey(null);
      await AsyncStorage.removeItem('@glimpse_wallet_address');
      await setSupabaseAccessToken(null);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    AsyncStorage.removeItem('@glimpse_wallet_address').catch(() => {});
    setSupabaseAccessToken(null).catch(() => {});
  }, []);

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction): Promise<string> => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      let signature = '';
      await transact(async wallet => {
        // Re-authorize in each transact session
        const reauth = await wallet.authorize({
          chain: `solana:${SOLANA_CLUSTER}`,
          identity: APP_IDENTITY,
        });

        // Verify the re-authorized wallet matches the connected wallet
        if (!reauth.accounts?.length || !reauth.accounts[0]?.address) {
          throw new Error('Wallet re-authorization returned no accounts');
        }
        const reauthPubkey = parseAuthorizedAccountAddress(
          reauth.accounts[0].address,
        );
        if (!reauthPubkey.equals(publicKey)) {
          throw new Error(
            'Wallet mismatch: re-authorized wallet differs from connected wallet. Please reconnect.',
          );
        }

        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });

        const sig = signatures[0];
        if (!sig) {
          throw new Error('Wallet returned an empty signature');
        }
        signature = sig;
      });

      return signature;
    },
    [publicKey],
  );

  const authorizeAndSignAndSendTransaction = useCallback(
    async (
      buildTransaction: (donorPubkey: PublicKey) => Promise<Transaction>,
    ): Promise<{publicKey: PublicKey; signature: string}> => {
      setConnecting(true);

      let donorPubkey: PublicKey | null = null;
      let signature = '';

      try {
        await transact(async wallet => {
          const auth = await wallet.authorize({
            chain: `solana:${SOLANA_CLUSTER}`,
            identity: APP_IDENTITY,
          });

          if (!auth.accounts?.length || !auth.accounts[0]?.address) {
            throw new Error('Wallet authorize returned no accounts');
          }

          const base64Address = auth.accounts[0].address;
          donorPubkey = parseAuthorizedAccountAddress(base64Address);
          const walletAddress = donorPubkey.toBase58();

          const message = createWalletAuthMessage();
          const payload = utf8Encode(message);
          const signedPayloads = await wallet.signMessages({
            addresses: [base64Address],
            payloads: [payload],
          });

          if (!signedPayloads[0]) {
            throw new Error('Wallet did not return a signed auth payload');
          }

          const authSignature = encodeBase64(signedPayloads[0]);
          const authResult = await authenticateWalletSignature({
            wallet: walletAddress,
            signature: authSignature,
            message,
          });

          await setSupabaseAccessToken(authResult.token);
          setPublicKey(donorPubkey);
          await AsyncStorage.setItem('@glimpse_wallet_address', walletAddress);

          const transaction = await buildTransaction(donorPubkey);
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transaction],
          });
          const txSignature = signatures[0];
          if (!txSignature) {
            throw new Error('Wallet returned an empty signature');
          }
          signature = txSignature;
        });

        if (!donorPubkey || !signature) {
          throw new Error('Wallet session did not return required values');
        }

        retryPendingConversations().catch(() => {});

        return {publicKey: donorPubkey, signature};
      } finally {
        setConnecting(false);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      connected,
      publicKey,
      connecting,
      connect,
      disconnect,
      signAndSendTransaction,
      authorizeAndSignAndSendTransaction,
    }),
    [
      connected,
      publicKey,
      connecting,
      connect,
      disconnect,
      signAndSendTransaction,
      authorizeAndSignAndSendTransaction,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

function parseAuthorizedAccountAddress(address: string): PublicKey {
  try {
    const accountBytes = decodeBase64(address);
    if (accountBytes.length === 32) {
      return new PublicKey(accountBytes);
    }
  } catch {
    // Fall through to base58 parse.
  }

  // Compatibility fallback for wallets that return base58 addresses.
  return new PublicKey(address);
}
