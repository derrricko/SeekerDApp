import {getExplorerTxUrl, getExplorerAddressUrl} from '../utils/explorer';

describe('explorer URL helpers', () => {
  it('builds a devnet transaction URL', () => {
    const url = getExplorerTxUrl('abc123');
    expect(url).toBe('https://explorer.solana.com/tx/abc123?cluster=devnet');
  });

  it('builds a devnet address URL', () => {
    const url = getExplorerAddressUrl('xyz789');
    expect(url).toBe(
      'https://explorer.solana.com/address/xyz789?cluster=devnet',
    );
  });
});
