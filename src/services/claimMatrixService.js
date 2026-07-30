import { apiClient } from './apiClient';

export const claimMatrixService = {
  getMatrix: async () => {
    try {
      const response = await apiClient.get(`/api/ownership-data?t=${Date.now()}`);
      return response; // apiClient already returns response.data
    } catch (error) {
      console.error('Error fetching claim matrix:', error);
      throw error;
    }
  },

  initialMint: async (country, amount) => {
    try {
      const response = await apiClient.post('/api/ownership-data/mint', { country, amount });
      return response;
    } catch (error) {
      console.error('Error in initial mint:', error);
      throw error;
    }
  },

  transfer: async (fromCountry, toCountry, amount) => {
    try {
      const response = await apiClient.post('/api/ownership-data/transfer', { fromCountry, toCountry, amount });
      return response;
    } catch (error) {
      console.error('Error in transfer:', error);
      throw error;
    }
  }
};
