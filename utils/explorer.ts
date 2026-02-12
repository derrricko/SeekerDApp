/**
 * Cluster-aware Solana Explorer URL builder.
 */

import {SOLANA_CLUSTER} from '../config/env';

const BASE = 'https://explorer.solana.com';

/**
 * Build an explorer URL for a transaction signature.
 */
export function getExplorerTxUrl(signature: string): string {
  const params =
    SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;
  return `${BASE}/tx/${signature}${params}`;
}

/**
 * Build an explorer URL for an account/address.
 */
export function getExplorerAddressUrl(address: string): string {
  const params =
    SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;
  return `${BASE}/address/${address}${params}`;
}
