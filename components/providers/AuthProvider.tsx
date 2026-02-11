/**
 * AuthProvider — manages Supabase session via SIWS (Sign-In With Solana).
 *
 * Auth flow:
 * 1. fetchNonce() → get server nonce
 * 2. wallet.signIn({nonce, domain, statement}) → SIWS signature
 * 3. verifySIWS(signedMessage, signature, pubkey) → Supabase JWT
 * 4. supabase.auth.setSession(jwt) → authenticated client
 * 5. Fetch profile
 *
 * Stubbed: Returns null session until Supabase Edge Functions are deployed.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {useWallet} from './WalletProvider';
import {fetchNonce, verifySIWS, setSupabaseSession} from '../../services/auth';
import {fetchProfile} from '../../services/profiles';
import type {Profile} from '../../services/profiles';
import {SUPABASE_URL} from '../../config/env';
import {handleMWAError} from '../../utils/errors';

interface AuthContextState {
  /** The authenticated profile, or null */
  profile: Profile | null;
  /** Whether auth is in progress */
  loading: boolean;
  /** Whether the user is authenticated with Supabase */
  isAuthenticated: boolean;
  /** Last auth error message, if any */
  error: string | null;
  /** Trigger SIWS auth flow */
  signInWithSolana: () => Promise<void>;
  /** Clear session */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextState>({
  profile: null,
  loading: false,
  isAuthenticated: false,
  error: null,
  signInWithSolana: async () => {},
  signOut: () => {},
});

export function AuthProvider({children}: {children: ReactNode}) {
  const {publicKey, signIn: walletSignIn, connected, disconnect} = useWallet();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = profile !== null;

  // When wallet connects, try to load existing profile
  useEffect(() => {
    if (connected && publicKey && SUPABASE_URL) {
      fetchProfile(publicKey.toBase58())
        .then(p => setProfile(p))
        .catch(() => {});
    } else if (!connected) {
      setProfile(null);
    }
  }, [connected, publicKey]);

  const signInWithSolana = useCallback(async () => {
    if (!SUPABASE_URL) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch nonce
      const nonce = await fetchNonce();

      // 2. Sign in with wallet (SIWS)
      const result = await walletSignIn({
        domain: 'glimpse.give',
        statement: 'Sign in to Glimpse',
        nonce,
      });

      if (!result) {
        throw new Error('Wallet sign-in cancelled');
      }

      // 3. Convert bytes to base64 for the verify endpoint
      const signedMessage = Buffer.from(result.signedMessage).toString(
        'base64',
      );
      const signature = Buffer.from(result.signature).toString('base64');
      const pubkey = result.account.address;

      // 4. Verify with server and get JWT
      const {token, profile: serverProfile} = await verifySIWS(
        signedMessage,
        signature,
        pubkey,
      );

      // 5. Set session on Supabase client
      await setSupabaseSession(token);

      // 6. Update profile state
      setProfile(serverProfile);
    } catch (err: any) {
      const mwaResult = handleMWAError(err);
      setError(mwaResult.message);
      // Clear cached auth on authorization failure (per Solana Mobile pattern)
      if (mwaResult.clearAuth) {
        setProfile(null);
        try {
          await disconnect();
        } catch {
          // Ignore disconnect errors
        }
      }
      console.warn('SIWS auth failed:', err);
    } finally {
      setLoading(false);
    }
  }, [walletSignIn, disconnect]);

  const signOut = useCallback(() => {
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{profile, loading, isAuthenticated, error, signInWithSolana, signOut}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextState {
  return useContext(AuthContext);
}
