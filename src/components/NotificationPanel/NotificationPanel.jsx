import { Calendar, CreditCard, Pill } from 'lucide-react';
import styles from './NotificationPanel.module.scss';

// Static template — no backend notification data exists yet (see 07-roadmap.md
// Fase 6). Sample items only, to be wired up to real data later.
const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: Calendar, text: 'Appointment baru dari pasien MD00004', time: '10 menit lalu' },
  { id: 2, icon: CreditCard, text: 'Invoice #INV-0012 telah dibayar', time: '1 jam lalu' },
  { id: 3, icon: Pill, text: 'Stok Amoxicillin 500mg menipis', time: 'Kemarin' },
];

export default function NotificationPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>Notifikasi</div>
      {SAMPLE_NOTIFICATIONS.length === 0 ? (
        <p className={styles.empty}>Tidak ada notifikasi baru</p>
      ) : (
        <ul className={styles.list}>
          {SAMPLE_NOTIFICATIONS.map(({ id, icon: Icon, text, time }) => (
            <li key={id} className={styles.item}>
              <Icon size={18} className={styles.itemIcon} />
              <div className={styles.itemBody}>
                <span className={styles.itemText}>{text}</span>
                <span className={styles.itemTime}>{time}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
