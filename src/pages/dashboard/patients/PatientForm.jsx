import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPatient, getPatient, updatePatient } from '../../../services/patients';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import PatientCard from '../../../components/PatientCard/PatientCard';
import styles from './PatientForm.module.scss';

const EMPTY_FORM = {
  full_name: '',
  nik: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  village: '',
  district: '',
  city: '',
  province: '',
  postal_code: '',
  allergies: '',
};

export default function PatientForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Populated after a successful create — drives the optional print-card step.
  const [createdPatient, setCreatedPatient] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getPatient(id).then(({ data }) => {
      setForm({
        full_name: data.full_name || '',
        nik: data.nik || '',
        dob: data.dob ? data.dob.slice(0, 10) : '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        village: data.village || '',
        district: data.district || '',
        city: data.city || '',
        province: data.province || '',
        postal_code: data.postal_code || '',
        allergies: data.allergies || '',
      });
    });
  }, [id, isEdit]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { ...form, dob: form.dob || null };
      if (isEdit) {
        await updatePatient(id, payload);
        navigate(`/dashboard/patients/${id}`);
      } else {
        const { data } = await createPatient(payload);
        setCreatedPatient(data);
      }
    } catch {
      setError(t('patients.form.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdPatient) {
    return (
      <div className={styles.wrapper}>
        <Card className={styles.successPanel}>
          <p>
            {t('patients.form.registeredPart1')} <strong>{createdPatient.full_name}</strong> {t('patients.form.registeredPart2')}{' '}
            <strong>{createdPatient.patient_number}</strong>.
          </p>
          <PatientCard patient={createdPatient} />
          <div className={styles.actions}>
            <Button onClick={() => window.print()}>{t('patients.form.printCard')}</Button>
            <Button variant="secondary" onClick={() => navigate(`/dashboard/patients/${createdPatient.id}`)}>
              {t('patients.form.skip')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{isEdit ? t('patients.form.editTitle') : t('patients.form.addTitle')}</h1>
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.section}>
            <span className={styles.sectionTitle}>{t('patients.form.sectionPersonal')}</span>
            <Input id="full_name" label={t('patients.form.fullName')} value={form.full_name} onChange={handleChange('full_name')} required />
            <div className={styles.grid}>
              <Input id="nik" label={t('patients.form.nik')} value={form.nik} onChange={handleChange('nik')} />
              <Input id="dob" label={t('patients.form.dob')} type="date" value={form.dob} onChange={handleChange('dob')} />
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>{t('patients.form.sectionContact')}</span>
            <div className={styles.grid}>
              <Input id="phone" label={t('patients.form.phone')} value={form.phone} onChange={handleChange('phone')} />
              <Input
                id="email"
                label={t('patients.form.email')}
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={handleChange('email')}
              />
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>{t('patients.form.sectionAddress')}</span>
            <Input id="address" label={t('patients.form.address')} value={form.address} onChange={handleChange('address')} />
            <div className={styles.grid}>
              <Input id="village" label={t('patients.form.village')} value={form.village} onChange={handleChange('village')} />
              <Input id="district" label={t('patients.form.district')} value={form.district} onChange={handleChange('district')} />
            </div>
            <div className={styles.grid3}>
              <Input id="city" label={t('patients.form.city')} value={form.city} onChange={handleChange('city')} />
              <Input id="province" label={t('patients.form.province')} value={form.province} onChange={handleChange('province')} />
              <Input id="postal_code" label={t('patients.form.postalCode')} value={form.postal_code} onChange={handleChange('postal_code')} />
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>{t('patients.form.sectionHealth')}</span>
            <Input id="allergies" label={t('patients.form.allergies')} value={form.allergies} onChange={handleChange('allergies')} />
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('patients.form.saving') : t('patients.form.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              {t('patients.form.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
