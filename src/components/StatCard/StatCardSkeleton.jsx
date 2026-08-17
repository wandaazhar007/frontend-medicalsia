import Card from '../Card/Card';
import Skeleton from '../Skeleton/Skeleton';
import styles from './StatCard.module.scss';

// Same shape/size as StatCard so nothing shifts once the real value arrives.
export default function StatCardSkeleton() {
  return (
    <Card className={styles.statCard}>
      <Skeleton width="60%" height="1.2rem" />
      <Skeleton width="40%" height="1.8rem" />
    </Card>
  );
}
