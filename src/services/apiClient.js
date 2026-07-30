import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getAuthToken, clearAuthToken } from './storageService';

const requireApiBase = () => {
  if (typeof window !== 'undefined') {
    return ''; // Use relative URL in browser to bypass DNS blocks via proxy
  }
  if (!API_BASE_URL) {
    throw new Error(
      'API base URL missing. Set EXPO_PUBLIC_API_BASE_URL to enable backend connectivity.',
    );
  }
  return API_BASE_URL;
};

const buildUrl = (path) => {
  const base = requireApiBase();
  // Allow caller to pass absolute URLs (e.g. http://...)
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const handleError = async (error) => {
  if (error.response?.status === 401) {
    // Clear token so app can force re-auth
    await clearAuthToken();
    const authError = new Error('Unauthorized');
    authError.isAuthError = true;
    authError.originalError = error;
    throw authError;
  }
  throw error;
};

const request = async ({ method, url, data, params, headers = {}, timeout = 10000 }) => {
  requireApiBase();
  const token = await getAuthToken();

  const finalHeaders = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  try {
    const response = await axios({
      method,
      url: buildUrl(url),
      data,
      params,
      headers: finalHeaders,
      timeout,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const apiClient = {
  get: (url, options = {}) => request({ method: 'GET', url, ...options }),
  post: (url, data, options = {}) => request({ method: 'POST', url, data, ...options }),
  patch: (url, data, options = {}) => request({ method: 'PATCH', url, data, ...options }),
  del: (url, options = {}) => request({ method: 'DELETE', url, ...options }),
  request,
};


