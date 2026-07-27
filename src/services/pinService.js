import { getPINHash, storePINHash } from './storageService';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../utils/constants';

const isWeb = Platform.OS === 'web';

// PIN verification expires after 12 hours
const PIN_VERIFICATION_EXPIRY_HOURS = 12;

/**
 * Store PIN last verified timestamp
 */
export const storePINVerifiedTimestamp = async () => {
  try {
    const timestamp = Date.now().toString();
    if (isWeb) {
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_VERIFIED_TIMESTAMP, timestamp);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_VERIFIED_TIMESTAMP, timestamp);
    }
    return true;
  } catch (error) {
    console.error('Error storing PIN verified timestamp:', error);
    return false;
  }
};

/**
 * Get PIN last verified timestamp
 */
export const getPINVerifiedTimestamp = async () => {
  try {
    if (isWeb) {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.PIN_VERIFIED_TIMESTAMP);
      return timestamp ? parseInt(timestamp, 10) : null;
    } else {
      const timestamp = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_VERIFIED_TIMESTAMP);
      return timestamp ? parseInt(timestamp, 10) : null;
    }
  } catch (error) {
    console.error('Error retrieving PIN verified timestamp:', error);
    return null;
  }
};

/**
 * Check if PIN verification is still valid (within 12 hours)
 */
export const isPINVerificationValid = async () => {
  try {
    const timestamp = await getPINVerifiedTimestamp();
    if (!timestamp) {
      return false;
    }

    const now = Date.now();
    const hoursSinceVerification = (now - timestamp) / (1000 * 60 * 60);
    
    return hoursSinceVerification < PIN_VERIFICATION_EXPIRY_HOURS;
  } catch (error) {
    console.error('Error checking PIN verification:', error);
    return false;
  }
};

/**
 * Verify PIN
 */
export const verifyPIN = async (pin) => {
  try {
    const storedPINHash = await getPINHash();
    if (!storedPINHash) {
      return { success: false, error: 'PIN not set' };
    }

    // Simple comparison (in production, use proper hashing)
    if (pin === storedPINHash) {
      // Store verification timestamp
      await storePINVerifiedTimestamp();
      return { success: true };
    }

    return { success: false, error: 'Invalid PIN' };
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return { success: false, error: 'PIN verification failed' };
  }
};

/**
 * Set/Update PIN
 */
export const setPIN = async (pin) => {
  try {
    if (!pin || pin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits' };
    }

    // Store PIN (in production, hash it properly)
    await storePINHash(pin);
    
    // Store verification timestamp when PIN is set
    await storePINVerifiedTimestamp();
    
    return { success: true };
  } catch (error) {
    console.error('Error setting PIN:', error);
    return { success: false, error: 'Failed to set PIN' };
  }
};

/**
 * Check if PIN is set
 */
export const isPINSet = async () => {
  try {
    const pinHash = await getPINHash();
    return !!pinHash;
  } catch (error) {
    return false;
  }
};

/**
 * Clear PIN verification (force re-verification)
 */
export const clearPINVerification = async () => {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(STORAGE_KEYS.PIN_VERIFIED_TIMESTAMP);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_VERIFIED_TIMESTAMP);
    }
    return true;
  } catch (error) {
    console.error('Error clearing PIN verification:', error);
    return false;
  }
};

