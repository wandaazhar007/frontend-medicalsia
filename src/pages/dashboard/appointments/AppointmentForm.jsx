import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, X } from 'lucide-react';
import { createAppointment } from '../../../services/appointments';
import { listPatients } from '../../../services/patients';
import { getBookingDoctors } from '../../../services/publicBooking';
import Input from '../../../components/Input/Input';
import SearchableSelect from '../../../components/SearchableSelect/SearchableSelect';
import Button from '../../../components/Button/Button';
import Tooltip from '../../../components/Tooltip/Tooltip';
import styles from './AppointmentForm.module.scss';

// "YYYY-MM-DD" / "HH:mm" in local time, for the date/time inputs' `min` —
// disables picking a past date, and past times on today's date.
function todayLocalDate() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffsetMs).toISOString().slice(0, 10);
}

function nowLocalTime() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffsetMs).toISOString().slice(11, 16);
}

export default function AppointmentForm({ onSuccess, onCancel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [patientError, setPatientError] = useState('');
  const [doctorError, setDoctorError] = useState('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [submitError, setSubmitError] = useState('');
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

  function handleSelectPatient(option) {
    setSelectedPatient(option ? option.raw : null);
    setPatientError('');
  }

  function handleDateChange(e) {
    setDate(e.target.value);
    setDateError('');
  }

  function handleTimeChange(e) {
    setTime(e.target.value);
    setTimeError('');
  }

  function validate() {
    let isValid = true;
    if (!selectedPatient) {
      setPatientError(t('appointments.form.selectPatientRequired'));
      isValid = false;
    }
    if (!selectedDoctor) {
      setDoctorError(t('appointments.form.selectDoctorRequired'));
      isValid = false;
    }
    if (!date) {
      setDateError(t('appointments.form.dateRequired'));
      isValid = false;
    }
    if (!time) {
      setTimeError(t('appointments.form.timeRequired'));
      isValid = false;
    }
    return isValid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setPatientError('');
    setDoctorError('');
    setDateError('');
    setTimeError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createAppointment({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor?.id || null,
        scheduled_at: new Date(`${date}T${time}`).toISOString(),
      });
      onSuccess();
    } catch {
      setSubmitError(t('appointments.form.createError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {submitError && <div className={styles.error}>{submitError}</div>}

      <SearchableSelect
        id="patient"
        label={(
          <span className={styles.labelWithTooltip}>
            {t('appointments.form.searchPatientLabel')}
            <Tooltip content={t('appointments.form.searchPatientTooltip')} ariaLabel={t('appointments.form.searchPatientTooltipLabel')} />
          </span>
        )}
        placeholder={t('appointments.form.searchPatientPlaceholder')}
        value={selectedPatient ? { label: `${selectedPatient.full_name} (${selectedPatient.patient_number})` } : null}
        onSelect={handleSelectPatient}
        loadOptions={loadPatientOptions}
        emptyMessage={t('appointments.form.searchPatientEmpty')}
        searchingMessage={t('common.searching')}
        onAddNew={() => navigate('/dashboard/patients/new')}
        addNewLabel={t('appointments.form.addNewPatient')}
        error={patientError}
      />

      <SearchableSelect
        id="doctor"
        label={t('appointments.form.doctorLabel')}
        placeholder={t('appointments.form.doctorPlaceholder')}
        value={selectedDoctor ? { label: selectedDoctor.full_name } : null}
        onSelect={(option) => {
          setSelectedDoctor(option ? { id: option.id, full_name: option.label } : null);
          setDoctorError('');
        }}
        loadOptions={loadDoctorOptions}
        emptyMessage={t('appointments.form.doctorEmpty')}
        searchingMessage={t('common.searching')}
        error={doctorError}
      />

      <div className={styles.dateTimeRow}>
        <Input
          id="scheduled_date"
          label={t('appointments.form.dateLabel')}
          type="date"
          min={todayLocalDate()}
          value={date}
          onChange={handleDateChange}
          error={dateError}
        />
        <Input
          id="scheduled_time"
          label={(
            <span className={styles.labelWithTooltip}>
              {t('appointments.form.timeLabel')}
              <Tooltip
                content={(
                  <>
                    {t('appointments.form.timeFormatTooltip')}{' '}
                    <span className={styles.tooltipExample}>{t('appointments.form.timeFormatTooltipExample')}</span>
                  </>
                )}
                ariaLabel={t('appointments.form.timeFormatTooltipLabel')}
              />
            </span>
          )}
          type="time"
          lang="id-ID"
          min={date === todayLocalDate() ? nowLocalTime() : undefined}
          value={time}
          onChange={handleTimeChange}
          error={timeError}
        />
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting}>
          <Save size={14} />
          {isSubmitting ? t('appointments.form.saving') : t('appointments.form.save')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          <X size={14} />
          {t('appointments.form.cancel')}
        </Button>
      </div>
    </form>
  );
}
