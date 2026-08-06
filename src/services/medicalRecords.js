import api from './api';

export function createMedicalRecord(payload) {
  return api.post('/medical-records', payload).then((res) => res.data);
}
