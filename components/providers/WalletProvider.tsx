// v2 WalletProvider — MWA wallet connection only
// NO SIWS signIn, NO auth tokens
//
// INTERFACE:
//   useWallet() → { connected, publicKey, connect, disconnect, signAndSendTransaction }

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {PublicKey, Transaction} from '@solana/web3.js';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {APP_IDENTITY, SOLANA_CLUSTER} from '../../config/env';
import {Buffer} from 'buffer';

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSendTransaction: (
    transaction: Transaction,
  ) => Promise<string>;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  signAndSendTransaction: async () => '',
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({children}: {children: React.ReactNode}) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connected = publicKey !== null;

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await transact(async wallet => {
        const auth = await wallet.authorize({
          chain: `solana:${SOLANA_CLUSTER}`,
          identity: APP_IDENTITY,
        });
        const pubkey = new PublicKey(auth.accounts[0].address);
        setPublicKey(pubkey);
      });
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
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
        const reauthPubkey = new PublicKey(reauth.accounts[0].address);
        if (!reauthPubkey.equals(publicKey)) {
          throw new Error(
            'Wallet mismatch: re-authorized wallet differs from connected wallet. Please reconnect.',
          );
        }

        const signatures = await wallet.signAndSendTransactions({
          transactions: [
            transaction.serialize({
              requireAllSignatures: false,
              verifySignatures: false,
            }),
          ],
        });

        // signAndSendTransactions returns Uint8Array[] of 64-byte signatures.
        // Some MWA implementations may return base64 strings instead.
        const sig = signatures[0];
        if (typeof sig === 'string') {
          // Already a string (base64 or base58 depending on wallet)
          signature = sig;
        } else {
          // Uint8Array → base58 using proper encoding with leading-zero handling
          const BS58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
          const bytes = new Uint8Array(sig);

          // Count leading zeros (each maps to '1' in base58)
          let leadingZeros = 0;
          for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
            leadingZeros++;
          }

          // Convert to BigInt for base58 division
          let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
          let encoded = '';
          while (num > 0n) {
            encoded = BS58_ALPHABET[Number(num % 58n)] + encoded;
            num = num / 58n;
          }

          signature = '1'.repeat(leadingZeros) + encoded;
        }
      });

      return signature;
    },
    [publicKey],
  );

  const value = useMemo(
    () => ({
      connected,
      publicKey,
      connecting,
      connect,
      disconnect,
      signAndSendTransaction,
    }),
    [connected, publicKey, connecting, connect, disconnect, signAndSendTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
