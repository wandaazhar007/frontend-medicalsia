import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, inviteUser, updateUser } from '../../../services/users';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import styles from './UserForm.module.scss';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Pemilik' },
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Dokter' },
  { value: 'receptionist', label: 'Resepsionis' },
  { value: 'pharmacy', label: 'Farmasi' },
  { value: 'cashier', label: 'Kasir' },
];

export default function UserForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

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
      setError(isEdit ? 'Nama lengkap wajib diisi.' : 'Nama lengkap dan email wajib diisi.');
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
      setError(isEdit ? 'Gagal menyimpan perubahan.' : 'Gagal mengundang user. Email mungkin sudah terdaftar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (inviteResult) {
    return (
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Undang User</h1>
        <Card>
          <div className={styles.success}>
            <p>
              <strong>{inviteResult.user.full_name}</strong> berhasil diundang sebagai {ROLE_OPTIONS.find((r) => r.value === inviteResult.user.role)?.label}.
              Bagikan tautan berikut supaya mereka bisa membuat password sendiri:
            </p>
            <div className={styles.inviteLink}>{inviteResult.invite_link}</div>
            <Button onClick={() => navigate('/dashboard/users')}>Selesai</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{isEdit ? 'Edit User' : 'Undang User'}</h1>
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <Input id="full_name" label="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

          <div className={styles.grid}>
            {!isEdit && (
              <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            <Input id="phone" label="Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <Select id="role" label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>

          {isEdit && (
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Akun aktif (bisa login)
            </label>
          )}

          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Kirim Undangan'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Batal</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
