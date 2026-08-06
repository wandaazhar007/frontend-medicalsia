import api from './api';

export function listPrescriptions({ patient_id = '', status = '' } = {}) {
  return api.get('/prescriptions', { params: { patient_id, status } }).then((res) => res.data);
}

export function createPrescription(payload) {
  return api.post('/prescriptions', payload).then((res) => res.data);
}

export function getPrescription(id) {
  return api.get(`/prescriptions/${id}`).then((res) => res.data);
}
