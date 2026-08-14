import api from './api';

export function listAppointments({ page = 1, limit = 20, search = '', date = '', doctor_id = '', status = '' } = {}) {
  return api.get('/appointments', { params: { page, limit, search, date, doctor_id, status } }).then((res) => res.data);
}

export function listCompletedAppointments({ page = 1, limit = 20, search = '', date = '' } = {}) {
  return api.get('/appointments/completed', { params: { page, limit, search, date } }).then((res) => res.data);
}

export function getAppointment(id) {
  return api.get(`/appointments/${id}`).then((res) => res.data);
}

export function createAppointment(payload) {
  return api.post('/appointments', payload).then((res) => res.data);
}

export function updateAppointmentStatus(id, status) {
  return api.patch(`/appointments/${id}/status`, { status }).then((res) => res.data);
}

export function deleteAppointment(id) {
  return api.delete(`/appointments/${id}`).then((res) => res.data);
}
