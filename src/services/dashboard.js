import api from './api';

export function getOwnerStats() {
  return api.get('/dashboard/owner-stats').then((res) => res.data);
}

export function getDoctorStats() {
  return api.get('/dashboard/doctor-stats').then((res) => res.data);
}

export function getPharmacyStats() {
  return api.get('/dashboard/pharmacy-stats').then((res) => res.data);
}
