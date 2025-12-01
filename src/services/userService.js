import { apiClient } from './apiClient';
import { API_BASE_URL } from '../utils/constants';

export const fetchUserProfile = async () => {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const data = await apiClient.get('/api/users/me', {
      timeout: 5000,
    });
    return data;
  } catch (error) {
    console.warn('User profile fetch failed:', error?.message);
    return null;
  }
};


