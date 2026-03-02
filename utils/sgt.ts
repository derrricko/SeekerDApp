// Seeker Genesis Token (SGT) verification
// Checks if a wallet holds a valid SGT — Token-2022 NFT, one per Seeker device.
// Always queries mainnet regardless of app cluster (SGTs only exist on mainnet).

import {Connection, PublicKey} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getMetadataPointerState,
} from '@solana/spl-token';
import {
  SGT_MINT_AUTHORITY,
  SGT_METADATA_ADDRESS,
  MAINNET_RPC_URL,
} from '../config/env';
import {Result, ok, fail} from './errors';
import {hasValidGroupMember} from './sgt-tlv';

// Re-export for backwards compatibility
export {hasValidGroupMember} from './sgt-tlv';

const SGT_MINT_AUTHORITY_PK = new PublicKey(SGT_MINT_AUTHORITY);
const SGT_METADATA_ADDRESS_PK = new PublicKey(SGT_METADATA_ADDRESS);

// Dedicated mainnet connection for SGT checks
let mainnetConnection: Connection | null = null;
function getMainnetConnection(): Connection {
  if (!mainnetConnection) {
    mainnetConnection = new Connection(MAINNET_RPC_URL, 'confirmed');
  }
  return mainnetConnection;
}

/**
 * Verify that a wallet holds a valid Seeker Genesis Token.
 * Three checks must all pass on at least one Token-2022 mint:
 *   1. mintAuthority === SGT_MINT_AUTHORITY
 *   2. metadataPointer authority + address match SGT constants
 *   3. tokenGroupMember group matches SGT_GROUP_MINT_ADDRESS
 *
 * Always queries mainnet RPC regardless of app cluster.
 */
export async function verifySeekerToken(
  wallet: PublicKey,
): Promise<Result<boolean>> {
  try {
    const connection = getMainnetConnection();

    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    for (const {account} of tokenAccounts.value) {
      // Token account data layout: mint (32) + owner (32) + amount (8)
      const data = account.data;
      if (data.length < 72) {
        continue;
      }

      const mintAddress = new PublicKey(data.slice(0, 32));
      const amount = data.readBigUInt64LE(64);
      if (amount === 0n) {
        continue;
      }

      let mint;
      try {
        mint = await getMint(
          connection,
          mintAddress,
          'confirmed',
          TOKEN_2022_PROGRAM_ID,
        );
      } catch {
        continue; // Mint fetch failed — skip this account
      }

      // Check 1: mintAuthority
      if (!mint.mintAuthority?.equals(SGT_MINT_AUTHORITY_PK)) {
        continue;
      }

      // Check 2: metadataPointer
      const metaPointer = getMetadataPointerState(mint);
      if (!metaPointer?.authority?.equals(SGT_MINT_AUTHORITY_PK)) {
        continue;
      }
      if (!metaPointer?.metadataAddress?.equals(SGT_METADATA_ADDRESS_PK)) {
        continue;
      }

      // Check 3: tokenGroupMember (manual TLV parse — not in spl-token v0.3.11)
      if (mint.tlvData && hasValidGroupMember(mint.tlvData)) {
        return ok(true);
      }
    }

    return ok(false);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail('SGT_CHECK_FAILED', `SGT verification failed: ${msg}`, true);
  }
}
