// v2 USDC transfer + Memo instruction builder
//
// FLOW:
//   1. Derive donor + recipient Associated Token Accounts (ATAs)
//   2. Pre-flight: verify donor has USDC ATA with sufficient balance
//   3. [Optional] Create recipient ATA if missing
//   4. Build SPL transferChecked instruction (validates mint + decimals)
//   5. Build Memo instruction (JSON metadata)
//   6. Combine into single atomic transaction
//
//   ┌────────────────┐   ┌──────────────┐   ┌──────────────┐
//   │ [Create ATA?]  │ + │ USDC Transfer │ + │ Memo (JSON)  │  →  MWA Sign  →  Confirm
//   └────────────────┘   └──────────────┘   └──────────────┘

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  TokenAccountNotFoundError,
} from '@solana/spl-token';
import {Buffer} from 'buffer';
import {MEMO_PROGRAM_ID, USDC_MINT, USDC_DECIMALS} from '../config/env';
import {utf8Encode} from './utf8';

export interface DonationMemo {
  /** Donor wallet (short: first 8 chars) */
  d: string;
  /** Recipient/pool wallet (short: first 8 chars) */
  r: string;
  /** Amount in USDC */
  a: number;
  /** Unix timestamp (seconds) */
  t: number;
  /** App identifier */
  app: string;
  /** Token identifier */
  tok: string;
  /** Donation cadence */
  c?: 'one_time' | 'daily';
}

/**
 * Build a USDC donation transaction with an on-chain receipt memo.
 *
 * Returns an unsigned Transaction. The caller is responsible for
 * signing via MWA and sending to the network.
 */
export async function buildDonationTransaction(
  connection: Connection,
  donor: PublicKey,
  recipientAddress: string,
  amountUSDC: number,
  cadence: 'one_time' | 'daily',
): Promise<{
  transaction: Transaction;
  memo: DonationMemo;
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientAddress);
  } catch {
    throw new Error(`Invalid recipient wallet address: ${recipientAddress}`);
  }

  const mint = new PublicKey(USDC_MINT);

  // Amount validation (USDC has 6 decimals)
  if (!Number.isFinite(amountUSDC) || amountUSDC <= 0) {
    throw new Error('Donation amount must be a positive number');
  }
  const rawAmount = Math.round(amountUSDC * 10 ** USDC_DECIMALS);

  if (rawAmount <= 0) {
    throw new Error('Donation amount must be greater than 0');
  }

  // Safety cap: prevent accidental large transfers
  const MAX_USDC = 10_000;
  if (amountUSDC > MAX_USDC) {
    throw new Error(`Donation amount exceeds maximum of ${MAX_USDC} USDC`);
  }

  // Derive Associated Token Accounts
  const donorATA = await getAssociatedTokenAddress(mint, donor);
  const recipientATA = await getAssociatedTokenAddress(mint, recipient);

  // Pre-flight: verify donor has USDC and sufficient balance
  try {
    const donorAccount = await getAccount(connection, donorATA);
    if (donorAccount.amount < BigInt(rawAmount)) {
      throw new Error('Insufficient USDC balance');
    }
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      throw new Error(
        'USDC token account not found. You need USDC in your wallet to donate.',
      );
    }
    throw e;
  }

  const transaction = new Transaction();

  // Create recipient ATA if it doesn't exist (donor pays rent ~0.002 SOL)
  try {
    await getAccount(connection, recipientATA);
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          donor, // payer
          recipientATA, // ATA to create
          recipient, // owner of the ATA
          mint, // token mint
        ),
      );
    } else {
      throw e; // Network errors should surface, not be swallowed
    }
  }

  // SPL token transfer (transferChecked validates mint + decimals on-chain)
  transaction.add(
    createTransferCheckedInstruction(
      donorATA, // source ATA
      mint, // mint
      recipientATA, // destination ATA
      donor, // owner (signer)
      rawAmount, // amount in raw units
      USDC_DECIMALS, // decimals
    ),
  );

  // Memo instruction (on-chain receipt)
  const memo: DonationMemo = {
    d: donor.toBase58().slice(0, 8),
    r: recipient.toBase58().slice(0, 8),
    a: rawAmount / 10 ** USDC_DECIMALS,
    t: Math.floor(Date.now() / 1000),
    app: 'glimpse',
    tok: 'usdc',
    c: cadence,
  };

  const memoData = JSON.stringify(memo);
  const memoBytes = utf8Encode(memoData);

  // Validate memo fits in Solana memo program limit (~566 bytes)
  if (memoBytes.length > 566) {
    throw new Error('Memo data exceeds maximum size');
  }

  const memoIx = new TransactionInstruction({
    keys: [{pubkey: donor, isSigner: true, isWritable: false}],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(memoBytes),
  });

  transaction.add(memoIx);

  // Set blockhash + fee payer
  const {blockhash, lastValidBlockHeight} = await connection.getLatestBlockhash(
    'confirmed',
  );
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = donor;

  return {transaction, memo, blockhash, lastValidBlockHeight};
}
