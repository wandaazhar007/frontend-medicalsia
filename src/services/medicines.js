import api from './api';

export function listMedicines({ page = 1, limit = 20, search = '' } = {}) {
  return api.get('/medicines', { params: { page, limit, search } }).then((res) => res.data);
}

export function getMedicine(id) {
  return api.get(`/medicines/${id}`).then((res) => res.data);
}

export function createMedicine(payload) {
  return api.post('/medicines', payload).then((res) => res.data);
}

export function updateMedicine(id, payload) {
  return api.patch(`/medicines/${id}`, payload).then((res) => res.data);
}

export function updateMedicineStock(id, payload) {
  return api.patch(`/medicines/${id}/stock`, payload).then((res) => res.data);
}

export function getMedicineStockLogs(id) {
  return api.get(`/medicines/${id}/stock-logs`).then((res) => res.data);
}
