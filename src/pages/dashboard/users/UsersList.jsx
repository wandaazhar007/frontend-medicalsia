import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users as UsersIcon } from 'lucide-react';
import { listUsers, updateUser } from '../../../services/users';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import styles from './UsersList.module.scss';

const LIMIT = 20;

const ROLE_LABELS = {
  owner: 'Pemilik',
  admin: 'Admin',
  doctor: 'Dokter',
  receptionist: 'Resepsionis',
  pharmacy: 'Farmasi',
  cashier: 'Kasir',
};

export default function UsersList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const data = await listUsers({ page, limit: LIMIT, search: debouncedSearch });
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    window.addEventListener('medicalsia:connection-restored', fetchUsers);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  // "Delete" for staff is deactivation, never a hard row delete — see
  // UserController.update comment for why (would orphan every medical
  // record/invoice/appointment that references them).
  async function handleToggleActive(user) {
    await updateUser(user.id, { is_active: !user.is_active });
    fetchUsers();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>User</h1>
        <Button onClick={() => navigate('/dashboard/users/new')}>
          <UserPlus size={16} />
          Undang User
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input placeholder="Cari nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {isLoading && <span className={styles.loadingHint}>Memuat...</span>}
      </div>

      {result.data.length === 0 && !isLoading ? (
        <EmptyState icon={UsersIcon} message="Belum ada user." />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.phone || '-'}</td>
                    <td><Badge variant="info">{ROLE_LABELS[user.role] || user.role}</Badge></td>
                    <td><Badge variant={user.is_active ? 'success' : 'danger'}>{user.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button variant="secondary" onClick={() => navigate(`/dashboard/users/${user.id}/edit`)}>Edit</Button>
                        <Button variant={user.is_active ? 'danger' : 'ghost'} onClick={() => handleToggleActive(user)}>
                          {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      </div>
                    </td>
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
