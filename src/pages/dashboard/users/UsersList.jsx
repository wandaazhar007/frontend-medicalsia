import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Ban, Check, Copy, Pencil, Power, Save, UserPlus, Users as UsersIcon, X } from 'lucide-react';
import { inviteUser, listUsers, updateUser } from '../../../services/users';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatPhoneNumber } from '../../../utils/phone';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import TableSkeleton from '../../../components/TableSkeleton/TableSkeleton';
import Modal from '../../../components/Modal/Modal';
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_INVITE_FORM = { full_name: '', email: '', phone: '', role: 'receptionist' };

const SKELETON_COLUMNS = [
  { width: '60%' },
  { width: '70%' },
  { width: '50%' },
  { width: '35%', variant: 'badge' },
  { width: '55%' },
  { width: '35%', variant: 'badge' },
  { width: '85%' },
];

function formatLastLogin(value, t) {
  if (!value) return t('usersPage.list.neverLoggedIn');
  return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UsersList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const isSearching = search !== debouncedSearch;

  const roleLabels = Object.fromEntries(ROLE_ORDER.map(([value, key]) => [value, t(`usersPage.list.${key}`)]));
  const roleOptions = ROLE_ORDER.map(([value, key]) => ({ value, label: t(`usersPage.form.${key}`) }));

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM);
  const [inviteFieldErrors, setInviteFieldErrors] = useState({});
  const [inviteFormError, setInviteFormError] = useState('');
  const [isSavingInvite, setIsSavingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

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

  function openInviteModal() {
    setInviteForm(EMPTY_INVITE_FORM);
    setInviteFieldErrors({});
    setInviteFormError('');
    setInviteResult(null);
    setIsLinkCopied(false);
    setIsInviteModalOpen(true);
  }

  function closeInviteModal() {
    setIsInviteModalOpen(false);
    if (inviteResult) fetchUsers();
  }

  async function handleCopyInviteLink() {
    await navigator.clipboard.writeText(inviteResult.invite_link);
    setIsLinkCopied(true);
  }

  function handleInviteFieldChange(field) {
    return (e) => setInviteForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function validateInviteForm() {
    const errors = {};
    if (!inviteForm.full_name.trim()) errors.full_name = t('usersPage.form.fieldRequired');
    if (!inviteForm.email.trim()) {
      errors.email = t('usersPage.form.fieldRequired');
    } else if (!EMAIL_PATTERN.test(inviteForm.email)) {
      errors.email = t('usersPage.form.emailInvalid');
    }
    if (!inviteForm.phone.trim()) {
      errors.phone = t('usersPage.form.fieldRequired');
    } else {
      const digitCount = inviteForm.phone.replace(/\D/g, '').length;
      if (digitCount < 9 || digitCount > 13) errors.phone = t('usersPage.form.phoneInvalid');
    }
    return errors;
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    setInviteFormError('');

    const errors = validateInviteForm();
    setInviteFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingInvite(true);
    try {
      const { data } = await inviteUser(inviteForm);
      setInviteResult(data);
    } catch {
      setInviteFormError(t('usersPage.form.inviteSaveError'));
    } finally {
      setIsSavingInvite(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('usersPage.list.title')}</h1>
        <Button onClick={openInviteModal}>
          <UserPlus size={14} />
          {t('usersPage.list.inviteButton')}
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input placeholder={t('usersPage.list.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!isLoading && !isSearching && result.data.length === 0 ? (
        <EmptyState icon={UsersIcon} message={t('usersPage.list.noResults')} />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('usersPage.list.columnName')}</th>
                  <th>{t('usersPage.list.columnEmail')}</th>
                  <th>{t('usersPage.list.columnPhone')}</th>
                  <th>{t('usersPage.list.columnRole')}</th>
                  <th>{t('usersPage.list.columnLastLogin')}</th>
                  <th>{t('usersPage.list.columnStatus')}</th>
                  <th>{t('usersPage.list.columnAction')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading || isSearching ? (
                  <TableSkeleton rows={8} columns={SKELETON_COLUMNS} />
                ) : (
                  result.data.map((user) => (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.email || '-'}</td>
                      <td>{user.phone || '-'}</td>
                      <td><Badge variant="info">{roleLabels[user.role] || user.role}</Badge></td>
                      <td>{formatLastLogin(user.last_login, t)}</td>
                      <td><Badge variant={user.is_active ? 'success' : 'danger'}>{user.is_active ? t('usersPage.list.active') : t('usersPage.list.inactive')}</Badge></td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button variant="secondary" onClick={() => navigate(`/dashboard/users/${user.id}/edit`)}>
                            <Pencil size={14} />
                            {t('usersPage.list.edit')}
                          </Button>
                          <Button variant={user.is_active ? 'dangerOutline' : 'ghost'} onClick={() => handleToggleActive(user)}>
                            {user.is_active ? <Ban size={14} /> : <Power size={14} />}
                            {user.is_active ? t('usersPage.list.deactivate') : t('usersPage.list.activate')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && !isSearching && (
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

      <Modal isOpen={isInviteModalOpen} onClose={closeInviteModal} title={t('usersPage.form.inviteTitle')}>
        {inviteResult ? (
          <div className={styles.success}>
            <p>
              <strong>{inviteResult.user.full_name}</strong> {t('usersPage.form.invitedSuccessPart1')} {roleOptions.find((r) => r.value === inviteResult.user.role)?.label}.
              {' '}{t('usersPage.form.invitedSuccessPart2')}
            </p>
            <div className={styles.inviteLinkRow}>
              <div className={styles.inviteLink}>{inviteResult.invite_link}</div>
              <button
                type="button"
                className={styles.copyButton}
                onClick={handleCopyInviteLink}
                title={t('usersPage.form.copyLink')}
              >
                {isLinkCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {isLinkCopied && <span className={styles.copiedHint}>{t('usersPage.form.linkCopied')}</span>}

            <div className={styles.oneTimeWarning}>
              <AlertTriangle size={16} />
              <span>{t('usersPage.form.oneTimeWarning')}</span>
            </div>

            <div className={styles.actions}>
              <Button onClick={closeInviteModal}>
                <Check size={14} />
                {t('usersPage.form.done')}
              </Button>
            </div>
          </div>
        ) : (
          <form className={styles.modalForm} onSubmit={handleInviteSubmit} noValidate>
            {inviteFormError && <div className={styles.error}>{inviteFormError}</div>}
            <Input
              id="invite_full_name"
              label={t('usersPage.form.fullNameLabel')}
              value={inviteForm.full_name}
              onChange={handleInviteFieldChange('full_name')}
              error={inviteFieldErrors.full_name}
            />
            <Input
              id="invite_email"
              type="email"
              label={t('usersPage.form.emailLabel')}
              value={inviteForm.email}
              onChange={handleInviteFieldChange('email')}
              error={inviteFieldErrors.email}
            />
            <Input
              id="invite_phone"
              label={t('usersPage.form.phoneLabel')}
              inputMode="numeric"
              value={inviteForm.phone}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
              error={inviteFieldErrors.phone}
            />
            <Select
              id="invite_role"
              label={t('usersPage.form.roleLabel')}
              value={inviteForm.role}
              onChange={handleInviteFieldChange('role')}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
            <div className={styles.actions}>
              <Button type="submit" disabled={isSavingInvite}>
                <Save size={14} />
                {isSavingInvite ? t('usersPage.form.saving') : t('usersPage.form.sendInvite')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeInviteModal}>
                <X size={14} />
                {t('usersPage.form.cancel')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
