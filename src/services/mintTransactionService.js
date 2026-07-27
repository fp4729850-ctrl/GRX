import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const serialize = (value) => JSON.stringify(value);

export const getMintTransactions = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.MINT_TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load mint transactions:', error);
    return [];
  }
};

export const saveMintTransaction = async (transaction) => {
  try {
    const previous = await getMintTransactions();
    const updated = [transaction, ...previous].slice(0, 50); // Keep last 50 transactions
    await AsyncStorage.setItem(STORAGE_KEYS.MINT_TRANSACTIONS, serialize(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save mint transaction:', error);
    throw error;
  }
};

export const clearMintTransactions = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.MINT_TRANSACTIONS);
  } catch (error) {
    console.error('Failed to clear mint transactions:', error);
  }
};

