import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const fetchUserProfile = async () => {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/users/me`, {
      timeout: 5000,
      withCredentials: true,
    });
    return data;
  } catch (error) {
    console.warn('User profile fetch failed:', error?.message);
    return null;
  }
};


