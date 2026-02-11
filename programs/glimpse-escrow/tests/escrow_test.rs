//! Integration tests for the Glimpse escrow program using LiteSVM.
//!
//! These tests load the compiled .so from target/deploy/ and exercise
//! all three instructions: initialize_need, donate, and disburse.
//!
//! The program enforces:
//! - USDC mint must match the hardcoded devnet address
//! - Only ADMIN_PUBKEY can call initialize_need
//! - Slug must be 1-32 bytes
//!
//! We inject a synthetic mint at the known USDC address and disable
//! signature verification so we can sign as ADMIN_PUBKEY in tests.

use litesvm::LiteSVM;
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    program_pack::Pack,
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    system_program,
    transaction::Transaction,
};
use std::sync::atomic::{AtomicU64, Ordering};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use spl_token::state::Mint;

use std::path::PathBuf;

// ---------------------------------------------------------------------------
// Constants (must match program's constants.rs)
// ---------------------------------------------------------------------------

/// Escrow program ID — must match declare_id! in lib.rs
const PROGRAM_ID: Pubkey = solana_sdk::pubkey!("7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE");

/// Devnet USDC mint — hardcoded in program's constants.rs
const USDC_MINT_ADDR: Pubkey =
    solana_sdk::pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

/// Admin pubkey — hardcoded in program's constants.rs
const ADMIN_ADDR: Pubkey =
    solana_sdk::pubkey!("HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5");

/// SPL Token program
const TOKEN_PROGRAM_ID: Pubkey =
    solana_sdk::pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

/// Associated Token Account program
const ATA_PROGRAM_ID: Pubkey =
    solana_sdk::pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

/// Rent sysvar
const RENT_SYSVAR: Pubkey = solana_sdk::pubkey!("SysvarRent111111111111111111111111111111111");

/// USDC has 6 decimals
const USDC_DECIMALS: u8 = 6;

// ---------------------------------------------------------------------------
// Discriminators (from IDL — sha256("global:<instruction_name>")[0..8])
// ---------------------------------------------------------------------------

fn initialize_need_discriminator() -> [u8; 8] {
    [16, 89, 102, 70, 140, 101, 220, 41]
}

fn donate_discriminator() -> [u8; 8] {
    [121, 186, 218, 211, 73, 70, 196, 180]
}

fn disburse_discriminator() -> [u8; 8] {
    [68, 250, 205, 89, 217, 142, 13, 44]
}

// ---------------------------------------------------------------------------
// PDA helpers
// ---------------------------------------------------------------------------

fn derive_vault_pda(slug: &str) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"need", slug.as_bytes()], &PROGRAM_ID)
}

// ---------------------------------------------------------------------------
// Instruction data serialization
// ---------------------------------------------------------------------------

fn serialize_string(s: &str) -> Vec<u8> {
    let mut buf = Vec::new();
    buf.extend_from_slice(&(s.len() as u32).to_le_bytes());
    buf.extend_from_slice(s.as_bytes());
    buf
}

fn build_initialize_need_data(slug: &str, target: u64, disburse_to: &Pubkey) -> Vec<u8> {
    let mut data = Vec::new();
    data.extend_from_slice(&initialize_need_discriminator());
    data.extend_from_slice(&serialize_string(slug));
    data.extend_from_slice(&target.to_le_bytes());
    data.extend_from_slice(&disburse_to.to_bytes());
    data
}

fn build_donate_data(amount: u64) -> Vec<u8> {
    let mut data = Vec::new();
    data.extend_from_slice(&donate_discriminator());
    data.extend_from_slice(&amount.to_le_bytes());
    data
}

fn build_disburse_data() -> Vec<u8> {
    disburse_discriminator().to_vec()
}

// ---------------------------------------------------------------------------
// Test environment setup
// ---------------------------------------------------------------------------

struct TestEnv {
    svm: LiteSVM,
    /// A real keypair used as the admin. We fund the ADMIN_ADDR separately
    /// and use sigverify(false) so we can sign as ADMIN_ADDR.
    admin_payer: Keypair,
    recipient: Keypair,
}

fn program_so_path() -> PathBuf {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.pop(); // programs/
    path.pop(); // project root
    path.push("target");
    path.push("deploy");
    path.push("glimpse_escrow.so");
    path
}

