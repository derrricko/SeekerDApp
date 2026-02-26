import {createWalletAuthMessage} from '../services/auth';

describe('wallet auth message', () => {
  it('uses stable glimpse-auth prefix', () => {
    const message = createWalletAuthMessage(1700000000000);
    expect(message).toBe('glimpse-auth:1700000000000');
  });
});
