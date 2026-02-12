import apiClient from '../apiClient';
import { API_ENDPOINTS } from '@/utils/constants';

export const votesAPI = {
  submit: async (votePackage) => {
    const response = await apiClient.post(API_ENDPOINTS.VOTES.SUBMIT, votePackage);
    return response.data;
  },

  getMyVote: async (electionId) => {
    const response = await apiClient.get(API_ENDPOINTS.VOTES.MY_VOTE, {
      params: { election_id: electionId },
    });
    return response.data;
  },
};

export const coAPI = {
  getPendingVotes: async () => {
    const response = await apiClient.get(API_ENDPOINTS.CO.PENDING_VOTES);
    return response.data;
  },

  verifyIdentity: async (voteId, verification) => {
    const response = await apiClient.post(
      API_ENDPOINTS.CO.VERIFY_IDENTITY(voteId),
      verification
    );
    return response.data;
  },
};

export const deAPI = {
  getPendingBallots: async (electionId) => {
    const response = await apiClient.get(API_ENDPOINTS.DE.PENDING_BALLOTS, {
      params: { election_id: electionId },
    });
    return response.data;
  },

  submitResults: async (electionId, results) => {
    const response = await apiClient.post(API_ENDPOINTS.DE.SUBMIT_RESULTS, {
      election_id: electionId,
      results,
    });
    return response.data;
  },
};