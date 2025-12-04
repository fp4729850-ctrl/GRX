import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import {
  getWalletAddress,
  getMnemonic,
  getCustodialMode,
  setCustodialMode as storeCustodialMode,
  storeWalletAddress,
} from '../services/storageService';
import { fetchUserWallets } from '../services/backendWalletService';
import { fetchGRXBalance, getCosmosAddress } from '../services/grxChainService';

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
  const [grxBalance, setGrxBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [isWalletInitialized, setIsWalletInitialized] = useState(false);
  const [custodialMode, setCustodialModeState] = useState(false);
  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  // Update balances when address changes (with debounce)
  useEffect(() => {
    if (walletAddress) {
      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      // Increased debounce to 3 seconds to avoid rate limiting
      refreshTimeoutRef.current = setTimeout(() => {
        refreshBalances();
      }, 3000);
    }
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [walletAddress]);

  const loadWalletData = async () => {
    try {
      let address = await getWalletAddress();
      const custodial = await getCustodialMode();

      // If no local address, try to derive from mnemonic
      if (!address) {
        try {
          const mnemonic = await getMnemonic();
          if (mnemonic) {
            // Derive Cosmos address from mnemonic
            address = await getCosmosAddress(mnemonic);
            if (address) {
              await storeWalletAddress(address);
            }
          }
        } catch (mnemonicError) {
          console.warn('Could not derive address from mnemonic:', mnemonicError?.message);
        }

        // If still no address, try backend
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
      }

      if (address) {
        setWalletAddress(address);
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
      // Fetch GRX balance from Cosmos REST API
      const balance = await fetchGRXBalance(walletAddress);
      setGrxBalance(balance || '0');
    } catch (error) {
      console.error('Error refreshing GRX balance:', error);
      setGrxBalance('0');
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  };

  const updateCustodialMode = async (enabled) => {
    await storeCustodialMode(enabled);
    setCustodialModeState(enabled);
  };

  const initializeWallet = (address) => {
    setWalletAddress(address);
    setIsWalletInitialized(true);
  };

  const clearWallet = () => {
    setWalletAddress(null);
    setGrxBalance('0');
    setIsWalletInitialized(false);
  };

  const value = {
    walletAddress,
    grxBalance,
    loading,
    isWalletInitialized,
    refreshBalances,
    custodialMode,
    updateCustodialMode,
    initializeWallet,
    clearWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

