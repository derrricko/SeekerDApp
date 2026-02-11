//! Integration tests for the Glimpse escrow program using LiteSVM.
//!
//! These tests load the compiled .so from target/deploy/ and exercise
//! all three instructions: initialize_need, donate, and disburse.

use litesvm::LiteSVM;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    program_pack::Pack,
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_program,
    transaction::Transaction,
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use spl_token::state::Mint;

use std::path::PathBuf;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Escrow program ID — must match declare_id! in lib.rs
const PROGRAM_ID: Pubkey = solana_sdk::pubkey!("7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE");

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

/// Anchor serializes String as: 4-byte LE length prefix + UTF-8 bytes
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
    authority: Keypair,
    usdc_mint: Keypair,
    recipient: Keypair,
}

fn program_so_path() -> PathBuf {
    // The .so lives at the workspace root: target/deploy/glimpse_escrow.so
    // Tests run from the crate directory, so go up two levels.
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.pop(); // programs/
    path.pop(); // project root
    path.push("target");
    path.push("deploy");
    path.push("glimpse_escrow.so");
    path
}

fn setup() -> TestEnv {
    let mut svm = LiteSVM::new();

    // Load the escrow program from the compiled .so
    let program_bytes = std::fs::read(program_so_path()).expect(
        "Failed to read glimpse_escrow.so — run `anchor build` or `cargo-build-sbf` first",
    );
    svm.add_program(PROGRAM_ID, &program_bytes);

    // Create keypairs
    let authority = Keypair::new();
    let usdc_mint = Keypair::new();
    let recipient = Keypair::new();

    // Fund authority with plenty of SOL for rent + fees
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();
    // Fund recipient so their account exists
    svm.airdrop(&recipient.pubkey(), 1_000_000_000).unwrap();

    // Create the USDC mint
    create_spl_mint(&mut svm, &authority, &usdc_mint, USDC_DECIMALS);

    TestEnv {
        svm,
        authority,
        usdc_mint,
        recipient,
    }
}

/// Creates an SPL Token mint account.
fn create_spl_mint(svm: &mut LiteSVM, payer: &Keypair, mint_kp: &Keypair, decimals: u8) {
    let rent = svm.minimum_balance_for_rent_exemption(Mint::LEN);

    let create_account_ix = solana_sdk::system_instruction::create_account(
        &payer.pubkey(),
        &mint_kp.pubkey(),
        rent,
        Mint::LEN as u64,
        &TOKEN_PROGRAM_ID,
    );

    let init_mint_ix = spl_token::instruction::initialize_mint(
        &TOKEN_PROGRAM_ID,
        &mint_kp.pubkey(),
        &payer.pubkey(), // mint authority
        None,            // freeze authority
        decimals,
    )
    .unwrap();

    let tx = Transaction::new_signed_with_payer(
        &[create_account_ix, init_mint_ix],
        Some(&payer.pubkey()),
        &[payer, mint_kp],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).unwrap();
}

/// Creates an associated token account for `owner` on `mint`, funded by `payer`.
fn create_ata(svm: &mut LiteSVM, payer: &Keypair, owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    let ata = get_associated_token_address(owner, mint);
    let ix = create_associated_token_account(&payer.pubkey(), owner, mint, &TOKEN_PROGRAM_ID);
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[payer],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).unwrap();
    ata
}

/// Mints `amount` tokens to `dest_ata`. `payer` must be the mint authority.
fn mint_tokens(
    svm: &mut LiteSVM,
    payer: &Keypair,
    mint: &Pubkey,
    dest_ata: &Pubkey,
    amount: u64,
) {
    let ix = spl_token::instruction::mint_to(
        &TOKEN_PROGRAM_ID,
        mint,
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
    authority: &Pubkey,
    slug: &str,
    target: u64,
    disburse_to: &Pubkey,
    usdc_mint: &Pubkey,
) -> Instruction {
    let (vault_pda, _) = derive_vault_pda(slug);
    let vault_ata = get_associated_token_address(&vault_pda, usdc_mint);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*authority, true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new_readonly(system_program::ID, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
            AccountMeta::new_readonly(ATA_PROGRAM_ID, false),
            AccountMeta::new_readonly(RENT_SYSVAR, false),
        ],
        data: build_initialize_need_data(slug, target, disburse_to),
    }
}

