import api from './api';

export function listPatients({ page = 1, limit = 20, search = '' } = {}) {
  return api.get('/patients', { params: { page, limit, search } }).then((res) => res.data);
}

export function getPatient(id) {
  return api.get(`/patients/${id}`).then((res) => res.data);
}

export function getMedicalRecordsForPrint(id, { from = '', to = '' } = {}) {
  return api.get(`/patients/${id}/medical-records`, { params: { from, to } }).then((res) => res.data);
}

export function createPatient(payload) {
  return api.post('/patients', payload).then((res) => res.data);
}

export function updatePatient(id, payload) {
  return api.patch(`/patients/${id}`, payload).then((res) => res.data);
}
