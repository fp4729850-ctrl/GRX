import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { ethers } from 'ethers';
import { getProvider } from '../services/networkService';
import GRXToken from '../abis/GRXToken.json';
import { GRX_TOKEN_ADDRESSES, GRX_TOKEN_METADATA } from '../utils/constants';

const { abi: GRX_ABI } = GRXToken;

const resolveGrxAddress = (networkKey = 'ETHEREUM', isTestnet = false) => {
  const normalized = networkKey?.toUpperCase() === 'BSC' ? 'BSC' : 'ETHEREUM';
  const bucket = GRX_TOKEN_ADDRESSES[normalized];
  if (!bucket) return null;
  return isTestnet ? bucket.testnet : bucket.mainnet;
};

export const useGRXBalance = (address, networkKey = 'ETHEREUM', isTestnet = false) => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance('0');
      return;
    }

    const tokenAddress = resolveGrxAddress(networkKey, isTestnet);
    if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
      setError('GRX contract address missing for selected network');
      setBalance('0');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const provider = getProvider(networkKey, isTestnet);
      const contract = new ethers.Contract(tokenAddress, GRX_ABI, provider);
      const rawBalance = await contract.balanceOf(address);
      const formatted = ethers.formatUnits(rawBalance, GRX_TOKEN_METADATA.decimals);
      setBalance(formatted);
    } catch (err) {
      console.error('GRX balance fetch failed:', err);
      setError(err.message || 'Unable to fetch GRX balance');
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [address, networkKey, isTestnet]);

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


