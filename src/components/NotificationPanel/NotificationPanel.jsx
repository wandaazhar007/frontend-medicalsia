import { useTranslation } from 'react-i18next';
import { Calendar, CreditCard, Pill } from 'lucide-react';
import styles from './NotificationPanel.module.scss';

// Static template — no backend notification data exists yet (see 07-roadmap.md
// Fase 6). Sample items only, to be wired up to real data later.
const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: Calendar, textKey: 'notificationPanel.sample1', timeKey: 'notificationPanel.time10Min' },
  { id: 2, icon: CreditCard, textKey: 'notificationPanel.sample2', timeKey: 'notificationPanel.time1Hour' },
  { id: 3, icon: Pill, textKey: 'notificationPanel.sample3', timeKey: 'notificationPanel.timeYesterday' },
];

export default function NotificationPanel() {
  const { t } = useTranslation();

  return (
    <div className={styles.panel}>
      <div className={styles.header}>{t('notificationPanel.title')}</div>
      {SAMPLE_NOTIFICATIONS.length === 0 ? (
        <p className={styles.empty}>{t('notificationPanel.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {SAMPLE_NOTIFICATIONS.map(({ id, icon: Icon, textKey, timeKey }) => (
            <li key={id} className={styles.item}>
              <Icon size={16} className={styles.itemIcon} />
              <div className={styles.itemBody}>
                <span className={styles.itemText}>{t(textKey)}</span>
                <span className={styles.itemTime}>{t(timeKey)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
