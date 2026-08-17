import api from './api';

export function listMedicalProcedures({ page = 1, limit = 20, search = '' } = {}) {
  return api.get('/medical-procedures', { params: { page, limit, search } }).then((res) => res.data);
}

export function createMedicalProcedure(payload) {
  return api.post('/medical-procedures', payload).then((res) => res.data);
}

export function updateMedicalProcedure(id, payload) {
  return api.patch(`/medical-procedures/${id}`, payload).then((res) => res.data);
}

export function previewMedicalProcedureImport(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/medical-procedures/import/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);
}

export function commitMedicalProcedureImport(rows) {
  return api.post('/medical-procedures/import', { rows }).then((res) => res.data);
}
