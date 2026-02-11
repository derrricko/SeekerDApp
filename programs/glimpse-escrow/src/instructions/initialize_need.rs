use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::NeedVault;

#[derive(Accounts)]
#[instruction(slug: String)]
pub struct InitializeNeed<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + NeedVault::INIT_SPACE,
        seeds = [b"need", slug.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, NeedVault>,

    /// The USDC mint
    pub usdc_mint: Account<'info, Mint>,

    /// The vault's associated token account for USDC
    #[account(
        init,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeNeed>,
    slug: String,
    target: u64,
    disburse_to: Pubkey,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.slug = slug;
    vault.target = target;
    vault.funded = 0;
    vault.disburse_to = disburse_to;
    vault.disbursed = false;
    vault.bump = ctx.bumps.vault;
    Ok(())
}
