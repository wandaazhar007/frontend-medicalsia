import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

// Attach the current Firebase ID token to every request — the backend
// resolves the staff user (id, role) from it via AuthMiddleware.
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Broadcasts whether any request is in flight, so UI elsewhere (e.g. the
// sidebar nav spinner) can track real fetch duration instead of a guessed
// timeout. Dispatched only on the 0->1 / 1->0 transitions, not every request.
let pendingRequests = 0;

function markRequestStart(config) {
  pendingRequests += 1;
  if (pendingRequests === 1) {
    window.dispatchEvent(new CustomEvent('medicalsia:api-loading-start'));
  }
  return config;
}

function markRequestEnd() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) {
    window.dispatchEvent(new CustomEvent('medicalsia:api-loading-end'));
  }
}

api.interceptors.request.use(markRequestStart);
api.interceptors.response.use(
  (response) => {
    markRequestEnd();
    return response;
  },
  (error) => {
    markRequestEnd();
    return Promise.reject(error);
  }
);

export default api;
