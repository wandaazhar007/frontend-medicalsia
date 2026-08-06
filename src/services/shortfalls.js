import api from './api';

export function listShortfalls({ status = '' } = {}) {
  return api.get('/shortfalls', { params: { status } }).then((res) => res.data);
}

export function resolveShortfall(id) {
  return api.patch(`/shortfalls/${id}/resolve`).then((res) => res.data);
}
