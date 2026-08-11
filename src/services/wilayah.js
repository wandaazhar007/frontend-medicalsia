import api from './api';

// level: 1=provinsi, 2=kota/kabupaten, 3=kecamatan, 4=kelurahan/desa
export function listWilayah({ level, parent = '', search = '', limit = 20 } = {}) {
  return api.get('/wilayah', { params: { level, parent, search, limit } }).then((res) => res.data);
}
