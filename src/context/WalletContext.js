import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import {
  getWalletAddress,
  getCurrentNetwork,
  getIsTestnet,
  getPrivateKey,
  storeCurrentNetwork,
  setIsTestnet as storeIsTestnet,
  getCustodialMode,
  setCustodialMode as storeCustodialMode,
  storeWalletAddress,
} from '../services/storageService';
import { fetchUserWallets } from '../services/backendWalletService';
import { getBalance, getTokenBalance } from '../services/networkService';
import { fetchTokenPrices } from '../services/priceService';
import { formatBalance } from '../utils/validation';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState('ETHEREUM'); // 'ETHEREUM' or 'BSC'
  const [isTestnet, setIsTestnet] = useState(false);
  const [ethBalance, setEthBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [ethBalanceUSD, setEthBalanceUSD] = useState('0');
  const [usdtBalanceUSD, setUsdtBalanceUSD] = useState('0');
  const [prices, setPrices] = useState({ eth: 0, usdt: 1 });
  const [loading, setLoading] = useState(false);
  const [isWalletInitialized, setIsWalletInitialized] = useState(false);
  const [custodialMode, setCustodialModeState] = useState(false);
  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  // Update balances when network or address changes (with debounce)
  useEffect(() => {
    if (walletAddress) {
      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      // Increased debounce to 3 seconds to avoid rate limiting
      refreshTimeoutRef.current = setTimeout(() => {
        refreshBalances();
        refreshPrices();
      }, 3000);
    }
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [walletAddress, currentNetwork, isTestnet]);

  const loadWalletData = async () => {
    try {
      let address = await getWalletAddress();
      const network = await getCurrentNetwork();
      const testnet = await getIsTestnet();
      const custodial = await getCustodialMode();
      const pk = await getPrivateKey();

      // If no local address but backend is available and user is authenticated,
      // try to pull the primary wallet from the backend.
      if (!address) {
        try {
          const wallets = await fetchUserWallets();
          if (wallets && wallets.length > 0) {
            const primary = wallets[0];
            if (primary?.address) {
              address = primary.address;
              // Persist so subsequent app launches have fast local access
              await storeWalletAddress(primary.address);
            }
          }
        } catch (backendError) {
          // Silent failure – backend might not be configured or user not logged in yet
          console.warn('Backend wallet sync skipped:', backendError?.message);
        }
      }

      if (address) {
        setWalletAddress(address);
        setCurrentNetwork(network || 'ETHEREUM');
        setIsTestnet(testnet || false);
        setPrivateKey(pk);
        setIsWalletInitialized(true);
        setCustodialModeState(!!custodial);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const refreshBalances = async () => {
    if (!walletAddress) return;
    
    // Prevent multiple simultaneous calls
    if (isRefreshingRef.current) {
      console.log('Balance refresh already in progress, skipping...');
      return;
    }

    isRefreshingRef.current = true;
    setLoading(true);
    try {
      // Get native token balance
      try {
        const nativeBalance = await getBalance(walletAddress, currentNetwork, isTestnet);
        setEthBalance(formatBalance(nativeBalance));
      } catch (error) {
        console.error('Error fetching native balance:', error);
        setEthBalance('0');
      }

      // Get USDT balance with delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const tokenData = await getTokenBalance(walletAddress, currentNetwork, isTestnet);
        setUsdtBalance(formatBalance(tokenData.balance, tokenData.decimals));
      } catch (error) {
        console.error('Error fetching USDT balance:', error);
        setUsdtBalance('0');
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
      // Set balances to zero on any error
      setEthBalance('0');
      setUsdtBalance('0');
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  };

  const refreshPrices = async () => {
    try {
      const priceData = await fetchTokenPrices();
      setPrices(priceData);

      // Update USD balances
      const ethUSD = (parseFloat(ethBalance) * priceData.eth).toFixed(2);
      const usdtUSD = (parseFloat(usdtBalance) * priceData.usdt).toFixed(2);
      setEthBalanceUSD(ethUSD);
      setUsdtBalanceUSD(usdtUSD);
    } catch (error) {
      console.error('Error refreshing prices:', error);
    }
  };

  const updateNetwork = async (network, testnet) => {
    await storeCurrentNetwork(network);
    await storeIsTestnet(testnet);
    setCurrentNetwork(network);
    setIsTestnet(testnet);
    await refreshBalances();
  };

  const updateCustodialMode = async (enabled) => {
    await storeCustodialMode(enabled);
    setCustodialModeState(enabled);
  };

  const initializeWallet = (address, pk) => {
    setWalletAddress(address);
    setPrivateKey(pk);
    setIsWalletInitialized(true);
  };

  const clearWallet = () => {
    setWalletAddress(null);
    setPrivateKey(null);
    setEthBalance('0');
    setUsdtBalance('0');
    setEthBalanceUSD('0');
    setUsdtBalanceUSD('0');
    setIsWalletInitialized(false);
  };

  const value = {
    walletAddress,
    privateKey,
    currentNetwork,
    isTestnet,
    ethBalance,
    usdtBalance,
    ethBalanceUSD,
    usdtBalanceUSD,
    prices,
    loading,
    isWalletInitialized,
    refreshBalances,
    refreshPrices,
    updateNetwork,
    custodialMode,
    updateCustodialMode,
    initializeWallet,
    clearWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

