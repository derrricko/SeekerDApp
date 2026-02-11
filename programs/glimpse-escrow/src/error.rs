use anchor_lang::prelude::*;

#[error_code]
pub enum GlimpseError {
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Funds have already been disbursed")]
    AlreadyDisbursed,
    #[msg("Donation amount must be greater than zero")]
    ZeroAmount,
    #[msg("Unauthorized — only the vault authority can perform this action")]
    Unauthorized,
    #[msg("Invalid USDC mint address")]
    InvalidMint,
    #[msg("Slug must be 1-32 bytes")]
    InvalidSlug,
}
