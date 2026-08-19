import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, X } from 'lucide-react';
import { createAppointment } from '../../../services/appointments';
import { listPatients } from '../../../services/patients';
import { getBookingDoctors } from '../../../services/publicBooking';
import { listDoctorSchedules } from '../../../services/doctorSchedules';
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
  const [schedules, setSchedules] = useState([]);
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
    // Needed to keep the date field in sync with the selected doctor's
    // working days — open to every role (unlike GET /users).
    listDoctorSchedules().then(({ data }) => setSchedules(data));
  }, []);

  // day_of_week uses JS Date#getDay() convention (0 = Sunday), matching
  // Postgres EXTRACT(DOW) used when the schedule rows were created.
  function getMatchingSchedule(doctorId, dateStr) {
    if (!doctorId || !dateStr) return null;
    const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
    return schedules.find((s) => s.doctor_id === doctorId && s.is_active && s.day_of_week === dayOfWeek) || null;
  }

  function doctorHasScheduleOn(doctorId, dateStr) {
    return Boolean(getMatchingSchedule(doctorId, dateStr));
  }

  // start_time/end_time come back as "HH:MM:SS" — compared as "HH:MM" strings
  // against the <input type="time"> value, which sorts correctly lexically.
  function isTimeWithinSchedule(doctorId, dateStr, timeStr) {
    const schedule = getMatchingSchedule(doctorId, dateStr);
    if (!schedule || !timeStr) return true;
    return timeStr >= schedule.start_time.slice(0, 5) && timeStr < schedule.end_time.slice(0, 5);
  }

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
    const newDate = e.target.value;
    if (selectedDoctor && newDate && !doctorHasScheduleOn(selectedDoctor.id, newDate)) {
      setDate('');
      setDateError(t('appointments.form.dateNoScheduleError'));
      return;
    }
    setDate(newDate);
    setDateError('');
    if (selectedDoctor && time && !isTimeWithinSchedule(selectedDoctor.id, newDate, time)) {
      setTime('');
      setTimeError(t('appointments.form.timeOutsideScheduleError'));
    }
  }

  function handleTimeChange(e) {
    const newTime = e.target.value;
    if (selectedDoctor && date && newTime && !isTimeWithinSchedule(selectedDoctor.id, date, newTime)) {
      setTime('');
      setTimeError(t('appointments.form.timeOutsideScheduleError'));
      return;
    }
    setTime(newTime);
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
    } else if (selectedDoctor && !doctorHasScheduleOn(selectedDoctor.id, date)) {
      setDateError(t('appointments.form.dateNoScheduleError'));
      isValid = false;
    }
    if (!time) {
      setTimeError(t('appointments.form.timeRequired'));
      isValid = false;
    } else if (selectedDoctor && date && !isTimeWithinSchedule(selectedDoctor.id, date, time)) {
      setTimeError(t('appointments.form.timeOutsideScheduleError'));
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

  const matchedSchedule = getMatchingSchedule(selectedDoctor?.id, date);
  const scheduleMinTime = matchedSchedule ? matchedSchedule.start_time.slice(0, 5) : undefined;
  const scheduleMaxTime = matchedSchedule ? matchedSchedule.end_time.slice(0, 5) : undefined;
  const todayMinTime = date === todayLocalDate() ? nowLocalTime() : undefined;
  const effectiveMinTime = [todayMinTime, scheduleMinTime].filter(Boolean).sort().pop();

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
          const doctor = option ? { id: option.id, full_name: option.label } : null;
          setSelectedDoctor(doctor);
          setDoctorError('');
          if (doctor && date && !doctorHasScheduleOn(doctor.id, date)) {
            setDate('');
            setDateError(t('appointments.form.dateNoScheduleError'));
          } else if (doctor && date && time && !isTimeWithinSchedule(doctor.id, date, time)) {
            setTime('');
            setTimeError(t('appointments.form.timeOutsideScheduleError'));
          }
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
          min={effectiveMinTime}
          max={scheduleMaxTime}
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
