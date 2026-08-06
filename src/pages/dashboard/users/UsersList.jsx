import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const ROLE_ORDER = [
  ['owner', 'roleOwner'],
  ['admin', 'roleAdmin'],
  ['doctor', 'roleDoctor'],
  ['receptionist', 'roleReceptionist'],
  ['pharmacy', 'rolePharmacy'],
  ['cashier', 'roleCashier'],
];

export default function UsersList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const roleLabels = Object.fromEntries(ROLE_ORDER.map(([value, key]) => [value, t(`usersPage.list.${key}`)]));

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
        <h1 className={styles.title}>{t('usersPage.list.title')}</h1>
        <Button onClick={() => navigate('/dashboard/users/new')}>
          <UserPlus size={16} />
          {t('usersPage.list.inviteButton')}
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input placeholder={t('usersPage.list.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        {isLoading && <span className={styles.loadingHint}>{t('usersPage.list.loading')}</span>}
      </div>

      {result.data.length === 0 && !isLoading ? (
        <EmptyState icon={UsersIcon} message={t('usersPage.list.noResults')} />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('usersPage.list.columnName')}</th>
                  <th>{t('usersPage.list.columnPhone')}</th>
                  <th>{t('usersPage.list.columnRole')}</th>
                  <th>{t('usersPage.list.columnStatus')}</th>
                  <th>{t('usersPage.list.columnAction')}</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.phone || '-'}</td>
                    <td><Badge variant="info">{roleLabels[user.role] || user.role}</Badge></td>
                    <td><Badge variant={user.is_active ? 'success' : 'danger'}>{user.is_active ? t('usersPage.list.active') : t('usersPage.list.inactive')}</Badge></td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button variant="secondary" onClick={() => navigate(`/dashboard/users/${user.id}/edit`)}>{t('usersPage.list.edit')}</Button>
                        <Button variant={user.is_active ? 'danger' : 'ghost'} onClick={() => handleToggleActive(user)}>
                          {user.is_active ? t('usersPage.list.deactivate') : t('usersPage.list.activate')}
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
