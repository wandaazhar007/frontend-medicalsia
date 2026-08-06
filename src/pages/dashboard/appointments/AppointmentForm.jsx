import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { createAppointment } from '../../../services/appointments';
import { listPatients } from '../../../services/patients';
import { getBookingDoctors } from '../../../services/publicBooking';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import SearchableSelect from '../../../components/SearchableSelect/SearchableSelect';
import Button from '../../../components/Button/Button';
import styles from './AppointmentForm.module.scss';

// "YYYY-MM-DDTHH:mm" in local time, for the datetime-local input's `min` —
// disables picking a past date, and past times on today's date.
function nowLocalDatetime() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffsetMs).toISOString().slice(0, 16);
}

export default function AppointmentForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Uses the public booking-doctors endpoint rather than GET /users —
    // that one is restricted to owner/admin (03-api-spec.md), but any staff
    // booking an appointment needs to see the doctor list.
    getBookingDoctors().then(({ data }) => setDoctors(data));
  }, []);

  const loadPatientOptions = useCallback(async (query) => {
    if (!query) return [];
    const { data } = await listPatients({ search: query, limit: 10 });
    return data.map((patient) => ({ id: patient.id, label: `${patient.full_name} (${patient.patient_number})`, raw: patient }));
  }, []);

  const loadDoctorOptions = useCallback(
    async (query) => {
      const filtered = query ? doctors.filter((d) => d.full_name.toLowerCase().includes(query.toLowerCase())) : doctors;
      return filtered.map((doctor) => ({ id: doctor.id, label: doctor.full_name }));
    },
    [doctors]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!selectedPatient) {
      setError(t('appointments.form.selectPatientRequired'));
      return;
    }
    if (!scheduledAt) {
      setError(t('appointments.form.dateRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointment({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor?.id || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      navigate('/dashboard/appointments');
    } catch {
      setError(t('appointments.form.createError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('appointments.form.title')}</h1>
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <SearchableSelect
            id="patient"
            label={t('appointments.form.searchPatientLabel')}
            placeholder={t('appointments.form.searchPatientPlaceholder')}
            value={selectedPatient ? { label: `${selectedPatient.full_name} (${selectedPatient.patient_number})` } : null}
            onSelect={(option) => setSelectedPatient(option.raw)}
            loadOptions={loadPatientOptions}
            emptyMessage={t('appointments.form.searchPatientEmpty')}
          />

          <SearchableSelect
            id="doctor"
            label={t('appointments.form.doctorLabel')}
            placeholder={t('appointments.form.doctorPlaceholder')}
            value={selectedDoctor ? { label: selectedDoctor.full_name } : null}
            onSelect={(option) => setSelectedDoctor({ id: option.id, full_name: option.label })}
            loadOptions={loadDoctorOptions}
            emptyMessage={t('appointments.form.doctorEmpty')}
          />

          <Input
            id="scheduled_at"
            label={t('appointments.form.dateTimeLabel')}
            type="datetime-local"
            min={nowLocalDatetime()}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />

          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              <Save size={16} />
              {isSubmitting ? t('appointments.form.saving') : t('appointments.form.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>{t('appointments.form.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
