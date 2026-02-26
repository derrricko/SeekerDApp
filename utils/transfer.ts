// v2 SOL transfer + Memo instruction builder
//
// FLOW:
//   1. Build SystemProgram.transfer (SOL)
//   2. Build Memo instruction (JSON metadata)
//   3. Combine into single atomic transaction
//   4. Sign + send via MWA
//
//   ┌──────────────┐   ┌──────────────┐
//   │ SOL Transfer  │ + │ Memo (JSON)  │  →  Single TX  →  MWA Sign  →  Confirm
//   └──────────────┘   └──────────────┘

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {MEMO_PROGRAM_ID} from '../config/env';

export interface DonationMemo {
  /** Donor wallet (short: first 8 chars) */
  d: string;
  /** Recipient wallet (short: first 8 chars) */
  r: string;
  /** Amount in SOL */
  a: number;
  /** Unix timestamp (seconds) */
  t: number;
  /** App identifier */
  app: string;
}

/**
 * Build a SOL donation transaction with an on-chain receipt memo.
 *
 * Returns an unsigned Transaction. The caller is responsible for
 * signing via MWA and sending to the network.
 */
export async function buildDonationTransaction(
  connection: Connection,
  donor: PublicKey,
  recipientAddress: string,
  amountSOL: number,
): Promise<{transaction: Transaction; memo: DonationMemo; lastValidBlockHeight: number}> {
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientAddress);
  } catch {
    throw new Error(`Invalid recipient wallet address: ${recipientAddress}`);
  }

  if (!PublicKey.isOnCurve(recipient.toBytes())) {
    throw new Error(`Recipient address is not a valid Solana wallet: ${recipientAddress}`);
  }

  const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

  if (lamports <= 0) {
    throw new Error('Donation amount must be greater than 0');
  }

  // Safety cap: prevent accidental large transfers (matches GiveScreen MAX_SOL)
  const MAX_LAMPORTS = 100 * LAMPORTS_PER_SOL;
  if (lamports > MAX_LAMPORTS) {
    throw new Error('Donation amount exceeds maximum of 100 SOL');
  }

  // 1. SOL transfer instruction
  const transferIx = SystemProgram.transfer({
    fromPubkey: donor,
    toPubkey: recipient,
    lamports,
  });

  // 2. Memo instruction (on-chain receipt)
  const memo: DonationMemo = {
    d: donor.toBase58().slice(0, 8),
    r: recipient.toBase58().slice(0, 8),
    a: lamports / LAMPORTS_PER_SOL,
    t: Math.floor(Date.now() / 1000),
    app: 'glimpse',
  };

  const memoData = JSON.stringify(memo);

  // Validate memo fits in Solana memo program limit (~566 bytes)
  if (Buffer.from(memoData).length > 566) {
    throw new Error('Memo data exceeds maximum size');
  }

  const memoIx = new TransactionInstruction({
    keys: [{pubkey: donor, isSigner: true, isWritable: false}],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(memoData),
  });

  // 3. Combine into single atomic transaction
  const transaction = new Transaction();
  transaction.add(transferIx, memoIx);

  const {blockhash, lastValidBlockHeight} = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = donor;

  return {transaction, memo, lastValidBlockHeight};
}
