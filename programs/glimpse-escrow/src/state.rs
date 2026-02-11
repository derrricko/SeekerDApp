use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct NeedVault {
    /// Admin authority who created this vault
    pub authority: Pubkey,
    /// Unique slug identifying this need (e.g. "shower", "groceries")
    #[max_len(32)]
    pub slug: String,
    /// Target amount in USDC base units (6 decimals)
    pub target: u64,
    /// Total funded so far in USDC base units
    pub funded: u64,
    /// Wallet to disburse funds to (fulfillment partner)
    pub disburse_to: Pubkey,
    /// Whether funds have been disbursed
    pub disbursed: bool,
    /// PDA bump seed
    pub bump: u8,
}
