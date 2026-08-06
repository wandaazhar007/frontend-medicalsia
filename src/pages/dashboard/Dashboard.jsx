import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getOwnerStats, getDoctorStats, getPharmacyStats } from '../../services/dashboard';
import Card from '../../components/Card/Card';
import StatCard from '../../components/StatCard/StatCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import AppointmentStatusChart from '../../components/AppointmentStatusChart/AppointmentStatusChart';
import QueueChart from '../../components/QueueChart/QueueChart';
import LowStockChart from '../../components/LowStockChart/LowStockChart';
import styles from './Dashboard.module.scss';

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [clinic, setClinic] = useState(null);
  const [stats, setStats] = useState(null);
  const [doctorStats, setDoctorStats] = useState(null);
  const [pharmacyStats, setPharmacyStats] = useState(null);
  const canViewStats = ['owner', 'admin', 'cashier'].includes(user?.role);
  const isDoctor = user?.role === 'doctor';
  const isPharmacy = user?.role === 'pharmacy';

  async function fetchClinicProfile() {
    try {
      const { data } = await api.get('/clinic-profile');
      setClinic(data.data);
    } catch {
      setClinic(null);
    }
  }

  async function fetchOwnerStats() {
    try {
      const { data } = await getOwnerStats();
      setStats(data);
    } catch {
      setStats(null);
    }
  }

  async function fetchDoctorStats() {
    try {
      const { data } = await getDoctorStats();
      setDoctorStats(data);
    } catch {
      setDoctorStats(null);
    }
  }

  async function fetchPharmacyStats() {
    try {
      const { data } = await getPharmacyStats();
      setPharmacyStats(data);
    } catch {
      setPharmacyStats(null);
    }
  }

  useEffect(() => {
    fetchClinicProfile();
    if (canViewStats) fetchOwnerStats();
    if (isDoctor) fetchDoctorStats();
    if (isPharmacy) fetchPharmacyStats();

    // Re-fetch once ConnectionStatus detects the connection came back.
    function handleReconnect() {
      fetchClinicProfile();
      if (canViewStats) fetchOwnerStats();
      if (isDoctor) fetchDoctorStats();
      if (isPharmacy) fetchPharmacyStats();
    }
    window.addEventListener('medicalsia:connection-restored', handleReconnect);
    return () => window.removeEventListener('medicalsia:connection-restored', handleReconnect);
  }, [canViewStats, isDoctor, isPharmacy]);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('dashboard.title')}</h1>
      <Card>
        <div className={styles.row}>
          <span>{t('dashboard.staffLogin')}</span>
          <span>{user?.full_name} ({user?.role})</span>
        </div>
        <div className={styles.row}>
          <span>{t('dashboard.clinicProfile')}</span>
          <span>{clinic ? clinic.name : t('dashboard.notSet')}</span>
        </div>
      </Card>

      {canViewStats && stats && (
        <>
          <h2 className={styles.sectionTitle}>{t('dashboard.todaySummary')}</h2>
          <div className={styles.statsGrid}>
            <StatCard label={t('dashboard.appointmentsToday')} value={stats.appointments_today.total} />
            <StatCard label={t('dashboard.revenueToday')} value={formatCurrency(stats.revenue_today)} />
            <StatCard label={t('dashboard.unpaidInvoices')} value={stats.invoices_unpaid_count} />
          </div>

          <div className={styles.chartsGrid}>
            <AppointmentStatusChart appointmentsToday={stats.appointments_today} />
            <QueueChart doctorCount={stats.queue_active.doctor_count} pharmacyCount={stats.queue_active.pharmacy_count} />
          </div>

          <h2 className={styles.sectionTitle}>{t('dashboard.needsAttention')}</h2>
          <div className={styles.statsGrid}>
            <StatCard
              label={t('dashboard.pendingRefund')}
              value={stats.refunds_pending.count}
              hint={stats.refunds_pending.count > 0 ? formatCurrency(stats.refunds_pending.total_amount) : undefined}
              variant={stats.refunds_pending.count > 0 ? 'warning' : 'default'}
            />
          </div>
          <div className={styles.chartsGrid}>
            <LowStockChart items={stats.medicines_low_stock.items} />
          </div>

          <h2 className={styles.sectionTitle}>{t('dashboard.clinicSection')}</h2>
          <div className={styles.statsGrid}>
            <StatCard label={t('dashboard.totalPatients')} value={stats.patients_total} />
            <StatCard label={t('dashboard.activeStaff')} value={stats.staff_active_count} />
          </div>
        </>
      )}

      {isDoctor && doctorStats && (
        <>
          <h2 className={styles.sectionTitle}>{t('dashboard.todaySchedule')}</h2>
          <div className={styles.statsGrid}>
            <StatCard label={t('dashboard.appointmentsToday')} value={doctorStats.appointments_today.total} />
            <StatCard label={t('dashboard.waiting')} value={doctorStats.appointments_today.checked_in} />
            <StatCard label={t('dashboard.inConsultation')} value={doctorStats.appointments_today.in_consultation} />
          </div>

          <div className={styles.chartsGrid}>
            <AppointmentStatusChart appointmentsToday={doctorStats.appointments_today} />
          </div>

          <h2 className={styles.sectionTitle}>{t('dashboard.nextPatients')}</h2>
          {doctorStats.next_patients.length === 0 ? (
            <EmptyState message={t('dashboard.noPatientsWaiting')} />
          ) : (
            <Card>
              {doctorStats.next_patients.map((patient) => (
                <div key={patient.id} className={styles.row}>
                  <span>{patient.queue_number} · {patient.patient_name}</span>
                  <span>{formatTime(patient.scheduled_at)}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {isPharmacy && pharmacyStats && (
        <>
          <h2 className={styles.sectionTitle}>{t('dashboard.dispensing')}</h2>
          <div className={styles.statsGrid}>
            <StatCard label={t('dashboard.queueReadyToDispense')} value={pharmacyStats.queue_count} />
            <StatCard label={t('dashboard.completedToday')} value={pharmacyStats.completed_today_count} />
          </div>

          <div className={styles.chartsGrid}>
            <LowStockChart items={pharmacyStats.medicines_low_stock.items} />
          </div>
        </>
      )}
    </div>
  );
}
