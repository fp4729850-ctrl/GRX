import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  getWalletAddress,
  getCurrentNetwork,
  getIsTestnet,
  getPrivateKey,
  storeCurrentNetwork,
  setIsTestnet as storeIsTestnet,
} from '../services/storageService';
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

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  // Update balances when network or address changes
  useEffect(() => {
    if (walletAddress) {
      refreshBalances();
      refreshPrices();
    }
  }, [walletAddress, currentNetwork, isTestnet]);

  const loadWalletData = async () => {
    try {
      const address = await getWalletAddress();
      const network = await getCurrentNetwork();
      const testnet = await getIsTestnet();
      const pk = await getPrivateKey();

      if (address) {
        setWalletAddress(address);
        setCurrentNetwork(network || 'ETHEREUM');
        setIsTestnet(testnet || false);
        setPrivateKey(pk);
        setIsWalletInitialized(true);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const refreshBalances = async () => {
    if (!walletAddress) return;

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

      // Get USDT balance
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
    initializeWallet,
    clearWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

