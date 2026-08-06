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

export default api;