fn donate_ix(donor: &Pubkey, slug: &str, usdc_mint: &Pubkey, amount: u64) -> Instruction {
    let (vault_pda, _) = derive_vault_pda(slug);
    let donor_ata = get_associated_token_address(donor, usdc_mint);
    let vault_ata = get_associated_token_address(&vault_pda, usdc_mint);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*donor, true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new(donor_ata, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        ],
        data: build_donate_data(amount),
    }
}

fn disburse_ix(
    authority: &Pubkey,
    slug: &str,
    usdc_mint: &Pubkey,
    disburse_to: &Pubkey,
) -> Instruction {
    let (vault_pda, _) = derive_vault_pda(slug);
    let vault_ata = get_associated_token_address(&vault_pda, usdc_mint);
    let disburse_ata = get_associated_token_address(disburse_to, usdc_mint);

    Instruction {
        program_id: PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(*authority, true),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new_readonly(*usdc_mint, false),
            AccountMeta::new(vault_ata, false),
            AccountMeta::new(disburse_ata, false),
            AccountMeta::new_readonly(*disburse_to, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
        ],
        data: build_disburse_data(),
    }
}

// ---------------------------------------------------------------------------
// Vault state deserialization (matches NeedVault layout)
// ---------------------------------------------------------------------------

/// Manually deserialize NeedVault from on-chain account data.
/// Layout: 8-byte discriminator + fields in struct order.
fn read_vault_state(svm: &LiteSVM, vault: &Pubkey) -> VaultState {
    let account = svm.get_account(vault).expect("Vault account not found");
    let data = &account.data;

    // Skip 8-byte Anchor discriminator
    let mut offset = 8;

    // authority: Pubkey (32 bytes)
    let authority = Pubkey::new_from_array(data[offset..offset + 32].try_into().unwrap());
    offset += 32;

    // slug: String (4-byte len + bytes)
    let slug_len = u32::from_le_bytes(data[offset..offset + 4].try_into().unwrap()) as usize;
    offset += 4;
    let slug = String::from_utf8(data[offset..offset + slug_len].to_vec()).unwrap();
    offset += slug_len;

    // target: u64
    let target = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    offset += 8;

    // funded: u64
    let funded = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    offset += 8;

    // disburse_to: Pubkey (32 bytes)
    let disburse_to = Pubkey::new_from_array(data[offset..offset + 32].try_into().unwrap());
    offset += 32;

    // disbursed: bool (1 byte)
    let disbursed = data[offset] != 0;
    offset += 1;

    // bump: u8
    let bump = data[offset];

    VaultState {
        authority,
        slug,
        target,
        funded,
        disburse_to,
        disbursed,
        bump,
    }
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
    authority: Keypair,
    donor: Keypair,
    usdc_mint_pubkey: Pubkey,
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
    let mint_pk = env.usdc_mint.pubkey();

    // Initialize the vault
    let ix = initialize_need_ix(
        &env.authority.pubkey(),
        slug,
        target,
        &env.recipient.pubkey(),
        &mint_pk,
    );
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&env.authority.pubkey()),
        &[&env.authority],
        env.svm.latest_blockhash(),
    );
    env.svm.send_transaction(tx).unwrap();

    // Create a donor
    let donor = Keypair::new();
    env.svm.airdrop(&donor.pubkey(), 5_000_000_000).unwrap();

    // Create donor ATA and fund it
    let donor_ata = create_ata(&mut env.svm, &donor, &donor.pubkey(), &mint_pk);
    if donor_balance > 0 {
        mint_tokens(&mut env.svm, &env.authority, &mint_pk, &donor_ata, donor_balance);
    }

    // Create recipient ATA
    let recipient_ata = create_ata(
        &mut env.svm,
        &env.authority,
        &env.recipient.pubkey(),
        &mint_pk,
    );

    let (vault_pda, _) = derive_vault_pda(slug);
    let vault_ata = get_associated_token_address(&vault_pda, &mint_pk);

    DonationEnv {
        svm: env.svm,
        authority: env.authority,
        donor,
        usdc_mint_pubkey: mint_pk,
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
    let mint_pk = env.usdc_mint.pubkey();

    let ix = initialize_need_ix(
        &env.authority.pubkey(),
        slug,
        target,
        &env.recipient.pubkey(),
        &mint_pk,
    );

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&env.authority.pubkey()),
        &[&env.authority],
        env.svm.latest_blockhash(),
    );

    env.svm.send_transaction(tx).unwrap();

    // Verify vault state
    let (vault_pda, expected_bump) = derive_vault_pda(slug);
    let state = read_vault_state(&env.svm, &vault_pda);

    assert_eq!(state.authority, env.authority.pubkey());
    assert_eq!(state.slug, slug);
    assert_eq!(state.target, target);
    assert_eq!(state.funded, 0);
    assert_eq!(state.disburse_to, env.recipient.pubkey());
    assert!(!state.disbursed);
    assert_eq!(state.bump, expected_bump);

    // Verify the vault ATA was created
    let vault_ata = get_associated_token_address(&vault_pda, &mint_pk);
    let balance = get_token_balance(&env.svm, &vault_ata);
    assert_eq!(balance, 0);
}