/// Inject a pre-built SPL Mint account at `mint_addr` with given decimals
/// and `mint_authority`. This avoids needing a keypair for the mint address.
fn inject_mint(svm: &mut LiteSVM, mint_addr: &Pubkey, decimals: u8, mint_authority: &Pubkey) {
    let mut mint_data = vec![0u8; Mint::LEN];
    let mint = spl_token::state::Mint {
        mint_authority: solana_sdk::program_option::COption::Some(*mint_authority),
        supply: 0,
        decimals,
        is_initialized: true,
        freeze_authority: solana_sdk::program_option::COption::None,
    };
    spl_token::state::Mint::pack(mint, &mut mint_data).unwrap();

    let rent = svm.minimum_balance_for_rent_exemption(Mint::LEN);
    svm.set_account(
        *mint_addr,
        Account {
            lamports: rent,
            data: mint_data,
            owner: TOKEN_PROGRAM_ID,
            executable: false,
            rent_epoch: 0,
        },
    )
    .unwrap();
}

fn setup() -> TestEnv {
    let mut svm = LiteSVM::new()
        .with_sigverify(false); // Allow signing as ADMIN_ADDR without private key

    // Load the escrow program
    let program_bytes = std::fs::read(program_so_path()).expect(
        "Failed to read glimpse_escrow.so — run `cargo-build-sbf` first",
    );
    svm.add_program(PROGRAM_ID, &program_bytes);

    // A real keypair we use as the "payer" for transactions.
    // With sigverify off, we'll construct transactions that claim ADMIN_ADDR
    // as a signer but use this keypair's signature slot.
    let admin_payer = Keypair::new();
    let recipient = Keypair::new();

    // Fund the ADMIN_ADDR (the hardcoded admin) and the payer
    svm.airdrop(&ADMIN_ADDR, 10_000_000_000).unwrap();
    svm.airdrop(&admin_payer.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&recipient.pubkey(), 1_000_000_000).unwrap();

    // Inject USDC mint at the hardcoded address with admin_payer as mint authority
    // (we use admin_payer since we have its keypair for mint_to instructions)
    inject_mint(&mut svm, &USDC_MINT_ADDR, USDC_DECIMALS, &admin_payer.pubkey());

    TestEnv {
        svm,
        admin_payer,
        recipient,
    }
}

/// Monotonic counter to ensure each admin tx has a unique signature.
/// Without this, LiteSVM deduplicates identical all-zero signatures.
static TX_COUNTER: AtomicU64 = AtomicU64::new(1);

/// Build and send a transaction with ADMIN_ADDR as fee payer.
/// Since sigverify is off, we don't need the actual admin private key.
fn send_admin_tx(svm: &mut LiteSVM, ixs: &[Instruction]) -> Result<(), Box<dyn std::error::Error>> {
    let mut tx = Transaction::new_with_payer(ixs, Some(&ADMIN_ADDR));
    tx.message.recent_blockhash = svm.latest_blockhash();
    // Assign a unique signature to avoid LiteSVM AlreadyProcessed dedup
    let counter = TX_COUNTER.fetch_add(1, Ordering::Relaxed);
    let mut sig_bytes = [0u8; 64];
    sig_bytes[..8].copy_from_slice(&counter.to_le_bytes());
    tx.signatures = vec![Signature::from(sig_bytes)];
    svm.send_transaction(tx).map(|_| ()).map_err(|e| format!("{:?}", e).into())
}

/// Creates an associated token account for `owner` on USDC_MINT_ADDR.
fn create_ata(svm: &mut LiteSVM, payer: &Keypair, owner: &Pubkey) -> Pubkey {
    let ata = get_associated_token_address(owner, &USDC_MINT_ADDR);
    let ix = create_associated_token_account(&payer.pubkey(), owner, &USDC_MINT_ADDR, &TOKEN_PROGRAM_ID);
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[payer],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).unwrap();
    ata
}

/// Creates an ATA using ADMIN_ADDR as payer (unsigned, sigverify off).
fn create_ata_admin(svm: &mut LiteSVM, owner: &Pubkey) -> Pubkey {
    let ata = get_associated_token_address(owner, &USDC_MINT_ADDR);
    let ix = create_associated_token_account(&ADMIN_ADDR, owner, &USDC_MINT_ADDR, &TOKEN_PROGRAM_ID);
    send_admin_tx(svm, &[ix]).unwrap();
    ata
}

/// Mints `amount` tokens to `dest_ata`. `payer` must be the mint authority.
fn mint_tokens(
    svm: &mut LiteSVM,
    payer: &Keypair,
    dest_ata: &Pubkey,
    amount: u64,
) {
    let ix = spl_token::instruction::mint_to(
        &TOKEN_PROGRAM_ID,
        &USDC_MINT_ADDR,
        dest_ata,
        &payer.pubkey(), // mint authority
        &[],
        amount,
    )
    .unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[payer],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).unwrap();
}

