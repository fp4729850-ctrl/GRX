import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const requireApiBase = () => {
  if (!API_BASE_URL) {
    throw new Error(
      "API base URL missing. Set EXPO_PUBLIC_API_BASE_URL to enable custodial invoice flows."
    );
  }
  return API_BASE_URL;
};

export const fetchBackendInvoices = async ({ address }) => {
  // Return empty array gracefully if API base URL is not configured
  if (!API_BASE_URL) {
    return [];
  }
  
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/invoice`, {
      params: { address },
    });
    return data?.invoices || data || [];
  } catch (error) {
    // Re-throw to let caller handle it
    throw error;
  }
};

export const fetchBackendInvoiceDetail = async (invoiceId) => {
  // Return null gracefully if API base URL is not configured
  if (!API_BASE_URL) {
    return null;
  }
  
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/invoice/${invoiceId}`);
    return data;
  } catch (error) {
    // Re-throw to let caller handle it
    throw error;
  }
};

export const fetchPayoutStatus = async (invoiceId) => {
  // Return null gracefully if API base URL is not configured
  if (!API_BASE_URL) {
    return null;
  }
  
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/partner/payout-status`, {
      params: { invoiceId },
    });
    return data;
  } catch (error) {
    // Return null if payout status not available (invoice might not have payout yet)
    if (error.response?.status === 404) {
      return null;
    }
    // Silently return null for other errors (network issues, etc.)
    console.warn(`Failed to fetch payout status for invoice ${invoiceId}:`, error.message);
    return null;
  }
};


