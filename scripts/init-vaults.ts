/**
 * Initialize NeedVault PDAs for the 5 seed needs on devnet.
 *
 * Usage:
 *   npx ts-node scripts/init-vaults.ts
 *
 * Prerequisites:
 *   - Solana CLI configured for devnet
 *   - Wallet at ~/.config/solana/id.json with devnet SOL
 *   - Escrow program deployed to 7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as borsh from '@coral-xyz/borsh';
import BN from 'bn.js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE');
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDC_DECIMALS = 6;

// Anchor discriminator for initialize_need: sha256("global:initialize_need")[0..8]
// From IDL: [16, 89, 102, 70, 140, 101, 220, 41]
const INIT_NEED_DISCRIMINATOR = Buffer.from([16, 89, 102, 70, 140, 101, 220, 41]);

// Borsh schema for initialize_need args: (slug: String, target: u64, disburse_to: Pubkey)
const initNeedArgsSchema = borsh.struct([
  borsh.str('slug'),
  borsh.u64('target'),
  borsh.publicKey('disburse_to'),
]);

// ─── Seed Needs ──────────────────────────────────────────────────────────────

const NEEDS = [
  {slug: 'shower', title: 'A clean shower and fresh clothes', amount: 25},
  {slug: 'groceries', title: 'Groceries for a single mom', amount: 100},
  {slug: 'wardrobe', title: 'New wardrobe for a foster kid', amount: 250},
  {slug: 'tires', title: 'New tires for a family in need', amount: 400},
  {slug: 'rent', title: "Full month's rent for a family", amount: 1000},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveVaultPDA(slug: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('need'), Buffer.from(slug)],
    PROGRAM_ID,
  );
}

function loadKeypair(): Keypair {
  const keyPath = path.resolve(
    process.env.HOME || '~',
    '.config/solana/id.json',
  );
  const secretKey = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');
  const authority = loadKeypair();

  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`Program:   ${PROGRAM_ID.toBase58()}`);
  console.log(`USDC Mint: ${USDC_MINT.toBase58()}`);
  console.log('');

  // Use the authority wallet as the disburse_to address for now
  // (can be updated later to actual fulfillment partners)
  const disburseTo = authority.publicKey;

  for (const need of NEEDS) {
    const [vaultPDA, bump] = deriveVaultPDA(need.slug);

    // Check if vault already exists
    const vaultInfo = await connection.getAccountInfo(vaultPDA);
    if (vaultInfo) {
      console.log(`  [skip] "${need.slug}" vault already exists: ${vaultPDA.toBase58()}`);
      continue;
    }

    const vaultATA = await getAssociatedTokenAddress(USDC_MINT, vaultPDA, true);
    const targetBaseUnits = new BN(need.amount * 10 ** USDC_DECIMALS);

    // Encode args
    const argsBuffer = Buffer.alloc(1024);
    const argsLen = initNeedArgsSchema.encode(
      {
        slug: need.slug,
        target: targetBaseUnits,
        disburse_to: disburseTo,
      },
      argsBuffer,
    );
    const argsData = argsBuffer.subarray(0, argsLen);
    const data = Buffer.concat([INIT_NEED_DISCRIMINATOR, argsData]);

    // Account order must match Rust InitializeNeed struct:
    // 0. authority (signer, mut)
    // 1. vault (PDA, mut)
    // 2. usdc_mint (read-only)
    // 3. vault_ata (mut)
    // 4. system_program
    // 5. token_program
    // 6. associated_token_program
    // 7. rent
    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        {pubkey: authority.publicKey, isSigner: true, isWritable: true},
        {pubkey: vaultPDA, isSigner: false, isWritable: true},
        {pubkey: USDC_MINT, isSigner: false, isWritable: false},
        {pubkey: vaultATA, isSigner: false, isWritable: true},
        {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
        {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
      ],
      data,
    });

    const transaction = new Transaction().add(instruction);

    try {
      const sig = await sendAndConfirmTransaction(connection, transaction, [authority]);
      console.log(`  [done] "${need.slug}" → vault: ${vaultPDA.toBase58()}`);
      console.log(`         ATA: ${vaultATA.toBase58()}`);
      console.log(`         Target: $${need.amount} (${targetBaseUnits.toString()} base units)`);
      console.log(`         Signature: ${sig}`);
    } catch (err: any) {
      console.error(`  [FAIL] "${need.slug}":`, err.message || err);
    }
    console.log('');
  }

  console.log('Done!');
}

main().catch(console.error);