/// Reads an SPL token account balance.
fn get_token_balance(svm: &LiteSVM, ata: &Pubkey) -> u64 {
    let account = svm.get_account(ata).expect("Token account not found");
    let token_account =
        spl_token::state::Account::unpack_from_slice(&account.data).expect("Bad token account");
    token_account.amount
}

// ---------------------------------------------------------------------------
// Instruction builders
// ---------------------------------------------------------------------------

fn initialize_need_ix(
    slug: &str,
    target: u64,
    disburse_to: &Pubkey,
) -> Instruction {
    let (vault_pda, _) = derive_vault_pda(slug);
    let vault_ata = get_associated_token_address(&vault_pda, &USDC_MINT_ADDR);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(ADMIN_ADDR, true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(USDC_MINT_ADDR, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new_readonly(system_program::ID, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
            AccountMeta::new_readonly(ATA_PROGRAM_ID, false),
            AccountMeta::new_readonly(RENT_SYSVAR, false),
        ],
        data: build_initialize_need_data(slug, target, disburse_to),
    }
}

fn donate_ix(donor: &Pubkey, slug: &str, amount: u64) -> Instruction {
    let (vault_pda, _) = derive_vault_pda(slug);
    let donor_ata = get_associated_token_address(donor, &USDC_MINT_ADDR);
    let vault_ata = get_associated_token_address(&vault_pda, &USDC_MINT_ADDR);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*donor, true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(USDC_MINT_ADDR, false),
            AccountMeta::new(donor_ata, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        ],
        data: build_donate_data(amount),
    }
}

fn disburse_ix(slug: &str, disburse_to: &Pubkey) -> Instruction {
    let (vault_pda, _) = derive_vault_pda(slug);
    let vault_ata = get_associated_token_address(&vault_pda, &USDC_MINT_ADDR);
    let disburse_ata = get_associated_token_address(disburse_to, &USDC_MINT_ADDR);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(ADMIN_ADDR, true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(USDC_MINT_ADDR, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new(disburse_ata, false),
            AccountMeta::new_readonly(*disburse_to, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        ],
        data: build_disburse_data(),
    }
}

// ---------------------------------------------------------------------------
// Vault state deserialization
// ---------------------------------------------------------------------------

fn read_vault_state(svm: &LiteSVM, vault: &Pubkey) -> VaultState {
    let account = svm.get_account(vault).expect("Vault account not found");
    let data = &account.data;

    let mut offset = 8; // skip discriminator

    let authority = Pubkey::new_from_array(data[offset..offset + 32].try_into().unwrap());
    offset += 32;

    let slug_len = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap()) as usize;
    offset += 4;
    let slug = String::from_utf8(data[offset..offset + slug_len].to_vec()).unwrap();
    offset += slug_len;

    let target = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    offset += 8;

    let funded = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    offset += 8;

    let disburse_to = Pubkey::new_from_array(data[offset..offset + 32].try_into().unwrap());
    offset += 32;

    let disbursed = data[offset] != 0;
    offset += 1;

    let bump = data[offset];

    VaultState { authority, slug, target, funded, disburse_to, disbursed, bump }
}

#[derive(Debug)]
#[allow(dead_code)]
struct VaultState {
    authority: Pubkey,
    slug: String,
    target: u64,
    funded: u64,
    disburse_to: Pubkey,
    disbursed: bool,
    bump: u8,
}

// ---------------------------------------------------------------------------
// Helper: full setup with initialized vault + funded donor
// ---------------------------------------------------------------------------

struct DonationEnv {
    svm: LiteSVM,
    admin_payer: Keypair,
    donor: Keypair,
    recipient: Keypair,
    slug: String,
    vault_pda: Pubkey,
    donor_ata: Pubkey,
    vault_ata: Pubkey,
    #[allow(dead_code)]
    recipient_ata: Pubkey,
}

