use anchor_lang::prelude::*;

/// Devnet USDC mint address.
/// Update to EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v for mainnet-beta.
pub const USDC_MINT: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

/// Admin wallet — only this key can initialize new vaults.
/// This is the deployer wallet (HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5).
pub const ADMIN_PUBKEY: Pubkey = pubkey!("HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5");
