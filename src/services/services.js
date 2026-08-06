import api from './api';

export function listServices({ page = 1, limit = 50, search = '' } = {}) {
  return api.get('/services', { params: { page, limit, search } }).then((res) => res.data);
}
