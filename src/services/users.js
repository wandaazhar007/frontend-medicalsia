import api from './api';

export function listUsers({ page = 1, limit = 20, search = '' } = {}) {
  return api.get('/users', { params: { page, limit, search } }).then((res) => res.data);
}

export function getUser(id) {
  return api.get(`/users/${id}`).then((res) => res.data);
}

export function updateUser(id, payload) {
  return api.patch(`/users/${id}`, payload).then((res) => res.data);
}

export function inviteUser(payload) {
  return api.post('/auth/invite', payload).then((res) => res.data);
}
