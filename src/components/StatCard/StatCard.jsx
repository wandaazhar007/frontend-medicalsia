import Card from '../Card/Card';
import styles from './StatCard.module.scss';

export default function StatCard({ label, value, hint, variant = 'default' }) {
  return (
    <Card className={`${styles.statCard} ${styles[variant]}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </Card>
  );
}
