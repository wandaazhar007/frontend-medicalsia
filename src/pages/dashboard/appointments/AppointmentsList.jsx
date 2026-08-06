import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { listAppointments, updateAppointmentStatus } from '../../../services/appointments';
import { getBookingDoctors } from '../../../services/publicBooking';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import styles from './AppointmentsList.module.scss';

const LIMIT = 20;

const STATUS_LABELS = {
  booked: 'Dipesan',
  checked_in: 'Check-in',
  in_consultation: 'Konsultasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak Datang',
};

const STATUS_VARIANTS = {
  booked: 'info',
  checked_in: 'warning',
  in_consultation: 'warning',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
};

function formatDateTime(value) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AppointmentsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    // Public booking-doctors endpoint, not GET /users (owner/admin-only —
    // any staff filtering this list needs to see doctor names too).
    getBookingDoctors().then(({ data }) => setDoctors(data));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, date, doctorId, status]);

  async function fetchAppointments() {
    setIsLoading(true);
    try {
      const data = await listAppointments({ page, limit: LIMIT, search: debouncedSearch, date, doctor_id: doctorId, status });
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();

    window.addEventListener('medicalsia:connection-restored', fetchAppointments);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchAppointments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, date, doctorId, status]);

  async function handleStatusChange(id, nextStatus) {
    await updateAppointmentStatus(id, nextStatus);
    fetchAppointments();
  }

  async function handleStartConsultation(appointment) {
    await updateAppointmentStatus(appointment.id, 'in_consultation');
    navigate(`/dashboard/consultation/${appointment.id}`);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Appointment</h1>
        <Button onClick={() => navigate('/dashboard/appointments/new')}>
          <CalendarPlus size={16} />
          Booking Manual
        </Button>
      </div>

      <div className={styles.filters}>
        <Input placeholder="Cari nama pasien..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">Semua Dokter</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>
      {isLoading && <span className={styles.loadingHint}>Memuat...</span>}

      {result.data.length === 0 && !isLoading ? (
        <EmptyState message="Belum ada appointment yang cocok." />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pasien</th>
                  <th>Dokter</th>
                  <th>Waktu</th>
                  <th>No. Antrian</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.patient_name}</td>
                    <td>{appointment.doctor_name || '-'}</td>
                    <td>{formatDateTime(appointment.scheduled_at)}</td>
                    <td>{appointment.queue_number || '-'}</td>
                    <td><Badge variant={STATUS_VARIANTS[appointment.status]}>{STATUS_LABELS[appointment.status]}</Badge></td>
                    <td>
                      <div className={styles.rowActions}>
                        {appointment.status === 'booked' && (
                          <>
                            <Button variant="secondary" onClick={() => handleStatusChange(appointment.id, 'checked_in')}>Check-in</Button>
                            <Button variant="ghost" onClick={() => handleStatusChange(appointment.id, 'no_show')}>Tidak Datang</Button>
                            <Button variant="danger" onClick={() => handleStatusChange(appointment.id, 'cancelled')}>Batal</Button>
                          </>
                        )}
                        {appointment.status === 'checked_in' && (
                          <Button variant="secondary" onClick={() => handleStartConsultation(appointment)}>Mulai Konsultasi</Button>
                        )}
                        {appointment.status === 'in_consultation' && (
                          <>
                            <Button variant="secondary" onClick={() => navigate(`/dashboard/consultation/${appointment.id}`)}>
                              Lanjutkan Konsultasi
                            </Button>
                            <Button variant="ghost" onClick={() => handleStatusChange(appointment.id, 'completed')}>Selesai</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={result.pagination.page}
            limit={result.pagination.limit}
            totalItems={result.pagination.total_items}
            totalPages={result.pagination.total_pages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
