/**
 * Hook to load needs from Supabase with static fallback.
 */

import {useState, useEffect} from 'react';
import {fetchActiveNeeds} from '../services/needs';
import {NEEDS} from '../data/content';
import type {Need} from '../data/content';

export function useNeeds() {
  const [needs, setNeeds] = useState<Need[]>(NEEDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchActiveNeeds();
        if (!cancelled) {
          setNeeds(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load needs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveNeeds();
      setNeeds(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load needs');
    } finally {
      setLoading(false);
    }
  };

  return {needs, loading, error, refresh};
}
