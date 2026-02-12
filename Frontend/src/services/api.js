import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getCurrentUser: () => api.get('/auth/me/'),
  changePassword: (passwordData) => api.post('/auth/change-password/', passwordData),
};

// Users API (pour récupérer la liste des utilisateurs)
export const usersAPI = {
  getAll: () => api.get('/auth/users/'),
  getById: (id) => api.get(`/auth/users/${id}/`),
  create: (data) => api.post('/auth/register/', data), 
  update: (id, data) => api.put(`/auth/users/${id}/`, data),
  delete: (id) => api.delete(`/auth/users/${id}/`),
};

// Elections API

export const electionsAPI = {
  getAll: (params) => api.get('/elections/', { params }),
  getById: (id) => api.get(`/elections/${id}/`),
  create: (data) => api.post('/elections/', data),
  update: (id, data) => api.put(`/elections/${id}/`, data),
  delete: (id) => api.delete(`/elections/${id}/`),
  open: (id) => api.post(`/elections/${id}/open/`),
  close: (id) => api.post(`/elections/${id}/close/`),
  getStats: (id) => api.get(`/elections/${id}/stats/`),
  assignVoters: (electionId, voterIds) => {
  return api.post('/elections/assign-voters/', {
    election_id: electionId,
    voter_ids: voterIds
  });
},
  getVoters: (id) => api.get(`/elections/${id}/voters/`),
};

// Candidates API
export const candidatesAPI = {
  getAll: (params) => api.get('/candidates/', { params }),
  getById: (id) => api.get(`/candidates/${id}/`),
  create: (data) => api.post('/candidates/', data),
  update: (id, data) => api.put(`/candidates/${id}/`, data),
  delete: (id) => api.delete(`/candidates/${id}/`),
  getByElection: (electionId) => api.get(`/candidates/election/${electionId}/`),
};

// Votes API
export const votesAPI = {
  submit: (voteData) => api.post('/votes/submit/', voteData),
  getMyVoteStatus: (electionId) => api.get('/votes/my-vote/', { params: { election_id: electionId } }),
  verifyReceipt: (receiptCode) => api.get('/votes/receipt/', { params: { code: receiptCode } }),
  
  // CO endpoints
  getPendingVotes: () => api.get('/votes/co/pending/'),
  verifyVote: (data) => api.post('/votes/co/verify/', data),
  
  // DE endpoints
  getPendingBallots: (electionId) => api.get('/votes/de/pending/', { params: { election_id: electionId } }),
  decryptBallot: (data) => api.post('/votes/de/decrypt/', data),
};

// Results API
export const resultsAPI = {
  calculate: (electionId) => api.post(`/results/calculate/${electionId}/`),
  publish: (electionId) => api.post(`/results/publish/${electionId}/`),
  getByElection: (electionId) => api.get(`/results/${electionId}/`),
  getPublished: () => api.get('/results/'),
};

export default api;