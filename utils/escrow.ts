/**
 * Manual Anchor instruction builder for the Glimpse Escrow program.
 *
 * Why manual? The @coral-xyz/anchor TypeScript client has polyfill issues
 * in React Native and the 0.30.1 IDL format is incompatible with the
 * RN-safe 0.28.0 client. This module builds instructions with web3.js + borsh,
 * which is the idiomatic Solana mobile pattern.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as borsh from '@coral-xyz/borsh';
import BN from 'bn.js';
import {ESCROW_PROGRAM_ID, USDC_MINT, USDC_DECIMALS} from '../config/env';

// ─── Discriminator ──────────────────────────────────────────────────────────
// Anchor discriminator = sha256("global:donate")[0..8]
// Pre-computed to avoid runtime crypto dependency.
// Verify after `anchor build` against target/idl/glimpse_escrow.json
const DONATE_DISCRIMINATOR = Buffer.from([
  121, 186, 218, 211, 73, 70, 196, 180,
]);

// Borsh schema matching the Rust `donate(amount: u64)` args
const donateArgsSchema = borsh.struct([borsh.u64('amount')]);

/**
 * Derive the PDA for a NeedVault from its slug.
 * Seeds: ["need", slug_bytes]
 */
export function deriveVaultPDA(slug: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('need'), Buffer.from(slug)],
    ESCROW_PROGRAM_ID,
  );
}

/**
 * Build a `donate` transaction for the Glimpse Escrow program.
 *
 * Account order MUST match the Rust `Donate` struct:
 *   0. donor       (signer, mut)
 *   1. vault       (PDA, mut)
 *   2. usdc_mint   (read-only)
 *   3. donor_ata   (mut)
 *   4. vault_ata   (mut)
 *   5. token_program (read-only)
 */
export async function buildDonateTransaction(
  connection: Connection,
  donorPublicKey: PublicKey,
  slug: string,
  amount: number,
): Promise<Transaction> {
  const [vaultPDA] = deriveVaultPDA(slug);
  const donorATA = await getAssociatedTokenAddress(USDC_MINT, donorPublicKey);
  const vaultATA = await getAssociatedTokenAddress(USDC_MINT, vaultPDA, true);

  // Encode instruction data: 8-byte discriminator + borsh-encoded args
  const argsBuffer = Buffer.alloc(8);
  const baseUnits = Math.round(amount * 10 ** USDC_DECIMALS);
  donateArgsSchema.encode(
    {amount: new BN(baseUnits)},
    argsBuffer,
  );
  const data = Buffer.concat([DONATE_DISCRIMINATOR, argsBuffer]);

  const instruction = new TransactionInstruction({
    programId: ESCROW_PROGRAM_ID,
    keys: [
      {pubkey: donorPublicKey, isSigner: true, isWritable: true},
      {pubkey: vaultPDA, isSigner: false, isWritable: true},
      {pubkey: USDC_MINT, isSigner: false, isWritable: false},
      {pubkey: donorATA, isSigner: false, isWritable: true},
      {pubkey: vaultATA, isSigner: false, isWritable: true},
      {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
    ],
    data,
  });

  const transaction = new Transaction().add(instruction);
  const {blockhash} = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = donorPublicKey;
  return transaction;
}
