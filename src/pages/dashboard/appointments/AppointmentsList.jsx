import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ban, CalendarPlus, CheckCircle2, PlayCircle, Stethoscope, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { listAppointments, updateAppointmentStatus } from '../../../services/appointments';
import { getBookingDoctors } from '../../../services/publicBooking';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import TableSkeleton from '../../../components/TableSkeleton/TableSkeleton';
import Modal from '../../../components/Modal/Modal';
import AppointmentForm from './AppointmentForm';
import styles from './AppointmentsList.module.scss';

const LIMIT = 20;

const SKELETON_COLUMNS = [
  { width: '75%' },
  { width: '60%' },
  { width: '65%' },
  { width: '35%' },
  { width: '45%', variant: 'badge' },
  { width: '70%' },
];

// appointments.status enum (02-data-model.md) -> i18n key suffix in appointments.list.*
const STATUS_ORDER = [
  ['booked', 'statusBooked'],
  ['checked_in', 'statusCheckedIn'],
  ['in_consultation', 'statusInConsultation'],
  ['completed', 'statusCompleted'],
  ['cancelled', 'statusCancelled'],
  ['no_show', 'statusNoShow'],
];

const STATUS_VARIANTS = {
  booked: 'info',
  checked_in: 'warning',
  in_consultation: 'warning',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
};

// Fixed DD-MM-YYYY + 24h format, independent of locale/i18n language toggle.
function formatDateTime(value) {
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export default function AppointmentsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  // A doctor's default view is their own appointments, not "All Doctors" —
  // they can still switch the filter manually afterwards.
  const [doctorId, setDoctorId] = useState(() => (user?.role === 'doctor' ? user.id : ''));
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const statusLabels = Object.fromEntries(STATUS_ORDER.map(([value, key]) => [value, t(`appointments.list.${key}`)]));

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
        <h1 className={styles.title}>{t('appointments.list.title')}</h1>
        <Button onClick={() => setIsBookingOpen(true)}>
          <CalendarPlus size={16} />
          {t('appointments.list.manualBooking')}
        </Button>
      </div>

      <div className={styles.filters}>
        <Input placeholder={t('appointments.list.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">{t('appointments.list.allDoctors')}</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('appointments.list.allStatus')}</option>
          {STATUS_ORDER.map(([value]) => (
            <option key={value} value={value}>{statusLabels[value]}</option>
          ))}
        </Select>
      </div>
      {!isLoading && result.data.length === 0 ? (
        <EmptyState message={t('appointments.list.noResults')} />
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('appointments.list.columnPatient')}</th>
                <th>{t('appointments.list.columnDoctor')}</th>
                <th>{t('appointments.list.columnTime')}</th>
                <th>{t('appointments.list.columnQueueNumber')}</th>
                <th>{t('appointments.list.columnStatus')}</th>
                <th>{t('appointments.list.columnAction')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={8} columns={SKELETON_COLUMNS} />
              ) : (
                result.data.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.patient_name}</td>
                    <td>{appointment.doctor_name || '-'}</td>
                    <td>{formatDateTime(appointment.scheduled_at)}</td>
                    <td>{appointment.queue_number || '-'}</td>
                    <td><Badge variant={STATUS_VARIANTS[appointment.status]}>{statusLabels[appointment.status]}</Badge></td>
                    <td>
                      <div className={styles.rowActions}>
                        {appointment.status === 'booked' && (
                          <>
                            <Button variant="secondary" onClick={() => handleStatusChange(appointment.id, 'checked_in')}>
                              <UserCheck size={16} />
                              {t('appointments.list.checkIn')}
                            </Button>
                            <Button variant="secondary" onClick={() => handleStatusChange(appointment.id, 'no_show')}>
                              <UserX size={16} />
                              {t('appointments.list.noShow')}
                            </Button>
                            <Button variant="danger" onClick={() => handleStatusChange(appointment.id, 'cancelled')}>
                              <Ban size={16} />
                              {t('appointments.list.cancel')}
                            </Button>
                          </>
                        )}
                        {appointment.status === 'checked_in' && (
                          <Button variant="secondary" onClick={() => handleStartConsultation(appointment)}>
                            <Stethoscope size={16} />
                            {t('appointments.list.startConsultation')}
                          </Button>
                        )}
                        {appointment.status === 'in_consultation' && (
                          <>
                            <Button variant="secondary" onClick={() => navigate(`/dashboard/consultation/${appointment.id}`)}>
                              <PlayCircle size={16} />
                              {t('appointments.list.continueConsultation')}
                            </Button>
                            <Button variant="secondary" onClick={() => handleStatusChange(appointment.id, 'completed')}>
                              <CheckCircle2 size={16} />
                              {t('appointments.list.complete')}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && result.data.length > 0 && (
        <Pagination
          page={result.pagination.page}
          limit={result.pagination.limit}
          totalItems={result.pagination.total_items}
          totalPages={result.pagination.total_pages}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} title={t('appointments.form.title')}>
        <AppointmentForm
          onSuccess={() => {
            setIsBookingOpen(false);
            fetchAppointments();
          }}
          onCancel={() => setIsBookingOpen(false)}
        />
      </Modal>
    </div>
  );
}
