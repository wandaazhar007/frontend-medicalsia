import api from './api';

export function listMedicines({ page = 1, limit = 20, search = '' } = {}) {
  return api.get('/medicines', { params: { page, limit, search } }).then((res) => res.data);
}
