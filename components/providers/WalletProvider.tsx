// v2 WalletProvider — MWA wallet connection + wallet-signed Supabase auth
//
// INTERFACE:
//   useWallet() → { connected, publicKey, connect, disconnect,
//                   signAndSendTransaction, authorizeSignAndBuildTransaction }
//
// ACTIVITY LIFECYCLE:
//   On Seeker, Android destroys and recreates the Activity when the MWA wallet
//   bottom sheet closes (singleTask launchMode). To survive this:
//   - All MWA operations (authorize, signMessages, signTransactions) happen
//     inside transact() — these are fast, no network submission.
//   - All post-MWA work (sendRawTransaction, wallet-auth HTTP, record-donation)
//     happens AFTER transact() resolves, when the Activity is stable.
//   - Pending auth/tx data is persisted to AsyncStorage as insurance.
//   - On Activity recreation, hydration completes any pending work.

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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
import {verifySeekerToken} from '../../utils/sgt';
import {utf8Encode} from '../../utils/utf8';

// AsyncStorage keys for data that survives Activity destruction.
const PENDING_AUTH_KEY = '@glimpse_pending_auth';
const PENDING_TX_KEY = '@glimpse_pending_tx';

interface PendingAuth {
  wallet: string;
  signature: string;
  message: string;
}

/** Data persisted when a signed tx exists but hasn't been submitted yet. */
interface PendingTx {
  wallet: string;
  authSignature: string;
  authMessage: string;
  /** Base64-encoded serialized signed Transaction */
  signedTxBase64: string;
}

/** Result from authorizeSignAndBuildTransaction — signed tx ready to submit. */
export interface WalletSignResult {
  publicKey: PublicKey;
  /** Fully signed Transaction, ready for sendRawTransaction */
  signedTransaction: Transaction;
  /** Auth signature for wallet-auth edge function */
  authSignature: string;
  /** Auth message for wallet-auth edge function */
  authMessage: string;
}

/** Signal that the wallet sent the tx itself via signAndSendTransactions fallback. */
class FallbackTxSent extends Error {
  publicKey: PublicKey;
  txSignature: string;
  authSignature: string;
  authMessage: string;
  constructor(
    pk: PublicKey,
    txSig: string,
    authSig: string,
    authMsg: string,
  ) {
    super('Wallet sent transaction via fallback path');
    this.name = 'FallbackTxSent';
    this.publicKey = pk;
    this.txSignature = txSig;
    this.authSignature = authSig;
    this.authMessage = authMsg;
  }
}

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  hasSeekerToken: boolean;
  sgtLoading: boolean;
  recheckSgt: () => void;
  connect: () => Promise<PublicKey>;
  disconnect: () => void;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  /**
   * Seamless one-shot flow: authorize + sign auth message + sign transaction.
   * Does NOT submit the tx — caller is responsible for sendRawTransaction.
   * This keeps all network work outside the MWA session to survive Activity destruction.
   */
  authorizeSignAndBuildTransaction: (
    buildTransaction: (donorPubkey: PublicKey) => Promise<Transaction>,
  ) => Promise<WalletSignResult>;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  connecting: false,
  hasSeekerToken: false,
  sgtLoading: false,
  recheckSgt: () => {},
  connect: async () => {
    throw new Error('WalletProvider is not mounted');
  },
  disconnect: () => {},
  signAndSendTransaction: async () => '',
  authorizeSignAndBuildTransaction: async () => {
    throw new Error('WalletProvider is not mounted');
  },
});

export function useWallet() {
  return useContext(WalletContext);
}

/** Complete a pending auth by calling the wallet-auth edge function. */
async function completePendingAuth(pending: PendingAuth): Promise<boolean> {
  try {
    const authResult = await authenticateWalletSignature({
      wallet: pending.wallet,
      signature: pending.signature,
      message: pending.message,
    });
    await setSupabaseAccessToken(authResult.token);
    await AsyncStorage.removeItem(PENDING_AUTH_KEY);
    return true;
  } catch {
    // Auth failed (expired challenge, replay, network). Clear pending data.
    await AsyncStorage.removeItem(PENDING_AUTH_KEY);
    return false;
  }
}

