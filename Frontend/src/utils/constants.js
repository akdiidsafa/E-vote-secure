// User Roles
export const ROLES = {
  ADMIN: 'admin',
  VOTER: 'voter',
  CO: 'co',
  DE: 'de',
};

// Election Status
export const ELECTION_STATUS = {
  DRAFT: 'draft',
  WAITING: 'waiting',
  OPEN: 'open',
  EN_COURS: 'en_cours',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    VERIFY_TOKEN: '/api/auth/verify',
  },
  ELECTIONS: {
    LIST: '/api/elections',
    DETAIL: (id) => `/api/elections/${id}`,
    CREATE: '/api/elections/create',
    OPEN: (id) => `/api/elections/${id}/open`,
    CLOSE: (id) => `/api/elections/${id}/close`,
  },
  VOTES: {
    SUBMIT: '/api/votes/submit',
    MY_VOTE: '/api/votes/my-vote',
  },
  CO: {
    PENDING_VOTES: '/api/co/pending-votes',
    VERIFY_IDENTITY: (id) => `/api/co/verify/${id}`,
  },
  DE: {
    PENDING_BALLOTS: '/api/de/pending-ballots',
    SUBMIT_RESULTS: '/api/de/submit-results',
  },
  KEYS: {
    CO_PUBLIC: '/api/keys/co/public',
    DE_PUBLIC: '/api/keys/de/public',
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
};