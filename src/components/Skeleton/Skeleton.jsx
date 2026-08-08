import styles from './Skeleton.module.scss';

// Generic shimmering placeholder bar — the building block for TableSkeleton
// (and any other loading placeholder that isn't a full table row).
export default function Skeleton({ width = '100%', height = '1.4rem', className = '', style }) {
  return <span className={`${styles.skeleton} ${className}`} style={{ width, height, ...style }} />;
}
