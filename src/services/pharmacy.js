import api from './api';

export function getPharmacyQueue() {
  return api.get('/pharmacy/queue').then((res) => res.data);
}

export function dispensePrescription(prescriptionId, items) {
  return api.post(`/pharmacy/dispense/${prescriptionId}`, { items }).then((res) => res.data);
}
