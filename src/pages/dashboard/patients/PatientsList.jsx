import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users } from 'lucide-react';
import { listPatients } from '../../../services/patients';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import TableSkeleton from '../../../components/TableSkeleton/TableSkeleton';
import styles from './PatientsList.module.scss';

const LIMIT = 20;

const SKELETON_COLUMNS = [
  { width: '50%' },
  { width: '75%' },
  { width: '65%' },
  { width: '55%' },
  { width: '45%' },
];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientsList() {
  const { t } = useTranslation();
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
        <h1 className={styles.title}>{t('patients.list.title')}</h1>
        <Button onClick={() => navigate('/dashboard/patients/new')}>
          <UserPlus size={14} />
          {t('patients.list.addButton')}
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input
          placeholder={t('patients.list.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!isLoading && result.data.length === 0 ? (
        <EmptyState
          icon={Users}
          message={debouncedSearch ? t('patients.list.noResultsSearch') : t('patients.list.noResults')}
        />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('patients.list.columnNumber')}</th>
                  <th>{t('patients.list.columnName')}</th>
                  <th>{t('patients.list.columnNik')}</th>
                  <th>{t('patients.list.columnPhone')}</th>
                  <th>{t('patients.list.columnDob')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton rows={8} columns={SKELETON_COLUMNS} />
                ) : (
                  result.data.map((patient) => (
                    <tr key={patient.id} onClick={() => navigate(`/dashboard/patients/${patient.id}`)}>
                      <td>{patient.patient_number}</td>
                      <td>{patient.full_name}</td>
                      <td>{patient.nik || '-'}</td>
                      <td>{patient.phone || '-'}</td>
                      <td>{formatDate(patient.dob)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && result.data.length > 0 && (
            <Pagination
              page={result.pagination.page}
              limit={result.pagination.limit}
              totalItems={result.pagination.total_items}
              totalPages={result.pagination.total_pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
