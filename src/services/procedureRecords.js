import api from './api';

export function listProcedureRecords({ patient_id = '', status = '' } = {}) {
  return api.get('/procedure-records', { params: { patient_id, status } }).then((res) => res.data);
}

export function createProcedureRecord(payload) {
  return api.post('/procedure-records', payload).then((res) => res.data);
}

export function getProcedureRecord(id) {
  return api.get(`/procedure-records/${id}`).then((res) => res.data);
}
