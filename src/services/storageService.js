import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const isWeb = Platform.OS === 'web';

/**
 * Store mnemonic securely using Keychain (most secure) or AsyncStorage (web)
 */
export const storeMnemonic = async (mnemonic) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.MNEMONIC, mnemonic);
    } else {
      await Keychain.setGenericPassword('mnemonic', mnemonic, {
        service: 'grx_wallet_mnemonic',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    return true;
  } catch (error) {
    console.error('Error storing mnemonic:', error);
    throw error;
  }
};

/**
 * Retrieve mnemonic from secure storage
 */
export const getMnemonic = async () => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(STORAGE_KEYS.MNEMONIC);
    } else {
      const credentials = await Keychain.getGenericPassword({
        service: 'grx_wallet_mnemonic',
      });
      return credentials ? credentials.password : null;
    }
  } catch (error) {
    console.error('Error retrieving mnemonic:', error);
    return null;
  }
};

/**
 * Store private key securely
 */
export const storePrivateKey = async (privateKey) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, privateKey);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.PRIVATE_KEY, privateKey);
    }
    return true;
  } catch (error) {
    console.error('Error storing private key:', error);
    throw error;
  }
};

/**
 * Retrieve private key from secure storage
 */
export const getPrivateKey = async () => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
    } else {
      return await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);
    }
  } catch (error) {
    console.error('Error retrieving private key:', error);
    return null;
  }
};

/**
 * Store wallet address
 */
export const storeWalletAddress = async (address) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.WALLET_ADDRESS, address);
    }
    return true;
  } catch (error) {
    console.error('Error storing wallet address:', error);
    return false;
  }
};

/**
 * Get wallet address
 */
export const getWalletAddress = async () => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    } else {
      return await SecureStore.getItemAsync(STORAGE_KEYS.WALLET_ADDRESS);
    }
  } catch (error) {
    console.error('Error retrieving wallet address:', error);
    return null;
  }
};

/**
 * Store PIN hash
 */
export const storePINHash = async (pinHash) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_HASH, pinHash);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, pinHash);
    }
    return true;
  } catch (error) {
    console.error('Error storing PIN hash:', error);
    return false;
  }
};

/**
 * Get PIN hash
 */
export const getPINHash = async () => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(STORAGE_KEYS.PIN_HASH);
    } else {
      return await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
    }
  } catch (error) {
    console.error('Error retrieving PIN hash:', error);
    return null;
  }
};

/**
 * Store app lock state
 */
export const setAppLocked = async (locked) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCKED, locked.toString());
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.APP_LOCKED, locked.toString());
    }
    return true;
  } catch (error) {
    console.error('Error storing app lock state:', error);
    return false;
  }
};

/**
 * Get app lock state
 */
export const getAppLocked = async () => {
  try {
    if (isWeb) {
      const locked = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCKED);
      return locked === 'true';
    } else {
      const locked = await SecureStore.getItemAsync(STORAGE_KEYS.APP_LOCKED);
      return locked === 'true';
    }
  } catch (error) {
    return false;
  }
};

/**
 * Store biometric enabled state
 */
export const setBiometricEnabled = async (enabled) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
    }
    return true;
  } catch (error) {
    console.error('Error storing biometric state:', error);
    return false;
  }
};

/**
 * Get biometric enabled state
 */
export const getBiometricEnabled = async () => {
  try {
    if (isWeb) {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } else {
      const enabled = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    }
  } catch (error) {
    return false;
  }
};

/**
 * Store current network
 */
export const storeCurrentNetwork = async (network) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_NETWORK, network);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.CURRENT_NETWORK, network);
    }
    return true;
  } catch (error) {
    console.error('Error storing network:', error);
    return false;
  }
};

/**
 * Get current network
 */
export const getCurrentNetwork = async () => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_NETWORK);
    } else {
      return await SecureStore.getItemAsync(STORAGE_KEYS.CURRENT_NETWORK);
    }
  } catch (error) {
    return 'ETHEREUM'; // Default
  }
};

/**
 * Store testnet flag
 */
export const setIsTestnet = async (isTestnet) => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_TESTNET, isTestnet.toString());
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.IS_TESTNET, isTestnet.toString());
    }
    return true;
  } catch (error) {
    console.error('Error storing testnet flag:', error);
    return false;
  }
};

/**
 * Get testnet flag
 */
export const getIsTestnet = async () => {
  try {
    if (isWeb) {
      const isTestnet = await AsyncStorage.getItem(STORAGE_KEYS.IS_TESTNET);
      return isTestnet === 'true';
    } else {
      const isTestnet = await SecureStore.getItemAsync(STORAGE_KEYS.IS_TESTNET);
      return isTestnet === 'true';
    }
  } catch (error) {
    return false;
  }
};

/**
 * Clear all wallet data
 */
export const clearAllData = async () => {
  try {
    if (isWeb) {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.MNEMONIC,
        STORAGE_KEYS.PRIVATE_KEY,
        STORAGE_KEYS.WALLET_ADDRESS,
        STORAGE_KEYS.PIN_HASH,
        STORAGE_KEYS.APP_LOCKED,
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        STORAGE_KEYS.CURRENT_NETWORK,
        STORAGE_KEYS.IS_TESTNET,
      ]);
    } else {
      await Keychain.resetGenericPassword({ service: 'grx_wallet_mnemonic' });
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PRIVATE_KEY);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.WALLET_ADDRESS);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.APP_LOCKED);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.CURRENT_NETWORK);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.IS_TESTNET);
    }
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

