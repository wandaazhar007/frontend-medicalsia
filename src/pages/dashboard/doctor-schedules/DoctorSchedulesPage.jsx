import { useEffect, useState } from 'react';
import { createDoctorSchedule, listDoctorSchedules, updateDoctorSchedule } from '../../../services/doctorSchedules';
import { getBookingDoctors } from '../../../services/publicBooking';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import EmptyState from '../../../components/EmptyState/EmptyState';
import styles from './DoctorSchedulesPage.module.scss';

const DAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const EMPTY_FORM = { doctor_id: '', day_of_week: '1', start_time: '08:00', end_time: '12:00', slot_minutes: '15' };

export default function DoctorSchedulesPage() {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

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
      setError('Pilih dokter terlebih dahulu.');
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
      setError('Gagal menyimpan jadwal.');
    }
  }

  async function toggleActive(schedule) {
    await updateDoctorSchedule(schedule.id, { is_active: !schedule.is_active });
    fetchSchedules();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Jadwal Dokter</h1>
        <Button onClick={() => setIsFormOpen((open) => !open)}>{isFormOpen ? 'Tutup' : 'Tambah Jadwal'}</Button>
      </div>

      {isFormOpen && (
        <Card>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.grid}>
              <Select id="doctor_id" label="Dokter" value={form.doctor_id} onChange={handleChange('doctor_id')}>
                <option value="">Pilih dokter</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
                ))}
              </Select>
              <Select id="day_of_week" label="Hari" value={form.day_of_week} onChange={handleChange('day_of_week')}>
                {DAY_LABELS.map((label, index) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </Select>
            </div>
            <div className={styles.grid}>
              <Input id="start_time" label="Jam Mulai" type="time" value={form.start_time} onChange={handleChange('start_time')} />
              <Input id="end_time" label="Jam Selesai" type="time" value={form.end_time} onChange={handleChange('end_time')} />
              <Input id="slot_minutes" label="Durasi Slot (menit)" type="number" min="5" step="5" value={form.slot_minutes} onChange={handleChange('slot_minutes')} />
            </div>
            <div className={styles.actions}>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {schedules.length === 0 ? (
        <EmptyState message="Belum ada jadwal dokter. Tambah jadwal dulu sebelum booking bisa berfungsi." />
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dokter</th>
                <th>Hari</th>
                <th>Jam</th>
                <th>Durasi Slot</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{schedule.doctor_name}</td>
                  <td>{DAY_LABELS[schedule.day_of_week]}</td>
                  <td>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</td>
                  <td>{schedule.slot_minutes} menit</td>
                  <td><Badge variant={schedule.is_active ? 'success' : 'danger'}>{schedule.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td>
                    <Button variant="ghost" onClick={() => toggleActive(schedule)}>
                      {schedule.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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
