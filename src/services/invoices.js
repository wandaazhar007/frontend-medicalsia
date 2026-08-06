import api from './api';

export function listInvoices({ page = 1, limit = 20, search = '' } = {}) {
  return api.get('/invoices', { params: { page, limit, search } }).then((res) => res.data);
}

export function getInvoice(id) {
  return api.get(`/invoices/${id}`).then((res) => res.data);
}

export function createInvoice(payload) {
  return api.post('/invoices', payload).then((res) => res.data);
}

export function payInvoice(id, payment_method) {
  return api.patch(`/invoices/${id}/pay`, { payment_method }).then((res) => res.data);
}
