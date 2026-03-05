// services/helius.ts
// Helius Enhanced Transactions API client
//
// Used to fetch verified on-chain transaction data for the donation feed.
// This is a READ-ONLY service — it never modifies state.

import {HELIUS_API_KEY} from '../config/env';

const HELIUS_API_BASE = 'https://api.helius.xyz/v0';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const POOL_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';

export interface EnhancedDonation {
  signature: string;
  amountUSDC: number;
  donorWallet: string;
  timestamp: number;
  verified: boolean;
}

export function parseEnhancedTransaction(tx: any): EnhancedDonation | null {
  const tokenTransfers: any[] = tx?.tokenTransfers || [];

  const usdcTransfer = tokenTransfers.find(
    (t: any) =>
      t.mint === USDC_MINT &&
      t.toUserAccount === POOL_WALLET &&
      t.tokenAmount > 0,
  );

  if (!usdcTransfer) {
    return null;
  }

  return {
    signature: tx.signature,
    amountUSDC: usdcTransfer.tokenAmount,
    donorWallet: usdcTransfer.fromUserAccount,
    timestamp: tx.timestamp,
    verified: true,
  };
}

export async function fetchEnhancedTransactions(
  signatures: string[],
): Promise<Map<string, EnhancedDonation>> {
  const result = new Map<string, EnhancedDonation>();

  if (signatures.length === 0 || !HELIUS_API_KEY) {
    return result;
  }

  const batches: string[][] = [];
  for (let i = 0; i < signatures.length; i += 100) {
    batches.push(signatures.slice(i, i + 100));
  }

  for (const batch of batches) {
    try {
      const response = await fetch(
        `${HELIUS_API_BASE}/transactions/?api-key=${HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({transactions: batch}),
        },
      );

      if (!response.ok) {
        console.warn(`[helius] Enhanced tx fetch failed: ${response.status}`);
        continue;
      }

      const enhanced: any[] = await response.json();
      for (const tx of enhanced) {
        const donation = parseEnhancedTransaction(tx);
        if (donation) {
          result.set(donation.signature, donation);
        }
      }
    } catch (error) {
      console.warn('[helius] Enhanced tx fetch error:', error);
    }
  }

  return result;
}
