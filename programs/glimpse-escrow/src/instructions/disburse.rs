use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::NeedVault;
use crate::error::GlimpseError;

#[derive(Accounts)]
pub struct Disburse<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"need", vault.slug.as_bytes()],
        bump = vault.bump,
        has_one = authority @ GlimpseError::Unauthorized,
    )]
    pub vault: Account<'info, NeedVault>,

    /// USDC mint
    pub usdc_mint: Account<'info, Mint>,

    /// Vault's USDC associated token account
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    /// Fulfillment partner's USDC associated token account
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = disburse_to,
    )]
    pub disburse_ata: Account<'info, TokenAccount>,

    /// CHECK: Validated against vault.disburse_to
    #[account(
        constraint = disburse_to.key() == vault.disburse_to @ GlimpseError::Unauthorized,
    )]
    pub disburse_to: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Disburse>) -> Result<()> {
    require!(!ctx.accounts.vault.disbursed, GlimpseError::AlreadyDisbursed);

    let vault = &ctx.accounts.vault;
    let amount = ctx.accounts.vault_ata.amount;

    // PDA signer seeds
    let slug_bytes = vault.slug.as_bytes();
    let bump = &[vault.bump];
    let seeds: &[&[u8]] = &[b"need", slug_bytes, bump];
    let signer_seeds = &[seeds];

    // Transfer all USDC from vault to fulfillment partner
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_ata.to_account_info(),
        to: ctx.accounts.disburse_ata.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, amount)?;

    // Mark as disbursed
    let vault_mut = &mut ctx.accounts.vault;
    vault_mut.disbursed = true;

    Ok(())
}
