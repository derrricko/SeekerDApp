/**
 * Hook to load transaction history for the current wallet.
 */

import {useState, useEffect, useCallback} from 'react';
import {fetchMyTransactions, TransactionRecord} from '../services/transactions';

export function useTransactions(walletAddress: string | null) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyTransactions(walletAddress);
      setTransactions(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    load();
  }, [load]);

  return {transactions, loading, error, refresh: load};
}
