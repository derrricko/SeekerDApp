import {parseEnhancedTransaction} from '../../services/helius';

describe('parseEnhancedTransaction', () => {
  it('extracts donation data from enhanced transaction', () => {
    const enhanced = {
      signature: 'abc123',
      timestamp: 1709000000,
      type: 'TRANSFER',
      source: 'SYSTEM_PROGRAM',
      nativeTransfers: [],
      tokenTransfers: [
        {
          fromUserAccount: 'DonorWallet111',
          toUserAccount: 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          tokenAmount: 5.0,
          tokenStandard: 'Fungible',
        },
      ],
      events: {},
    };

    const result = parseEnhancedTransaction(enhanced);
    expect(result).not.toBeNull();
    expect(result!.signature).toBe('abc123');
    expect(result!.amountUSDC).toBe(5.0);
    expect(result!.donorWallet).toBe('DonorWallet111');
    expect(result!.verified).toBe(true);
    expect(result!.timestamp).toBe(1709000000);
  });

  it('returns null for non-USDC transfers', () => {
    const enhanced = {
      signature: 'abc123',
      timestamp: 1709000000,
      type: 'TRANSFER',
      source: 'SYSTEM_PROGRAM',
      nativeTransfers: [],
      tokenTransfers: [
        {
          fromUserAccount: 'DonorWallet111',
          toUserAccount: 'SomeOtherWallet',
          mint: 'NotUSDC',
          tokenAmount: 5.0,
          tokenStandard: 'Fungible',
        },
      ],
      events: {},
    };

    const result = parseEnhancedTransaction(enhanced);
    expect(result).toBeNull();
  });

  it('returns null for empty tokenTransfers', () => {
    const enhanced = {
      signature: 'abc123',
      timestamp: 1709000000,
      tokenTransfers: [],
    };
    expect(parseEnhancedTransaction(enhanced)).toBeNull();
  });

  it('returns null for missing tokenTransfers', () => {
    const enhanced = {signature: 'abc123', timestamp: 1709000000};
    expect(parseEnhancedTransaction(enhanced)).toBeNull();
  });
});
