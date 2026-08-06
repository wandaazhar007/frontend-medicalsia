import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createDoctorSchedule, listDoctorSchedules, updateDoctorSchedule } from '../../../services/doctorSchedules';
import { getBookingDoctors } from '../../../services/publicBooking';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import EmptyState from '../../../components/EmptyState/EmptyState';
import styles from './DoctorSchedulesPage.module.scss';

const DAY_KEYS = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'];

const EMPTY_FORM = { doctor_id: '', day_of_week: '1', start_time: '08:00', end_time: '12:00', slot_minutes: '15' };

export default function DoctorSchedulesPage() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const dayLabels = DAY_KEYS.map((key) => t(`doctorSchedulesPage.${key}`));

  async function fetchDoctors() {
    // Public booking-doctors endpoint, not GET /users (owner/admin-only —
    // this page's schedule form needs the doctor list regardless of role).
    const { data } = await getBookingDoctors();
    setDoctors(data);
  }

  async function fetchSchedules() {
    const { data } = await listDoctorSchedules();
    setSchedules(data);
  }

  useEffect(() => {
    fetchDoctors();
    fetchSchedules();
  }, []);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.doctor_id) {
      setError(t('doctorSchedulesPage.selectDoctorRequired'));
      return;
    }
    try {
      await createDoctorSchedule({
        doctor_id: form.doctor_id,
        day_of_week: parseInt(form.day_of_week, 10),
        start_time: form.start_time,
        end_time: form.end_time,
        slot_minutes: parseInt(form.slot_minutes, 10),
      });
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      fetchSchedules();
    } catch {
      setError(t('doctorSchedulesPage.saveError'));
    }
  }

  async function toggleActive(schedule) {
    await updateDoctorSchedule(schedule.id, { is_active: !schedule.is_active });
    fetchSchedules();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('doctorSchedulesPage.title')}</h1>
        <Button onClick={() => setIsFormOpen((open) => !open)}>{isFormOpen ? t('doctorSchedulesPage.close') : t('doctorSchedulesPage.addSchedule')}</Button>
      </div>

      {isFormOpen && (
        <Card>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.grid}>
              <Select id="doctor_id" label={t('doctorSchedulesPage.doctorLabel')} value={form.doctor_id} onChange={handleChange('doctor_id')}>
                <option value="">{t('doctorSchedulesPage.selectDoctorPlaceholder')}</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
                ))}
              </Select>
              <Select id="day_of_week" label={t('doctorSchedulesPage.dayLabel')} value={form.day_of_week} onChange={handleChange('day_of_week')}>
                {dayLabels.map((label, index) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </Select>
            </div>
            <div className={styles.grid}>
              <Input id="start_time" label={t('doctorSchedulesPage.startTimeLabel')} type="time" value={form.start_time} onChange={handleChange('start_time')} />
              <Input id="end_time" label={t('doctorSchedulesPage.endTimeLabel')} type="time" value={form.end_time} onChange={handleChange('end_time')} />
              <Input id="slot_minutes" label={t('doctorSchedulesPage.slotDurationLabel')} type="number" min="5" step="5" value={form.slot_minutes} onChange={handleChange('slot_minutes')} />
            </div>
            <div className={styles.actions}>
              <Button type="submit">{t('doctorSchedulesPage.save')}</Button>
            </div>
          </form>
        </Card>
      )}

      {schedules.length === 0 ? (
        <EmptyState message={t('doctorSchedulesPage.empty')} />
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('doctorSchedulesPage.columnDoctor')}</th>
                <th>{t('doctorSchedulesPage.columnDay')}</th>
                <th>{t('doctorSchedulesPage.columnTime')}</th>
                <th>{t('doctorSchedulesPage.columnSlotDuration')}</th>
                <th>{t('doctorSchedulesPage.columnStatus')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{schedule.doctor_name}</td>
                  <td>{dayLabels[schedule.day_of_week]}</td>
                  <td>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</td>
                  <td>{schedule.slot_minutes} {t('doctorSchedulesPage.minutes')}</td>
                  <td><Badge variant={schedule.is_active ? 'success' : 'danger'}>{schedule.is_active ? t('doctorSchedulesPage.active') : t('doctorSchedulesPage.inactive')}</Badge></td>
                  <td>
                    <Button variant="ghost" onClick={() => toggleActive(schedule)}>
                      {schedule.is_active ? t('doctorSchedulesPage.deactivate') : t('doctorSchedulesPage.activate')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
