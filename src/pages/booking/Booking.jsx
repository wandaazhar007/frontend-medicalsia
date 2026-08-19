import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import { checkPhone, createPublicBooking, getBookingDoctors } from '../../services/publicBooking';
import { formatPhoneNumber, countPhoneDigits } from '../../utils/phone';
import { usePreferences } from '../../context/PreferencesContext';
import { useDebounce } from '../../hooks/useDebounce';
import LogoIcon from '../../components/LogoIcon/LogoIcon';
import Wordmark from '../../components/LogoIcon/Wordmark';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import SearchableSelect from '../../components/SearchableSelect/SearchableSelect';
import Tooltip from '../../components/Tooltip/Tooltip';
import Button from '../../components/Button/Button';
import styles from './Booking.module.scss';

function pad(n) {
  return String(n).padStart(2, '0');
}

// Builds the list of selectable time slots for one doctor on one date:
// every slot_minutes step of every schedule matching that date's day-of-week,
// minus slots already booked and minus times already in the past.
function buildAvailableSlots(doctor, dateStr) {
  if (!doctor || !dateStr) return [];

  const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
  const matchingSchedules = doctor.schedules.filter((s) => s.day_of_week === dayOfWeek);
  const bookedTimes = new Set(doctor.booked_slots.map((slot) => new Date(slot).getTime()));
  const now = Date.now();

  const slots = [];
  for (const schedule of matchingSchedules) {
    const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
    const start = new Date(`${dateStr}T${pad(startHour)}:${pad(startMinute)}:00`);
    const end = new Date(`${dateStr}T${pad(endHour)}:${pad(endMinute)}:00`);

    for (let t = start; t < end; t = new Date(t.getTime() + schedule.slot_minutes * 60000)) {
      if (t.getTime() <= now) continue;
      if (bookedTimes.has(t.getTime())) continue;
      slots.push(t);
    }
  }

  return slots.sort((a, b) => a - b);
}

