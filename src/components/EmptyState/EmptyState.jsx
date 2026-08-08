import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.scss';

export default function EmptyState({ icon: Icon = Inbox, message }) {
  return (
    <div className={styles.wrapper}>
      <Icon size={29} className={styles.icon} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
