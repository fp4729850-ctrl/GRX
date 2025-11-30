import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchGrxPricing, PRICING_CACHE_TTL_MS } from '../services/grxPricingService';

export interface GrxPricingSnapshot {
  id?: string;
  lastUpdated?: string;
  goldPerGramUSD: number;
  fx?: Record<string, number | string>;
  signature?: string | null;
}

export interface UseGrxPricingResult {
  pricing: GrxPricingSnapshot | null;
  loading: boolean;
  error: unknown;
  stale: boolean;
  warning: string | null;
  refresh: () => void;
}

const REFRESH_INTERVAL = PRICING_CACHE_TTL_MS;

export const useGrxPricing = (): UseGrxPricingResult => {
  const [pricing, setPricing] = useState<GrxPricingSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const [stale, setStale] = useState<boolean>(false);
  const [warning, setWarning] = useState<string | null>(null);
  const refreshRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(
    async (options: { forceRefresh?: boolean } = {}) => {
      setLoading(true);
      try {
        const { data, stale: staleFlag, meta } = await fetchGrxPricing(options);
        setPricing(data);
        setStale(Boolean(staleFlag));
        setWarning(meta?.warning || null);
        setError(meta?.error || null);
      } catch (err) {
        console.error('Pricing hook failed:', err);
        setError(err);
        setStale(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
    // DISABLED: Automatic polling causes too many API calls
    // refreshRef.current = setInterval(() => {
    //   load({ forceRefresh: true });
    // }, REFRESH_INTERVAL);

    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
      }
    };
  }, [load]);

  const refresh = useCallback(() => load({ forceRefresh: true }), [load]);

  return {
    pricing,
    loading,
    error,
    stale,
    warning,
    refresh,
  };
};


