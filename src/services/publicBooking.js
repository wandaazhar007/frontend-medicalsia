import api from './api';

export function getBookingDoctors() {
  return api.get('/public/booking/doctors').then((res) => res.data);
}

export function checkPhone(phone) {
  return api.get('/public/booking/check-phone', { params: { phone } }).then((res) => res.data);
}

export function createPublicBooking(payload) {
  return api.post('/public/booking', payload).then((res) => res.data);
}

export function getPublicQueue() {
  return api.get('/public/queue').then((res) => res.data);
}

export function getPublicPharmacyQueue() {
  return api.get('/public/queue/pharmacy').then((res) => res.data);
}
