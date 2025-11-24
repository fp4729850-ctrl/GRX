import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { STORAGE_KEYS, API_BASE_URL } from '../utils/constants';

const serialize = (value) => JSON.stringify(value);

export const getInvoices = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load invoices:', error);
    return [];
  }
};

export const saveInvoice = async (invoice) => {
  try {
    const previous = await getInvoices();
    const updated = [invoice, ...previous].slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, serialize(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save invoice:', error);
    throw error;
  }
};

export const clearInvoices = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.INVOICES);
  } catch (error) {
    console.error('Failed to clear invoices:', error);
  }
};

/**
 * Creates an invoice on the backend after a successful burn transaction
 * @param {Object} invoiceData - Invoice data including snapshot info
 * @param {string} invoiceData.invoiceId - Generated invoice ID (keccak256 hash)
 * @param {string} invoiceData.txHash - Transaction hash
 * @param {string} invoiceData.snapshotId - Oracle snapshot ID
 * @param {string} invoiceData.snapshotSignature - Oracle snapshot signature
 * @param {string|bigint} invoiceData.amountWei - Amount in Wei
 * @param {string} invoiceData.timestamp - ISO timestamp
 * @param {string} invoiceData.sender - Sender wallet address
 * @returns {Promise<Object>} Created invoice response
 */
export const createBackendInvoice = async (invoiceData) => {
  if (!API_BASE_URL) {
    console.warn('API_BASE_URL not configured, skipping backend invoice creation');
    return null;
  }

  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/invoice/create`, {
      invoiceId: invoiceData.invoiceId,
      txHash: invoiceData.txHash,
      snapshotId: invoiceData.snapshotId,
      snapshotSignature: invoiceData.snapshotSignature,
      amountWei: invoiceData.amountWei.toString(),
      timestamp: invoiceData.timestamp,
      sender: invoiceData.sender,
    });
    return data;
  } catch (error) {
    console.error('Failed to create backend invoice:', error);
    // Don't throw - allow local save even if backend fails
    throw error;
  }
};


