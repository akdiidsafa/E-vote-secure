import apiClient from '../apiClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants';

export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    if (response.data.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },
};