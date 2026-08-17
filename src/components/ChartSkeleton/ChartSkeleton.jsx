import Card from '../Card/Card';
import Skeleton from '../Skeleton/Skeleton';
import styles from './ChartSkeleton.module.scss';

// Placeholder for AppointmentStatusChart/QueueChart/LowStockChart — all use
// ResponsiveContainer height={220} as their baseline, so this matches that.
export default function ChartSkeleton() {
  return (
    <Card>
      <div className={styles.wrapper}>
        <Skeleton width="40%" height="1rem" />
        <Skeleton width="100%" height="220px" />
      </div>
    </Card>
  );
}
