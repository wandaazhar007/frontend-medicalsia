import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Volume2 } from 'lucide-react';
import { listAppointments, updateAppointmentStatus } from '../../../services/appointments';
import { createQueueCall } from '../../../services/queueCalls';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import EmptyState from '../../../components/EmptyState/EmptyState';
import styles from './QueuePage.module.scss';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

// Live queue for today — checked-in patients waiting, and whoever is
// currently in consultation. Small/short-lived list, no pagination needed
// (same reasoning as doctor_schedules).
export default function QueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  async function fetchQueue() {
    const { data } = await listAppointments({ date: todayIsoDate(), limit: 100 });
    setAppointments(
      data
        .filter((a) => a.status === 'checked_in' || a.status === 'in_consultation')
        .sort((a, b) => (a.queue_number || '').localeCompare(b.queue_number || ''))
    );
  }

  useEffect(() => {
    fetchQueue();
    window.addEventListener('medicalsia:connection-restored', fetchQueue);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchQueue);
  }, []);

  async function handleCall(appointment) {
    await createQueueCall(appointment.queue_number, 'doctor');
    fetchQueue();
  }

  async function handleStatusChange(id, status) {
    await updateAppointmentStatus(id, status);
    fetchQueue();
  }

  async function handleStartConsultation(appointment) {
    await updateAppointmentStatus(appointment.id, 'in_consultation');
    navigate(`/dashboard/consultation/${appointment.id}`);
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('queuePage.title')}</h1>

      {appointments.length === 0 ? (
        <EmptyState message={t('queuePage.empty')} />
      ) : (
        <div className={styles.list}>
          {appointments.map((appointment) => (
            <Card key={appointment.id} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.queueNumber}>{appointment.queue_number}</span>
                <div>
                  <div className={styles.patientName}>{appointment.patient_name}</div>
                  <div className={styles.doctorName}>{appointment.doctor_name || t('queuePage.noDoctor')}</div>
                </div>
                <Badge variant="warning">
                  {appointment.status === 'checked_in' ? t('queuePage.waiting') : t('queuePage.inConsultation')}
                </Badge>
              </div>
              <div className={styles.actions}>
                {appointment.status === 'checked_in' && (
                  <>
                    <Button variant="secondary" onClick={() => handleCall(appointment)}>
                      <Volume2 size={16} />
                      {t('queuePage.call')}
                    </Button>
                    <Button variant="ghost" onClick={() => handleStartConsultation(appointment)}>
                      <Stethoscope size={16} />
                      {t('queuePage.startConsultation')}
                    </Button>
                  </>
                )}
                {appointment.status === 'in_consultation' && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/dashboard/consultation/${appointment.id}`)}>
                      <Stethoscope size={16} />
                      {t('queuePage.continueConsultation')}
                    </Button>
                    <Button variant="ghost" onClick={() => handleStatusChange(appointment.id, 'completed')}>
                      {t('queuePage.complete')}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
