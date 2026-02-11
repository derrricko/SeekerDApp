use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::NeedVault;
use crate::error::GlimpseError;

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"need", vault.slug.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, NeedVault>,

    /// USDC mint
    pub usdc_mint: Account<'info, Mint>,

    /// Donor's USDC associated token account
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = donor,
    )]
    pub donor_ata: Account<'info, TokenAccount>,

    /// Vault's USDC associated token account
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Donate>, amount: u64) -> Result<()> {
    require!(amount > 0, GlimpseError::ZeroAmount);
    require!(!ctx.accounts.vault.disbursed, GlimpseError::AlreadyDisbursed);

    // Transfer USDC from donor to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.donor_ata.to_account_info(),
        to: ctx.accounts.vault_ata.to_account_info(),
        authority: ctx.accounts.donor.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // Update funded counter with checked math
    let vault = &mut ctx.accounts.vault;
    vault.funded = vault
        .funded
        .checked_add(amount)
        .ok_or(GlimpseError::Overflow)?;

    Ok(())
}
