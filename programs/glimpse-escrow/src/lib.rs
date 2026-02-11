use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE");

#[program]
pub mod glimpse_escrow {
    use super::*;

    pub fn initialize_need(
        ctx: Context<InitializeNeed>,
        slug: String,
        target: u64,
        disburse_to: Pubkey,
    ) -> Result<()> {
        instructions::initialize_need::handler(ctx, slug, target, disburse_to)
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        instructions::donate::handler(ctx, amount)
    }

    pub fn disburse(ctx: Context<Disburse>) -> Result<()> {
        instructions::disburse::handler(ctx)
    }
}
