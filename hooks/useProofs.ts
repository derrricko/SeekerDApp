/**
 * Hook to load proof media for a specific need.
 */

import {useState, useEffect, useCallback} from 'react';
import {fetchProofsForNeed, Proof} from '../services/proofs';

export function useProofs(needId: string | null) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!needId) {
      setProofs([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchProofsForNeed(needId);
      setProofs(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load proofs');
    } finally {
      setLoading(false);
    }
  }, [needId]);

  useEffect(() => {
    load();
  }, [load]);

  return {proofs, loading, error, refresh: load};
}