fn setup_with_vault_and_donor(slug: &str, target: u64, donor_balance: u64) -> DonationEnv {
    let mut env = setup();

    // Initialize the vault (as ADMIN_ADDR)
    let ix = initialize_need_ix(slug, target, &env.recipient.pubkey());
    send_admin_tx(&mut env.svm, &[ix]).unwrap();

    // Create a donor with real keypair
    let donor = Keypair::new();
    env.svm.airdrop(&donor.pubkey(), 5_000_000_000).unwrap();

    // Create donor ATA and fund it
    let donor_ata = create_ata(&mut env.svm, &donor, &donor.pubkey());
    if donor_balance > 0 {
        mint_tokens(&mut env.svm, &env.admin_payer, &donor_ata, donor_balance);
    }

    // Create recipient ATA
    let recipient_ata = create_ata_admin(&mut env.svm, &env.recipient.pubkey());

    let (vault_pda, _) = derive_vault_pda(slug);
    let vault_ata = get_associated_token_address(&vault_pda, &USDC_MINT_ADDR);

    DonationEnv {
        svm: env.svm,
        admin_payer: env.admin_payer,
        donor,
        recipient: env.recipient,
        slug: slug.to_string(),
        vault_pda,
        donor_ata,
        vault_ata,
        recipient_ata,
    }
}

// ===========================================================================
// Tests
// ===========================================================================

#[test]
fn test_initialize_need() {
    let mut env = setup();
    let slug = "shower";
    let target = 25_000_000u64; // 25 USDC

    let ix = initialize_need_ix(slug, target, &env.recipient.pubkey());
    send_admin_tx(&mut env.svm, &[ix]).unwrap();

    // Verify vault state
    let (vault_pda, expected_bump) = derive_vault_pda(slug);
    let state = read_vault_state(&env.svm, &vault_pda);

    assert_eq!(state.authority, ADMIN_ADDR);
    assert_eq!(state.slug, slug);
    assert_eq!(state.target, target);
    assert_eq!(state.funded, 0);
    assert_eq!(state.disburse_to, env.recipient.pubkey());
    assert!(!state.disbursed);
    assert_eq!(state.bump, expected_bump);

    // Verify the vault ATA was created with zero balance
    let vault_ata = get_associated_token_address(&vault_pda, &USDC_MINT_ADDR);
    let balance = get_token_balance(&env.svm, &vault_ata);
    assert_eq!(balance, 0);
}

#[test]
fn test_initialize_need_duplicate() {
    let mut env = setup();
    let slug = "groceries";
    let target = 100_000_000u64;

    let ix = initialize_need_ix(slug, target, &env.recipient.pubkey());
    send_admin_tx(&mut env.svm, &[ix]).unwrap();

    // Second init with same slug — should fail
    let ix2 = initialize_need_ix(slug, target, &env.recipient.pubkey());
    let result = send_admin_tx(&mut env.svm, &[ix2]);
    assert!(result.is_err(), "Duplicate initialize_need should fail");
}

#[test]
fn test_initialize_need_non_admin() {
    let mut env = setup();
    let slug = "hacked";
    let target = 1_000_000u64;

    let imposter = Keypair::new();
    env.svm.airdrop(&imposter.pubkey(), 5_000_000_000).unwrap();

    // Build init ix but with imposter as authority (not ADMIN_ADDR)
    let (vault_pda, _) = derive_vault_pda(slug);
    let vault_ata = get_associated_token_address(&vault_pda, &USDC_MINT_ADDR);
    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(imposter.pubkey(), true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(USDC_MINT_ADDR, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new_readonly(system_program::ID, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
            AccountMeta::new_readonly(ATA_PROGRAM_ID, false),
            AccountMeta::new_readonly(RENT_SYSVAR, false),
        ],
        data: build_initialize_need_data(slug, target, &imposter.pubkey()),
    };
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&imposter.pubkey()),
        &[&imposter],
        env.svm.latest_blockhash(),
    );
    let result = env.svm.send_transaction(tx);
    assert!(result.is_err(), "Non-admin init should fail");
}

#[test]
fn test_donate_happy_path() {
    let donate_amount = 5_000_000u64; // 5 USDC
    let mut denv = setup_with_vault_and_donor("shower", 25_000_000, 50_000_000);

    let ix = donate_ix(&denv.donor.pubkey(), &denv.slug, donate_amount);
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx).unwrap();

    assert_eq!(get_token_balance(&denv.svm, &denv.donor_ata), 50_000_000 - donate_amount);
    assert_eq!(get_token_balance(&denv.svm, &denv.vault_ata), donate_amount);

    let state = read_vault_state(&denv.svm, &denv.vault_pda);
    assert_eq!(state.funded, donate_amount);
    assert!(!state.disbursed);
}

#[test]
fn test_donate_zero_amount() {
    let mut denv = setup_with_vault_and_donor("shower", 25_000_000, 50_000_000);

    let ix = donate_ix(&denv.donor.pubkey(), &denv.slug, 0);
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    let result = denv.svm.send_transaction(tx);
    assert!(result.is_err(), "Zero-amount donation should fail");
}

