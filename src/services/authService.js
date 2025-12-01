import { apiClient } from './apiClient';
import { storeAuthToken, clearAuthToken } from './storageService';

// DTO shapes follow backend: RegisterDto, LoginDto, Enable2FADto, etc.

export const register = async (payload) => {
  // payload: { email, password, firstName, lastName, phone? }
  const data = await apiClient.post('/api/auth/register', payload);
  return data;
};

export const login = async (payload) => {
  // payload: { email, password, twoFactorCode? }
  const data = await apiClient.post('/api/auth/login', payload);

  if (data?.accessToken) {
    await storeAuthToken(data.accessToken);
  }

  return data;
};

export const verify2FA = async (payload) => {
  // payload: { code }
  const data = await apiClient.post('/api/auth/2fa/verify', payload);

  if (data?.accessToken) {
    await storeAuthToken(data.accessToken);
  }

  return data;
};

export const getCurrentUserProfile = async () => {
  // Prefer auth profile first, fall back to users/me
  try {
    return await apiClient.get('/api/auth/profile');
  } catch (error) {
    // If 404 or route not available, try /api/users/me
    if (error.response?.status === 404) {
      return apiClient.get('/api/users/me');
    }
    throw error;
  }
};

export const logout = async () => {
  await clearAuthToken();
};


