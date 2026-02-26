import {SOLANA_CLUSTER} from '../config/env';

export function getExplorerUrl(signature: string): string {
  const cluster =
    SOLANA_CLUSTER === 'mainnet-beta' ? '' : `?cluster=${SOLANA_CLUSTER}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}