#[test]
fn test_initialize_need_duplicate() {
    let mut env = setup();
    let slug = "groceries";
    let target = 100_000_000u64;
    let mint_pk = env.usdc_mint.pubkey();

    // First initialization — should succeed
    let ix = initialize_need_ix(
        &env.authority.pubkey(),
        slug,
        target,
        &env.recipient.pubkey(),
        &mint_pk,
    );
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&env.authority.pubkey()),
        &[&env.authority],
        env.svm.latest_blockhash(),
    );
    env.svm.send_transaction(tx).unwrap();

    // Second initialization with same slug — should fail
    let ix2 = initialize_need_ix(
        &env.authority.pubkey(),
        slug,
        target,
        &env.recipient.pubkey(),
        &mint_pk,
    );
    let tx2 = Transaction::new_signed_with_payer(
        &[ix2],
        Some(&env.authority.pubkey()),
        &[&env.authority],
        env.svm.latest_blockhash(),
    );

    let result = env.svm.send_transaction(tx2);
    assert!(
        result.is_err(),
        "Duplicate initialize_need should fail but succeeded"
    );
}

#[test]
fn test_donate_happy_path() {
    let donate_amount = 5_000_000u64; // 5 USDC
    let mut denv = setup_with_vault_and_donor("shower", 25_000_000, 50_000_000);

    let ix = donate_ix(
        &denv.donor.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        donate_amount,
    );
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx).unwrap();

    // Verify donor balance decreased
    let donor_balance = get_token_balance(&denv.svm, &denv.donor_ata);
    assert_eq!(donor_balance, 50_000_000 - donate_amount);

    // Verify vault ATA balance increased
    let vault_balance = get_token_balance(&denv.svm, &denv.vault_ata);
    assert_eq!(vault_balance, donate_amount);

    // Verify vault state funded counter
    let state = read_vault_state(&denv.svm, &denv.vault_pda);
    assert_eq!(state.funded, donate_amount);
    assert!(!state.disbursed);
}

#[test]
fn test_donate_zero_amount() {
    let mut denv = setup_with_vault_and_donor("shower", 25_000_000, 50_000_000);

    let ix = donate_ix(
        &denv.donor.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        0, // zero amount
    );
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );

    let result = denv.svm.send_transaction(tx);
    assert!(
        result.is_err(),
        "Zero-amount donation should fail but succeeded"
    );
}