#[test]
fn test_donate_after_disburse() {
    let donate_amount = 10_000_000u64;
    let mut denv = setup_with_vault_and_donor("rent", 1_000_000_000, 100_000_000);

    // Donate
    let ix1 = donate_ix(&denv.donor.pubkey(), &denv.slug, donate_amount);
    let tx1 = Transaction::new_signed_with_payer(
        &[ix1],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    // Disburse (as admin)
    let ix2 = disburse_ix(&denv.slug, &denv.recipient.pubkey());
    send_admin_tx(&mut denv.svm, &[ix2]).unwrap();

    // Try donate after disburse — should fail
    let ix3 = donate_ix(&denv.donor.pubkey(), &denv.slug, 5_000_000);
    let tx3 = Transaction::new_signed_with_payer(
        &[ix3],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    let result = denv.svm.send_transaction(tx3);
    assert!(result.is_err(), "Donation after disburse should fail");
}

#[test]
fn test_disburse_happy_path() {
    let donate_amount = 25_000_000u64;
    let mut denv = setup_with_vault_and_donor("shower", 25_000_000, 50_000_000);

    // Donate
    let ix1 = donate_ix(&denv.donor.pubkey(), &denv.slug, donate_amount);
    let tx1 = Transaction::new_signed_with_payer(
        &[ix1],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    assert_eq!(get_token_balance(&denv.svm, &denv.vault_ata), donate_amount);

    // Disburse (as admin)
    let ix2 = disburse_ix(&denv.slug, &denv.recipient.pubkey());
    send_admin_tx(&mut denv.svm, &[ix2]).unwrap();

    assert_eq!(get_token_balance(&denv.svm, &denv.vault_ata), 0);
    assert_eq!(get_token_balance(&denv.svm, &denv.recipient_ata), donate_amount);

    let state = read_vault_state(&denv.svm, &denv.vault_pda);
    assert!(state.disbursed);
    assert_eq!(state.funded, donate_amount);
}

#[test]
fn test_disburse_unauthorized() {
    let donate_amount = 10_000_000u64;
    let mut denv = setup_with_vault_and_donor("tires", 400_000_000, 100_000_000);

    // Donate
    let ix1 = donate_ix(&denv.donor.pubkey(), &denv.slug, donate_amount);
    let tx1 = Transaction::new_signed_with_payer(
        &[ix1],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    // Attempt disburse with imposter
    let imposter = Keypair::new();
    denv.svm.airdrop(&imposter.pubkey(), 1_000_000_000).unwrap();

    let (vault_pda, _) = derive_vault_pda(&denv.slug);
    let vault_ata = get_associated_token_address(&vault_pda, &USDC_MINT_ADDR);
    let disburse_ata = get_associated_token_address(&denv.recipient.pubkey(), &USDC_MINT_ADDR);

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(imposter.pubkey(), true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(USDC_MINT_ADDR, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new(disburse_ata, false),
            AccountMeta::new_readonly(denv.recipient.pubkey(), false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        ],
        data: build_disburse_data(),
    };
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&imposter.pubkey()),
        &[&imposter],
        denv.svm.latest_blockhash(),
    );
    let result = denv.svm.send_transaction(tx);
    assert!(result.is_err(), "Unauthorized disburse should fail");

    let state = read_vault_state(&denv.svm, &denv.vault_pda);
    assert!(!state.disbursed);
    assert_eq!(get_token_balance(&denv.svm, &denv.vault_ata), donate_amount);
}

#[test]
fn test_disburse_double() {
    let donate_amount = 50_000_000u64;
    let mut denv = setup_with_vault_and_donor("wardrobe", 250_000_000, 100_000_000);

    // Donate
    let ix1 = donate_ix(&denv.donor.pubkey(), &denv.slug, donate_amount);
    let tx1 = Transaction::new_signed_with_payer(
        &[ix1],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    // First disburse — ok
    let ix2 = disburse_ix(&denv.slug, &denv.recipient.pubkey());
    send_admin_tx(&mut denv.svm, &[ix2]).unwrap();
    assert!(read_vault_state(&denv.svm, &denv.vault_pda).disbursed);

    // Second disburse — should fail
    let ix3 = disburse_ix(&denv.slug, &denv.recipient.pubkey());
    let result = send_admin_tx(&mut denv.svm, &[ix3]);
    assert!(result.is_err(), "Double disburse should fail");
}
