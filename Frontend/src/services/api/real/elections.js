import apiClient from '../apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const electionsAPI = {
  getAll: async (filters = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.ELECTIONS.LIST, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.ELECTIONS.DETAIL(id));
    return response.data;
  },

  getCandidates: async (electionId) => {
    const response = await apiClient.get(`/api/elections/${electionId}/candidates`);
    return response.data;
  },
};