export default function Booking() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = usePreferences();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateError, setDateError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [phoneCheckStatus, setPhoneCheckStatus] = useState('idle'); // idle | checking | found

  useEffect(() => {
    getBookingDoctors().then(({ data }) => setDoctors(data));
  }, []);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const availableSlots = useMemo(() => buildAvailableSlots(selectedDoctor, date), [selectedDoctor, date]);

  // day_of_week uses JS Date#getDay() convention (0 = Sunday), matching
  // Postgres EXTRACT(DOW) used when the schedule rows were created.
  function doctorHasScheduleOn(doctor, dateStr) {
    if (!doctor || !dateStr) return true;
    const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
    return doctor.schedules.some((s) => s.day_of_week === dayOfWeek);
  }

  const loadDoctorOptions = useCallback(
    async (query) => {
      const filtered = query ? doctors.filter((d) => d.full_name.toLowerCase().includes(query.toLowerCase())) : doctors;
      return filtered.map((doctor) => ({ id: doctor.id, label: doctor.full_name }));
    },
    [doctors]
  );

  const debouncedPhone = useDebounce(phone, 500);

  useEffect(() => {
    const digitCount = countPhoneDigits(debouncedPhone);
    if (digitCount < 9) {
      setPhoneCheckStatus('idle');
      return undefined;
    }

    let isCurrent = true;
    setPhoneCheckStatus('checking');
    checkPhone(debouncedPhone)
      .then(({ data }) => {
        if (!isCurrent) return;
        if (data) {
          setPhoneCheckStatus('found');
          setFullName(data.full_name);
        } else {
          setPhoneCheckStatus('idle');
        }
      })
      .catch(() => {
        if (isCurrent) setPhoneCheckStatus('idle');
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedPhone]);

  function handleSelectDoctor(option) {
    const doctor = option ? doctors.find((d) => d.id === option.id) : null;
    setDoctorId(option ? option.id : '');
    setScheduledAt('');
    setFieldErrors((prev) => ({ ...prev, doctor_id: undefined }));
    if (doctor && date && !doctorHasScheduleOn(doctor, date)) {
      setDate('');
      setDateError(t('bookingPage.dateNoScheduleError'));
    } else {
      setDateError('');
    }
  }

  function handlePhoneChange(e) {
    setPhone(formatPhoneNumber(e.target.value));
    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    setPhoneCheckStatus('idle');
  }

  function validate() {
    const errors = {};
    if (!doctorId) errors.doctor_id = t('bookingPage.fieldRequired');
    if (!scheduledAt) errors.scheduled_at = t('bookingPage.fieldRequired');
    if (!phone.trim()) {
      errors.phone = t('bookingPage.fieldRequired');
    } else {
      const digitCount = countPhoneDigits(phone);
      if (digitCount < 9 || digitCount > 13) errors.phone = t('bookingPage.phoneInvalid');
    }
    if (!fullName.trim()) errors.full_name = t('bookingPage.fieldRequired');
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await createPublicBooking({ doctor_id: doctorId, scheduled_at: scheduledAt, full_name: fullName, phone });
      setIsBooked(true);
    } catch {
      setError(t('bookingPage.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isBooked) {
    return (
      <div className={styles.wrapper}>
        <Card className={styles.card}>
          <div className={styles.success}>
            <CheckCircle size={43} className={styles.successIcon} />
            <h1>{t('bookingPage.successTitle')}</h1>
            <p>{t('bookingPage.successText')}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <button type="button" className={styles.langToggle} role="switch" aria-checked={language === 'en'} onClick={toggleLanguage}>
          <span className={`${styles.langOption} ${language === 'id' ? styles.langOptionActive : ''}`}>IND</span>
          <span className={`${styles.langOption} ${language === 'en' ? styles.langOptionActive : ''}`}>ENG</span>
        </button>

        <div className={styles.brand}>
          <LogoIcon variant="light" size={36} />
          <Wordmark variant="light" />
        </div>
        <p className={styles.subtitle}>{t('bookingPage.subtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <div className={styles.error}>{error}</div>}

          <SearchableSelect
            id="doctor_id"
            label={(
              <span className={styles.labelWithTooltip}>
                {t('bookingPage.selectDoctorLabel')}
                <Tooltip content={t('bookingPage.doctorTooltip')} ariaLabel={t('bookingPage.tooltipAriaLabel')} />
              </span>
            )}
            placeholder={t('bookingPage.searchDoctorPlaceholder')}
            value={selectedDoctor ? { label: selectedDoctor.full_name } : null}
            onSelect={handleSelectDoctor}
            loadOptions={loadDoctorOptions}
            emptyMessage={t('bookingPage.searchDoctorEmpty')}
            searchingMessage={t('common.searching')}
            error={fieldErrors.doctor_id}
          />

          <div className={styles.grid}>
            <Input
              id="date"
              label={(
                <span className={styles.labelWithTooltip}>
                  {t('bookingPage.dateLabel')}
                  <Tooltip content={t('bookingPage.dateTooltip')} ariaLabel={t('bookingPage.tooltipAriaLabel')} />
                </span>
              )}
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => {
                const newDate = e.target.value;
                if (selectedDoctor && newDate && !doctorHasScheduleOn(selectedDoctor, newDate)) {
                  setDate('');
                  setScheduledAt('');
                  setDateError(t('bookingPage.dateNoScheduleError'));
                  return;
                }
                setDate(newDate);
                setScheduledAt('');
                setDateError('');
              }}
              disabled={!doctorId}
              error={dateError}
            />
            <Select
              id="scheduled_at"
              label={(
                <span className={styles.labelWithTooltip}>
                  {t('bookingPage.timeLabel')}
                  <Tooltip content={t('bookingPage.timeTooltip')} ariaLabel={t('bookingPage.tooltipAriaLabel')} />
                </span>
              )}
              value={scheduledAt}
              onChange={(e) => {
                setScheduledAt(e.target.value);
                setFieldErrors((prev) => ({ ...prev, scheduled_at: undefined }));
              }}
              disabled={!date || availableSlots.length === 0}
              error={fieldErrors.scheduled_at}
            >
              <option value="">
                {date && availableSlots.length === 0 ? t('bookingPage.noSlotsAvailable') : t('bookingPage.selectTimePlaceholder')}
              </option>
              {availableSlots.map((slot) => (
                <option key={slot.toISOString()} value={slot.toISOString()}>
                  {slot.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              id="phone"
              label={(
                <span className={styles.labelWithTooltip}>
                  {t('bookingPage.phoneLabel')}
                  <Tooltip content={t('bookingPage.phoneTooltip')} ariaLabel={t('bookingPage.tooltipAriaLabel')} />
                </span>
              )}
              type="tel"
              placeholder="0812-3456-7890"
              value={phone}
              onChange={handlePhoneChange}
              error={fieldErrors.phone}
            />
            {phoneCheckStatus === 'checking' && <p className={styles.phoneStatusChecking}>{t('bookingPage.phoneCheckingText')}</p>}
            {phoneCheckStatus === 'found' && (
              <p className={styles.phoneStatusFound}>
                <CheckCircle size={13} />
                {t('bookingPage.phoneFoundText', { name: fullName })}
              </p>
            )}
          </div>

          <Input
            id="full_name"
            label={(
              <span className={styles.labelWithTooltip}>
                {t('bookingPage.fullNameLabel')}
                <Tooltip content={t('bookingPage.fullNameTooltip')} ariaLabel={t('bookingPage.tooltipAriaLabel')} />
              </span>
            )}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, full_name: undefined }));
            }}
            error={fieldErrors.full_name}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className={styles.spinner} /> : <Send size={16} />}
            {isSubmitting ? t('bookingPage.processing') : t('bookingPage.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