#[test]
fn test_donate_after_disburse() {
    let donate_amount = 10_000_000u64; // 10 USDC
    let mut denv = setup_with_vault_and_donor("rent", 1_000_000_000, 100_000_000);

    // Donate first
    let donate_ix_1 = donate_ix(
        &denv.donor.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        donate_amount,
    );
    let tx1 = Transaction::new_signed_with_payer(
        &[donate_ix_1],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    // Disburse
    let disburse = disburse_ix(
        &denv.authority.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        &denv.recipient.pubkey(),
    );
    let tx2 = Transaction::new_signed_with_payer(
        &[disburse],
        Some(&denv.authority.pubkey()),
        &[&denv.authority],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx2).unwrap();

    // Try to donate after disburse — should fail with AlreadyDisbursed
    let donate_ix_2 = donate_ix(
        &denv.donor.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        5_000_000,
    );
    let tx3 = Transaction::new_signed_with_payer(
        &[donate_ix_2],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );

    let result = denv.svm.send_transaction(tx3);
    assert!(
        result.is_err(),
        "Donation after disburse should fail but succeeded"
    );
}

#[test]
fn test_disburse_happy_path() {
    let donate_amount = 25_000_000u64; // 25 USDC
    let mut denv = setup_with_vault_and_donor("shower", 25_000_000, 50_000_000);

    // Donate
    let donate = donate_ix(
        &denv.donor.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        donate_amount,
    );
    let tx1 = Transaction::new_signed_with_payer(
        &[donate],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    // Verify vault has funds
    let vault_balance_before = get_token_balance(&denv.svm, &denv.vault_ata);
    assert_eq!(vault_balance_before, donate_amount);

    // Disburse
    let disburse = disburse_ix(
        &denv.authority.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        &denv.recipient.pubkey(),
    );
    let tx2 = Transaction::new_signed_with_payer(
        &[disburse],
        Some(&denv.authority.pubkey()),
        &[&denv.authority],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx2).unwrap();

    // Verify vault ATA is drained
    let vault_balance_after = get_token_balance(&denv.svm, &denv.vault_ata);
    assert_eq!(vault_balance_after, 0);

    // Verify recipient received the funds
    let recipient_balance = get_token_balance(&denv.svm, &denv.recipient_ata);
    assert_eq!(recipient_balance, donate_amount);

    // Verify vault state is marked disbursed
    let state = read_vault_state(&denv.svm, &denv.vault_pda);
    assert!(state.disbursed);
    assert_eq!(state.funded, donate_amount);
}

#[test]
fn test_disburse_unauthorized() {
    let donate_amount = 10_000_000u64;
    let mut denv = setup_with_vault_and_donor("tires", 400_000_000, 100_000_000);

    // Donate first
    let donate = donate_ix(
        &denv.donor.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        donate_amount,
    );
    let tx1 = Transaction::new_signed_with_payer(
        &[donate],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    // Create imposter
    let imposter = Keypair::new();
    denv.svm.airdrop(&imposter.pubkey(), 1_000_000_000).unwrap();

    // Attempt disburse with imposter — should fail
    let disburse = disburse_ix(
        &imposter.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        &denv.recipient.pubkey(),
    );
    let tx2 = Transaction::new_signed_with_payer(
        &[disburse],
        Some(&imposter.pubkey()),
        &[&imposter],
        denv.svm.latest_blockhash(),
    );

    let result = denv.svm.send_transaction(tx2);
    assert!(
        result.is_err(),
        "Unauthorized disburse should fail but succeeded"
    );

    // Verify vault NOT disbursed
    let state = read_vault_state(&denv.svm, &denv.vault_pda);
    assert!(!state.disbursed);

    // Verify vault ATA still has funds
    let vault_balance = get_token_balance(&denv.svm, &denv.vault_ata);
    assert_eq!(vault_balance, donate_amount);
}

#[test]
fn test_disburse_double() {
    let donate_amount = 50_000_000u64; // 50 USDC
    let mut denv = setup_with_vault_and_donor("wardrobe", 250_000_000, 100_000_000);

    // Donate
    let donate = donate_ix(
        &denv.donor.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        donate_amount,
    );
    let tx1 = Transaction::new_signed_with_payer(
        &[donate],
        Some(&denv.donor.pubkey()),
        &[&denv.donor],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx1).unwrap();

    // First disburse — should succeed
    let disburse1 = disburse_ix(
        &denv.authority.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        &denv.recipient.pubkey(),
    );
    let tx2 = Transaction::new_signed_with_payer(
        &[disburse1],
        Some(&denv.authority.pubkey()),
        &[&denv.authority],
        denv.svm.latest_blockhash(),
    );
    denv.svm.send_transaction(tx2).unwrap();

    let state = read_vault_state(&denv.svm, &denv.vault_pda);
    assert!(state.disbursed);

    // Second disburse — should fail
    let disburse2 = disburse_ix(
        &denv.authority.pubkey(),
        &denv.slug,
        &denv.usdc_mint_pubkey,
        &denv.recipient.pubkey(),
    );
    let tx3 = Transaction::new_signed_with_payer(
        &[disburse2],
        Some(&denv.authority.pubkey()),
        &[&denv.authority],
        denv.svm.latest_blockhash(),
    );

    let result = denv.svm.send_transaction(tx3);
    assert!(
        result.is_err(),
        "Double disburse should fail but succeeded"
    );
}