export function WalletProvider({children}: {children: React.ReactNode}) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hasSeekerToken, setHasSeekerToken] = useState(false);
  const [sgtLoading, setSgtLoading] = useState(false);

  // Re-entrancy guard: useRef (not useState) for synchronous checking.
  const connectingRef = useRef(false);

  // Request-id guard: prevents stale async SGT results from overwriting
  // state after disconnect/reconnect.
  const sgtCheckIdRef = useRef(0);

  const connected = publicKey !== null;

  // Trigger SGT verification for a wallet. Uses request-id to discard stale results.
  const checkSeekerToken = useCallback((wallet: PublicKey) => {
    const checkId = ++sgtCheckIdRef.current;
    setSgtLoading(true);
    setHasSeekerToken(false);
    verifySeekerToken(wallet)
      .then(result => {
        if (sgtCheckIdRef.current !== checkId) {
          return;
        }
        setHasSeekerToken(result.success && result.data === true);
      })
      .catch(() => {
        if (sgtCheckIdRef.current !== checkId) {
          return;
        }
        setHasSeekerToken(false);
      })
      .finally(() => {
        if (sgtCheckIdRef.current !== checkId) {
          return;
        }
        setSgtLoading(false);
      });
  }, []);

  const recheckSgt = useCallback(() => {
    if (publicKey) {
      checkSeekerToken(publicKey);
    }
  }, [publicKey, checkSeekerToken]);

  // Hydrate wallet state on mount. Handles two cases:
  // 1. Normal cold start — JWT + wallet address in storage → restore session.
  // 2. Activity recreation after MWA — pending auth in storage → complete the
  //    HTTP call to wallet-auth, then restore session.
  React.useEffect(() => {
    (async () => {
      try {
        // Case 2: Activity was destroyed during MWA. Complete the auth.
        const pendingRaw = await AsyncStorage.getItem(PENDING_AUTH_KEY);
        if (pendingRaw) {
          const pending: PendingAuth = JSON.parse(pendingRaw);
          const success = await completePendingAuth(pending);
          if (success) {
            const restoredKey = new PublicKey(pending.wallet);
            setPublicKey(restoredKey);
            checkSeekerToken(restoredKey);
            retryPendingConversations().catch(() => {});
            return;
          }
        }

        // Case 1: Normal hydration — both wallet address and valid JWT exist.
        const [storedAddress, storedToken] = await Promise.all([
          AsyncStorage.getItem('@glimpse_wallet_address'),
          AsyncStorage.getItem('@glimpse_wallet_jwt'),
        ]);
        if (storedAddress && storedToken) {
          await hydrateSupabaseAccessToken();
          const restoredKey = new PublicKey(storedAddress);
          setPublicKey(restoredKey);
          checkSeekerToken(restoredKey);
          retryPendingConversations().catch(() => {});
        }
      } catch {
        // Hydration failed — user will need to connect manually.
      }
    })();
  }, [checkSeekerToken]);

  const connect = useCallback(async (): Promise<PublicKey> => {
    if (connectingRef.current) {
      throw new Error('Connection already in progress');
    }
    connectingRef.current = true;
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

        // Persist wallet address immediately — survives Activity destruction.
        await AsyncStorage.setItem('@glimpse_wallet_address', walletAddress);

        // Sign the auth challenge inside the MWA session.
        const message = createWalletAuthMessage();
        const payload = utf8Encode(message);
        const signedPayloads = await wallet.signMessages({
          addresses: [base64Address],
          payloads: [payload],
        });

        if (!signedPayloads[0]) {
          throw new Error('Wallet did not return a signed auth payload');
        }

        // MWA signMessages may return signed message (sig + msg) or detached sig.
        // Extract first 64 bytes to ensure we get just the ed25519 signature.
        const signatureBytes = signedPayloads[0].slice(0, 64);
        const signature = encodeBase64(signatureBytes);

        // Persist pending auth BEFORE the HTTP call. If Android destroys the
        // Activity during the fetch, the hydration effect will complete it.
        const pendingAuth: PendingAuth = {wallet: walletAddress, signature, message};
        await AsyncStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pendingAuth));

        // Now make the HTTP call. This may or may not complete before
        // Android destroys the Activity — that's OK, hydration handles it.
        const authResult = await authenticateWalletSignature({
          wallet: walletAddress,
          signature,
          message,
        });

        // If we get here, the Activity survived. Persist JWT and clean up.
        await setSupabaseAccessToken(authResult.token);
        await AsyncStorage.removeItem(PENDING_AUTH_KEY);
        setPublicKey(pubkey);

        // Best-effort replay for orphaned DB writes where on-chain tx succeeded.
        retryPendingConversations().catch(() => {});
      });

      if (!connectedPubkey) {
        throw new Error('Wallet authorize returned no usable account');
      }

      // SGT check runs async — does not block wallet connection.
      checkSeekerToken(connectedPubkey);

      return connectedPubkey;
    } catch (error) {
      // Don't clear wallet address if pending auth exists — hydration will
      // complete the auth on the next mount.
      const hasPending = await AsyncStorage.getItem(PENDING_AUTH_KEY);
      if (!hasPending) {
        setPublicKey(null);
        setHasSeekerToken(false);
        setSgtLoading(false);
        await AsyncStorage.removeItem('@glimpse_wallet_address');
        await setSupabaseAccessToken(null);
      }
      throw error;
    } finally {
      setConnecting(false);
      connectingRef.current = false;
    }
  }, [checkSeekerToken]);

  const disconnect = useCallback(() => {
    ++sgtCheckIdRef.current; // Invalidate any in-flight SGT check
    setPublicKey(null);
    setHasSeekerToken(false);
    setSgtLoading(false);
    AsyncStorage.removeItem('@glimpse_wallet_address').catch(() => {});
    AsyncStorage.removeItem(PENDING_AUTH_KEY).catch(() => {});
    AsyncStorage.removeItem(PENDING_TX_KEY).catch(() => {});
    AsyncStorage.removeItem('@glimpse_fallback_tx_sig').catch(() => {});
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

  const authorizeSignAndBuildTransaction = useCallback(
    async (
      buildTransaction: (donorPubkey: PublicKey) => Promise<Transaction>,
    ): Promise<WalletSignResult> => {
      if (connectingRef.current) {
        throw new Error('Connection already in progress');
      }
      connectingRef.current = true;
      setConnecting(true);

      try {
        // All MWA operations happen inside transact(). NO network submission.
        // This keeps the callback fast so it completes before Activity destruction.
        const result = await transact(async wallet => {
          // 1. Authorize — user approves in wallet bottom sheet
          const auth = await wallet.authorize({
            chain: `solana:${SOLANA_CLUSTER}`,
            identity: APP_IDENTITY,
          });

          if (!auth.accounts?.length || !auth.accounts[0]?.address) {
            throw new Error('Wallet authorize returned no accounts');
          }

          const base64Address = auth.accounts[0].address;
          const newPubkey = parseAuthorizedAccountAddress(base64Address);

          if (publicKey && !newPubkey.equals(publicKey)) {
            console.warn(
              'Wallet changed during seamless flow:',
              publicKey.toBase58(),
              '→',
              newPubkey.toBase58(),
            );
          }

          const walletAddress = newPubkey.toBase58();

          // 2. Sign auth challenge message
          const authMessage = createWalletAuthMessage();
          const payload = utf8Encode(authMessage);
          const signedPayloads = await wallet.signMessages({
            addresses: [base64Address],
            payloads: [payload],
          });

          if (!signedPayloads[0]) {
            throw new Error('Wallet did not return a signed auth payload');
          }

          const authSignatureBytes = signedPayloads[0].slice(0, 64);
          const authSignature = encodeBase64(authSignatureBytes);

          // 3. Build the donation transaction (RPC calls for blockhash, ATA)
          const transaction = await buildTransaction(newPubkey);

          // 4. Sign the transaction — prefer signTransactions (pure crypto,
          // no network) over signAndSendTransactions (wallet submits).
          // Both getCapabilities and signTransactions have TS resolution issues
          // through the ESM exports map — runtime implementations confirmed in
          // the web3js wrapper (index.native.js).
          const walletAny = wallet as any;

          // Check capabilities to decide which signing method to use.
          let canSignOnly = false;
          try {
            const caps = await walletAny.getCapabilities();
            canSignOnly =
              caps?.features?.includes('solana:signTransactions') ?? false;
          } catch {
            // getCapabilities failed — try signTransactions anyway
            canSignOnly = true;
          }

          if (canSignOnly) {
            try {
              const signedTxs: Transaction[] = await walletAny.signTransactions(
                {transactions: [transaction]},
              );
              if (!signedTxs[0]) {
                throw new Error('Wallet returned no signed transaction');
              }

              const signedTransaction = signedTxs[0];

              // 5. Persist signed tx + auth data for Activity destruction recovery
              const signedTxBytes = signedTransaction.serialize();
              const signedTxBase64 = encodeBase64(signedTxBytes);

              const pendingTx: PendingTx = {
                wallet: walletAddress,
                authSignature,
                authMessage,
                signedTxBase64,
              };
              await AsyncStorage.setItem(
                PENDING_TX_KEY,
                JSON.stringify(pendingTx),
              );
              await AsyncStorage.setItem(
                PENDING_AUTH_KEY,
                JSON.stringify({
                  wallet: walletAddress,
                  signature: authSignature,
                  message: authMessage,
                }),
              );
              await AsyncStorage.setItem(
                '@glimpse_wallet_address',
                walletAddress,
              );

              return {
                walletAddress,
                authSignature,
                authMessage,
                signedTransaction,
                walletSentTx: false as const,
              };
            } catch (signError) {
              // If user declined, re-throw — don't fall through
              const errMsg =
                signError instanceof Error ? signError.message : '';
              if (
                errMsg.includes('DECLINED') ||
                errMsg.includes('NOT_SIGNED')
              ) {
                throw signError;
              }
              console.warn(
                'signTransactions failed, falling back to signAndSendTransactions:',
                errMsg,
              );
            }
          }

          // Fallback: wallet signs AND submits the tx
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transaction],
          });
          if (!signatures[0]) {
            throw new Error('Wallet returned an empty signature');
          }

          // Persist for Activity destruction recovery
          await AsyncStorage.setItem(
            PENDING_AUTH_KEY,
            JSON.stringify({
              wallet: walletAddress,
              signature: authSignature,
              message: authMessage,
            }),
          );
          await AsyncStorage.setItem(
            '@glimpse_wallet_address',
            walletAddress,
          );

          return {
            walletAddress,
            authSignature,
            authMessage,
            txSignature: signatures[0],
            walletSentTx: true as const,
          };
        });

        // transact() resolved — Activity survived. Extract return values.
        const walletAddress = result.walletAddress;
        const donorPubkey = new PublicKey(walletAddress);

        // Complete wallet-auth OUTSIDE transact (Activity is stable now)
        try {
          const authResult = await authenticateWalletSignature({
            wallet: walletAddress,
            signature: result.authSignature,
            message: result.authMessage,
          });
          await setSupabaseAccessToken(authResult.token);
          await AsyncStorage.removeItem(PENDING_AUTH_KEY);
        } catch (wpAuthErr) {
          const msg = wpAuthErr instanceof Error ? wpAuthErr.message : String(wpAuthErr);
          console.error('[WP] wallet-auth FAILED:', msg);
          // Auth failed — donations.ts will retry with same credentials.
        }

        setPublicKey(donorPubkey);
        await AsyncStorage.setItem('@glimpse_wallet_address', walletAddress);

        // SGT check runs async — does not block the donation result.
        checkSeekerToken(donorPubkey);
        retryPendingConversations().catch(() => {});

        if (result.walletSentTx) {
          // Fallback path: wallet already sent the tx via signAndSendTransactions.
          // Signal the caller via FallbackTxSent so it skips sendRawTransaction
          // and goes straight to confirmTransaction.
          throw new FallbackTxSent(
            donorPubkey,
            result.txSignature,
            result.authSignature,
            result.authMessage,
          );
        }

        // Clean up pending tx — we'll submit it ourselves now
        await AsyncStorage.removeItem(PENDING_TX_KEY);

        return {
          publicKey: donorPubkey,
          signedTransaction: result.signedTransaction,
          authSignature: result.authSignature,
          authMessage: result.authMessage,
        };
      } catch (error) {
        // If this is our fallback signal, re-throw for the caller
        if (error instanceof FallbackTxSent) {
          throw error;
        }

        // Check for pending tx from Activity destruction recovery
        const pendingTxRaw = await AsyncStorage.getItem(PENDING_TX_KEY);
        if (pendingTxRaw) {
          try {
            const pending: PendingTx = JSON.parse(pendingTxRaw);
            const donorPubkey = new PublicKey(pending.wallet);
            const txBytes = decodeBase64(pending.signedTxBase64);
            const signedTransaction = Transaction.from(txBytes);

            setPublicKey(donorPubkey);

            // Complete auth in background
            completePendingAuth({
              wallet: pending.wallet,
              signature: pending.authSignature,
              message: pending.authMessage,
            }).catch(() => {});

            await AsyncStorage.removeItem(PENDING_TX_KEY);

            return {
              publicKey: donorPubkey,
              signedTransaction,
              authSignature: pending.authSignature,
              authMessage: pending.authMessage,
            };
          } catch {
            await AsyncStorage.removeItem(PENDING_TX_KEY);
          }
        }

        // Check for pending auth (no tx data — wallet may have sent via fallback)
        const hasPending = await AsyncStorage.getItem(PENDING_AUTH_KEY);
        if (!hasPending) {
          setPublicKey(null);
          setHasSeekerToken(false);
          setSgtLoading(false);
          await AsyncStorage.removeItem('@glimpse_wallet_address');
          try {
            await setSupabaseAccessToken(null);
          } catch {
            // Don't let Supabase client recreation clobber the real error
          }
        }
        throw error;
      } finally {
        setConnecting(false);
        connectingRef.current = false;
      }
    },
    [checkSeekerToken, publicKey],
  );

  const value = useMemo(
    () => ({
      connected,
      publicKey,
      connecting,
      hasSeekerToken,
      sgtLoading,
      recheckSgt,
      connect,
      disconnect,
      signAndSendTransaction,
      authorizeSignAndBuildTransaction,
    }),
    [
      connected,
      publicKey,
      connecting,
      hasSeekerToken,
      sgtLoading,
      recheckSgt,
      connect,
      disconnect,
      signAndSendTransaction,
      authorizeSignAndBuildTransaction,
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
