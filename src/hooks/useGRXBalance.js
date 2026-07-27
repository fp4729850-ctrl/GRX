import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { fetchGRXBalance } from '../services/grxChainService';
import { GRX_TOKEN_METADATA } from '../utils/constants';

export const useGRXBalance = (address) => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance('0');
      setError(null);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      // fetchGRXBalance handles all errors internally and returns '0' on failure
      // Connection refused errors are handled gracefully (expected when server is not running)
      const balance = await fetchGRXBalance(address);
      setBalance(balance || '0');
      setError(null); // Clear any previous errors
    } catch (err) {
      // This should rarely happen since fetchGRXBalance handles errors internally
      // But keep it as a safety net
      console.warn('Unexpected error in GRX balance fetch:', err.message);
      setError(null); // Don't show error for connection issues
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchBalance();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchBalance]);

  useEffect(() => {
    fetchBalance();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // DISABLED: Polling causes too many API calls
    // Only fetch on mount and when app comes to foreground
    // intervalRef.current = setInterval(fetchBalance, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchBalance]);

  return {
    balance,
    loading,
    refresh: fetchBalance,
    error,
    metadata: GRX_TOKEN_METADATA,
  };
};


