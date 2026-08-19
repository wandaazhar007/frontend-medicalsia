import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react';
import { dispensePrescription, getPharmacyQueue } from '../../../services/pharmacy';
import { getPublicPharmacyQueue } from '../../../services/publicBooking';
import { createQueueCall } from '../../../services/queueCalls';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import EmptyState from '../../../components/EmptyState/EmptyState';
import Skeleton from '../../../components/Skeleton/Skeleton';
import styles from './PharmacyPage.module.scss';

// Mirrors a real prescription Card so nothing shifts once data arrives.
function PrescriptionCardSkeleton() {
  return (
    <Card>
      <div className={styles.prescriptionHeader}>
        <Skeleton width="10rem" height="1.6rem" />
        <Skeleton width="4rem" height="1.6rem" />
      </div>
      <div className={styles.itemRow}>
        <Skeleton width="60%" height="1.4rem" />
        <Skeleton width="8rem" height="3.4rem" />
      </div>
      <div className={styles.itemRow}>
        <Skeleton width="45%" height="1.4rem" />
        <Skeleton width="8rem" height="3.4rem" />
      </div>
      <Skeleton width="100%" height="3.6rem" style={{ marginTop: '0.8rem' }} />
    </Card>
  );
}

function CallRowSkeleton() {
  return (
    <div className={styles.callRow}>
      <Skeleton width="4rem" height="1.6rem" />
      <Skeleton width="8rem" height="3.4rem" />
    </div>
  );
}

// The dispensing queue only ever shows prescriptions with status = 'paid' —
// enforced server-side in PharmacyController.getQueue, this filter is just
// what the API already guarantees, not a client-side gate.
export default function PharmacyPage() {
  const { t } = useTranslation();
  const [queue, setQueue] = useState([]);
  const [readyForPickup, setReadyForPickup] = useState([]);
  const [dispensedQtyByItem, setDispensedQtyByItem] = useState({});
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isLoadingReady, setIsLoadingReady] = useState(false);

  async function fetchQueue() {
    setIsLoadingQueue(true);
    try {
      const { data } = await getPharmacyQueue();
      setQueue(data);

      const defaults = {};
      for (const prescription of data) {
        for (const item of prescription.items) {
          defaults[item.id] = Math.min(item.quantity, item.stock_qty);
        }
      }
      setDispensedQtyByItem((prev) => ({ ...defaults, ...prev }));
    } finally {
      setIsLoadingQueue(false);
    }
  }

  // Prescriptions already marked 'completed' aren't dispensable anymore —
  // this list is purely for the "Panggil" call button, sourced from the
  // same public queue the waiting-room display polls.
  async function fetchReadyForPickup() {
    setIsLoadingReady(true);
    try {
      const { data } = await getPublicPharmacyQueue();
      setReadyForPickup(data.filter((entry) => entry.status === 'siap_diambil'));
    } finally {
      setIsLoadingReady(false);
    }
  }

  useEffect(() => {
    fetchQueue();
    fetchReadyForPickup();
    window.addEventListener('medicalsia:connection-restored', fetchQueue);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchQueue);
  }, []);

  function updateDispensedQty(itemId, value) {
    setDispensedQtyByItem((prev) => ({ ...prev, [itemId]: Math.max(0, value) }));
  }

  async function handleDispense(prescription) {
    const items = prescription.items.map((item) => ({
      prescription_item_id: item.id,
      dispensed_qty: dispensedQtyByItem[item.id] ?? Math.min(item.quantity, item.stock_qty),
    }));
    await dispensePrescription(prescription.id, items);
    fetchQueue();
    fetchReadyForPickup();
  }

  async function handleCall(queueNumber) {
    await createQueueCall(queueNumber, 'pharmacy');
    fetchReadyForPickup();
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('pharmacyPage.title')}</h1>

      <div>
        <div className={styles.sectionTitle}>{t('pharmacyPage.beingPrepared')}</div>
        {isLoadingQueue ? (
          <div className={styles.list}>
            <PrescriptionCardSkeleton />
            <PrescriptionCardSkeleton />
          </div>
        ) : queue.length === 0 ? (
          <EmptyState message={t('pharmacyPage.noQueue')} />
        ) : (
          <div className={styles.list}>
            {queue.map((prescription) => (
              <Card key={prescription.id}>
                <div className={styles.prescriptionHeader}>
                  <span className={styles.patientName}>{prescription.patient_name}</span>
                  <span className={styles.queueNumber}>{prescription.queue_number || '-'}</span>
                </div>
                {prescription.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <span>
                      {item.medicine_name} — {t('pharmacyPage.requested')} {item.quantity}, {t('pharmacyPage.stock')} {item.stock_qty}
                      {item.stock_qty < item.quantity && <Badge variant="danger">{t('pharmacyPage.lowStockBadge')}</Badge>}
                    </span>
                    <div className={styles.itemFields}>
                      <span>{t('pharmacyPage.give')}</span>
                      <div className={styles.qtyInput}>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={dispensedQtyByItem[item.id] ?? 0}
                          onChange={(e) => updateDispensedQty(item.id, parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button onClick={() => handleDispense(prescription)}>{t('pharmacyPage.processButton')}</Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className={styles.sectionTitle}>{t('pharmacyPage.readyForPickup')}</div>
        {isLoadingReady ? (
          <Card>
            <CallRowSkeleton />
            <CallRowSkeleton />
          </Card>
        ) : readyForPickup.length === 0 ? (
          <EmptyState message={t('pharmacyPage.noReadyForPickup')} />
        ) : (
          <Card>
            {readyForPickup.map((entry) => (
              <div key={entry.queue_number} className={styles.callRow}>
                <span className={styles.queueNumber}>{entry.queue_number}</span>
                <Button variant="secondary" onClick={() => handleCall(entry.queue_number)}>
                  <Volume2 size={14} />
                  {t('pharmacyPage.callButton')}
                </Button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
