import api from './api';

export function listDoctorSchedules() {
  return api.get('/doctor-schedules').then((res) => res.data);
}

export function createDoctorSchedule(payload) {
  return api.post('/doctor-schedules', payload).then((res) => res.data);
}

export function updateDoctorSchedule(id, payload) {
  return api.patch(`/doctor-schedules/${id}`, payload).then((res) => res.data);
}
