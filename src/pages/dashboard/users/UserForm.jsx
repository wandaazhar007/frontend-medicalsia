import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUser, updateUser } from '../../../services/users';
import { formatPhoneNumber } from '../../../utils/phone';
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
  const navigate = useNavigate();

  const roleOptions = ROLE_ORDER.map(([value, key]) => ({ value, label: t(`usersPage.form.${key}`) }));

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('receptionist');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getUser(id).then(({ data }) => {
      setFullName(data.full_name);
      setPhone(data.phone || '');
      setRole(data.role);
      setIsActive(data.is_active);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName) {
      setError(t('usersPage.form.editRequiredError'));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser(id, { full_name: fullName, phone, role, is_active: isActive });
      navigate('/dashboard/users');
    } catch {
      setError(t('usersPage.form.editSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('usersPage.form.editTitle')}</h1>
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <Input id="full_name" label={t('usersPage.form.fullNameLabel')} value={fullName} onChange={(e) => setFullName(e.target.value)} required />

          <Input
            id="phone"
            label={t('usersPage.form.phoneLabel')}
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            inputMode="numeric"
          />

          <Select id="role" label={t('usersPage.form.roleLabel')} value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>

          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t('usersPage.form.activeCheckbox')}
          </label>

          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('usersPage.form.saving') : t('usersPage.form.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>{t('usersPage.form.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
