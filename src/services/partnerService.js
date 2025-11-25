import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const fetchPayoutStatus = async (invoiceId) => {
  if (!invoiceId) {
    throw new Error('Invoice ID is required');
  }

  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured');
  }

  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/partner/payout-status`, {
      params: { invoiceId },
      timeout: 8000,
      withCredentials: true,
    });
    return data;
  } catch (error) {
    console.error('Payout status fetch failed:', error);
    throw error;
  }
};


