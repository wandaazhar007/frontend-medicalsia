import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUser, inviteUser, updateUser } from '../../../services/users';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import styles from './UserForm.module.scss';

const ROLE_ORDER = [
  ['owner', 'roleOwner'],
  ['admin', 'roleAdmin'],
  ['doctor', 'roleDoctor'],
  ['receptionist', 'roleReceptionist'],
  ['pharmacy', 'rolePharmacy'],
  ['cashier', 'roleCashier'],
];

export default function UserForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const roleOptions = ROLE_ORDER.map(([value, key]) => ({ value, label: t(`usersPage.form.${key}`) }));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('receptionist');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Populated after a successful invite — email delivery isn't wired up yet
  // (Fase 6), so the reset link is shown here to share with the new staff manually.
  const [inviteResult, setInviteResult] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getUser(id).then(({ data }) => {
      setFullName(data.full_name);
      setPhone(data.phone || '');
      setRole(data.role);
      setIsActive(data.is_active);
    });
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName || (!isEdit && !email)) {
      setError(isEdit ? t('usersPage.form.editRequiredError') : t('usersPage.form.inviteRequiredError'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateUser(id, { full_name: fullName, phone, role, is_active: isActive });
        navigate('/dashboard/users');
      } else {
        const { data } = await inviteUser({ full_name: fullName, email, phone, role });
        setInviteResult(data);
      }
    } catch {
      setError(isEdit ? t('usersPage.form.editSaveError') : t('usersPage.form.inviteSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (inviteResult) {
    return (
      <div className={styles.wrapper}>
        <h1 className={styles.title}>{t('usersPage.form.inviteTitle')}</h1>
        <Card>
          <div className={styles.success}>
            <p>
              <strong>{inviteResult.user.full_name}</strong> {t('usersPage.form.invitedSuccessPart1')} {roleOptions.find((r) => r.value === inviteResult.user.role)?.label}.
              {' '}{t('usersPage.form.invitedSuccessPart2')}
            </p>
            <div className={styles.inviteLink}>{inviteResult.invite_link}</div>
            <Button onClick={() => navigate('/dashboard/users')}>{t('usersPage.form.done')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{isEdit ? t('usersPage.form.editTitle') : t('usersPage.form.inviteTitle')}</h1>
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <Input id="full_name" label={t('usersPage.form.fullNameLabel')} value={fullName} onChange={(e) => setFullName(e.target.value)} required />

          <div className={styles.grid}>
            {!isEdit && (
              <Input id="email" label={t('usersPage.form.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            <Input id="phone" label={t('usersPage.form.phoneLabel')} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <Select id="role" label={t('usersPage.form.roleLabel')} value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>

          {isEdit && (
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              {t('usersPage.form.activeCheckbox')}
            </label>
          )}

          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('usersPage.form.saving') : isEdit ? t('usersPage.form.save') : t('usersPage.form.sendInvite')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>{t('usersPage.form.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
