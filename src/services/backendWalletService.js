import { apiClient } from './apiClient';
import { API_BASE_URL } from '../utils/constants';

/**
 * Fetch wallets for the current authenticated user.
 */
export const fetchUserWallets = async () => {
  if (!API_BASE_URL) {
    return [];
  }

  const data = await apiClient.get('/api/wallets');
  // Backend may return an array directly or wrapped
  return data?.wallets || data || [];
};

/**
 * Register a newly created self-custody wallet with the backend.
 */
export const createBackendWallet = async ({ address, label, network, isTestnet }) => {
  if (!API_BASE_URL) {
    return null;
  }

  const payload = {
    address,
    label,
    network,
    isTestnet,
  };

  return apiClient.post('/api/wallets', payload);
};

/**
 * Register an imported wallet with the backend.
 */
export const importBackendWallet = async ({ address, label, network, isTestnet }) => {
  if (!API_BASE_URL) {
    return null;
  }

  const payload = {
    address,
    label,
    network,
    isTestnet,
  };

  return apiClient.post('/api/wallets/import', payload);
};


