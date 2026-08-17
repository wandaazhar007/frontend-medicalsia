import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats, getDoctorStats, getPharmacyStats } from '../../services/dashboard';
import Card from '../../components/Card/Card';
import StatCard from '../../components/StatCard/StatCard';
import StatCardSkeleton from '../../components/StatCard/StatCardSkeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
import AppointmentStatusChart from '../../components/AppointmentStatusChart/AppointmentStatusChart';
import QueueChart from '../../components/QueueChart/QueueChart';
import LowStockChart from '../../components/LowStockChart/LowStockChart';
import ChartSkeleton from '../../components/ChartSkeleton/ChartSkeleton';
import Skeleton from '../../components/Skeleton/Skeleton';
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
  const [stats, setStats] = useState(null);
  const [doctorStats, setDoctorStats] = useState(null);
  const [pharmacyStats, setPharmacyStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const canViewStats = ['owner', 'admin', 'cashier'].includes(user?.role);
  const isDoctor = user?.role === 'doctor';
  const isPharmacy = user?.role === 'pharmacy';

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
    // Whichever fetch applies to this role also clears the initial skeleton
    // once it settles; a role with none of these (e.g. receptionist) has
    // nothing to load, so drop the skeleton immediately.
    if (canViewStats) fetchOwnerStats().finally(() => setIsLoadingStats(false));
    else if (isDoctor) fetchDoctorStats().finally(() => setIsLoadingStats(false));
    else if (isPharmacy) fetchPharmacyStats().finally(() => setIsLoadingStats(false));
    else setIsLoadingStats(false);

    // Re-fetch once ConnectionStatus detects the connection came back.
    function handleReconnect() {
      if (canViewStats) fetchOwnerStats();
      if (isDoctor) fetchDoctorStats();
      if (isPharmacy) fetchPharmacyStats();
    }
    window.addEventListener('medicalsia:connection-restored', handleReconnect);
    return () => window.removeEventListener('medicalsia:connection-restored', handleReconnect);
  }, [canViewStats, isDoctor, isPharmacy]);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('dashboard.title', { name: user?.full_name })}</h1>

      {canViewStats && (
        <>
          <h2 className={styles.sectionTitle}>{t('dashboard.todaySummary')}</h2>
          {isLoadingStats ? (
            <>
              <div className={styles.statsGrid}>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
              <div className={styles.chartsGrid}>
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </>
          ) : stats && (
            <>
              <div className={styles.statsGrid}>
                <StatCard label={t('dashboard.appointmentsToday')} value={stats.appointments_today.total} />
                <StatCard label={t('dashboard.revenueToday')} value={formatCurrency(stats.revenue_today)} />
                <StatCard label={t('dashboard.unpaidInvoices')} value={stats.invoices_unpaid_count} />
              </div>

              <div className={styles.chartsGrid}>
                <AppointmentStatusChart appointmentsToday={stats.appointments_today} />
                <QueueChart doctorCount={stats.queue_active.doctor_count} pharmacyCount={stats.queue_active.pharmacy_count} />
              </div>
            </>
          )}

          <h2 className={styles.sectionTitle}>{t('dashboard.needsAttention')}</h2>
          {isLoadingStats ? (
            <>
              <div className={styles.statsGrid}>
                <StatCardSkeleton />
              </div>
              <div className={styles.chartsGrid}>
                <ChartSkeleton />
              </div>
            </>
          ) : stats && (
            <>
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
            </>
          )}

          <h2 className={styles.sectionTitle}>{t('dashboard.clinicSection')}</h2>
          {isLoadingStats ? (
            <div className={styles.statsGrid}>
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : stats && (
            <div className={styles.statsGrid}>
              <StatCard label={t('dashboard.totalPatients')} value={stats.patients_total} />
              <StatCard label={t('dashboard.activeStaff')} value={stats.staff_active_count} />
            </div>
          )}
        </>
      )}

      {isDoctor && (
        <>
          <h2 className={styles.sectionTitle}>{t('dashboard.todaySchedule')}</h2>
          {isLoadingStats ? (
            <>
              <div className={styles.statsGrid}>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
              <div className={styles.chartsGrid}>
                <ChartSkeleton />
              </div>
            </>
          ) : doctorStats && (
            <>
              <div className={styles.statsGrid}>
                <StatCard label={t('dashboard.appointmentsToday')} value={doctorStats.appointments_today.total} />
                <StatCard label={t('dashboard.waiting')} value={doctorStats.appointments_today.checked_in} />
                <StatCard label={t('dashboard.inConsultation')} value={doctorStats.appointments_today.in_consultation} />
              </div>

              <div className={styles.chartsGrid}>
                <AppointmentStatusChart appointmentsToday={doctorStats.appointments_today} />
              </div>
            </>
          )}

          <h2 className={styles.sectionTitle}>{t('dashboard.nextPatients')}</h2>
          {isLoadingStats ? (
            <Card>
              <Skeleton width="70%" height="1.2rem" style={{ marginBottom: '0.8rem' }} />
              <Skeleton width="60%" height="1.2rem" style={{ marginBottom: '0.8rem' }} />
              <Skeleton width="65%" height="1.2rem" />
            </Card>
          ) : doctorStats && (
            doctorStats.next_patients.length === 0 ? (
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
            )
          )}
        </>
      )}

      {isPharmacy && (
        <>
          <h2 className={styles.sectionTitle}>{t('dashboard.dispensing')}</h2>
          {isLoadingStats ? (
            <>
              <div className={styles.statsGrid}>
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
              <div className={styles.chartsGrid}>
                <ChartSkeleton />
              </div>
            </>
          ) : pharmacyStats && (
            <>
              <div className={styles.statsGrid}>
                <StatCard label={t('dashboard.queueReadyToDispense')} value={pharmacyStats.queue_count} />
                <StatCard label={t('dashboard.completedToday')} value={pharmacyStats.completed_today_count} />
              </div>

              <div className={styles.chartsGrid}>
                <LowStockChart items={pharmacyStats.medicines_low_stock.items} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
