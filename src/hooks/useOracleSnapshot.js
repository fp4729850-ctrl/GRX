import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchOracleSnapshot } from '../services/oracleSnapshotService';

// Configurable poll interval (default 30 seconds)
const DEFAULT_POLL_INTERVAL = 30000;

// Deterministic sample snapshot for SANDBOX mode
const getDeterministicSnapshot = () => ({
  id: 'sandbox-snapshot-001',
  timestamp: new Date().toISOString(),
  goldPerGramUSD: 62.5,
  fx: {
    INR: 83.5,
    AED: 3.67,
    RUB: 92.0,
    CNY: 7.25,
  },
  signature: '0x' + 'a'.repeat(130), // Mock signature
  sources: ['LBMA', 'COMEX'],
});

export const useOracleSnapshot = (pollInterval = DEFAULT_POLL_INTERVAL, forceRefresh = false) => {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const isSandbox = typeof process !== 'undefined' && process.env?.SANDBOX === 'true';

  const fetchSnapshot = useCallback(async () => {
    if (isSandbox) {
      // Return deterministic snapshot immediately in sandbox mode
      setSnapshot(getDeterministicSnapshot());
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchOracleSnapshot();
      if (data) {
        setSnapshot({
          id: data?.id || data?.snapshotId,
          timestamp: data?.timestamp || data?.updatedAt,
          goldPerGramUSD: data?.goldPerGramUSD || data?.goldPriceUSD,
          fx: typeof data?.fx === 'string' ? JSON.parse(data.fx) : data?.fx || {},
          signature: data?.signature,
          sources: data?.sources || data?.source ? [data.source] : [],
        });
      } else {
        // API base URL not configured or no data available
        setSnapshot(null);
        setError(null); // Don't show error if API is not configured
      }
    } catch (err) {
      console.error('Oracle snapshot fetch failed:', err);
      setError(err.message || 'Failed to fetch oracle snapshot');
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [isSandbox]);

  useEffect(() => {
    // Initial fetch
    fetchSnapshot();

    // Set up polling if interval is provided and > 0
    if (pollInterval > 0 && !isSandbox) {
      intervalRef.current = setInterval(fetchSnapshot, pollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSnapshot, pollInterval, isSandbox]);

  // Force refresh function
  const refresh = useCallback(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  return {
    snapshot,
    loading,
    error,
    refresh,
  };
};

