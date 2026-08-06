import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { listPatients } from '../../../services/patients';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import styles from './PatientsList.module.scss';

const LIMIT = 20;

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function fetchPatients() {
    setIsLoading(true);
    try {
      const data = await listPatients({ page, limit: LIMIT, search: debouncedSearch });
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();

    window.addEventListener('medicalsia:connection-restored', fetchPatients);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchPatients);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pasien</h1>
        <Button onClick={() => navigate('/dashboard/patients/new')}>
          <UserPlus size={16} />
          Tambah Pasien
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input
          placeholder="Cari nama, NIK, atau nomor pasien..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isLoading && <span className={styles.loadingHint}>Mencari...</span>}
      </div>

      {result.data.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          message={debouncedSearch ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Belum ada pasien terdaftar.'}
        />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Pasien</th>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>Telepon</th>
                  <th>Tgl Lahir</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((patient) => (
                  <tr key={patient.id} onClick={() => navigate(`/dashboard/patients/${patient.id}`)}>
                    <td>{patient.patient_number}</td>
                    <td>{patient.full_name}</td>
                    <td>{patient.nik || '-'}</td>
                    <td>{patient.phone || '-'}</td>
                    <td>{formatDate(patient.dob)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={result.pagination.page}
            limit={result.pagination.limit}
            totalItems={result.pagination.total_items}
            totalPages={result.pagination.total_pages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
