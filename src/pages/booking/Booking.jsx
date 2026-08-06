import { useEffect, useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { createPublicBooking, getBookingDoctors } from '../../services/publicBooking';
import LogoIcon from '../../components/LogoIcon/LogoIcon';
import Wordmark from '../../components/LogoIcon/Wordmark';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
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
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  useEffect(() => {
    getBookingDoctors().then(({ data }) => setDoctors(data));
  }, []);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const availableSlots = useMemo(() => buildAvailableSlots(selectedDoctor, date), [selectedDoctor, date]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!doctorId || !scheduledAt || !fullName) {
      setError('Dokter, jadwal, dan nama wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPublicBooking({ doctor_id: doctorId, scheduled_at: scheduledAt, full_name: fullName, phone });
      setIsBooked(true);
    } catch {
      setError('Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isBooked) {
    return (
      <div className={styles.wrapper}>
        <Card className={styles.card}>
          <div className={styles.success}>
            <CheckCircle size={48} className={styles.successIcon} />
            <h1>Booking Berhasil</h1>
            <p>Silakan datang sesuai jadwal yang dipilih dan lakukan check-in di resepsionis klinik.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <LogoIcon variant="light" size={40} />
          <Wordmark variant="light" />
        </div>
        <p className={styles.subtitle}>Booking Appointment</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <Select
            id="doctor_id"
            label="Pilih Dokter"
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setScheduledAt('');
            }}
          >
            <option value="">Pilih dokter</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
            ))}
          </Select>

          <div className={styles.grid}>
            <Input
              id="date"
              label="Tanggal"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setScheduledAt('');
              }}
              disabled={!doctorId}
            />
            <Select
              id="scheduled_at"
              label="Jam"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={!date || availableSlots.length === 0}
            >
              <option value="">
                {date && availableSlots.length === 0 ? 'Tidak ada slot tersedia' : 'Pilih jam'}
              </option>
              {availableSlots.map((slot) => (
                <option key={slot.toISOString()} value={slot.toISOString()}>
                  {slot.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </Select>
          </div>

          <Input id="full_name" label="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input id="phone" label="No. HP" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Booking Sekarang'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
